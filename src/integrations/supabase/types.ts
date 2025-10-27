export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          approval_type: Database["public"]["Enums"]["approval_type"]
          created_at: string | null
          id: string
          notes: string | null
          quotation_id: string
          request_details: Json | null
          requested_at: string
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string | null
        }
        Insert: {
          approval_type: Database["public"]["Enums"]["approval_type"]
          created_at?: string | null
          id?: string
          notes?: string | null
          quotation_id: string
          request_details?: Json | null
          requested_at?: string
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string | null
        }
        Update: {
          approval_type?: Database["public"]["Enums"]["approval_type"]
          created_at?: string | null
          id?: string
          notes?: string | null
          quotation_id?: string
          request_details?: Json | null
          requested_at?: string
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          route: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          route?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          route?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          company: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customization_workflow_steps: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          customization_id: string
          id: string
          notes: string | null
          response_data: Json | null
          status: string | null
          step_type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          customization_id: string
          id?: string
          notes?: string | null
          response_data?: Json | null
          status?: string | null
          step_type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          customization_id?: string
          id?: string
          notes?: string | null
          response_data?: Json | null
          status?: string | null
          step_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customization_workflow_steps_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customization_workflow_steps_customization_id_fkey"
            columns: ["customization_id"]
            isOneToOne: false
            referencedRelation: "quotation_customizations"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_limits_config: {
        Row: {
          admin_approval_required_above: number
          director_approval_max: number
          id: string
          limit_type: string
          no_approval_max: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          admin_approval_required_above: number
          director_approval_max: number
          id?: string
          limit_type: string
          no_approval_max: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          admin_approval_required_above?: number
          director_approval_max?: number
          id?: string
          limit_type?: string
          no_approval_max?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      memorial_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      memorial_items: {
        Row: {
          brand: string | null
          category: Database["public"]["Enums"]["memorial_category"]
          category_display_order: number | null
          category_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean | null
          is_customizable: boolean | null
          item_name: string
          model: string | null
          quantity: number | null
          technical_specs: Json | null
          unit: string | null
          updated_at: string | null
          yacht_model_id: string
        }
        Insert: {
          brand?: string | null
          category: Database["public"]["Enums"]["memorial_category"]
          category_display_order?: number | null
          category_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          is_customizable?: boolean | null
          item_name: string
          model?: string | null
          quantity?: number | null
          technical_specs?: Json | null
          unit?: string | null
          updated_at?: string | null
          yacht_model_id: string
        }
        Update: {
          brand?: string | null
          category?: Database["public"]["Enums"]["memorial_category"]
          category_display_order?: number | null
          category_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          is_customizable?: boolean | null
          item_name?: string
          model?: string | null
          quantity?: number | null
          technical_specs?: Json | null
          unit?: string | null
          updated_at?: string | null
          yacht_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorial_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "memorial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorial_items_yacht_model_id_fkey"
            columns: ["yacht_model_id"]
            isOneToOne: false
            referencedRelation: "yacht_models"
            referencedColumns: ["id"]
          },
        ]
      }
      option_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      options: {
        Row: {
          base_price: number
          category_id: string | null
          code: string
          cost: number | null
          created_at: string | null
          created_by: string | null
          delivery_days_impact: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          technical_specifications: Json | null
          updated_at: string | null
          yacht_model_id: string | null
        }
        Insert: {
          base_price: number
          category_id?: string | null
          code: string
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          delivery_days_impact?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          technical_specifications?: Json | null
          updated_at?: string | null
          yacht_model_id?: string | null
        }
        Update: {
          base_price?: number
          category_id?: string | null
          code?: string
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          delivery_days_impact?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          technical_specifications?: Json | null
          updated_at?: string | null
          yacht_model_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "options_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "option_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "options_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "options_yacht_model_id_fkey"
            columns: ["yacht_model_id"]
            isOneToOne: false
            referencedRelation: "yacht_models"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_yacht_model_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          pm_user_id: string
          yacht_model_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          pm_user_id: string
          yacht_model_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          pm_user_id?: string
          yacht_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_yacht_model_assignments_pm_user_id_fkey"
            columns: ["pm_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_yacht_model_assignments_yacht_model_id_fkey"
            columns: ["yacht_model_id"]
            isOneToOne: true
            referencedRelation: "yacht_models"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_customizations: {
        Row: {
          additional_cost: number | null
          attachments: Json | null
          created_at: string | null
          delivery_impact_days: number | null
          engineering_hours: number | null
          engineering_notes: string | null
          file_paths: string[] | null
          id: string
          item_name: string
          memorial_item_id: string | null
          notes: string | null
          planning_delivery_impact_days: number | null
          planning_notes: string | null
          planning_window_start: string | null
          pm_final_delivery_impact_days: number | null
          pm_final_notes: string | null
          pm_final_price: number | null
          pm_scope: string | null
          quantity: number | null
          quotation_id: string
          reject_reason: string | null
          required_parts: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          supply_cost: number | null
          supply_items: Json | null
          supply_lead_time_days: number | null
          supply_notes: string | null
          workflow_audit: Json | null
          workflow_status: string | null
        }
        Insert: {
          additional_cost?: number | null
          attachments?: Json | null
          created_at?: string | null
          delivery_impact_days?: number | null
          engineering_hours?: number | null
          engineering_notes?: string | null
          file_paths?: string[] | null
          id?: string
          item_name: string
          memorial_item_id?: string | null
          notes?: string | null
          planning_delivery_impact_days?: number | null
          planning_notes?: string | null
          planning_window_start?: string | null
          pm_final_delivery_impact_days?: number | null
          pm_final_notes?: string | null
          pm_final_price?: number | null
          pm_scope?: string | null
          quantity?: number | null
          quotation_id: string
          reject_reason?: string | null
          required_parts?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          supply_cost?: number | null
          supply_items?: Json | null
          supply_lead_time_days?: number | null
          supply_notes?: string | null
          workflow_audit?: Json | null
          workflow_status?: string | null
        }
        Update: {
          additional_cost?: number | null
          attachments?: Json | null
          created_at?: string | null
          delivery_impact_days?: number | null
          engineering_hours?: number | null
          engineering_notes?: string | null
          file_paths?: string[] | null
          id?: string
          item_name?: string
          memorial_item_id?: string | null
          notes?: string | null
          planning_delivery_impact_days?: number | null
          planning_notes?: string | null
          planning_window_start?: string | null
          pm_final_delivery_impact_days?: number | null
          pm_final_notes?: string | null
          pm_final_price?: number | null
          pm_scope?: string | null
          quantity?: number | null
          quotation_id?: string
          reject_reason?: string | null
          required_parts?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          supply_cost?: number | null
          supply_items?: Json | null
          supply_lead_time_days?: number | null
          supply_notes?: string | null
          workflow_audit?: Json | null
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_customizations_memorial_item_id_fkey"
            columns: ["memorial_item_id"]
            isOneToOne: false
            referencedRelation: "memorial_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_customizations_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_customizations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_options: {
        Row: {
          created_at: string | null
          delivery_days_impact: number | null
          id: string
          option_id: string | null
          quantity: number | null
          quotation_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          delivery_days_impact?: number | null
          id?: string
          option_id?: string | null
          quantity?: number | null
          quotation_id?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          delivery_days_impact?: number | null
          id?: string
          option_id?: string | null
          quantity?: number | null
          quotation_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_options_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_options_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          accepted_at: string | null
          accepted_by_email: string | null
          accepted_by_name: string | null
          base_delivery_days: number
          base_discount_percentage: number | null
          base_price: number
          client_email: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string | null
          discount_amount: number | null
          discount_percentage: number | null
          final_base_price: number
          final_options_price: number | null
          final_price: number
          id: string
          options_discount_percentage: number | null
          parent_quotation_id: string | null
          quotation_number: string
          sales_representative_id: string | null
          secure_token: string | null
          snapshot_json: Json | null
          status: string
          total_customizations_price: number | null
          total_delivery_days: number
          total_options_price: number | null
          updated_at: string | null
          valid_until: string
          version: number | null
          yacht_model_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_email?: string | null
          accepted_by_name?: string | null
          base_delivery_days: number
          base_discount_percentage?: number | null
          base_price: number
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_base_price: number
          final_options_price?: number | null
          final_price: number
          id?: string
          options_discount_percentage?: number | null
          parent_quotation_id?: string | null
          quotation_number: string
          sales_representative_id?: string | null
          secure_token?: string | null
          snapshot_json?: Json | null
          status: string
          total_customizations_price?: number | null
          total_delivery_days: number
          total_options_price?: number | null
          updated_at?: string | null
          valid_until: string
          version?: number | null
          yacht_model_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by_email?: string | null
          accepted_by_name?: string | null
          base_delivery_days?: number
          base_discount_percentage?: number | null
          base_price?: number
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_base_price?: number
          final_options_price?: number | null
          final_price?: number
          id?: string
          options_discount_percentage?: number | null
          parent_quotation_id?: string | null
          quotation_number?: string
          sales_representative_id?: string | null
          secure_token?: string | null
          snapshot_json?: Json | null
          status?: string
          total_customizations_price?: number | null
          total_delivery_days?: number
          total_options_price?: number | null
          updated_at?: string | null
          valid_until?: string
          version?: number | null
          yacht_model_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_parent_quotation_id_fkey"
            columns: ["parent_quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_sales_representative_id_fkey"
            columns: ["sales_representative_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_yacht_model_id_fkey"
            columns: ["yacht_model_id"]
            isOneToOne: false
            referencedRelation: "yacht_models"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          department: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department: string
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_config: {
        Row: {
          config_key: string
          config_value: Json
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      yacht_models: {
        Row: {
          base_delivery_days: number
          base_price: number
          bathrooms: string | null
          beam: number | null
          cabins: number | null
          code: string
          created_at: string | null
          created_by: string | null
          cruise_speed: number | null
          delivery_date: string | null
          description: string | null
          displacement_light: number | null
          displacement_loaded: number | null
          draft: number | null
          dry_weight: number | null
          engines: string | null
          fuel_capacity: number | null
          height_from_waterline: number | null
          hull_color: string | null
          hull_length: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          length_overall: number | null
          max_speed: number | null
          name: string
          passengers_capacity: number | null
          range_nautical_miles: number | null
          registration_number: string | null
          technical_specifications: Json | null
          updated_at: string | null
          water_capacity: number | null
        }
        Insert: {
          base_delivery_days: number
          base_price: number
          bathrooms?: string | null
          beam?: number | null
          cabins?: number | null
          code: string
          created_at?: string | null
          created_by?: string | null
          cruise_speed?: number | null
          delivery_date?: string | null
          description?: string | null
          displacement_light?: number | null
          displacement_loaded?: number | null
          draft?: number | null
          dry_weight?: number | null
          engines?: string | null
          fuel_capacity?: number | null
          height_from_waterline?: number | null
          hull_color?: string | null
          hull_length?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          length_overall?: number | null
          max_speed?: number | null
          name: string
          passengers_capacity?: number | null
          range_nautical_miles?: number | null
          registration_number?: string | null
          technical_specifications?: Json | null
          updated_at?: string | null
          water_capacity?: number | null
        }
        Update: {
          base_delivery_days?: number
          base_price?: number
          bathrooms?: string | null
          beam?: number | null
          cabins?: number | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          cruise_speed?: number | null
          delivery_date?: string | null
          description?: string | null
          displacement_light?: number | null
          displacement_loaded?: number | null
          draft?: number | null
          dry_weight?: number | null
          engines?: string | null
          fuel_capacity?: number | null
          height_from_waterline?: number | null
          hull_color?: string | null
          hull_length?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          length_overall?: number | null
          max_speed?: number | null
          name?: string
          passengers_capacity?: number | null
          range_nautical_miles?: number | null
          registration_number?: string | null
          technical_specifications?: Json | null
          updated_at?: string | null
          water_capacity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "yacht_models_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_yacht_model_id: { Args: { modelo_text: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { user_id: string }; Returns: boolean }
      normalize_memorial_category: {
        Args: { okean_categoria: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "administrador"
        | "gerente_comercial"
        | "comercial"
        | "producao"
        | "financeiro"
        | "pm_engenharia"
        | "comprador"
        | "planejador"
        | "broker"
        | "diretor_comercial"
        | "backoffice_comercial"
      approval_status: "pending" | "approved" | "rejected"
      approval_type: "discount" | "customization" | "commercial" | "technical"
      department_type:
        | "commercial"
        | "engineering"
        | "supply"
        | "planning"
        | "backoffice"
      memorial_category:
        | "dimensoes"
        | "motorizacao"
        | "sistema_eletrico"
        | "sistema_hidraulico"
        | "acabamentos"
        | "equipamentos"
        | "seguranca"
        | "conforto"
        | "outros"
        | "conves_principal"
        | "salao"
        | "area_jantar"
        | "lavabo"
        | "area_cozinha"
        | "cozinha_galley"
        | "comando_principal"
        | "flybridge"
        | "lobby_conves_inferior"
        | "cabine_master"
        | "banheiro_master"
        | "cabine_vip"
        | "banheiro_vip"
        | "cabine_hospedes_bombordo"
        | "banheiro_hospedes_bombordo"
        | "cabine_hospedes_boreste"
        | "banheiro_hospedes_boreste"
        | "banheiro_capitao"
        | "cabine_capitao"
        | "banheiro_tripulacao"
        | "cabine_tripulacao"
        | "lobby_tripulacao"
        | "sala_maquinas"
        | "garagem"
        | "propulsao_controle"
        | "sistema_estabilizacao"
        | "equipamentos_eletronicos"
        | "sistema_extincao_incendio"
        | "sistema_ar_condicionado"
        | "sistema_bombas_porao"
        | "sistema_agua_sanitario"
        | "cabine_vip_proa"
        | "banheiro_hospedes_compartilhado"
        | "eletrica"
        | "audiovisual_entretenimento"
        | "deck_principal"
        | "plataforma_popa"
        | "casco_estrutura"
        | "area_tecnica"
        | "navegacao"
        | "cockpit"
        | "caracteristicas_externas"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "administrador",
        "gerente_comercial",
        "comercial",
        "producao",
        "financeiro",
        "pm_engenharia",
        "comprador",
        "planejador",
        "broker",
        "diretor_comercial",
        "backoffice_comercial",
      ],
      approval_status: ["pending", "approved", "rejected"],
      approval_type: ["discount", "customization", "commercial", "technical"],
      department_type: [
        "commercial",
        "engineering",
        "supply",
        "planning",
        "backoffice",
      ],
      memorial_category: [
        "dimensoes",
        "motorizacao",
        "sistema_eletrico",
        "sistema_hidraulico",
        "acabamentos",
        "equipamentos",
        "seguranca",
        "conforto",
        "outros",
        "conves_principal",
        "salao",
        "area_jantar",
        "lavabo",
        "area_cozinha",
        "cozinha_galley",
        "comando_principal",
        "flybridge",
        "lobby_conves_inferior",
        "cabine_master",
        "banheiro_master",
        "cabine_vip",
        "banheiro_vip",
        "cabine_hospedes_bombordo",
        "banheiro_hospedes_bombordo",
        "cabine_hospedes_boreste",
        "banheiro_hospedes_boreste",
        "banheiro_capitao",
        "cabine_capitao",
        "banheiro_tripulacao",
        "cabine_tripulacao",
        "lobby_tripulacao",
        "sala_maquinas",
        "garagem",
        "propulsao_controle",
        "sistema_estabilizacao",
        "equipamentos_eletronicos",
        "sistema_extincao_incendio",
        "sistema_ar_condicionado",
        "sistema_bombas_porao",
        "sistema_agua_sanitario",
        "cabine_vip_proa",
        "banheiro_hospedes_compartilhado",
        "eletrica",
        "audiovisual_entretenimento",
        "deck_principal",
        "plataforma_popa",
        "casco_estrutura",
        "area_tecnica",
        "navegacao",
        "cockpit",
        "caracteristicas_externas",
      ],
    },
  },
} as const
