export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: number
          name: string
          description: string
          type: string
          default_instructions: string
          default_context: string
          is_visible: boolean
          system_prompt: string
          language: string
          model: string
          temperature: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          type: string
          default_instructions: string
          default_context: string
          system_prompt: string
          language?: string
          model: string
          temperature: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          type?: string
          default_instructions?: string
          default_context?: string
          system_prompt?: string
          language?: string
          model?: string
          temperature?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_organization_visibility: {
        Row: {
          id: number
          agent_id: number
          organization_id: number
          created_at: string
        }
        Insert: {
          id?: number
          agent_id: number
          organization_id: number
          created_at?: string
        }
        Update: {
          id?: number
          agent_id?: number
          organization_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_organization_visibility_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_organization_visibility_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_user_visibility: {
        Row: {
          id: number
          agent_id: number
          user_id: number
          created_at: string
        }
        Insert: {
          id?: number
          agent_id: number
          user_id: number
          created_at?: string
        }
        Update: {
          id?: number
          agent_id?: number
          user_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_user_visibility_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_user_visibility_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_instance_user_visibility: {
        Row: {
          id: number
          instance_id: number
          user_id: number
          created_at: string
          is_read_only: boolean
        }
        Insert: {
          id?: number
          instance_id: number
          user_id: number
          created_at?: string
          is_read_only?: boolean
        }
        Update: {
          id?: number
          instance_id?: number
          user_id?: number
          created_at?: string
          is_read_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agent_instance_user_visibility_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "organization_agent_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_instance_user_visibility_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_instance_organization_visibility: {
        Row: {
          id: number
          instance_id: number
          organization_id: number
          created_at: string
          is_read_only: boolean
        }
        Insert: {
          id?: number
          instance_id: number
          organization_id: number
          created_at?: string
          is_read_only?: boolean
        }
        Update: {
          id?: number
          instance_id?: number
          organization_id?: number
          created_at?: string
          is_read_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agent_instance_organization_visibility_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "organization_agent_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_instance_organization_visibility_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_instance_field_permissions: {
        Row: {
          id: number
          instance_id: number
          field_name: string
          is_hidden: boolean
          created_at: string
        }
        Insert: {
          id?: number
          instance_id: number
          field_name: string
          is_hidden: boolean
          created_at?: string
        }
        Update: {
          id?: number
          instance_id?: number
          field_name?: string
          is_hidden?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_instance_field_permissions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "organization_agent_instances"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_instance_user_field_permissions: {
        Row: {
          id: number
          instance_id: number
          user_id: number
          field_name: string
          is_hidden: boolean
          created_at: string
        }
        Insert: {
          id?: number
          instance_id: number
          user_id: number
          field_name: string
          is_hidden: boolean
          created_at?: string
        }
        Update: {
          id?: number
          instance_id?: number
          user_id?: number
          field_name?: string
          is_hidden?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_instance_user_field_permissions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "organization_agent_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_instance_user_field_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_instance_organization_field_permissions: {
        Row: {
          id: number
          instance_id: number
          organization_id: number
          field_name: string
          is_hidden: boolean
          created_at: string
        }
        Insert: {
          id?: number
          instance_id: number
          organization_id: number
          field_name: string
          is_hidden: boolean
          created_at?: string
        }
        Update: {
          id?: number
          instance_id?: number
          organization_id?: number
          field_name?: string
          is_hidden?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_instance_organization_field_permissions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "organization_agent_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_instance_organization_field_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_agent_instances: {
        Row: {
          id: number
          organization_id: number
          agent_id: number
          name: string
          instructions: string
          context: string
          created_at: string
          updated_at: string
          created_by: number
          is_org_visible: boolean
          is_read_only: boolean
        }
        Insert: {
          id?: number
          organization_id: number
          agent_id: number
          name: string
          instructions: string
          context: string
          created_at?: string
          updated_at?: string
          created_by: number
          is_org_visible?: boolean
          is_read_only?: boolean
        }
        Update: {
          id?: number
          organization_id?: number
          agent_id?: number
          name?: string
          instructions?: string
          context?: string
          created_at?: string
          updated_at?: string
          created_by?: number
          is_org_visible?: boolean
          is_read_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "organization_agent_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_agent_instances_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_agent_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_documents: {
        Row: {
          id: number
          organization_agent_instance_id: number
          document_id: string
          created_at: string
        }
        Insert: {
          id?: number
          organization_agent_instance_id: number
          document_id: string
          created_at?: string
        }
        Update: {
          id?: number
          organization_agent_instance_id?: number
          document_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_documents_organization_agent_instance_id_fkey"
            columns: ["organization_agent_instance_id"]
            isOneToOne: false
            referencedRelation: "organization_agent_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
        ]
      }
      assistants: {
        Row: {
          id: string
          organization_id: number
          tag: string
          tag_id: number
        }
        Insert: {
          id: string
          organization_id: number
          tag: string
          tag_id: number
        }
        Update: {
          id?: string
          organization_id?: number
          tag?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "assistants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistants_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      chunks: {
        Row: {
          content: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          drive_document: boolean | null
          drive_file_id: string | null
          id: string
          name: string
          organization_id: number
          path: string
          size: number
          tag: string
          tag_id: number | null
          teams_document: boolean
          type: string
        }
        Insert: {
          created_at?: string
          drive_document?: boolean | null
          drive_file_id?: string | null
          id: string
          name: string
          organization_id: number
          path: string
          size: number
          tag?: string
          tag_id?: number | null
          teams_document?: boolean
          type: string
        }
        Update: {
          created_at?: string
          drive_document?: boolean | null
          drive_file_id?: string | null
          id?: string
          name?: string
          organization_id?: number
          path?: string
          size?: number
          tag?: string
          tag_id?: number | null
          teams_document?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string
          created_at: string
          global: boolean | null
          id: number
          module: string
          name: string
          organization_id: number
          user_id: number | null
        }
        Insert: {
          color: string
          created_at?: string
          global?: boolean | null
          id?: number
          module: string
          name: string
          organization_id: number
          user_id?: number | null
        }
        Update: {
          color?: string
          created_at?: string
          global?: boolean | null
          id?: number
          module?: string
          name?: string
          organization_id?: number
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      help_content: {
        Row: {
          allowed_role: Database["public"]["Enums"]["roles"]
          content: string
          created_at: string
          id: number
          subtitle: string
          tag: string | null
          title: string
          title_excerpt: string | null
          type: Database["public"]["Enums"]["help_content_type"] | null
        }
        Insert: {
          allowed_role?: Database["public"]["Enums"]["roles"]
          content: string
          created_at?: string
          id?: number
          subtitle: string
          tag?: string | null
          title: string
          title_excerpt?: string | null
          type?: Database["public"]["Enums"]["help_content_type"] | null
        }
        Update: {
          allowed_role?: Database["public"]["Enums"]["roles"]
          content?: string
          created_at?: string
          id?: number
          subtitle?: string
          tag?: string | null
          title?: string
          title_excerpt?: string | null
          type?: Database["public"]["Enums"]["help_content_type"] | null
        }
        Relationships: []
      }
      message_stats: {
        Row: {
          created_at: string
          id: number
          organization_id: number
          thread_id: string
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          organization_id: number
          thread_id: string
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          organization_id?: number
          thread_id?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_sent_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_sent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_stats_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          addon_id: number | null
          ai_context: string
          ai_model: string
          ai_temperature: number
          created_at: string | null
          custom_plan_id: number | null
          drive_folder_id: string
          google_client_id: string | null
          google_client_secret: string | null
          google_token: Json | null
          id: number
          microsoft_client_id: string | null
          microsoft_client_secret: string | null
          microsoft_token: Json | null
          name: string
          plan_id: number | null
          suggested_tag_context: string | null
          teams_bot_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          addon_id?: number | null
          ai_context?: string
          ai_model?: string
          ai_temperature?: number
          created_at?: string | null
          custom_plan_id?: number | null
          drive_folder_id?: string
          google_client_id?: string | null
          google_client_secret?: string | null
          google_token?: Json | null
          id?: number
          microsoft_client_id?: string | null
          microsoft_client_secret?: string | null
          microsoft_token?: Json | null
          name: string
          plan_id?: number | null
          suggested_tag_context?: string | null
          teams_bot_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          addon_id?: number | null
          ai_context?: string
          ai_model?: string
          ai_temperature?: number
          created_at?: string | null
          custom_plan_id?: number | null
          drive_folder_id?: string
          google_client_id?: string | null
          google_client_secret?: string | null
          google_token?: Json | null
          id?: number
          microsoft_client_id?: string | null
          microsoft_client_secret?: string | null
          microsoft_token?: Json | null
          name?: string
          plan_id?: number | null
          suggested_tag_context?: string | null
          teams_bot_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "plan_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_custom_plan_id_fkey"
            columns: ["custom_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_addons: {
        Row: {
          created_at: string
          extra_messages: number
          extra_storage: number
          extra_users: number
          id: number
        }
        Insert: {
          created_at?: string
          extra_messages?: number
          extra_storage?: number
          extra_users?: number
          id?: number
        }
        Update: {
          created_at?: string
          extra_messages?: number
          extra_storage?: number
          extra_users?: number
          id?: number
        }
        Relationships: []
      }
      plans: {
        Row: {
          addons: boolean
          annual_discount: number
          created_at: string
          custom_integrations: boolean
          duration: Database["public"]["Enums"]["plan_duration"] | null
          id: number
          message_limit: number
          name: string
          price: number
          priority_support: boolean
          sandbox_stripe_price_id: string | null
          slug: Database["public"]["Enums"]["plan_slug"] | null
          storage_limit: number
          stripe_price_id: string | null
          unit_size: number | null
          user_limit: number
        }
        Insert: {
          addons?: boolean
          annual_discount?: number
          created_at?: string
          custom_integrations?: boolean
          duration?: Database["public"]["Enums"]["plan_duration"] | null
          id?: number
          message_limit?: number
          name: string
          price?: number
          priority_support?: boolean
          sandbox_stripe_price_id?: string | null
          slug?: Database["public"]["Enums"]["plan_slug"] | null
          storage_limit?: number
          stripe_price_id?: string | null
          unit_size?: number | null
          user_limit?: number
        }
        Update: {
          addons?: boolean
          annual_discount?: number
          created_at?: string
          custom_integrations?: boolean
          duration?: Database["public"]["Enums"]["plan_duration"] | null
          id?: number
          message_limit?: number
          name?: string
          price?: number
          priority_support?: boolean
          sandbox_stripe_price_id?: string | null
          slug?: Database["public"]["Enums"]["plan_slug"] | null
          storage_limit?: number
          stripe_price_id?: string | null
          unit_size?: number | null
          user_limit?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: number
          mode: string
          organization_id: number | null
          plan_id: number
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          stripe_subscription_id: string
          user_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          mode?: string
          organization_id?: number | null
          plan_id: number
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string
          stripe_subscription_id: string
          user_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          mode?: string
          organization_id?: number | null
          plan_id?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string
          stripe_subscription_id?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          background_color: string
          created_at: string
          deleted_at: string | null
          id: number
          name: string
          organization_id: number | null
          text_color: string
          user_id: number | null
          context: string | null
        }
        Insert: {
          background_color: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          name: string
          organization_id?: number | null
          text_color: string
          user_id?: number | null
          context?: string | null
        }
        Update: {
          background_color?: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          name?: string
          organization_id?: number | null
          text_color?: string
          user_id?: number | null
          context?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_stores: {
        Row: {
          id: string
          organization_id: number
          tag_id: number
        }
        Insert: {
          id: string
          organization_id: number
          tag_id: number
        }
        Update: {
          id?: string
          organization_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vector_stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vector_stores_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_folders: {
        Row: {
          created_at: string
          folder_id: number
          id: number
          organization_id: number
          thread_id: string
          user_id: number | null
        }
        Insert: {
          created_at?: string
          folder_id: number
          id?: number
          organization_id: number
          thread_id: string
          user_id?: number | null
        }
        Update: {
          created_at?: string
          folder_id?: number
          id?: number
          organization_id?: number
          thread_id?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_folders_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_folders_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_pins: {
        Row: {
          created_at: string
          id: number
          order: number
          organization_id: number
          thread_id: string
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          order: number
          organization_id: number
          thread_id: string
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          order?: number
          organization_id?: number
          thread_id?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "thread_pins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_pins_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      },
      thread_attachments: {
        Row: {
          id: string
          thread_id: string
          url: string
          filename: string
          mime_type: string
          created_at: string
          openai_file_id: string | null
        }
        Insert: {
          id?: string
          thread_id: string
          url: string
          filename: string
          mime_type: string
          created_at?: string
          openai_file_id?: string | null
        }
        Update: {
          id?: string
          thread_id?: string
          url?: string
          filename?: string
          mime_type?: string
          created_at?: string
          openai_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thread_attachments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          }
        ]
      },
      threads: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          last_message: string
          messages: Json
          modified_at: string
          name: string
          openai_response_id: string | null
          run_id: string | null
          tag: string
          tag_id: number | null
          teams_thread: boolean
          user_id: number | null
          whatsapp_thread: boolean
          agent_run: boolean | null
          agent_instance_id: number | null
          agent_run_inputs: Json | null
          agent_run_outputs: Json | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id: string
          last_message?: string
          messages?: Json
          modified_at?: string
          name?: string
          openai_response_id?: string | null
          run_id?: string | null
          tag?: string
          tag_id?: number | null
          teams_thread?: boolean
          user_id?: number | null
          whatsapp_thread?: boolean
          agent_run?: boolean | null
          agent_instance_id?: number | null
          agent_run_inputs?: Json | null
          agent_run_outputs?: Json | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          last_message?: string
          messages?: Json
          modified_at?: string
          name?: string
          openai_response_id?: string | null
          run_id?: string | null
          tag?: string
          tag_id?: number | null
          teams_thread?: boolean
          user_id?: number | null
          whatsapp_thread?: boolean
          agent_run?: boolean | null
          agent_instance_id?: number | null
          agent_run_inputs?: Json | null
          agent_run_outputs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "threads_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          organization_id: number
          role: string
          user_id: number
        }
        Insert: {
          organization_id: number
          role: string
          user_id: number
        }
        Update: {
          organization_id?: number
          role?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tags: {
        Row: {
          created_at: string
          tag_id: number
          user_id: number
        }
        Insert: {
          created_at?: string
          tag_id: number
          user_id: number
        }
        Update: {
          created_at?: string
          tag_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active_organization_id: number | null
          created_at: string | null
          data_access_tags: string[]
          email: string
          firebase_uid: string
          first_name: string | null
          id: number
          image: string
          is_teamleader: boolean
          last_name: string | null
          phone: string | null
          profile: string | null
          tags: string[]
          teamlead_id: number | null
          ai_user_context: string | null
          ai_user_model?: string | null
          ai_user_temperature?: number | null
        }
        Insert: {
          active_organization_id?: number | null
          created_at?: string | null
          data_access_tags?: string[]
          email: string
          firebase_uid: string
          first_name?: string | null
          id?: number
          image?: string
          is_teamleader?: boolean
          last_name?: string | null
          phone?: string | null
          profile?: string | null
          tags?: string[]
          teamlead_id?: number | null
          ai_user_context?: string | null
          ai_user_model?: string | null
          ai_user_temperature?: number | null
        }
        Update: {
          active_organization_id?: number | null
          created_at?: string | null
          data_access_tags?: string[]
          email?: string
          firebase_uid?: string
          first_name?: string | null
          id?: number
          image?: string
          is_teamleader?: boolean
          last_name?: string | null
          phone?: string | null
          profile?: string | null
          tags?: string[]
          teamlead_id?: number | null
          ai_user_context?: string | null
          ai_user_model?: string | null
          ai_user_temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_teamlead_id_fkey"
            columns: ["teamlead_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          created_at: string
          document_id: string
          folder_id: number
          id: number
          organization_id: number
          user_id: number | null
        }
        Insert: {
          created_at?: string
          document_id: string
          folder_id: number
          id?: number
          organization_id: number
          user_id?: number | null
        }
        Update: {
          created_at?: string
          document_id?: string
          folder_id?: number
          id?: number
          organization_id?: number
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      filter_chunks_by_tags: {
        Args: {
          tags: string[]
        }
        Returns: {
          content: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }[]
      }
      find_similar_documents: {
        Args: {
          filter: Json
          query_embedding: string
          match_count: number
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          embedding: Json
          similarity: number
          debug_info: Json
        }[]
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_chunks: {
        Args: {
          filter: Json
          query_embedding: string
          match_count: number
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          embedding: Json
          similarity: number
          debug_info: Json
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      help_content_type: "article" | "video" | "prompt"
      plan_duration: "monthly" | "annually" | "discounted"
      plan_slug:
        | "free"
        | "small_team_monthly"
        | "small_team_annually"
        | "large_team_monthly"
        | "large_team_annually"
        | "enterprise"
        | "addon_messages"
        | "addon_storage"
        | "addon_users"
        | "custom"
      roles: "user" | "admin" | "owner" | "super-admin"
      subscription_status: "active" | "paused" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
