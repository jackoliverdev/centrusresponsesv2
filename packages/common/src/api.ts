import {
  AddMemberToOrganizationDto,
  ChangeMemberRoleInOrganizationDto,
  CreateOrganizationDto,
  AdminCreateUserDto,
  DeleteMemberFromOrganizationDto,
  DeleteOrganizationDto,
  UpdateOrganizationDto,
  UpdateUserDto,
  AdminUpdateUserDto,
  ChatsSchema,
  ChatSchema,
  UpdateChatDto,
  SignUpWithOrganizationDto,
  ReorderThreadDto,
  CustomPlanDto,
  CreateTagDto,
  UpdateTagDto,
  UpdateSuggestedTagContextDto,
  CreateDocumentFolderDto,
  UpdateDocumentFolderDto,
  AttachDocumentFolderDto,
  BulkAttachDocumentFolderDto,
} from './dto';
import {
  DocumentSchema,
  DocumentsSchema,
  FolderSchema,
  FolderWithThreadsSchema,
  HelpContentSchema,
  OrganizationMemberSchema,
  OrganizationPlanInfoSchema,
  OrganizationSchema,
  PaginateOrganizationsParams,
  PaginateTagsParams,
  PaginateUsersParams,
  PaginationResult,
  PinnedThreadSchema,
  PlanAddonSchema,
  PlanSchema,
  PlatformOrganizationsSchema,
  PlatformUserInfoSchema,
  TagInfoSchema,
  TagItemData,
  TagSchema,
  TeamsChannels,
  ThreadFolderSchema,
  UserWithOrganizationSchema,
  FolderWithDocumentsSchema,
  DocumentFolderSchema,
  AttachmentSchema,
  AgentSchema,
  AgentInstanceSchema,
  AgentInstanceWithDocumentsSchema,
  MessageGeneratorInputSchema,
  MessageGeneratorResultSchema,
  AgentInstanceFieldPermissionSchema,
  AgentInstanceUserFieldPermissionSchema,
  AgentInstanceOrganizationFieldPermissionSchema,
} from './schema';

export type EmptyBody = null | undefined;
export type DefaultBody = Record<string, any> | EmptyBody;
export type APIEndpointParams = {
  path: string;
};

export class APIEndpoint<
  ReqBody extends DefaultBody,
  ResBody extends DefaultBody,
> {
  path: string;

  constructor(params: APIEndpointParams) {
    this.path = params.path;
  }

  /**
   * You can use this to get the type of the
   * request body:
   * ReturnType<typeof API.yourEndpoint.getTypedRequestBody>
   */
  public getTypedRequestBody(body: ReqBody) {
    return body;
  }

  /**
   * You can use this to get the type of the
   * response body:
   * ReturnType<typeof API.yourEndpoint.getTypedRequestBody>
   */
  public getTypedResponseBody(body: ResBody) {
    return body;
  }
}

export type RequestBodyType<T extends APIEndpoint<any, any>> =
  T extends APIEndpoint<infer ReqBody, any> ? ReqBody : never;

export type ResponseBodyType<T extends APIEndpoint<any, any>> =
  T extends APIEndpoint<any, infer ResBody> ? ResBody : never;

export const API = {
  getOrCreateUser: new APIEndpoint<EmptyBody, UserWithOrganizationSchema>({
    path: '/user/get-or-create',
  }),

  signUpWithOrganization: new APIEndpoint<
    SignUpWithOrganizationDto,
    UserWithOrganizationSchema
  >({
    path: '/organization/signup',
  }),

  updateUser: new APIEndpoint<UpdateUserDto, UserWithOrganizationSchema>({
    path: '/user/update',
  }),

  updateUserAIContext: new APIEndpoint<
    { ai_user_context: string },
    UserWithOrganizationSchema
  >({
    path: '/user/update-ai-context',
  }),

  getPlans: new APIEndpoint<EmptyBody, PlanSchema[]>({
    path: '/plans',
  }),

  getPlanAddons: new APIEndpoint<EmptyBody, PlanAddonSchema[]>({
    path: '/plans/addons',
  }),

  getPlanAddon: new APIEndpoint<{ id: number }, PlanAddonSchema>({
    path: '/plans/addon',
  }),

  getPlanAddonForOrganization: new APIEndpoint<EmptyBody, PlanAddonSchema>({
    path: '/plans/addon/organization',
  }),

  stripeCheckoutPlan: new APIEndpoint<{ newPlanId: number }, { url: string }>({
    path: '/stripe/plans/checkout',
  }),

  stripeCheckoutPlanAddons: new APIEndpoint<
    { quantities: { messages?: number; storage?: number; users?: number } },
    {
      url: string;
    }
  >({
    path: '/stripe/plan-addons/checkout',
  }),

  stripeCancelSubscription: new APIEndpoint<
    { currentSubscriptionId?: string },
    EmptyBody
  >({
    path: '/stripe/plans/cancel',
  }),

  stripeWebhook: new APIEndpoint<{ planId: number }, EmptyBody>({
    path: '/stripe/webhook',
  }),

  adminCreateUser: new APIEndpoint<
    AdminCreateUserDto,
    UserWithOrganizationSchema
  >({
    path: '/org-admin/create',
  }),

  adminUpdateUser: new APIEndpoint<
    AdminUpdateUserDto,
    UserWithOrganizationSchema
  >({
    path: '/org-admin/update',
  }),

  adminDeleteUser: new APIEndpoint<{ id: number }, EmptyBody>({
    path: '/org-admin/delete',
  }),

  getOrganization: new APIEndpoint<
    { id: number },
    OrganizationSchema & {
      google_token: {
        access_token: string;
        refresh_token: string;
        expiry_date: number;
      } | null;

      microsoft_token: {
        access_token: string;
        refresh_token: string;
        expiry_date: number;
      } | null;
      drive_folder_id: string;
    }
  >({
    path: '/organization/get',
  }),

  getOrganizationPlan: new APIEndpoint<
    { id: number },
    OrganizationPlanInfoSchema
  >({
    path: '/organization/getPlanInfo',
  }),

  getOrganizationMembers: new APIEndpoint<
    EmptyBody,
    OrganizationMemberSchema[]
  >({
    path: '/organization/getMembers',
  }),

  createOrganization: new APIEndpoint<
    CreateOrganizationDto,
    EmptyBody // TODO: Return organization
  >({
    path: '/organization/create',
  }),

  updateOrganization: new APIEndpoint<
    UpdateOrganizationDto,
    OrganizationSchema
  >({
    path: '/organization/update',
  }),

  updateSuggestedTagContext: new APIEndpoint<
    UpdateSuggestedTagContextDto,
    OrganizationSchema
  >({
    path: '/organization/update-suggested-tag-context',
  }),

  addMemberToOrganization: new APIEndpoint<
    AddMemberToOrganizationDto,
    EmptyBody // TODO: Return organization with members
  >({
    path: '/organization/member/add',
  }),

  changeMemberRoleInOrganization: new APIEndpoint<
    ChangeMemberRoleInOrganizationDto,
    EmptyBody // TODO: Return organization with members
  >({
    path: '/organization/member/role',
  }),

  deleteMemberFromOrganization: new APIEndpoint<
    DeleteMemberFromOrganizationDto,
    EmptyBody // TODO: Return organization with members
  >({
    path: '/organization/member/delete',
  }),

  deleteOrganization: new APIEndpoint<
    DeleteOrganizationDto,
    OrganizationSchema
  >({
    path: '/organization/delete',
  }),

  // Leaves the current organization
  leaveOrganization: new APIEndpoint<EmptyBody, EmptyBody>({
    path: '/organization/leave',
  }),

  getTags: new APIEndpoint<EmptyBody, TagSchema[]>({
    path: '/organization/tags/getAll',
  }),

  getTagsWithInfo: new APIEndpoint<
    PaginateTagsParams,
    PaginationResult<TagInfoSchema>
  >({
    path: '/organization/tags/getAllWithInfo',
  }),

  createTag: new APIEndpoint<CreateTagDto, TagSchema>({
    path: '/organization/tags/create',
  }),

  updateTag: new APIEndpoint<UpdateTagDto, TagSchema>({
    path: '/organization/tags/update',
  }),

  deleteTag: new APIEndpoint<Pick<UpdateTagDto, 'id'>, TagSchema>({
    path: '/organization/tags/delete',
  }),

  createChat: new APIEndpoint<{ tag: string }, ChatSchema>({
    path: '/chat/create',
  }),

  getChats: new APIEndpoint<EmptyBody, ChatsSchema>({
    path: '/chat/list',
  }),

  getChat: new APIEndpoint<{ id: string }, ChatSchema>({
    path: '/chat/get',
  }),

  updateChat: new APIEndpoint<
    {
      id: string;
      data: UpdateChatDto;
    },
    EmptyBody
  >({
    path: '/chat/update',
  }),

  sendChatMessage: new APIEndpoint<
    { id: string; 
      message: string; 
      options?: { useWebSearch?: boolean; reasoningEffort?: 'low' | 'medium' | 'high' }; 
      thread_attachment_ids?: string[] },
    ReadableStream
  >({
    path: '/chat/message',
  }),

  cancelChatMessage: new APIEndpoint<{ id: string }, EmptyBody>({
    path: '/chat/cancel',
  }),

  // Upload a thread-specific attachment
  uploadThreadAttachment: new APIEndpoint<
    { threadId: string; file: FormData },
    AttachmentSchema
  >({
    path: '/thread/attachments/upload',
  }),

  // Detach (delete) a thread-specific attachment
  detachThreadAttachment: new APIEndpoint<
    { id: string },
    EmptyBody
  >({
    path: '/thread/attachments/delete',
  }),

  getMessageStats: new APIEndpoint<
    { start: string; end: string },
    { day: string; value: number }[]
  >({
    path: '/chat/stats',
  }),

  getPinnedThreads: new APIEndpoint<EmptyBody, PinnedThreadSchema[]>({
    path: '/thread/pinned',
  }),

  pinThread: new APIEndpoint<{ threadId: string }, PinnedThreadSchema>({
    path: '/thread/pin',
  }),

  unpinThread: new APIEndpoint<{ threadId: string }, PinnedThreadSchema>({
    path: '/thread/unpin',
  }),

  reorderPinedThread: new APIEndpoint<ReorderThreadDto[], PinnedThreadSchema[]>(
    {
      path: '/thread/pin/reorder',
    },
  ),

  getThreadFolders: new APIEndpoint<EmptyBody, FolderWithThreadsSchema[]>({
    path: '/thread/folders',
  }),

  createThreadFolder: new APIEndpoint<
    Pick<FolderSchema, 'name' | 'color' | 'global'>,
    FolderSchema
  >({
    path: '/thread/folders/create',
  }),

  updateThreadFolder: new APIEndpoint<
    Pick<FolderSchema, 'name' | 'color' | 'global' | 'id'>,
    FolderSchema
  >({
    path: '/thread/folders/update',
  }),

  deleteThreadFolder: new APIEndpoint<Pick<FolderSchema, 'id'>, FolderSchema>({
    path: '/thread/folders/delete',
  }),

  attachThreadToFolder: new APIEndpoint<
    Pick<ThreadFolderSchema, 'folderId' | 'threadId'>,
    ThreadFolderSchema
  >({
    path: '/thread/folders/attach',
  }),

  detachThreadFromFolder: new APIEndpoint<
    { folderId: number; threadId: string },
    { id: number }
  >({
    path: '/thread/folders/detach',
  }),

  getDocuments: new APIEndpoint<EmptyBody, DocumentsSchema>({
    path: '/document/list',
  }),

  getDocumentUsage: new APIEndpoint<EmptyBody, { usage: number }>({
    path: '/document/storage',
  }),

  addDocument: new APIEndpoint<
    { name: string; path: string; type: 'text' | 'audio' } | { url: string },
    { id: string }
  >({
    path: '/document/add',
  }),

  scanWebsite: new APIEndpoint<
    { url: string },
    { url: string; title: string }[]
  >({
    path: '/document/website/scan',
  }),

  crawlWebsitePages: new APIEndpoint<
    { urls: string[]; name: string },
    { id: string }
  >({
    path: '/document/website/crawl',
  }),

  updateDocument: new APIEndpoint<
    { id: string; data: Partial<DocumentSchema>; tagData?: TagItemData },
    EmptyBody
  >({
    path: '/document/update/',
  }),

  bulkUpdateDocument: new APIEndpoint<
    { ids: string[]; data: Partial<DocumentSchema>; tagData?: TagItemData },
    EmptyBody
  >({
    path: '/document/update/bulk',
  }),

  // TODO remove this
  updateDocumentMetadata: new APIEndpoint<
    { id: string; metadata: Partial<DocumentSchema> },
    EmptyBody
  >({
    path: '/document/update/metadata',
  }),

  deleteDocument: new APIEndpoint<{ id: string }, EmptyBody>({
    path: '/document/delete',
  }),

  bulkDeleteDocument: new APIEndpoint<{ ids: string[] }, EmptyBody>({
    path: '/document/delete/bulk',
  }),

  // Document Folders endpoints
  getDocumentFolders: new APIEndpoint<EmptyBody, FolderWithDocumentsSchema[]>({
    path: '/document/folders',
  }),

  createDocumentFolder: new APIEndpoint<
    CreateDocumentFolderDto,
    FolderSchema
  >({
    path: '/document/folders/create',
  }),

  updateDocumentFolder: new APIEndpoint<
    UpdateDocumentFolderDto,
    FolderSchema
  >({
    path: '/document/folders/update',
  }),

  deleteDocumentFolder: new APIEndpoint<Pick<FolderSchema, 'id'>, FolderSchema>({
    path: '/document/folders/delete',
  }),

  attachDocumentToFolder: new APIEndpoint<
    AttachDocumentFolderDto,
    DocumentFolderSchema
  >({
    path: '/document/folders/attach',
  }),

  detachDocumentFromFolder: new APIEndpoint<
    { folderId: number; documentId: string },
    { id: number }
  >({
    path: '/document/folders/detach',
  }),

  bulkAttachDocumentToFolder: new APIEndpoint<
    BulkAttachDocumentFolderDto,
    DocumentFolderSchema[]
  >({
    path: '/document/folders/attach/bulk',
  }),

  transcribeAudio: new APIEndpoint<
    Pick<DocumentSchema, 'path' | 'name'>,
    { transcript: string }
  >({
    path: '/document/audio/transcribe',
  }),

  // Text-to-speech endpoint
  textToSpeech: new APIEndpoint<
    { text: string },
    ReadableStream
  >({
    path: '/audio/speech',
  }),

  googleAuth: new APIEndpoint<EmptyBody, { url: string }>({
    path: '/google/auth',
  }),

  driveFolders: new APIEndpoint<
    EmptyBody,
    { name: string; id: string; parents: string[] }[]
  >({
    path: '/google/folders',
  }),

  driveSync: new APIEndpoint<{ folderId: string }, EmptyBody>({
    path: '/google/sync',
  }),

  microsoftAuth: new APIEndpoint<EmptyBody, { url: string }>({
    path: '/microsoft/auth',
  }),

  teamsSync: new APIEndpoint<
    { teamId: string; channelId: string }[],
    EmptyBody
  >({
    path: '/microsoft/sync',
  }),

  getTeamsChannels: new APIEndpoint<EmptyBody, TeamsChannels>({
    path: '/microsoft/channels',
  }),

  getHelpContents: new APIEndpoint<
    { type: HelpContentSchema['type'] },
    HelpContentSchema[]
  >({
    path: '/help-content/getAll',
  }),

  getHelpContent: new APIEndpoint<
    { id: number; type: HelpContentSchema['type'] },
    HelpContentSchema
  >({
    path: '/help-content/get',
  }),

  getAdminStats: new APIEndpoint<
    EmptyBody,
    {
      organizations: number;
      users: number;
      messages: number;
      previousMessages: number;
      storage: number;
    }
  >({
    path: 'plat-admin/stats/get',
  }),

  getOrganizations: new APIEndpoint<
    PaginateOrganizationsParams,
    PaginationResult<PlatformOrganizationsSchema>
  >({
    path: 'plat-admin/organization/getAll',
  }),

  updateLimitsForOrganization: new APIEndpoint<
    {
      values: CustomPlanDto;
      organizationId: number;
    },
    EmptyBody
  >({
    path: 'plat-admin/organization/limits/update',
  }),

  getUsers: new APIEndpoint<
    PaginateUsersParams,
    PaginationResult<PlatformUserInfoSchema>
  >({
    path: 'plat-admin/users/getAll',
  }),

  getSuggestedPrompts: new APIEndpoint<
    { tagId: number },
    string[]
  >({
    path: '/thread/suggested-prompts',
  }),

  getSuggestedTags: new APIEndpoint<{
    documentId: string;
    organizationId: number;
  }, {
    id: number;
    name: string;
    backgroundColor: string;
    textColor: string;
    confidence: number;
  }[]>({
    path: '/document/suggested-tags',
  }),

  assignUserToTag: new APIEndpoint<{ 
    userId: number; 
    tagId: number;
    action: 'assign' | 'unassign';
  }, EmptyBody>({
    path: '/organization/tags/assignUser',
  }),
} as const;

// Agent endpoints
export const getAllAgents = new APIEndpoint<EmptyBody, AgentSchema[]>({
  path: '/agent/all',
});

export const getAgentInstances = new APIEndpoint<EmptyBody, AgentInstanceSchema[]>({
  path: '/agent/instances',
});

export const getAgentInstance = new APIEndpoint<{ id: number }, AgentInstanceWithDocumentsSchema>({
  path: '/agent/instance',
});

export const createAgentInstance = new APIEndpoint<{
  agentId: number;
  name: string;
  instructions: string;
  context: string;
  isOrgVisible?: boolean;
  isReadOnly?: boolean;
}, AgentInstanceSchema>({
  path: '/agent/instance/create',
});

export const updateAgentInstance = new APIEndpoint<{
  id: number;
  name?: string;
  instructions?: string;
  context?: string;
  isOrgVisible?: boolean;
  isReadOnly?: boolean;
}, AgentInstanceSchema>({
  path: '/agent/instance/update',
});

export const deleteAgentInstance = new APIEndpoint<{
  id: number;
}, { success: boolean }>({
  path: '/agent/instance/delete',
});

export const runMessageGenerator = new APIEndpoint<MessageGeneratorInputSchema, MessageGeneratorResultSchema>({
  path: '/agent/message-generator/run',
});

// Agent instance user visibility endpoints
export const getAgentInstanceUserVisibility = new APIEndpoint<{
  instanceId: number;
}, {
  users: number[];
  fullVisibilities?: {
    id: number;
    instanceId: number;
    userId: number;
    createdAt: string;
    isReadOnly: boolean;
  }[];
}>({
  path: '/agent/instance/user-visibility',
});

export const addAgentInstanceUserVisibility = new APIEndpoint<{
  instanceId: number;
  userId: number;
  isReadOnly?: boolean;
}, {
  id: number;
  instanceId: number;
  userId: number;
  createdAt: string;
  isReadOnly: boolean;
}>({
  path: '/agent/instance/user-visibility/add',
});

export const updateAgentInstanceUserPermission = new APIEndpoint<{
  instanceId: number;
  userId: number;
  isReadOnly: boolean;
}, {
  id: number;
  instanceId: number;
  userId: number;
  createdAt: string;
  isReadOnly: boolean;
}>({
  path: '/agent/instance/user-permission/update',
});

export const removeAgentInstanceUserVisibility = new APIEndpoint<{
  instanceId: number;
  userId: number;
}, { success: boolean }>({
  path: '/agent/instance/user-visibility/remove',
});

export const updateAgentInstanceVisibility = new APIEndpoint<{
  id: number;
  isOrgVisible: boolean;
  visibleToUsers?: number[];
}, AgentInstanceSchema>({
  path: '/agent/instance/visibility/update',
});

// Agent instance organization visibility endpoints
export const getAgentInstanceOrganizationVisibility = new APIEndpoint<{
  instanceId: number;
}, {
  organizations: number[];
  fullVisibilities?: {
    id: number;
    instanceId: number;
    organizationId: number;
    createdAt: string;
    isReadOnly: boolean;
  }[];
}>({
  path: '/agent/instance/organization-visibility',
});

export const createAgentInstanceOrganizationVisibility = new APIEndpoint<{
  instanceId: number;
  organizationId: number;
  isReadOnly?: boolean;
}, {
  id: number;
  instanceId: number;
  organizationId: number;
  createdAt: string;
  isReadOnly: boolean;
}>({
  path: '/agent/instance/organization-visibility/add',
});

export const updateAgentInstanceOrganizationPermission = new APIEndpoint<{
  instanceId: number;
  organizationId: number;
  isReadOnly: boolean;
}, {
  id: number;
  instanceId: number;
  organizationId: number;
  createdAt: string;
  isReadOnly: boolean;
}>({
  path: '/agent/instance/organization-permission/update',
});

// Agent instance field permissions endpoints
export const getAgentInstanceFieldPermissions = new APIEndpoint<{
  instanceId: number;
}, {
  permissions: AgentInstanceFieldPermissionSchema[];
}>({
  path: '/agent/instance/field-permissions',
});

export const createAgentInstanceFieldPermission = new APIEndpoint<{
  instanceId: number;
  fieldName: string;
  isHidden: boolean;
}, AgentInstanceFieldPermissionSchema>({
  path: '/agent/instance/field-permission/create',
});

export const updateAgentInstanceFieldPermission = new APIEndpoint<{
  id: number;
  isHidden: boolean;
}, AgentInstanceFieldPermissionSchema>({
  path: '/agent/instance/field-permission/update',
});

export const deleteAgentInstanceFieldPermission = new APIEndpoint<{
  id: number;
}, { success: boolean }>({
  path: '/agent/instance/field-permission/delete',
});

// Agent instance user-specific field permissions endpoints
export const getAgentInstanceUserFieldPermissions = new APIEndpoint<{
  instanceId: number;
  userId: number;
}, {
  permissions: AgentInstanceUserFieldPermissionSchema[];
}>({
  path: '/agent/instance/user-field-permissions',
});

export const createAgentInstanceUserFieldPermission = new APIEndpoint<{
  instanceId: number;
  userId: number;
  fieldName: string;
  isHidden: boolean;
}, AgentInstanceUserFieldPermissionSchema>({
  path: '/agent/instance/user-field-permission/create',
});

export const updateAgentInstanceUserFieldPermission = new APIEndpoint<{
  id: number;
  isHidden: boolean;
}, AgentInstanceUserFieldPermissionSchema>({
  path: '/agent/instance/user-field-permission/update',
});

export const deleteAgentInstanceUserFieldPermission = new APIEndpoint<{
  id: number;
}, { success: boolean }>({
  path: '/agent/instance/user-field-permission/delete',
});

// Agent instance organization-specific field permissions endpoints
export const getAgentInstanceOrganizationFieldPermissions = new APIEndpoint<{
  instanceId: number;
  organizationId: number;
}, {
  permissions: AgentInstanceOrganizationFieldPermissionSchema[];
}>({
  path: '/agent/instance/organization-field-permissions',
});

export const createAgentInstanceOrganizationFieldPermission = new APIEndpoint<{
  instanceId: number;
  organizationId: number;
  fieldName: string;
  isHidden: boolean;
}, AgentInstanceOrganizationFieldPermissionSchema>({
  path: '/agent/instance/organization-field-permission/create',
});

export const updateAgentInstanceOrganizationFieldPermission = new APIEndpoint<{
  id: number;
  isHidden: boolean;
}, AgentInstanceOrganizationFieldPermissionSchema>({
  path: '/agent/instance/organization-field-permission/update',
});

export const deleteAgentInstanceOrganizationFieldPermission = new APIEndpoint<{
  id: number;
}, { success: boolean }>({
  path: '/agent/instance/organization-field-permission/delete',
});
