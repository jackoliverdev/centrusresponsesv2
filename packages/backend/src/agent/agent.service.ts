import { DBService } from '@/db/db.service';
import { Injectable } from '@nestjs/common';
import { AgentType } from 'common';
import { OpenAiService } from '@/open-ai/open-ai.service';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '@nestjs/common';

// Define credit costs for different agent types
export const AGENT_CREDIT_COSTS = {
  'message_generator': 1,
};

// Define interfaces for Supabase data types
interface OrganizationAgentInstanceRecord {
  id: number;
  organization_id: number;
  agent_id: number;
  name: string;
  instructions: string;
  context: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  is_org_visible: boolean;
  is_read_only: boolean;
}

interface OrganizationRecord {
  id: number;
  name: string;
}

interface AgentOrganizationVisibilityRecord {
  id: number;
  agent_id: number;
  organization_id: number;
  created_at: string;
  organization?: OrganizationRecord;
}

@Injectable()
export class AgentService {
  constructor(
    private dbService: DBService,
    private openAiService: OpenAiService,
  ) {}

  async getAgents(organizationId: number) {
    // First, get agents that are globally visible
    const { data: globalAgents } = await this.dbService.supabase
      .from('agents')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: true });

    // Then, get organization-specific visible agents (even if not globally visible)
    const { data: orgVisibleAgents } = await this.dbService.supabase
      .from('agents')
      .select('*, agent_organization_visibility!inner(organization_id)')
      .eq('agent_organization_visibility.organization_id', organizationId)
      .order('created_at', { ascending: true });

    // Combine and deduplicate the results
    const combinedAgents = [...(globalAgents || [])];
    
    // Add organization-specific agents that aren't already in the list
    if (orgVisibleAgents) {
      orgVisibleAgents.forEach(agent => {
        if (!combinedAgents.some(a => a.id === agent.id)) {
          combinedAgents.push(agent);
        }
      });
    }

    return combinedAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: agent.type,
      defaultInstructions: agent.default_instructions,
      defaultContext: agent.default_context,
      system_prompt: agent.system_prompt,
      model: agent.model,
      temperature: agent.temperature,
      language: agent.language || 'en-GB',
      isVisible: agent.is_visible,
      createdAt: agent.created_at,
      updatedAt: agent.updated_at,
    }));
  }

  async getAllAgents() {
    const { data } = await this.dbService.supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: true });

    return (data || []).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: agent.type,
      defaultInstructions: agent.default_instructions,
      defaultContext: agent.default_context,
      system_prompt: agent.system_prompt,
      model: agent.model,
      temperature: agent.temperature,
      language: agent.language || 'en-GB',
      isVisible: agent.is_visible,
      createdAt: agent.created_at,
      updatedAt: agent.updated_at,
    }));
  }

  async getAgentInstances(organizationId: number, userId?: number) {
    // First, get all instances that are org-visible or created by the user
    const { data: directInstances } = await this.dbService.supabase
      .from('organization_agent_instances')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`is_org_visible.eq.true,created_by.eq.${userId || 0}`)
      .order('created_at', { ascending: false });
    
    let instances = directInstances || [];
    
    // If userId is provided, also get instances shared specifically with this user
    if (userId) {
      const { data: sharedInstances } = await this.dbService.supabase
        .from('agent_instance_user_visibility')
        .select('instance_id')
        .eq('user_id', userId);
      
      if (sharedInstances && sharedInstances.length > 0) {
        const sharedInstanceIds = sharedInstances.map(si => si.instance_id);
        
        // Get the full instance data for these shared instances
        const { data: userVisibleInstances } = await this.dbService.supabase
          .from('organization_agent_instances')
          .select('*')
          .eq('organization_id', organizationId)
          .in('id', sharedInstanceIds)
          .order('created_at', { ascending: false });
        
        // Add these instances if they're not already in the list
        if (userVisibleInstances) {
          userVisibleInstances.forEach(instance => {
            if (!instances.some(i => i.id === instance.id)) {
              instances.push(instance);
            }
          });
        }
      }
    }

    // Get user visibilities for all instances
    const instanceIds = instances.map(instance => instance.id);
    let visibilitiesMap = new Map();
    
    if (instanceIds.length > 0) {
      const { data: allVisibilities } = await this.dbService.supabase
        .from('agent_instance_user_visibility')
        .select('instance_id, user_id')
        .in('instance_id', instanceIds);
      
      if (allVisibilities) {
        // Group visibilities by instance_id
        allVisibilities.forEach(v => {
          if (!visibilitiesMap.has(v.instance_id)) {
            visibilitiesMap.set(v.instance_id, []);
          }
          visibilitiesMap.get(v.instance_id).push(v.user_id);
        });
      }
    }

    return instances.map((instance: OrganizationAgentInstanceRecord) => {
      const visibleToUsers = visibilitiesMap.get(instance.id) || [];
      const isShared = !instance.is_org_visible && visibleToUsers.length > 0;
      
      return {
        id: instance.id,
        organizationId: instance.organization_id,
        agentId: instance.agent_id,
        name: instance.name,
        instructions: instance.instructions,
        context: instance.context,
        createdAt: instance.created_at,
        updatedAt: instance.updated_at,
        createdBy: instance.created_by,
        isOrgVisible: instance.is_org_visible,
        isReadOnly: instance.is_read_only,
        visibleToUsers,
        isShared
      };
    });
  }

  async getAgentInstance(instanceId: number, organizationId: number) {
    const { data: instance } = await this.dbService.supabase
      .from('organization_agent_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('organization_id', organizationId)
      .single();

    if (!instance) {
      return null;
    }

    const { data: documents } = await this.dbService.supabase
      .from('agent_documents')
      .select(
        'document:document_id(id, name, type, path, size, tag_id, created_at, tag)',
      )
      .eq('organization_agent_instance_id', instanceId);

    // Get user visibilities for this instance
    const { data: userVisibilities } = await this.dbService.supabase
      .from('agent_instance_user_visibility')
      .select('user_id')
      .eq('instance_id', instanceId);
    
    const visibleToUsers = userVisibilities ? userVisibilities.map(v => v.user_id) : [];
    const isShared = !instance.is_org_visible && visibleToUsers.length > 0;

    return {
      id: instance.id,
      organizationId: instance.organization_id,
      agentId: instance.agent_id,
      name: instance.name,
      instructions: instance.instructions,
      context: instance.context,
      createdAt: instance.created_at,
      updatedAt: instance.updated_at,
      createdBy: instance.created_by,
      isOrgVisible: instance.is_org_visible,
      isReadOnly: instance.is_read_only,
      documents: documents
        ? documents
            .filter((doc) => doc.document)
            .map((doc) => doc.document)
        : [],
      visibleToUsers,
      isShared
    };
  }

  async createAgentInstance(dto: {
    agentId: number;
    name: string;
    instructions: string;
    context: string;
    organizationId: number;
    userId: number;
    isOrgVisible?: boolean;
    isReadOnly?: boolean;
    visibleToUsers?: number[];
  }) {
    const { data: instance } = await this.dbService.supabase
      .from('organization_agent_instances')
      .insert({
        agent_id: dto.agentId,
        name: dto.name,
        instructions: dto.instructions,
        context: dto.context,
        organization_id: dto.organizationId,
        created_by: dto.userId,
        is_org_visible: dto.isOrgVisible || false,
        is_read_only: dto.isReadOnly ?? (dto.isOrgVisible ? true : false), // Default to read-only if org visible
      })
      .select('*')
      .single();

    // Add user visibilities if provided
    const visibleToUsers = dto.visibleToUsers || [];
    if (visibleToUsers.length > 0) {
      for (const userId of visibleToUsers) {
        await this.addAgentInstanceUserVisibility({
          instanceId: instance.id,
          userId,
          isReadOnly: dto.isReadOnly
        });
      }
    }

    // If isOrgVisible is true, create an organization visibility record
    if (dto.isOrgVisible) {
      await this.createAgentInstanceOrganizationVisibility({
        instanceId: instance.id,
        organizationId: dto.organizationId,
        isReadOnly: dto.isReadOnly !== undefined ? dto.isReadOnly : true
      });
    }

    return {
      id: instance.id,
      organizationId: instance.organization_id,
      agentId: instance.agent_id,
      name: instance.name,
      instructions: instance.instructions,
      context: instance.context,
      createdAt: instance.created_at,
      updatedAt: instance.updated_at,
      createdBy: instance.created_by,
      isOrgVisible: instance.is_org_visible,
      isReadOnly: instance.is_read_only,
      visibleToUsers,
      isShared: !instance.is_org_visible && visibleToUsers.length > 0
    };
  }

  async updateAgentInstance(dto: {
    id: number;
    name?: string;
    instructions?: string;
    context?: string;
    isOrgVisible?: boolean;
    isReadOnly?: boolean;
    visibleToUsers?: number[];
    organizationId: number;
  }) {
    // Get current instance to check for visibility status changes
    const { data: currentInstance } = await this.dbService.supabase
      .from('organization_agent_instances')
      .select('is_org_visible, is_read_only')
      .eq('id', dto.id)
      .single();

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.instructions !== undefined) updateData.instructions = dto.instructions;
    if (dto.context !== undefined) updateData.context = dto.context;
    if (dto.isOrgVisible !== undefined) updateData.is_org_visible = dto.isOrgVisible;
    if (dto.isReadOnly !== undefined) updateData.is_read_only = dto.isReadOnly;
    updateData.updated_at = new Date().toISOString();

    const { data: instance } = await this.dbService.supabase
      .from('organization_agent_instances')
      .update(updateData)
      .eq('id', dto.id)
      .eq('organization_id', dto.organizationId)
      .select('*')
      .single();

    // Update user visibilities if provided
    if (dto.visibleToUsers !== undefined) {
      await this.updateAgentInstanceUserVisibilities({
        instanceId: dto.id,
        userIds: dto.visibleToUsers
      });
    }
    
    // Handle changes to organization visibility
    if (dto.isOrgVisible !== undefined) {
      const wasOrgVisible = currentInstance?.is_org_visible || false;
      const isNowOrgVisible = dto.isOrgVisible;
      
      // If changing from not org-visible to org-visible, create organization visibility record
      if (!wasOrgVisible && isNowOrgVisible) {
        await this.createAgentInstanceOrganizationVisibility({
          instanceId: dto.id,
          organizationId: dto.organizationId,
          isReadOnly: dto.isReadOnly !== undefined ? dto.isReadOnly : true
        });
      }
      // If already org-visible and read-only status changed, update the permission
      else if (wasOrgVisible && isNowOrgVisible && dto.isReadOnly !== undefined) {
        await this.updateAgentInstanceOrganizationPermission({
          instanceId: dto.id,
          organizationId: dto.organizationId,
          isReadOnly: dto.isReadOnly
        });
      }
    }
    // If isReadOnly changed but isOrgVisible didn't, and instance is org-visible, update the org permission
    else if (dto.isReadOnly !== undefined && currentInstance?.is_org_visible) {
      await this.updateAgentInstanceOrganizationPermission({
        instanceId: dto.id,
        organizationId: dto.organizationId,
        isReadOnly: dto.isReadOnly
      });
    }
    
    // Get updated user visibilities
    const { data: userVisibilities } = await this.dbService.supabase
      .from('agent_instance_user_visibility')
      .select('user_id')
      .eq('instance_id', dto.id);
    
    const visibleToUsers = userVisibilities ? userVisibilities.map(v => v.user_id) : [];

    return {
      id: instance.id,
      organizationId: instance.organization_id,
      agentId: instance.agent_id,
      name: instance.name,
      instructions: instance.instructions,
      context: instance.context,
      createdAt: instance.created_at,
      updatedAt: instance.updated_at,
      createdBy: instance.created_by,
      isOrgVisible: instance.is_org_visible,
      isReadOnly: instance.is_read_only,
      visibleToUsers,
      isShared: !instance.is_org_visible && visibleToUsers.length > 0
    };
  }

  async deleteAgentInstance(dto: {
    id: number;
    organizationId: number;
  }) {
    // Delete associated documents first
    await this.dbService.supabase
      .from('agent_documents')
      .delete()
      .eq('organization_agent_instance_id', dto.id);

    // Delete user visibility records
    await this.dbService.supabase
      .from('agent_instance_user_visibility')
      .delete()
      .eq('instance_id', dto.id);

    // Then delete the instance
    await this.dbService.supabase
      .from('organization_agent_instances')
      .delete()
      .eq('id', dto.id)
      .eq('organization_id', dto.organizationId);

    return { success: true };
  }

  async attachDocumentToAgentInstance(dto: {
    instanceId: number;
    documentId: string;
    organizationId: number;
  }) {
    // Check if document is already attached
    const { data: existingDoc } = await this.dbService.supabase
      .from('agent_documents')
      .select('id')
      .eq('organization_agent_instance_id', dto.instanceId)
      .eq('document_id', dto.documentId)
      .maybeSingle();

    if (existingDoc) {
      return existingDoc;
    }

    const { data: document } = await this.dbService.supabase
      .from('agent_documents')
      .insert({
        organization_agent_instance_id: dto.instanceId,
        document_id: dto.documentId,
      })
      .select('*')
      .single();

    return document;
  }

  async detachDocumentFromAgentInstance(dto: {
    instanceId: number;
    documentId: string;
  }) {
    const { data: document } = await this.dbService.supabase
      .from('agent_documents')
      .delete()
      .eq('organization_agent_instance_id', dto.instanceId)
      .eq('document_id', dto.documentId)
      .select('*')
      .single();

    return document;
  }

  async createAgent(dto: {
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
  }) {
    // Enforce temperature=1 for o1-mini model
    let temperature = dto.temperature;
    if (dto.model === 'o1-mini') {
      temperature = 1.0;
    }
    
    const { data: agent } = await this.dbService.supabase
      .from('agents')
      .insert({
        name: dto.name,
        description: dto.description,
        type: dto.type,
        default_instructions: dto.defaultInstructions,
        default_context: dto.defaultContext,
        system_prompt: dto.system_prompt,
        model: dto.model,
        temperature: temperature,
        language: dto.language || 'en-GB',
        is_visible: dto.isVisible ?? true,
      })
      .select('*')
      .single();

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: agent.type,
      defaultInstructions: agent.default_instructions,
      defaultContext: agent.default_context,
      system_prompt: agent.system_prompt,
      model: agent.model,
      temperature: agent.temperature,
      language: agent.language || 'en-GB',
      isVisible: agent.is_visible,
      createdAt: agent.created_at,
      updatedAt: agent.updated_at,
    };
  }

  async updateAgent(dto: {
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
  }) {
    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description) updateData.description = dto.description;
    if (dto.type) updateData.type = dto.type;
    if (dto.defaultInstructions) updateData.default_instructions = dto.defaultInstructions;
    if (dto.defaultContext) updateData.default_context = dto.defaultContext;
    if (dto.system_prompt) updateData.system_prompt = dto.system_prompt;
    if (dto.language !== undefined) updateData.language = dto.language;
    
    // Handle model and temperature updates
    if (dto.model) updateData.model = dto.model;
    
    // If o1-mini, force temperature to be 1
    if (dto.model === 'o1-mini') {
      updateData.temperature = 1.0;
    } else if (dto.temperature !== undefined) {
      updateData.temperature = dto.temperature;
    }
    
    updateData.updated_at = new Date().toISOString();

    const { data: agent } = await this.dbService.supabase
      .from('agents')
      .update(updateData)
      .eq('id', dto.id)
      .select('*')
      .single();

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: agent.type,
      defaultInstructions: agent.default_instructions,
      defaultContext: agent.default_context,
      system_prompt: agent.system_prompt,
      model: agent.model,
      temperature: agent.temperature,
      language: agent.language || 'en-GB',
      isVisible: agent.is_visible,
      createdAt: agent.created_at,
      updatedAt: agent.updated_at,
    };
  }

  async toggleAgentVisibility(dto: { id: number; isVisible: boolean }) {
    const { data: agent } = await this.dbService.supabase
      .from('agents')
      .update({
        is_visible: dto.isVisible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dto.id)
      .select('id, is_visible')
      .single();

    return {
      id: agent.id,
      isVisible: agent.is_visible,
    };
  }

  // Get organization visibility settings for an agent
  async getAgentOrganizationVisibility(agentId: number) {
    const { data: visibilityRecords } = await this.dbService.supabase
      .from('agent_organization_visibility')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    
    if (!visibilityRecords || visibilityRecords.length === 0) {
      return [];
    }
    
    // Get organizations info for all visibility records
    const organizationIds = visibilityRecords.map(record => record.organization_id);
    const { data: organizations } = await this.dbService.supabase
      .from('organizations')
      .select('id, name')
      .in('id', organizationIds);
    
    // Create a map of organization id to organization details
    const orgMap = new Map();
    if (organizations) {
      organizations.forEach(org => {
        orgMap.set(org.id, { id: org.id, name: org.name });
      });
    }
    
    // Map visibility records with organization details
    return visibilityRecords.map(record => ({
      id: record.id,
      agentId: record.agent_id,
      organizationId: record.organization_id,
      createdAt: record.created_at,
      organization: orgMap.get(record.organization_id),
    }));
  }

  // Add organization visibility for an agent
  async addAgentOrganizationVisibility(dto: { agentId: number; organizationId: number }) {
    // Check if the visibility already exists
    const { data: existing } = await this.dbService.supabase
      .from('agent_organization_visibility')
      .select('*')
      .eq('agent_id', dto.agentId)
      .eq('organization_id', dto.organizationId)
      .maybeSingle();

    if (existing) {
      // Already exists, return it
      return {
        id: existing.id,
        agentId: existing.agent_id,
        organizationId: existing.organization_id,
        createdAt: existing.created_at,
      };
    }

    // Create a new visibility record
    const { data, error } = await this.dbService.supabase
      .from('agent_organization_visibility')
      .insert({
        agent_id: dto.agentId,
        organization_id: dto.organizationId,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(
        `Failed to add organization visibility: ${error.message}`,
      );
    }

    return {
      id: data.id,
      agentId: data.agent_id,
      organizationId: data.organization_id,
      createdAt: data.created_at,
    };
  }

  // Remove organization visibility for an agent
  async removeAgentOrganizationVisibility(id: number) {
    const { error } = await this.dbService.supabase
      .from('agent_organization_visibility')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(
        `Failed to remove organization visibility: ${error.message}`,
      );
    }

    return { success: true };
  }

  // Get user visibility settings for an agent instance
  async getAgentInstanceUserVisibility(instanceId: number) {
    const { data } = await this.dbService.supabase
      .from('agent_instance_user_visibility')
      .select('*')
      .eq('instance_id', instanceId);
    
    return (data || []).map(record => ({
      id: record.id,
      instanceId: record.instance_id,
      userId: record.user_id,
      createdAt: record.created_at,
      isReadOnly: record.is_read_only
    }));
  }

  // Add user visibility for an agent instance
  async addAgentInstanceUserVisibility(dto: {
    instanceId: number;
    userId: number;
    isReadOnly?: boolean;
  }) {
    // Check if the visibility already exists
    const { data: existing } = await this.dbService.supabase
      .from('agent_instance_user_visibility')
      .select('*')
      .eq('instance_id', dto.instanceId)
      .eq('user_id', dto.userId)
      .maybeSingle();

    if (existing) {
      // Already exists, return it
      return {
        id: existing.id,
        instanceId: existing.instance_id,
        userId: existing.user_id,
        createdAt: existing.created_at,
        isReadOnly: existing.is_read_only
      };
    }

    // Create a new visibility record
    const { data, error } = await this.dbService.supabase
      .from('agent_instance_user_visibility')
      .insert({
        instance_id: dto.instanceId,
        user_id: dto.userId,
        is_read_only: dto.isReadOnly !== undefined ? dto.isReadOnly : true // Default to read-only
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to add user visibility: ${error.message}`);
    }

    return {
      id: data.id,
      instanceId: data.instance_id,
      userId: data.user_id,
      createdAt: data.created_at,
      isReadOnly: data.is_read_only
    };
  }

  // Update permission level for a user visibility
  async updateAgentInstanceUserPermission(dto: {
    instanceId: number;
    userId: number;
    isReadOnly: boolean;
  }) {
    try {
      // Find the visibility record
      const { data: visibilities, error: queryError } = await this.dbService.supabase
        .from('agent_instance_user_visibility')
        .select('*')
        .eq('instance_id', dto.instanceId)
        .eq('user_id', dto.userId);
      
      if (queryError) {
        throw new Error(`Failed to find visibility record: ${queryError.message}`);
      }
      
      // If no visibility record exists, create one
      if (!visibilities || visibilities.length === 0) {
        return this.addAgentInstanceUserVisibility(dto);
      }
      
      // If multiple records exist (which shouldn't happen), update the first one
      const visibility = visibilities[0];
      
      // Update the permission level
      const { data, error } = await this.dbService.supabase
        .from('agent_instance_user_visibility')
        .update({ is_read_only: dto.isReadOnly })
        .eq('id', visibility.id)
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to update user permission: ${error.message}`);
      }
      
      return {
        id: data.id,
        instanceId: data.instance_id,
        userId: data.user_id,
        createdAt: data.created_at,
        isReadOnly: data.is_read_only
      };
    } catch (error) {
      console.error('Error in updateAgentInstanceUserPermission:', error);
      throw error;
    }
  }

  // Remove user visibility for an agent instance
  async removeAgentInstanceUserVisibility(id: number) {
    const { error } = await this.dbService.supabase
      .from('agent_instance_user_visibility')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to remove user visibility: ${error.message}`);
    }

    return { success: true };
  }

  // Get organization visibility settings for an agent instance
  async getAgentInstanceOrganizationVisibility(instanceId: number) {
    const { data } = await this.dbService.supabase
      .from('agent_instance_organization_visibility')
      .select('*')
      .eq('instance_id', instanceId);
    
    return (data || []).map(record => ({
      id: record.id,
      instanceId: record.instance_id,
      organizationId: record.organization_id,
      createdAt: record.created_at,
      isReadOnly: record.is_read_only
    }));
  }

  // Add organization visibility for an agent instance
  async createAgentInstanceOrganizationVisibility(dto: {
    instanceId: number;
    organizationId: number;
    isReadOnly?: boolean;
  }) {
    // Check if the visibility already exists
    const { data: existing } = await this.dbService.supabase
      .from('agent_instance_organization_visibility')
      .select('*')
      .eq('instance_id', dto.instanceId)
      .eq('organization_id', dto.organizationId)
      .maybeSingle();

    if (existing) {
      // Already exists, return it
      return {
        id: existing.id,
        instanceId: existing.instance_id,
        organizationId: existing.organization_id,
        createdAt: existing.created_at,
        isReadOnly: existing.is_read_only
      };
    }

    // Create a new visibility record
    const { data, error } = await this.dbService.supabase
      .from('agent_instance_organization_visibility')
      .insert({
        instance_id: dto.instanceId,
        organization_id: dto.organizationId,
        is_read_only: dto.isReadOnly !== undefined ? dto.isReadOnly : true // Default to read-only
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to add organization visibility: ${error.message}`);
    }

    return {
      id: data.id,
      instanceId: data.instance_id,
      organizationId: data.organization_id,
      createdAt: data.created_at,
      isReadOnly: data.is_read_only
    };
  }

  // Update permission level for organization visibility
  async updateAgentInstanceOrganizationPermission(dto: {
    instanceId: number;
    organizationId: number;
    isReadOnly: boolean;
  }) {
    try {
      // Find the visibility record
      const { data: visibilities, error: queryError } = await this.dbService.supabase
        .from('agent_instance_organization_visibility')
        .select('*')
        .eq('instance_id', dto.instanceId)
        .eq('organization_id', dto.organizationId);
      
      if (queryError) {
        throw new Error(`Failed to find organization visibility record: ${queryError.message}`);
      }
      
      // If no visibility record exists, create one
      if (!visibilities || visibilities.length === 0) {
        return this.createAgentInstanceOrganizationVisibility(dto);
      }
      
      // If multiple records exist (which shouldn't happen), update the first one
      const visibility = visibilities[0];
      
      // Update the permission level
      const { data, error } = await this.dbService.supabase
        .from('agent_instance_organization_visibility')
        .update({ is_read_only: dto.isReadOnly })
        .eq('id', visibility.id)
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to update organization permission: ${error.message}`);
      }
      
      return {
        id: data.id,
        instanceId: data.instance_id,
        organizationId: data.organization_id,
        createdAt: data.created_at,
        isReadOnly: data.is_read_only
      };
    } catch (error) {
      console.error('Error in updateAgentInstanceOrganizationPermission:', error);
      throw error;
    }
  }

  // Update all user visibilities for an agent instance
  async updateAgentInstanceUserVisibilities(dto: {
    instanceId: number;
    userIds: number[];
  }) {
    // First, get current visibilities
    const currentVisibilities = await this.getAgentInstanceUserVisibility(dto.instanceId);
    
    // Find users to add
    const currentUserIds = currentVisibilities.map(v => v.userId);
    const usersToAdd = dto.userIds.filter(id => !currentUserIds.includes(id));
    
    // Find visibilities to remove
    const visibilitiesToRemove = currentVisibilities.filter(v => !dto.userIds.includes(v.userId));
    
    // Process additions
    for (const userId of usersToAdd) {
      await this.addAgentInstanceUserVisibility({
        instanceId: dto.instanceId,
        userId,
        isReadOnly: false
      });
    }
    
    // Process removals
    for (const visibility of visibilitiesToRemove) {
      await this.removeAgentInstanceUserVisibility(visibility.id);
    }
    
    return { success: true };
  }

  // Get field permissions for an agent instance
  async getAgentInstanceFieldPermissions(instanceId: number) {
    // Get organization-level field permissions
    const { data: fieldPermissions } = await this.dbService.supabase
      .from('agent_instance_field_permissions')
      .select('*')
      .eq('instance_id', instanceId);
    
    return {
      permissions: (fieldPermissions || []).map(record => ({
        id: record.id,
        instanceId: record.instance_id,
        fieldName: record.field_name,
        isHidden: record.is_hidden,
        createdAt: record.created_at
      }))
    };
  }

  // Create or update field permission
  async createAgentInstanceFieldPermission(dto: {
    instanceId: number;
    fieldName: string;
    isHidden: boolean;
  }) {
    try {
      // Use upsert to handle both insert and update cases
      const { data, error } = await this.dbService.supabase
        .from('agent_instance_field_permissions')
        .upsert({
          instance_id: dto.instanceId,
          field_name: dto.fieldName,
          is_hidden: dto.isHidden
        }, {
          // The conflict target is the unique constraint
          onConflict: 'instance_id,field_name'
        })
        .select('*')
        .single();
        
      if (error) {
        console.error('Error upserting field permission:', error);
        throw new Error(`Failed to create/update field permission: ${error.message}`);
      }
      
      return {
        id: data.id,
        instanceId: data.instance_id,
        fieldName: data.field_name,
        isHidden: data.is_hidden,
        createdAt: data.created_at
      };
    } catch (error: any) {
      console.error('Error in createAgentInstanceFieldPermission:', error);
      throw error;
    }
  }

  // Update field permission
  async updateAgentInstanceFieldPermission(dto: {
    id: number;
    isHidden: boolean;
  }) {
    const { data, error } = await this.dbService.supabase
      .from('agent_instance_field_permissions')
      .update({ is_hidden: dto.isHidden })
      .eq('id', dto.id)
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to update field permission: ${error.message}`);
    }
    
    return {
      id: data.id,
      instanceId: data.instance_id,
      fieldName: data.field_name,
      isHidden: data.is_hidden,
      createdAt: data.created_at
    };
  }

  // Delete field permission
  async deleteAgentInstanceFieldPermission(id: number) {
    const { error } = await this.dbService.supabase
      .from('agent_instance_field_permissions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete field permission: ${error.message}`);
    }

    return { success: true };
  }

  // Get field permissions for a specific user on an agent instance
  async getAgentInstanceUserFieldPermissions(instanceId: number, userId: number) {
    const { data: fieldPermissions } = await this.dbService.supabase
      .from('agent_instance_user_field_permissions')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', userId);
    
    return {
      permissions: (fieldPermissions || []).map(record => ({
        id: record.id,
        instanceId: record.instance_id,
        userId: record.user_id,
        fieldName: record.field_name,
        isHidden: record.is_hidden,
        createdAt: record.created_at
      }))
    };
  }

  // Create or update user-specific field permission
  async createAgentInstanceUserFieldPermission(dto: {
    instanceId: number;
    userId: number;
    fieldName: string;
    isHidden: boolean;
  }) {
    try {
      // Use upsert to handle both insert and update cases
      const { data, error } = await this.dbService.supabase
        .from('agent_instance_user_field_permissions')
        .upsert({
          instance_id: dto.instanceId,
          user_id: dto.userId,
          field_name: dto.fieldName,
          is_hidden: dto.isHidden
        }, {
          // The conflict target is the unique constraint
          onConflict: 'instance_id,user_id,field_name'
        })
        .select('*')
        .single();
        
      if (error) {
        console.error('Error upserting user field permission:', error);
        throw new Error(`Failed to create/update user field permission: ${error.message}`);
      }
      
      return {
        id: data.id,
        instanceId: data.instance_id,
        userId: data.user_id,
        fieldName: data.field_name,
        isHidden: data.is_hidden,
        createdAt: data.created_at
      };
    } catch (error: any) {
      console.error('Error in createAgentInstanceUserFieldPermission:', error);
      throw error;
    }
  }

  // Update user-specific field permission
  async updateAgentInstanceUserFieldPermission(dto: {
    id: number;
    isHidden: boolean;
  }) {
    const { data, error } = await this.dbService.supabase
      .from('agent_instance_user_field_permissions')
      .update({ is_hidden: dto.isHidden })
      .eq('id', dto.id)
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to update user field permission: ${error.message}`);
    }
    
    return {
      id: data.id,
      instanceId: data.instance_id,
      userId: data.user_id,
      fieldName: data.field_name,
      isHidden: data.is_hidden,
      createdAt: data.created_at
    };
  }

  // Delete user-specific field permission
  async deleteAgentInstanceUserFieldPermission(id: number) {
    const { error } = await this.dbService.supabase
      .from('agent_instance_user_field_permissions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user field permission: ${error.message}`);
    }

    return { success: true };
  }

  // Get organization-specific field permissions for an agent instance
  async getAgentInstanceOrganizationFieldPermissions(instanceId: number, organizationId: number) {
    const { data: fieldPermissions } = await this.dbService.supabase
      .from('agent_instance_organization_field_permissions')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('organization_id', organizationId);
    
    return {
      permissions: (fieldPermissions || []).map(record => ({
        id: record.id,
        instanceId: record.instance_id,
        organizationId: record.organization_id,
        fieldName: record.field_name,
        isHidden: record.is_hidden,
        createdAt: record.created_at
      }))
    };
  }

  // Create or update organization-specific field permission
  async createAgentInstanceOrganizationFieldPermission(dto: {
    instanceId: number;
    organizationId: number;
    fieldName: string;
    isHidden: boolean;
  }) {
    try {
      // Use upsert to handle both insert and update cases
      const { data, error } = await this.dbService.supabase
        .from('agent_instance_organization_field_permissions')
        .upsert({
          instance_id: dto.instanceId,
          organization_id: dto.organizationId,
          field_name: dto.fieldName,
          is_hidden: dto.isHidden
        }, {
          // The conflict target is the unique constraint
          onConflict: 'instance_id,organization_id,field_name'
        })
        .select('*')
        .single();
        
      if (error) {
        console.error('Error upserting organization field permission:', error);
        throw new Error(`Failed to create/update organization field permission: ${error.message}`);
      }
      
      return {
        id: data.id,
        instanceId: data.instance_id,
        organizationId: data.organization_id,
        fieldName: data.field_name,
        isHidden: data.is_hidden,
        createdAt: data.created_at
      };
    } catch (error: any) {
      console.error('Error in createAgentInstanceOrganizationFieldPermission:', error);
      throw error;
    }
  }

  // Update organization-specific field permission
  async updateAgentInstanceOrganizationFieldPermission(dto: {
    id: number;
    isHidden: boolean;
  }) {
    const { data, error } = await this.dbService.supabase
      .from('agent_instance_organization_field_permissions')
      .update({ is_hidden: dto.isHidden })
      .eq('id', dto.id)
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to update organization field permission: ${error.message}`);
    }
    
    return {
      id: data.id,
      instanceId: data.instance_id,
      organizationId: data.organization_id,
      fieldName: data.field_name,
      isHidden: data.is_hidden,
      createdAt: data.created_at
    };
  }

  // Delete organization-specific field permission
  async deleteAgentInstanceOrganizationFieldPermission(id: number) {
    const { error } = await this.dbService.supabase
      .from('agent_instance_organization_field_permissions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete organization field permission: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Check if an organization has enough message credits for a specific agent type
   * @param organizationId The organization ID
   * @param agentType The type of agent to run
   * @returns boolean indicating if there are enough credits
   */
  async hasEnoughMessageCredits(organizationId: number, agentType: AgentType): Promise<boolean> {
    // Get current usage
    const currentUsage = await this.getCurrentMessageUsage(organizationId);
    
    // Get usage limits
    const usageLimit = await this.getMessageLimit(organizationId);
    
    // Get credit cost for this agent type
    const creditCost = AGENT_CREDIT_COSTS[agentType] || 1;
    
    // Check if there are enough credits
    return currentUsage + creditCost <= usageLimit;
  }

  /**
   * Get current message usage for an organization
   */
  async usage(organizationId: number) {
    const { count } = await this.dbService.supabase
      .from('message_stats')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return count;
  }

  /**
   * Get the current message usage for an organization
   * @param organizationId The organization ID
   * @returns The current message usage count
   */
  async getCurrentMessageUsage(organizationId: number): Promise<number> {
    try {
      const { count, error } = await this.dbService.supabase
        .from('message_stats')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (error) {
        throw new Error(`Failed to get message usage: ${error.message}`);
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getCurrentMessageUsage:', error);
      // Return 0 as a safe default if there's an error
      return 0;
    }
  }

  /**
   * Get the message limit for an organization
   * @param organizationId The organization ID
   * @returns The message limit
   */
  async getMessageLimit(organizationId: number): Promise<number> {
    // Get organization
    const { data: organization } = await this.dbService.supabase
      .from('organizations')
      .select('plan_id, custom_plan_id, addon_id')
      .eq('id', organizationId)
      .single();
    
    if (!organization) {
      return 0;
    }
    
    // Get plan
    const { data: plan } = await this.dbService.supabase
      .from('plans')
      .select('message_limit')
      .eq('id', organization.plan_id)
      .single();
    
    // Get custom plan if it exists
    let customPlanLimit = 0;
    if (organization.custom_plan_id) {
      const { data: customPlan } = await this.dbService.supabase
        .from('plans')
        .select('message_limit')
        .eq('id', organization.custom_plan_id)
        .single();
      
      if (customPlan) {
        customPlanLimit = customPlan.message_limit;
      }
    }
    
    // Get addon messages if applicable
    let addonMessages = 0;
    if (organization.addon_id) {
      const { data: addon } = await this.dbService.supabase
        .from('plan_addons')
        .select('extra_messages')
        .eq('id', organization.addon_id)
        .single();
      
      if (addon) {
        addonMessages = addon.extra_messages;
      }
    }
    
    // Use the higher of plan or custom plan limit, plus addons
    const baseLimit = Math.max(plan?.message_limit || 0, customPlanLimit);
    return baseLimit + addonMessages;
  }

  /**
   * Add a message credit usage entry - EXACT COPY of ChatService implementation
   */
  async addMessageStat(chatId: string, userId: number, organizationId: number, count: number = 1) {
    try {
      const supabase = this.dbService.supabase;
      
      console.log(`Adding message stat for chatId=${chatId}, userId=${userId}, organizationId=${organizationId}, count=${count}`);
      
      // Get or create agent tag first
      const agentTag = await this.getOrCreateAgentTag(organizationId);
      console.log('Using agent tag:', agentTag);
      
      // First, ensure a thread exists in the threads table using upsert (not insert)
      console.log('Creating/updating thread record with tag_id');
      const { data: threadData, error: threadError } = await supabase.from('threads').upsert({
        id: chatId,
        name: `Agent Thread ${new Date().toISOString().split('T')[0]}`,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
        user_id: userId,
        tag: agentTag.name,
        tag_id: agentTag.id, // Set tag_id to agent tag
        agent_run: true, // Mark as agent thread right away
        last_message: 'Generated by agent',
      }, { onConflict: 'id' }).select().single();
      
      console.log('Thread upsert result:', { data: threadData ? [{ id: threadData.id, tag_id: threadData.tag_id }] : null, error: threadError });
      
      if (threadError) {
        console.error('Error creating thread in addMessageStat:', threadError);
        throw new Error(`Failed to create thread: ${threadError.message}`);
      }
      
      // Add a single message stat
      console.log('Adding single message stat');
      const { data: statData, error: statError } = await supabase.from('message_stats').insert({
        organization_id: organizationId,
        user_id: userId,
        thread_id: chatId,
      }).select('id, thread_id');
      
      console.log('Message stat insert result:', { data: statData, error: statError });
      
      if (statError) {
        console.error('Error adding message stat:', statError);
        throw new Error(`Failed to add message stat: ${statError.message}`);
      }
      
      console.log('Message stats added successfully');
    } catch (error) {
      console.error('Exception in addMessageStat:', error);
      throw error;
    }
  }

  /**
   * Get or create an "agent" tag for the organization
   * This tag will be used for all agent threads
   */
  async getOrCreateAgentTag(organizationId: number): Promise<{
    id: number;
    name: string;
    backgroundColor: string;
    textColor: string;
    context: string | null;
  }> {
    const tagName = 'agent';
    
    console.log(`Looking for existing '${tagName}' tag for organization ${organizationId}`);
    
    try {
      // First try to find the existing agent tag
      const { data: existingTag, error: findError } = await this.dbService.supabase
        .from('tags')
        .select('id, name, background_color, text_color, context')
        .eq('organization_id', organizationId)
        .eq('name', tagName)
        .is('deleted_at', null)
        .maybeSingle();
      
      if (findError) {
        console.error('Error finding agent tag:', findError);
      }
      
      if (existingTag) {
        console.log(`Found existing '${tagName}' tag:`, existingTag);
        return {
          id: existingTag.id,
          name: existingTag.name,
          backgroundColor: existingTag.background_color,
          textColor: existingTag.text_color,
          context: existingTag.context
        };
      }
      
      console.log(`No '${tagName}' tag found, creating new one`);
      
      // If not found, create a new agent tag
      const { data: newTag, error: createError } = await this.dbService.supabase
        .from('tags')
        .insert({
          name: tagName,
          background_color: '#4B5563', // Gray-600
          text_color: '#FFFFFF',      // White
          organization_id: organizationId,
          context: 'This thread contains agent-generated content.'
        })
        .select('id, name, background_color, text_color, context')
        .single();
      
      if (createError) {
        console.error('Error creating agent tag:', createError);
        throw new Error(`Failed to create agent tag: ${createError.message}`);
      }
      
      if (!newTag || !newTag.id) {
        throw new Error('Failed to create agent tag: No tag returned from insert operation');
      }
      
      console.log(`Created new '${tagName}' tag:`, newTag);
      
      return {
        id: newTag.id,
        name: newTag.name,
        backgroundColor: newTag.background_color,
        textColor: newTag.text_color,
        context: newTag.context
      };
    } catch (error) {
      console.error('Exception in getOrCreateAgentTag:', error);
      throw error;
    }
  }
} 