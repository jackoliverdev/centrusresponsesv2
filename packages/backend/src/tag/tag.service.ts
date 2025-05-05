import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateTagDto,
  PaginateTagsParams,
  PLATFORM_ADMIN_ORG, TagItemData,
  TagSchema,
  UpdateTagDto,
} from 'common';
import { DBService } from '@/db/db.service';

@Injectable()
export class TagService {
  constructor(private readonly dbService: DBService) {}

  async create(data: CreateTagDto, organizationId: number, userId?: number) {
    const supabase = this.dbService.supabase;

    const { data: tagExists } = await supabase
      .from('tags')
      .select('id,name')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .ilike('name', data.name)
      .maybeSingle()
      .throwOnError();

    if (tagExists) {
      throw new BadRequestException('Tag with this name already exists');
    }

    const { data: tag } = await supabase
      .from('tags')
      .insert({
        ...data,
        organization_id: organizationId,
        user_id: userId ?? null,
      })
      .select(
        'id,name,createdAt:created_at,backgroundColor:background_color,textColor:text_color,organizationId:organization_id,userId:user_id,context',
      )
      .single()
      .throwOnError();

    return tag;
  }

  async update({ id, ...data }: UpdateTagDto) {
    const supabase = this.dbService.supabase;

    const { data: tag } = await supabase
      .from('tags')
      .update(data)
      .eq('id', id)
      .select(
        'id,name,createdAt:created_at,backgroundColor:background_color,textColor:text_color,organizationId:organization_id,userId:user_id,context',
      )
      .single()
      .throwOnError();

    return tag;
  }

  async delete(id: number) {
    const supabase = this.dbService.supabase;

    const { data: tag } = await supabase
      .from('tags')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select(
        'id,name,createdAt:created_at,deletedAt:deleted_at,backgroundColor:background_color,textColor:text_color,organizationId:organization_id,userId:user_id,context',
      )
      .single()
      .throwOnError();

    return tag;
  }

  async getAll(organizationId: number) {
    const { data: tags } = await this.dbService.supabase
      .from('tags')
      .select(
        'id,name,createdAt:created_at,backgroundColor:background_color,textColor:text_color,organizationId:organization_id,userId:user_id,context',
      )
      .neq('organization_id', PLATFORM_ADMIN_ORG.organizationId)
      .eq('organization_id', organizationId)
      .is('deleted_at', null);

    return tags;
  }

  async getAllWithInfo(
    organizationId: number,
    { filters, ...options }: PaginateTagsParams,
  ) {
    const tagsResult = await this.dbService.paginate<'tags', TagSchema>({
      table: 'tags',
      ...options,
      selectQuery:
        'id,name,createdAt:created_at,backgroundColor:background_color,textColor:text_color,organizationId:organization_id,userId:user_id,context,users:user_tags!user_tags_tag_id_fkey(user:users(id,firstName:first_name,lastName:last_name,email,image)),documents:documents(id,name,type,path,size)',
      filters: [
        {
          key: 'organization_id',
          operator: 'neq',
          value: PLATFORM_ADMIN_ORG.organizationId,
        },
        {
          key: 'organization_id',
          operator: 'eq',
          value: organizationId,
        },
        {
          key: 'deleted_at',
          operator: 'is',
          value: null,
        },
        ...(filters ?? []),
      ],
    });

    const supabase = this.dbService.supabase;
    const tagsWithThreads = await Promise.all(
      (tagsResult.data ?? []).map(async (tag) => {
        const { data: threads } = await supabase
          .from('threads')
          .select('id')
          .eq('tag_id', tag.id)
          .is('archived', false);
        return {
          ...tag,
          threads: (threads ?? []).map((t) => ({ id: t.id })),
        };
      })
    );

    return {
      ...tagsResult,
      data: tagsWithThreads,
    };
  }

  async getTagById(id: number) {
    const { data: tag } = await this.dbService.supabase
      .from('tags')
      .select(
        'id,name,createdAt:created_at,backgroundColor:background_color,textColor:text_color,deletedAt:deleted_at,createdAt:created_at,organizationId:organization_id,userId:user_id,context',
      )
      .eq('id', id)
      .maybeSingle();

    return tag;
  }

  async getTagByName(organizationId: number, tagName: string) {
    const { data: tag } = await this.dbService.supabase
      .from('tags')
      .select(
        'id,name,createdAt:created_at,backgroundColor:background_color,textColor:text_color,deletedAt:deleted_at,createdAt:created_at,organizationId:organization_id,userId:user_id,context',
      )
      .is('deleted_at', null)
      .eq('name', tagName)
      .eq('organization_id', organizationId)
      .maybeSingle();

    return tag;
  }

  async processNewTags (organizationId: number, userTags?: TagItemData[]) {
    const tags = userTags ?? [];
    const newTags = tags.filter((tag) => tag.id <= 0);

    for (const tag of newTags) {
      const newTag = await this.create(
        {
          background_color: tag.backgroundColor,
          text_color: tag.textColor,
          name: tag.name,
        },
        organizationId,
      );

      tags.push(newTag);
    }

    return tags.filter((tag) => tag.id > 0);
  }
}
