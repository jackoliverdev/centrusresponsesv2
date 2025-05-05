import { UserRole } from './roles';
import { ThreadSchema } from './dto';

/** Allow any string for ai_model */
type ChatModel = string;
export type UserSchema = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  firebaseUid: string;
  image: string;
  phone: string | null;
  activeOrganizationId?: number;
  tags: TagItemData[];
  is_teamleader: boolean;
  teamlead_id: number | null;
  aiUserContext?: string;
  profile?: {
    position?: string;
    phone?: string;
    address?: string;
  };
  ai_user_model?: string;
  ai_user_temperature?: number;
};

export type Duration = 'monthly' | 'annually';

export type PlanDuration = Duration | 'discounted';

export type PlanSlug =
  | 'free'
  | 'small_team_monthly'
  | 'small_team_annually'
  | 'large_team_monthly'
  | 'large_team_annually'
  | 'enterprise'
  | 'addon_messages'
  | 'addon_storage'
  | 'addon_users'
  | 'custom';

export type PlanSchema = {
  name: string;
  id: number;
  customIntegrations: boolean;
  prioritySupport: boolean;
  addons: boolean;
  annualDiscount: number;
  messageLimit: number;
  storageLimit: number;
  userLimit: number;
  price: number;
  duration: PlanDuration;
  stripePriceId: string | null;
  sandboxStripePriceId: string | null;
  slug: PlanSlug;
  unitSize: number;
};

export type PlanAddonSchema = {
  id: number;
  extraMessages: number;
  extraStorage: number;
  extraUsers: number;
};

export type PlanUsageSchema = {
  name: string;
  storageLimit: string;
  storageUsage: string;
  storagePercentage: number;
  messageLimit: string;
  messageUsage: string;
  messagePercentage: number;
  userLimit: string;
  userUsage: string;
  userPercentage: number;
  currentPlan?: PlanSchema;
  addon?: PlanAddonSchema;
  isLoading?: boolean;
};

export type OrganizationSchema = {
  id: number;
  name: string;
  ai_model: ChatModel;
  ai_context: string;
  ai_temperature: number;
  whatsapp_number: string;
  google_client_id: string;
  google_client_secret: string;
  microsoft_client_id: string;
  microsoft_client_secret: string;
  teams_bot_url: string;
  suggested_tag_context: string;
  plan?: PlanSchema;
  customPlan?: PlanSchema;
  addon?: PlanAddonSchema;
  subscriptionStatus?: 'active' | 'cancelled' | 'paused';
  subscriptionId?: string;
};

export type UsageStat = {
  messages: number;
  storage: number;
  users: number;
};

export type FormattedStat = {
  storageLimit: number;
  storageUsage: number;
  storagePercentage: number;
  messageLimit: string;
  messageUsage: string;
  messagePercentage: number;
  userLimit: string;
  userUsage: string;
  userPercentage: number;
};

export type OrganizationPlanInfoSchema = Pick<
  OrganizationSchema,
  'plan' | 'addon' | 'subscriptionStatus' | 'subscriptionId'
> & {
  usageLimits: UsageStat;
  usages: UsageStat;
  documentCount: number;
  formattedStats: FormattedStat;
};

export type OrganizationWithRoleSchema = OrganizationSchema & {
  role: UserOrganizationSchema['role'];
};

export type UserOrganizationSchema = {
  organizationId: OrganizationSchema['id'];
  userId: UserSchema['id'];
  role: UserRole;
};

export type UserWithOrganizationSchema = UserSchema & {
  organizations: Pick<
    OrganizationWithRoleSchema,
    'id' | 'name' | 'role' | 'plan'
  >[];
  organizationId: number;
  role: UserRole;
  ai_user_model?: string;
  ai_user_temperature?: number;
};

export type OrganizationMemberSchema = UserSchema & {
  role: UserOrganizationSchema['role'];
  chat_count: number;
};

export type OrganizationWithMembersSchema = OrganizationSchema & {
  members: (UserSchema & {
    role: UserOrganizationSchema['role'];
  })[];
};

export type DocumentSchema = {
  id: string;
  size: number;
  name: string;
  type: string;
  path: string;
  teams_document: boolean;
  drive_file_id: string;
  tag_id: number;
  documentTag?: TagSchema;
};

export type DocumentsSchema = DocumentSchema[];

export type TeamsChannel = {
  id: string;
  displayName: string;
  team: {
    id: string;
    displayName: string;
  };
};

export type TeamsChannels = TeamsChannel[];

export type PaginationResult<T extends object> = {
  data: T[];
  total: number;
  pages: number;
  page: number;
  limit: number;
  error?: Error;
};

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'is'
  | 'in';

export type FilterValue = string | number | bigint | boolean;

export type SearchFilter = {
  key: string;
  operator: `${'' | 'not.'}${FilterOperator}`;
  value: FilterValue;
};

export type PaginateParams<T> = {
  table: T;
  page?: number;
  limit?: number;
  selectQuery?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
  orderReference?: string;
  searchFilters?: SearchFilter[];
  filters?: SearchFilter[];
};

export type PaginateTableParams<T> = Omit<
  PaginateParams<T>,
  'table' | 'selectQuery'
>;

export type PaginateOrganizationsParams = PaginateTableParams<'organizations'>;

export type PaginateTagsParams = PaginateTableParams<'tags'>;

export type PaginateUsersParams = PaginateTableParams<'users'>;

export type PinnedThreadSchema = {
  id: number;
  order: number;
  threadId: string;
};

export type FolderSchema = {
  id: number;
  userId: number;
  name: string;
  color: string;
  module: string;
  global: boolean;
};

export type FolderWithThreadsSchema = FolderSchema & {
  threads: Pick<
    ThreadSchema,
    'id' | 'last_message' | 'modified_at' | 'name' | 'tag' | 'user'
  >[];
};

export type ThreadFolderSchema = {
  id: number;
  folderId: number;
  userId: number;
  threadId: string;
  organizationId: number;
};

export type DocumentFolderSchema = {
  id: number;
  folderId: number;
  userId: number | null;
  documentId: string;
  organizationId: number;
  createdAt: string;
};

export type FolderWithDocumentsSchema = FolderSchema & {
  documents: Pick<
    DocumentSchema,
    'id' | 'name' | 'type' | 'path' | 'size' | 'documentTag'
  >[];
};

export type PlatformOrganizationsSchema = Pick<
  OrganizationSchema,
  'id' | 'name' | 'addon'
> & {
  plan: Pick<
    PlanSchema,
    | 'id'
    | 'name'
    | 'slug'
    | 'duration'
    | 'messageLimit'
    | 'storageLimit'
    | 'userLimit'
  >;
  created_at: string;
} & Pick<
    OrganizationPlanInfoSchema,
    'usages' | 'usageLimits' | 'formattedStats' | 'documentCount'
  >;

export type PlatformUserInfoSchema = {
  id: number;
  email: string;
  role: string;
  created_at: string;
  firstName: string;
  lastName?: string;
  lastLogin?: string;
  organization: { id: number; name: string };
};

export type TagSchema = {
  id: number;
  name: string;
  backgroundColor: string;
  textColor: string;
  createdAt: string;
  deletedAt?: string | null;
  organizationId: number | null;
  userId: number | null;
  context: string | null;
};

export type TagInfoSchema = TagSchema & {
  users?: {
    user: {
      id: number;
      firstName: string | null;
      lastName: string | null;
      email: string;
      image: string | null;
    };
  }[];
  documents?: {
    id: string;
    name: string;
    type: string;
    path: string;
    size: number;
  }[];
  threads?: { id: string }[];
};

export type TagItemData = Pick<
  TagSchema,
  'name' | 'backgroundColor' | 'textColor' | 'id'
>;

export type HelpContentSchema = {
  id: number;
  title: string;
  titleExcerpt: string | null;
  subtitle: string;
  createdAt: string;
  content: string | null;
  tag: string | null;
  type: 'article' | 'video' | 'prompt' | null;
  allowedRole?: UserRole;
};

// Attachment record for thread-specific uploads
export type AttachmentSchema = {
  id: string;
  threadId: string;
  url: string;
  openaiFileId: string | null;
  filename: string;
  mimeType: string;
  createdAt: string;
};

// Agent schemas
export type AgentType = 'message_generator' | 'future_agent_type';

export type AgentSchema = {
  id: number;
  name: string;
  description: string;
  type: AgentType;
  defaultInstructions: string;
  defaultContext: string;
  isVisible: boolean;
  system_prompt: string;
  model: string;
  temperature: number;
  language: string;
  createdAt: string;
  updatedAt: string;
};

export interface AgentOrganizationVisibilitySchema {
  id: number;
  agentId: number;
  organizationId: number;
  createdAt: string;
}

export interface AgentUserVisibilitySchema {
  id: number;
  agentId: number;
  userId: number;
  createdAt: string;
}

export interface AgentInstanceUserVisibilitySchema {
  id: number;
  instanceId: number;
  userId: number;
  createdAt: string;
  isReadOnly: boolean;
}

export interface AgentInstanceOrganizationVisibilitySchema {
  id: number;
  instanceId: number;
  organizationId: number;
  createdAt: string;
  isReadOnly: boolean;
}

export interface AgentInstanceFieldPermissionSchema {
  id: number;
  instanceId: number;
  fieldName: string;
  isHidden: boolean;
  createdAt: string;
}

export interface AgentInstanceUserFieldPermissionSchema {
  id: number;
  instanceId: number;
  userId: number;
  fieldName: string;
  isHidden: boolean;
  createdAt: string;
}

export interface AgentInstanceOrganizationFieldPermissionSchema {
  id: number;
  instanceId: number;
  organizationId: number;
  fieldName: string;
  isHidden: boolean;
  createdAt: string;
}

export type AgentInstanceWithDocumentsSchema = AgentInstanceSchema & {
  documents: DocumentSchema[];
};

export type AgentDocumentSchema = {
  id: number;
  organizationAgentInstanceId: number;
  documentId: string;
  createdAt: string;
};

export type AgentInstanceSchema = {
  id: number;
  organizationId: number;
  agentId: number;
  name: string;
  instructions: string;
  context: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  isOrgVisible: boolean;
  isReadOnly?: boolean;
  visibleToUsers?: number[];
};

export type MessageGeneratorInputSchema = {
  instanceId: number;
  messageContext: string;
  platformType: string; // 'email', 'linkedin', 'social_dm', 'social_comment', 'custom'
  customPlatform?: string;
  numberOfVariants: number;
  senderName?: string;
  documentIds?: string[];
};

export type MessageGeneratorResultSchema = {
  id: string;
  instanceId: number;
  results: {
    messages: Array<{
      type: string;
      content: string;
    }>;
    platformType: string;
  };
  createdAt: string;
};
