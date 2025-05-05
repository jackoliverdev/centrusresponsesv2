import { DBService } from '@/db/db.service';
import { ThreadService } from '@/thread/thread.service';
import { UserService } from '@/user/user.service';
import { OrganizationService } from '@/organization/organization.service';
import { TagService } from '@/tag/tag.service';
import { Json } from '@/utils/supabase.types';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateChatDto } from 'common';
import { z } from 'zod';
import { Stream } from 'openai/streaming';

@Injectable()
export class ChatService {
  private activeStreams = new Map<string, { stream: Stream<any>; previousResponseIdAtStart: string | null }>();

  constructor(
    private dbService: DBService,
    private userService: UserService,
    private threadService: ThreadService,
    private organizationService: OrganizationService,
    private tagService: TagService,
  ) {}

  async getChats(userId: number) {
    const supabase = this.dbService.supabase;
    const user = await this.userService.getUserWithOrganizations(userId);
    const { data: personalChats } = await supabase
      .from('threads')
      .select(
        '*, user:users(firstName:first_name, lastName:last_name, image, email, ai_user_model), threadTag:tags(id,name,backgroundColor:background_color,textColor:text_color,createdAt:created_at,deletedAt:deleted_at,organizationId:organization_id,userId:user_id,context)',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .eq('whatsapp_thread', false)
      .throwOnError();

    const { data: teamChats } = user?.is_teamleader
      ? await supabase
          .from('threads')
          .select(
            '*, user:users!inner(firstName:first_name, lastName:last_name, image, email, ai_user_model), threadTag:tags(id,name,backgroundColor:background_color,textColor:text_color,createdAt:created_at,deletedAt:deleted_at,organizationId:organization_id,userId:user_id,context)',
          )
          .eq('users.teamlead_id', userId)
          .eq('whatsapp_thread', false)
          .eq('teams_thread', false)
          .order('modified_at', { ascending: false })
          .throwOnError()
      : { data: [] };

    return [
      ...personalChats.map((chat) => ({
        ...chat,
        tag: chat.threadTag,
        type: 'Personal' as const,
      })),
      ...teamChats.map((chat) => ({
        ...chat,
        tag: chat.threadTag,
        type: 'Team' as const,
      })),
    ];
  }

  async getChatUsingResponses(threadId: string) {
    const supabase = this.dbService.supabase;
    const { data: chat } = await supabase
    .from('threads')
    .select(
      '*, user:users(firstName:first_name, lastName:last_name, image, email, ai_user_model), threadTag:tags(id,name,backgroundColor:background_color,textColor:text_color,createdAt:created_at,deletedAt:deleted_at,organizationId:organization_id,userId:user_id,context)',
    )
    .eq('id', threadId)
    .single();
    
    const messages = await this.threadService.getMessagesFromResponses(chat.openai_response_id, threadId);
    
    return {
      ...chat,
      tag: chat.threadTag,
      messages,
      type: 'Personal' as const,
    };
  }

  async createChatResponses(
    userId: number,
    {
      tag,
      whatsappChat = false,
      teamsChat = false,
    }: { tag: string; whatsappChat?: boolean; teamsChat?: boolean },
  ) {
    const user = await this.userService.getUserWithOrganizations(userId);
    if (user.tags.length == 0)
      throw new BadRequestException("Your account doesn't have a tag");
    if (tag && !user.tags.some((t) => t.name === tag))
      throw new BadRequestException("Your account doesn't have that tag");
    const threadTag = await this.tagService.getTagByName(
      user.organizationId,
      tag,
    );
    if (!threadTag) throw new BadRequestException('Tag not found');
    // init chat
    const supabase = this.dbService.supabase;
    const { data } = await supabase
      .from('threads')
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        tag_id: threadTag.id,
        whatsapp_thread: whatsappChat,
        teams_thread: teamsChat,
      })
      .select(
        '*, user:users(firstName:first_name, lastName:last_name, image, email, ai_user_model)',
      )
      .limit(1)
      .single()
      .throwOnError();

    return {
      ...data,
      tag: threadTag,
      type: 'Personal' as const,
      messages: [],
    };
  }

  async update(id: string, data: UpdateChatDto) {
    await this.dbService.supabase
      .from('threads')
      .update(data)
      .eq('id', id)
      .throwOnError();
  }

  async findChatByWhatsappNumber(number: string) {
    const supabase = this.dbService.supabase;
    const user = await this.userService.findUserByPhone(number);
    if (!user) return;
    const { data } = await supabase
      .from('threads')
      .select('*,threadTag:tags(id,name)')
      .eq('whatsapp_thread', true)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return { ...data, tag: data.threadTag.name };
  }

  async findChatByTeamsEmail(email: string) {
    const supabase = this.dbService.supabase;
    const user = await this.userService.findUserByEmail(email);
    if (!user) return;
    const { data } = await supabase
      .from('threads')
      .select('*,threadTag:tags(id,name)')
      .eq('teams_thread', true)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return { ...data, tag: data.threadTag.name };
  }

  async sendMessageUsingResponses(threadId: string, message: string) {
    const { tag, last_message, user_id , openai_response_id} = await this.getChatUsingResponses(threadId);
    const { organizationId } =
      await this.userService.getUserWithOrganizations(user_id);
    const response = await this.threadService.createResponseAndPoll(
      openai_response_id,
      tag.id,
      organizationId,
      message,
      user_id,
    );
    await this.addMessageStat(threadId, user_id, organizationId);
    if (!last_message)
      await this.update(threadId, {
        name: await this.threadService.generateName(message),
      });
    await this.updateLastMessage(threadId, response.content);
    return response;
  }

  async streamMessage(
    threadId: string,
    message: string,
    options?: { useWebSearch?: boolean, reasoningEffort?: 'low' | 'medium' | 'high' },
    thread_attachment_ids?: string[]
  ) {
    thread_attachment_ids = thread_attachment_ids ?? ["067311c5-c007-4857-a978-3117e9558b7e"];
    const { tag, last_message, user_id, openai_response_id } = await this.getChatUsingResponses(threadId);
    if (!!tag.deletedAt)
      throw new BadRequestException("Thread tag deleted, unable to send message");

    const { organizationId, role } =
      await this.userService.getUserWithOrganizations(user_id);

    const currentUsage = await this.usage(organizationId);
    const usageLimit =
      await this.organizationService.usageLimitsForOrganization(organizationId);
    
    console.log(`Message limit check: user_id=${user_id}, role=${role}, currentUsage=${currentUsage}, limit=${usageLimit.messages}, canSend=${currentUsage < usageLimit.messages}`);
    
    if (currentUsage >= usageLimit.messages)
      throw new BadRequestException("You've reached your messages limit");

    // Check if a stream is already active for this thread and abort if necessary
    if (this.activeStreams.has(threadId)) {
        console.warn(`Stream already active for thread ${threadId}. Aborting previous stream.`);
        try {
            const existingStreamData = this.activeStreams.get(threadId);
            await (existingStreamData?.stream as any)?.controller.abort();
        } catch (error) {
            console.error(`Error aborting existing stream for thread ${threadId}:`, error);
        }
        this.activeStreams.delete(threadId);
    }

    const stream = await this.threadService.streamResponses(
      openai_response_id,
      tag.id,
      organizationId,
      message,
      {
        ...options,
        userId: user_id
      },
      thread_attachment_ids
    );
    console.log("stream object created for", threadId);

    this.activeStreams.set(threadId, { stream, previousResponseIdAtStart: openai_response_id });

    this.addMessageStat(threadId, user_id, organizationId);
    if (!last_message) {
        this.update(threadId, {
          name: await this.threadService.generateName(message),
        }).catch(err => console.error(`Failed to update thread name for ${threadId}:`, err));
    }

    return stream;
  }

  async updateLastMessage(chatId: string, message: string) {
    const supabase = this.dbService.supabase;
    await supabase
      .from('threads')
      .update({
        last_message: message,
        modified_at: new Date().toISOString(),
      })
      .eq('id', chatId);
  }

  async addMessageStat(chatId: string, userId: number, organizationId: number) {
    console.log(`Adding message stat: chatId=${chatId}, userId=${userId}, organizationId=${organizationId}`);
    const supabase = this.dbService.supabase;
    await supabase.from('message_stats').insert({
      organization_id: organizationId,
      user_id: userId,
      thread_id: chatId,
    });
    console.log(`Message stat added successfully`);
  }

  async deleteWhatsappChat(userId: number) {
    await this.dbService.supabase
      .from('threads')
      .delete()
      .eq('user_id', userId)
      .eq('whatsapp_thread', true)
      .throwOnError();
  }

  async deleteTeamsChat(userId: number) {
    await this.dbService.supabase
      .from('threads')
      .delete()
      .eq('user_id', userId)
      .eq('teams_thread', true)
      .throwOnError();
  }

  async getMessageStat(
    organizationId: number,
    { start, end }: { start: string; end: string },
  ) {
    const sql = this.dbService.sql;
    const results = await sql`
      SELECT
        DATE (created_at) AS DAY,
        CAST(COUNT(id) AS Integer) AS value
      FROM
        message_stats
      WHERE
        organization_id = ${organizationId}
        AND ${start} <= DATE (created_at)
        AND ${end} >= DATE (created_at)
      GROUP BY
        DATE (created_at)
      ORDER BY
        DAY;
    `;
    return results.map((result) =>
      z
        .object({
          day: z.date(),
          value: z.number(),
        })
        .transform((data) => ({
          day: data.day.toISOString(),
          value: data.value,
        }))
        .parse(result),
    );
  }

  parseMessages(messages: Json) {
    const parseResult = z
      .array(
        z
          .object({
            role: z.string().default(''),
            content: z.string().default(''),
            timestamp: z.string().default(''),
          })
          .default({ role: '', content: '' }),
      )
      .safeParse(messages);
    return parseResult.success
      ? (parseResult.data as {
          role: string;
          content: string;
          timestamp: string;
        }[])
      : [];
  }

  async usage(organizationId: number) {
    console.log(`Calculating usage for organization ${organizationId}`);
    
    // Get the first day of the current month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    // Get the last day of the current month
    const lastDayOfMonth = new Date();
    lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
    lastDayOfMonth.setDate(0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const { count } = await this.dbService.supabase
      .from('message_stats')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', firstDayOfMonth.toISOString())
      .lte('created_at', lastDayOfMonth.toISOString());

    console.log(`Organization ${organizationId} has used ${count} messages this month (${firstDayOfMonth.toISOString()} to ${lastDayOfMonth.toISOString()})`);
    return count;
  }

  async cancelMessage(threadId: string) {
    console.log(`Attempting to cancel message stream for thread: ${threadId}`);
    const streamData = this.activeStreams.get(threadId);
    let knownPreviousResponseId: string | null | undefined = undefined;

    if (streamData) {
      console.log(`Found active stream for thread ${threadId}. Aborting...`);
      knownPreviousResponseId = streamData.previousResponseIdAtStart;
      try {
        await (streamData.stream as any).controller.abort();
        console.log(`Stream aborted via controller for thread ${threadId}.`);
      } catch (error) {
        console.error(`Error aborting stream controller for thread ${threadId}:`, error);
      }
      this.activeStreams.delete(threadId);
    } else {
      console.log(`No active stream found in map for thread ${threadId}. Proceeding with DB revert using fetch.`);
    }

    return await this.threadService.cancelLatestResponse(threadId, knownPreviousResponseId);
  }

  // Utility to clear stored active stream for a thread
  public clearActiveStream(threadId: string) {
    this.activeStreams.delete(threadId);
  }
}
