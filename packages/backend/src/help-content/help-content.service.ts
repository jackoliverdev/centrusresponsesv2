import { Injectable } from '@nestjs/common';
import {
  CreateHelpContentDto,
  HelpContentSchema,
  ROLE_HIERARCHY,
} from 'common';
import { DBService } from '@/db/db.service';
import { Enums } from '@/utils/supabase.types';

@Injectable()
export class HelpContentService {
  constructor(private readonly dbService: DBService) {}

  async create(data: CreateHelpContentDto) {
    // todo
  }

  async getAll(role: Enums<'roles'>) {
    const { data: tags } = await this.dbService.supabase
      .from('help_content')
      .select(
        'id,title,titleExcerpt:title_excerpt,subtitle,content,tag,type,createdAt:created_at',
      )
      .in('allowed_role', [role, ...ROLE_HIERARCHY[role]]);

    return tags;
  }

  async getAllForType<T extends Enums<'help_content_type'>>(
    type: T,
    role: Enums<'roles'>,
  ) {
    const { data: content } = await this.dbService.supabase
      .from('help_content')
      .select(
        'id,title,titleExcerpt:title_excerpt,subtitle,content,tag,type,createdAt:created_at',
      )
      .eq('type', type)
      .in('allowed_role', [role, ...ROLE_HIERARCHY[role]]);

    return content as (HelpContentSchema & { type: T })[];
  }

  async getForType<T extends Enums<'help_content_type'>>(
    type: T,
    role: Enums<'roles'>,
    contentId: number,
  ) {
    const { data: content } = await this.dbService.supabase
      .from('help_content')
      .select(
        'id,title,titleExcerpt:title_excerpt,subtitle,content,tag,type,createdAt:created_at',
      )
      .eq('type', type)
      .eq('id', contentId)
      .in('allowed_role', [role, ...ROLE_HIERARCHY[role]])
      .maybeSingle();

    return content as HelpContentSchema & { type: T };
  }

  async getContentById(id: number) {
    const { data: content } = await this.dbService.supabase
      .from('help_content')
      .select(
        'id,title,titleExcerpt:title_excerpt,subtitle,content,tag,type,createdAt:created_at',
      )
      .eq('id', id)
      .maybeSingle();

    return content;
  }
}
