import { OrganizationService } from '@/organization/organization.service';
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import { convert } from 'html-to-text';
import { DocumentService } from '@/document/document.service';

const scope =
  'offline_access team.readbasic.all channel.readbasic.all channelmessage.read.all chat.read';

@Injectable()
export class MicrosoftService {
  private readonly oauth: AxiosInstance;
  private readonly redirect_uri = `${process.env.WEB_APP_URL}/integrations/microsoft/callback`;
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly documentService: DocumentService,
  ) {
    this.oauth = axios.create({
      baseURL: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/',
    });
  }

  getAPI(organizationId: number) {
    const api = axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0/',
    });

    api.interceptors.request.use(async (request) => {
      const access_token = await this.getAccessToken(organizationId);
      request.headers['Authorization'] = `Bearer ${access_token}`;
      return request;
    });

    return api;
  }

  async getAuthUrl() {
    const path = `authorize?client_id=${process.env.MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(this.redirect_uri)}&response_mode=query&scope=${encodeURIComponent(scope)}&prompt=select_account`;
    return this.oauth.defaults.baseURL + path;
  }

  extractTokenFromResponse(data: any) {
    const token = z
      .object({
        access_token: z.string(),
        refresh_token: z.string(),
        expires_in: z.number(),
      })
      .parse(data);

    return {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expiry_date: new Date().valueOf() + (token.expires_in - 10) * 1000,
    };
  }

  async getToken(code: string) {
    const { data } = await this.oauth.post(
      'token',
      {
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code,
        scope,
        grant_type: 'authorization_code',
        redirect_uri: this.redirect_uri,
      },
      { headers: { 'content-type': 'application/x-www-form-urlencoded' } },
    );

    return this.extractTokenFromResponse(data);
  }

  async refreshToken(refresh_token: string) {
    const { data } = await this.oauth.post(
      'token',
      {
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        refresh_token,
        scope,
        grant_type: 'refresh_token',
      },
      { headers: { 'content-type': 'application/x-www-form-urlencoded' } },
    );
    return this.extractTokenFromResponse(data);
  }

  async getAccessToken(organizationId: number) {
    const token =
      await this.organizationService.getMicrosoftToken(organizationId);
    if (!token) throw new Error('Token not found');

    const expired = token.expiry_date < new Date().valueOf();

    if (!expired) return token.access_token;

    const newToken = await this.refreshToken(token.refresh_token);
    await this.organizationService.updateOrganization(organizationId, {
      microsoft_token: newToken,
    });
    return newToken.access_token;
  }

  async getChannelMessages(
    teamId: string,
    channelId: string,
    organizationId: number,
  ) {
    const api = this.getAPI(organizationId);
    const { data } = await api.get(
      `teams/${teamId}/channels/${channelId}/messages?$top=50`,
    );
    const allMessages = [...data.value];
    let nextLink = data['@odata.nextLink'];

    while (nextLink) {
      const { data } = await api.get(nextLink, { baseURL: '' });
      allMessages.push(...data.value);
      nextLink = data['@odata.nextLink'];
    }
    return allMessages;
  }

  async getTeams(organizationId: number) {
    const api = this.getAPI(organizationId);
    const { data } = await api.get(`teams`);
    return data.value;
  }

  async getChannels(teamId: string, organizationId: number) {
    const api = this.getAPI(organizationId);
    const { data } = await api.get(`teams/${teamId}/channels`);
    return data.value;
  }

  async getAllChannels(organizationId: number) {
    const teams = await this.getTeams(organizationId);
    const results = await Promise.allSettled(
      teams.map(async (team) =>
        (await this.getChannels(team.id, organizationId)).map((channel) => ({
          team,
          ...channel,
        })),
      ),
    );
    return results
      .filter((result) => 'value' in result)
      .map((result) => result.value)
      .flat();
  }

  async getChats(organizationId: number) {
    const api = this.getAPI(organizationId);
    const { data } = await api.get(`chats`);
    return data.value;
  }

  async getChatMessages(chatId: string, organizationId: number) {
    const api = this.getAPI(organizationId);
    const { data } = await api.get(`chats/${chatId}/messages?$top=50`);
    const allMessages = [...data.value];
    let nextLink = data['@odata.nextLink'];

    while (nextLink) {
      const { data } = await api.get(nextLink, { baseURL: '' });
      allMessages.push(...data.value);
      nextLink = data['@odata.nextLink'];
    }
    return allMessages;
  }

  async getAllChatMessages(organizationId: number) {
    const allMessages = [];
    const chats = await this.getChats(organizationId);
    for (const { id } of chats) {
      const messages = await this.getChatMessages(id, organizationId);
      allMessages.push(...messages);
    }
    return allMessages;
  }

  async getTeamMessages(teamId: string, organizationId: number) {
    const allMessages = [];
    try {
      const channels = await this.getChannels(teamId, organizationId);
      for (const { id } of channels) {
        const messages = await this.getChannelMessages(
          teamId,
          id,
          organizationId,
        );
        allMessages.push(...messages);
      }
    } catch {}
    return allMessages;
  }

  async getAllTeamMessages(organizationId: number) {
    const teams = await this.getTeams(organizationId);
    const allMessages = [];
    for (const { id } of teams) {
      const messages = await this.getTeamMessages(id, organizationId);
      allMessages.push(...messages);
    }
    return allMessages;
  }

  async getAllMessages(organizationId: number) {
    const teamMessages = await this.getAllTeamMessages(organizationId);
    const chatMessages = await this.getAllChatMessages(organizationId);
    const allMessages = [...teamMessages, ...chatMessages];

    return allMessages;
  }

  async getMessagesInTextFormat(
    channels: { teamId: string; channelId: string }[],
    organizationId: number,
  ) {
    const messages = (
      await Promise.all(
        channels.map((channel) =>
          this.getChannelMessages(
            channel.teamId,
            channel.channelId,
            organizationId,
          ),
        ),
      )
    ).flat();

    return messages
      .filter(({ body: { content } }) => convert(content))
      .map(
        ({ createdDateTime, from, body: { content } }) =>
          `[${createdDateTime}] ${from?.user?.displayName}: ${convert(content)}`,
      )
      .join('\n');
  }

  async upload(file: File, tag: string = '', organizationId: number) {
    const id = await this.documentService.upload(file, tag, organizationId);
    await this.documentService.update(id, {
      teams_document: true,
    });
  }

  async sync(
    channels: { teamId: string; channelId: string }[],
    organizationId: number,
  ) {
    const documentsWithTags =
      await this.documentService.getTeamsDocumentsWithTags(organizationId);

    await this.documentService.deleteTeamsDocuments(organizationId);

    const text = await this.getMessagesInTextFormat(channels, organizationId);
    const file = new File([text], 'teams-messages.txt', { type: 'text/plain' });
    await this.upload(file, documentsWithTags[0]?.tag || '', organizationId);
  }
}
