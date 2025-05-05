import { DBService } from '@/db/db.service';
import { Injectable } from '@nestjs/common';
import {
  baseUploadDocument,
  baseDownloadDocument,
  DOCUMENT_BUCKET,
} from 'common';

@Injectable()
export class StorageService {
  constructor(private dbService: DBService) {}

  async uploadDocument(file: File) {
    return await baseUploadDocument(this.dbService.supabase, file);
  }

  async downloadDocument(path: string, name: string) {
    return await baseDownloadDocument(this.dbService.supabase, path, name);
  }

  async getDocumentMetadata(path: string) {
    const { data, error } = await this.dbService.supabase.storage
      .from(DOCUMENT_BUCKET)
      .list('', { search: path, limit: 1 });
    if (error) throw error;

    return data[0].metadata;
  }

  async getDocumentSize(path: string) {
    const { size } = await this.getDocumentMetadata(path);
    return size;
  }
}
