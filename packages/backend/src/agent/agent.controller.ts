import { User } from '@/auth-guard/user.decorator';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';
import { Body, Controller, Post } from '@nestjs/common';
import { API, getAllAgents, getAgentInstances, getAgentInstance, createAgentInstance, updateAgentInstance, deleteAgentInstance, getAgentInstanceUserVisibility, addAgentInstanceUserVisibility, removeAgentInstanceUserVisibility, updateAgentInstanceVisibility, getAgentInstanceFieldPermissions, createAgentInstanceFieldPermission, updateAgentInstanceFieldPermission, deleteAgentInstanceFieldPermission, getAgentInstanceUserFieldPermissions, createAgentInstanceUserFieldPermission, updateAgentInstanceUserFieldPermission, deleteAgentInstanceUserFieldPermission, updateAgentInstanceUserPermission, getAgentInstanceOrganizationVisibility, createAgentInstanceOrganizationVisibility, updateAgentInstanceOrganizationPermission, getAgentInstanceOrganizationFieldPermissions, createAgentInstanceOrganizationFieldPermission, updateAgentInstanceOrganizationFieldPermission, deleteAgentInstanceOrganizationFieldPermission } from 'common';
import { AgentService } from './agent.service';
import { Authorized } from '@/auth-guard/auth-guard';

@Controller()
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post(getAllAgents.path)
  @Authorized()
  async getAllAgents(
    @User() { organizationId }: UserFromRequest,
  ) {
    return await this.agentService.getAgents(organizationId);
  }

  @Post(getAgentInstances.path)
  @Authorized()
  async getAgentInstances(
    @User() { organizationId, userId }: UserFromRequest,
  ) {
    return await this.agentService.getAgentInstances(organizationId, userId);
  }

  @Post(getAgentInstance.path)
  @Authorized()
  async getAgentInstance(
    @Body()
    params: ReturnType<typeof getAgentInstance.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest,
  ) {
    return await this.agentService.getAgentInstance(params.id, organizationId);
  }

  @Post(createAgentInstance.path)
  @Authorized()
  async createAgentInstance(
    @Body()
    params: {
      agentId: number;
      name: string;
      instructions: string;
      context: string;
      isOrgVisible?: boolean;
      isReadOnly?: boolean;
      visibleToUsers?: number[];
    },
    @User() { organizationId, userId }: UserFromRequest,
  ) {
    return await this.agentService.createAgentInstance({
      ...params,
      organizationId,
      userId,
      isOrgVisible: params.isOrgVisible !== undefined ? params.isOrgVisible : false,
      isReadOnly: params.isReadOnly !== undefined ? params.isReadOnly : (params.isOrgVisible ? true : false),
    });
  }

  @Post(updateAgentInstance.path)
  @Authorized()
  async updateAgentInstance(
    @Body()
    params: ReturnType<typeof updateAgentInstance.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest,
  ) {
    return await this.agentService.updateAgentInstance({
      ...params,
      organizationId,
    });
  }

  @Post(deleteAgentInstance.path)
  @Authorized()
  async deleteAgentInstance(
    @Body()
    params: ReturnType<typeof deleteAgentInstance.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest,
  ) {
    return await this.agentService.deleteAgentInstance({
      ...params,
      organizationId,
    });
  }

  @Post(getAgentInstanceUserVisibility.path)
  @Authorized()
  async getAgentInstanceUserVisibility(
    @Body() params: ReturnType<typeof getAgentInstanceUserVisibility.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    const visibilities = await this.agentService.getAgentInstanceUserVisibility(params.instanceId);
    return { 
      users: visibilities.map(v => v.userId),
      fullVisibilities: visibilities
    };
  }

  @Post(addAgentInstanceUserVisibility.path)
  @Authorized()
  async addAgentInstanceUserVisibility(
    @Body() params: ReturnType<typeof addAgentInstanceUserVisibility.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.addAgentInstanceUserVisibility(params);
  }

  @Post(updateAgentInstanceUserPermission.path)
  @Authorized()
  async updateAgentInstanceUserPermission(
    @Body() params: ReturnType<typeof updateAgentInstanceUserPermission.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.updateAgentInstanceUserPermission(params);
  }

  @Post(removeAgentInstanceUserVisibility.path)
  @Authorized()
  async removeAgentInstanceUserVisibility(
    @Body() params: ReturnType<typeof removeAgentInstanceUserVisibility.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    // Find the visibility record by instance and user
    const visibilities = await this.agentService.getAgentInstanceUserVisibility(params.instanceId);
    const visibility = visibilities.find(v => v.userId === params.userId);
    
    if (!visibility) {
      return { success: true }; // Already doesn't exist
    }
    
    return await this.agentService.removeAgentInstanceUserVisibility(visibility.id);
  }

  @Post(updateAgentInstanceVisibility.path)
  @Authorized()
  async updateAgentInstanceVisibility(
    @Body() params: ReturnType<typeof updateAgentInstanceVisibility.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.updateAgentInstance({
      id: params.id,
      isOrgVisible: params.isOrgVisible,
      visibleToUsers: params.visibleToUsers,
      organizationId
    });
  }

  @Post('/agent/instance/user-visibility/update-all')
  @Authorized()
  async updateAgentInstanceUserVisibilities(
    @Body() params: { instanceId: number; userIds: number[] },
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.updateAgentInstanceUserVisibilities(params);
  }

  @Post(getAgentInstanceOrganizationVisibility.path)
  @Authorized()
  async getAgentInstanceOrganizationVisibility(
    @Body() params: ReturnType<typeof getAgentInstanceOrganizationVisibility.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    const visibilities = await this.agentService.getAgentInstanceOrganizationVisibility(params.instanceId);
    return { 
      organizations: visibilities.map(v => v.organizationId),
      fullVisibilities: visibilities
    };
  }

  @Post(createAgentInstanceOrganizationVisibility.path)
  @Authorized()
  async createAgentInstanceOrganizationVisibility(
    @Body() params: ReturnType<typeof createAgentInstanceOrganizationVisibility.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.createAgentInstanceOrganizationVisibility(params);
  }

  @Post(updateAgentInstanceOrganizationPermission.path)
  @Authorized()
  async updateAgentInstanceOrganizationPermission(
    @Body() params: ReturnType<typeof updateAgentInstanceOrganizationPermission.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.updateAgentInstanceOrganizationPermission(params);
  }

  @Post('/agent/instance/field-permissions')
  @Authorized()
  async getAgentInstanceFieldPermissions(
    @Body() params: ReturnType<typeof getAgentInstanceFieldPermissions.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.getAgentInstanceFieldPermissions(params.instanceId);
  }

  @Post('/agent/instance/field-permission/create')
  @Authorized()
  async createAgentInstanceFieldPermission(
    @Body() params: ReturnType<typeof createAgentInstanceFieldPermission.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.createAgentInstanceFieldPermission(params);
  }

  @Post('/agent/instance/field-permission/update')
  @Authorized()
  async updateAgentInstanceFieldPermission(
    @Body() params: ReturnType<typeof updateAgentInstanceFieldPermission.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.updateAgentInstanceFieldPermission(params);
  }

  @Post('/agent/instance/field-permission/delete')
  @Authorized()
  async deleteAgentInstanceFieldPermission(
    @Body() params: ReturnType<typeof deleteAgentInstanceFieldPermission.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.deleteAgentInstanceFieldPermission(params.id);
  }

  @Post('/agent/instance/user-field-permissions')
  @Authorized()
  async getAgentInstanceUserFieldPermissions(
    @Body() params: ReturnType<typeof getAgentInstanceUserFieldPermissions.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.getAgentInstanceUserFieldPermissions(params.instanceId, params.userId);
  }

  @Post('/agent/instance/user-field-permission/create')
  @Authorized()
  async createAgentInstanceUserFieldPermission(
    @Body() params: ReturnType<typeof createAgentInstanceUserFieldPermission.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.createAgentInstanceUserFieldPermission(params);
  }

  @Post('/agent/instance/user-field-permission/update')
  @Authorized()
  async updateAgentInstanceUserFieldPermission(
    @Body() params: ReturnType<typeof updateAgentInstanceUserFieldPermission.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.updateAgentInstanceUserFieldPermission(params);
  }

  @Post('/agent/instance/user-field-permission/delete')
  @Authorized()
  async deleteAgentInstanceUserFieldPermission(
    @Body() params: ReturnType<typeof deleteAgentInstanceUserFieldPermission.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.deleteAgentInstanceUserFieldPermission(params.id);
  }

  @Post('/agent/instance/organization-field-permissions')
  @Authorized()
  async getAgentInstanceOrganizationFieldPermissions(
    @Body() params: ReturnType<typeof getAgentInstanceOrganizationFieldPermissions.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.getAgentInstanceOrganizationFieldPermissions(params.instanceId, params.organizationId);
  }

  @Post('/agent/instance/organization-field-permission/create')
  @Authorized()
  async createAgentInstanceOrganizationFieldPermission(
    @Body() params: ReturnType<typeof createAgentInstanceOrganizationFieldPermission.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.createAgentInstanceOrganizationFieldPermission(params);
  }

  @Post('/agent/instance/organization-field-permission/update')
  @Authorized()
  async updateAgentInstanceOrganizationFieldPermission(
    @Body() params: ReturnType<typeof updateAgentInstanceOrganizationFieldPermission.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.updateAgentInstanceOrganizationFieldPermission(params);
  }

  @Post('/agent/instance/organization-field-permission/delete')
  @Authorized()
  async deleteAgentInstanceOrganizationFieldPermission(
    @Body() params: ReturnType<typeof deleteAgentInstanceOrganizationFieldPermission.getTypedRequestBody>,
    @User() { organizationId }: UserFromRequest
  ) {
    return await this.agentService.deleteAgentInstanceOrganizationFieldPermission(params.id);
  }
} 