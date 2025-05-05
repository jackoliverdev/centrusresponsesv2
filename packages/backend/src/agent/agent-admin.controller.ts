import { User } from '@/auth-guard/user.decorator';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';
import { Body, Controller, Post } from '@nestjs/common';
import { AgentService } from './agent.service';
import { Authorized } from '@/auth-guard/auth-guard';
import { AgentType } from 'common';

@Controller()
export class AgentAdminController {
  constructor(private readonly agentService: AgentService) {}

  @Post('/admin/agent/all')
  @Authorized({ requiredRoles: ['super-admin'] })
  async getAllAgents() {
    return await this.agentService.getAllAgents();
  }

  @Post('/admin/agent/create')
  @Authorized({ requiredRoles: ['super-admin'] })
  async createAgent(
    @Body() params: {
      name: string;
      description: string;
      type: AgentType;
      defaultInstructions: string;
      defaultContext: string;
      system_prompt: string;
      model: string;
      temperature: number;
      language?: string;
      isVisible?: boolean;
    },
  ) {
    return await this.agentService.createAgent(params);
  }

  @Post('/admin/agent/update')
  @Authorized({ requiredRoles: ['super-admin'] })
  async updateAgent(
    @Body() params: {
      id: number;
      name?: string;
      description?: string;
      type?: string;
      defaultInstructions?: string;
      defaultContext?: string;
      system_prompt?: string;
      model?: string;
      temperature?: number;
      language?: string;
    },
  ) {
    return await this.agentService.updateAgent(params);
  }

  @Post('/admin/agent/toggle-visibility')
  @Authorized({ requiredRoles: ['super-admin'] })
  async toggleAgentVisibility(
    @Body() params: { id: number; isVisible: boolean },
  ) {
    return await this.agentService.toggleAgentVisibility(params);
  }

  @Post('/admin/agent/organization-visibility')
  @Authorized({ requiredRoles: ['super-admin'] })
  async getAgentOrganizationVisibility(
    @Body() params: { agentId: number },
  ) {
    return await this.agentService.getAgentOrganizationVisibility(params.agentId);
  }

  @Post('/admin/agent/organization-visibility/add')
  @Authorized({ requiredRoles: ['super-admin'] })
  async addAgentOrganizationVisibility(
    @Body() params: { agentId: number; organizationId: number },
  ) {
    return await this.agentService.addAgentOrganizationVisibility(params);
  }

  @Post('/admin/agent/organization-visibility/remove')
  @Authorized({ requiredRoles: ['super-admin'] })
  async removeAgentOrganizationVisibility(
    @Body() params: { id: number },
  ) {
    return await this.agentService.removeAgentOrganizationVisibility(params.id);
  }
} 