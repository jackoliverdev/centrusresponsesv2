import {
  FolderSchema, HelpContentSchema,
  OrganizationSchema,
  PinnedThreadSchema,
  TagItemData,
  TagSchema,
  ThreadFolderSchema,
  UserOrganizationSchema,
  UserSchema,
  DocumentFolderSchema,
} from './schema';

export type SignUpWithOrganizationDto = {
  organization: {
    name: string;
  };
  user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    firebaseUid?: string;
  };
};

export type SignInDto = {
  email: string;
  password: string;
};

export type UpdateUserDto = Partial<
  Omit<UserSchema, 'id' | 'firebaseUid' | 'email'> & {
    firebaseUid?: string;
    isAdmin?: boolean;
    teamMemberIds?: number[];
    ai_user_model?: string;
    ai_user_temperature?: number;
  }
>;

export type AdminCreateUserDto = Omit<UserSchema, 'id' | 'firebaseUid' | 'tags'> & {
  password: string;
  is_teamleader: boolean;
  team_member_ids: number[];
  isAdmin: boolean;
  phone: string;
  address: string;
  position: string;
  tags: TagItemData[];
  ai_user_model?: string;
  ai_user_temperature?: number;
};

export type AdminUpdateUserDto = Partial<
  Omit<UserSchema, 'firebaseUid' | 'email'> & {
    ai_user_model?: string;
    ai_user_temperature?: number;
  }
>;

export type CreateOrganizationDto = Omit<OrganizationSchema, 'id'>;

export type UpdateOrganizationDto = Partial<
  Omit<OrganizationSchema, 'id'> & {
    google_token: null;
    microsoft_token: null;
    drive_folder_id: string;
  }
>;

export type DeleteOrganizationDto = Pick<OrganizationSchema, 'id'>;

export type AddMemberToOrganizationDto = Omit<
  UserOrganizationSchema,
  'organizationId'
>;

export type LeaveOrganizationDto = UserOrganizationSchema;

export type DeleteMemberFromOrganizationDto = Pick<
  UserOrganizationSchema,
  'userId'
>;

export type ChangeMemberRoleInOrganizationDto = Omit<
  UserOrganizationSchema,
  'organizationId'
>;

export type ChatSchema = {
  id: string;
  messages: {
    content: string;
    role: string;
    timestamp: string;
    sources: { filename: string; text: string }[];
  }[];
  name: string;
  last_message: string;
  modified_at: string;
  created_at: string;
  user_id: number;
  run_id: string | null;
  openai_response_id: string | null;
  tag: TagSchema;
  archived: boolean;
  user: {
    firstName: string;
    lastName: string;
    image: string;
    email: string;
    ai_user_model?: string;
  };
  type: 'Personal' | 'Team';
  agent_run?: boolean;
  agent_instance_id?: number;
  agent_run_inputs?: any;
  agent_run_outputs?: any;
};

export type ThreadSchema = Omit<ChatSchema, 'messages'>;

export type ReorderThreadDto = Pick<
  PinnedThreadSchema,
  'id' | 'threadId' | 'order'
>;

export type ChatsSchema = ThreadSchema[];

export type UpdateChatDto = Partial<
  Pick<ChatSchema, 'archived' | 'name' | 'run_id' | 'openai_response_id'>
>;

export type ChangePlanDto = {
  newPlanId: number;
};

export type UpdatePlanAddonDto = {
  extraMessages: number;
  extraStorage: number;
  extraUsers: number;
};

export type CustomPlanDto = {
  messages: number;
  storage: number;
  users: number;
};

export type CreateFolderDto = Pick<
  FolderSchema,
  'name' | 'color' | 'module' | 'global'
> & {
  organizationId: number;
  userId: number;
};

export type UpdateFolderDto = Pick<
  FolderSchema,
  'name' | 'color' | 'global' | 'id'
> & {
  organizationId: number;
  userId: number;
};

export type AttachThreadFolderDto = Pick<
  ThreadFolderSchema,
  'folderId' | 'threadId' | 'organizationId' | 'userId'
>;

export type UpdateTagDto = Pick<TagSchema, 'id'> & {
  background_color: string;
  text_color: string;
  context?: string | null;
};

export type CreateTagDto = Pick<TagSchema, 'name'> & Omit<UpdateTagDto, 'id'>;

export type CreateHelpContentDto = Omit<HelpContentSchema, 'id'>;

export type UpdateSuggestedTagContextDto = {
  suggested_tag_context: string;
};

export type CreateDocumentFolderDto = Pick<
  FolderSchema,
  'name' | 'color' | 'global'
> & {
  module?: string;
  organizationId?: number;
  userId?: number;
};

export type UpdateDocumentFolderDto = Pick<
  FolderSchema,
  'name' | 'color' | 'global' | 'id'
> & {
  organizationId?: number;
  userId?: number;
};

export type AttachDocumentFolderDto = Pick<
  DocumentFolderSchema,
  'folderId' | 'documentId'
> & {
  organizationId?: number;
  userId?: number;
};

export type BulkAttachDocumentFolderDto = {
  documentIds: string[];
  folderId: number;
  organizationId: number;
  userId: number;
};
