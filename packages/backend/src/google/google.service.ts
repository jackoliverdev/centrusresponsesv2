import { DocumentService } from '@/document/document.service';
import { OrganizationService } from '@/organization/organization.service';
import { StorageService } from '@/storage/storage.service';
import { Injectable } from '@nestjs/common';
import { ALL_MIMES } from 'common';
import { google } from 'googleapis';

export const GOOGLE_WORKSPACE_DOCUMENT_MIMES = {
  'application/vnd.google-apps.document': {
    ext: '.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  'application/vnd.google-apps.spreadsheet': {
    ext: '.xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
};

const getAuth = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.WEB_APP_URL}/integrations/google/callback`,
  );
};

@Injectable()
export class GoogleService {
  private auth;
  constructor(
    private organizationService: OrganizationService,
    private storageService: StorageService,
    private documentService: DocumentService,
  ) {
    this.auth = getAuth();
  }

  async getAuthUrl() {
    return await this.auth.generateAuthUrl({
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
      access_type: 'offline',
      prompt: 'select_account consent',
    });
  }

  async getTokenFromCode(code: string) {
    const response = await this.auth.getToken(code);
    const { access_token, refresh_token, expiry_date } = response.res.data;
    return { access_token, refresh_token, expiry_date };
  }

  async getCredentials(organizationId: number): Promise<{
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  }> {
    const organization =
      await this.organizationService.getOrganization(organizationId);
    const token = organization.google_token;
    const auth = getAuth();
    auth.setCredentials(token);
    const response = await auth.getAccessToken();
    const { access_token, expiry_date } = response?.res?.data || {};
    if (expiry_date) {
      const new_token = {
        access_token,
        expiry_date,
        refresh_token: token.refresh_token,
      };
      await this.organizationService.updateOrganization(organizationId, {
        google_token: new_token,
      });
      return new_token;
    }
    return token;
  }

  async getGoogleDrive(organizationId: number) {
    const auth = getAuth();
    auth.setCredentials(await this.getCredentials(organizationId));

    return google.drive({
      version: 'v3',
      auth,
    });
  }

  async getFolders(organizationId: number) {
    const drive = await this.getGoogleDrive(organizationId);
    const res = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder'",
      fields: 'files(id, name, parents)',
    });
    return res.data.files as { id: string; name: string; parents: string[] }[];
  }

  async getFiles(organizationId: number) {
    const drive = await this.getGoogleDrive(organizationId);
    const res = await drive.files.list({
      pageSize: 500,
    });
    return res.data.files;
  }

  async getSupportedFiles(folderId: string, organizationId: number) {
    const mimes: string[] = [
      ...Object.keys(ALL_MIMES),
      ...Object.keys(GOOGLE_WORKSPACE_DOCUMENT_MIMES),
    ];
    const drive = await this.getGoogleDrive(organizationId);
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and (${mimes.map((mime) => `mimeType = '${mime}'`).join(' or ')})`,
    });
    return res.data.files;
  }

  async download(fileId: string, organizationId: number) {
    const drive = await this.getGoogleDrive(organizationId);
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size',
    });

    const workspaceDocumentMimes = Object.keys(GOOGLE_WORKSPACE_DOCUMENT_MIMES);
    if (workspaceDocumentMimes.includes(fileMetadata.data.mimeType)) {
      const { mime: mimeType, ext } =
        GOOGLE_WORKSPACE_DOCUMENT_MIMES[fileMetadata.data.mimeType];
      const response = await drive.files.export(
        {
          fileId,
          mimeType,
        },
        { responseType: 'arraybuffer' },
      );
      const buffer = Buffer.from(response.data as ArrayBuffer);

      return new File([buffer], fileMetadata.data.name + ext, {
        type: fileMetadata.data.mimeType,
      });
    } else {
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' },
      );
      const buffer = Buffer.from(response.data as ArrayBuffer);

      return new File([buffer], fileMetadata.data.name, {
        type: fileMetadata.data.mimeType,
      });
    }
  }

  async upload(
    file: File,
    drive_file_id: string,
    tag: string,
    organizationId: number,
  ) {
    const path = await this.storageService.uploadDocument(file);
    await this.documentService.addDocument({
      name: file.name,
      path,
      tag,
      drive_file_id,
      organization_id: organizationId,
    });
  }

  async process(fileId: string, tag: string = '', organizationId: number) {
    const file = await this.download(fileId, organizationId);
    await this.upload(file, fileId, tag, organizationId);
  }

  async sync(folderId: string, organizationId: number) {
    const documentsWithTags =
      await this.documentService.getDriveDocumentsWithTags(organizationId);

    await this.documentService.deleteDriveDocuments(organizationId);

    const files = await this.getSupportedFiles(folderId, organizationId);

    await Promise.allSettled(
      files.map((file) =>
        this.process(
          file.id,
          documentsWithTags.find(({ id }) => id == file.id)?.tag || '',
          organizationId,
        ),
      ),
    );
    await this.organizationService.updateOrganization(organizationId, {
      drive_folder_id: folderId,
    });
  }
}
