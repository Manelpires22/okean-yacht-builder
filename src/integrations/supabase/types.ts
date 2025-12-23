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
      additional_to_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          ato_number: string
          commercial_approval_status: string | null
          contract_id: string
          created_at: string | null
          delivery_days_impact: number | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          notes: string | null
          original_price_impact: number | null
          price_impact: number | null
          rejection_reason: string | null
          requested_at: string | null
          requested_by: string
          requires_approval: boolean | null
          sequence_number: number
          status: string
          technical_approval_status: string | null
          title: string
          updated_at: string | null
          workflow_status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          ato_number: string
          commercial_approval_status?: string | null
          contract_id: string
          created_at?: string | null
          delivery_days_impact?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          original_price_impact?: number | null
          price_impact?: number | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by: string
          requires_approval?: boolean | null
          sequence_number: number
          status?: string
          technical_approval_status?: string | null
          title: string
          updated_at?: string | null
          workflow_status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          ato_number?: string
          commercial_approval_status?: string | null
          contract_id?: string
          created_at?: string | null
          delivery_days_impact?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          original_price_impact?: number | null
          price_impact?: number | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string
          requires_approval?: boolean | null
          sequence_number?: number
          status?: string
          technical_approval_status?: string | null
          title?: string
          updated_at?: string | null
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "additional_to_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_to_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "live_contracts"
            referencedColumns: ["contract_id"]
          },
        ]
      }
      approvals_backup: {
        Row: {
          approval_type: Database["public"]["Enums"]["approval_type"] | null
          created_at: string | null
          id: string | null
          notes: string | null
          quotation_id: string | null
          request_details: Json | null
          requested_at: string | null
          requested_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
          updated_at: string | null
        }
        Insert: {
          approval_type?: Database["public"]["Enums"]["approval_type"] | null
          created_at?: string | null
          id?: string | null
          notes?: string | null
          quotation_id?: string | null
          request_details?: Json | null
          requested_at?: string | null
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
        }
        Update: {
          approval_type?: Database["public"]["Enums"]["approval_type"] | null
          created_at?: string | null
          id?: string | null
          notes?: string | null
          quotation_id?: string | null
          request_details?: Json | null
          requested_at?: string | null
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ato_configurations: {
        Row: {
          ato_id: string
          calculated_price: number | null
          configuration_details: Json | null
          created_at: string | null
          created_by: string | null
          delivery_impact_days: number | null
          discount_percentage: number | null
          id: string
          item_id: string | null
          item_type: string
          labor_cost_per_hour: number | null
          labor_hours: number | null
          materials: Json | null
          notes: string | null
          original_price: number | null
          pm_notes: string | null
          pm_reviewed_at: string | null
          pm_reviewed_by: string | null
          pm_status: string | null
          sub_items: Json | null
        }
        Insert: {
          ato_id: string
          calculated_price?: number | null
          configuration_details?: Json | null
          created_at?: string | null
          created_by?: string | null
          delivery_impact_days?: number | null
          discount_percentage?: number | null
          id?: string
          item_id?: string | null
          item_type: string
          labor_cost_per_hour?: number | null
          labor_hours?: number | null
          materials?: Json | null
          notes?: string | null
          original_price?: number | null
          pm_notes?: string | null
          pm_reviewed_at?: string | null
          pm_reviewed_by?: string | null
          pm_status?: string | null
          sub_items?: Json | null
        }
        Update: {
          ato_id?: string
          calculated_price?: number | null
          configuration_details?: Json | null
          created_at?: string | null
          created_by?: string | null
          delivery_impact_days?: number | null
          discount_percentage?: number | null
          id?: string
          item_id?: string | null
          item_type?: string
          labor_cost_per_hour?: number | null
          labor_hours?: number | null
          materials?: Json | null
          notes?: string | null
          original_price?: number | null
          pm_notes?: string | null
          pm_reviewed_at?: string | null
          pm_reviewed_by?: string | null
          pm_status?: string | null
          sub_items?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ato_configurations_ato_id_fkey"
            columns: ["ato_id"]
            isOneToOne: false
            referencedRelation: "additional_to_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ato_workflow_steps: {
        Row: {
          assigned_to: string | null
          ato_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          response_data: Json | null
          status: string | null
          step_type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          ato_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          response_data?: Json | null
          status?: string | null
          step_type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          ato_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          response_data?: Json | null
          status?: string | null
          step_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ato_workflow_steps_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ato_workflow_steps_ato_id_fkey"
            columns: ["ato_id"]
            isOneToOne: false
            referencedRelation: "additional_to_orders"
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
      contract_delivery_checklist: {
        Row: {
          contract_id: string
          created_at: string | null
          id: string
          is_verified: boolean | null
          item_code: string | null
          item_id: string
          item_name: string
          item_type: string
          photo_urls: Json | null
          updated_at: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          item_code?: string | null
          item_id: string
          item_name: string
          item_type: string
          photo_urls?: Json | null
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          item_code?: string | null
          item_id?: string
          item_name?: string
          item_type?: string
          photo_urls?: Json | null
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_delivery_checklist_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_delivery_checklist_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "live_contracts"
            referencedColumns: ["contract_id"]
          },
        ]
      }
      contracts: {
        Row: {
          base_delivery_days: number
          base_price: number
          base_snapshot: Json | null
          client_id: string
          contract_number: string
          created_at: string | null
          created_by: string | null
          current_total_delivery_days: number
          current_total_price: number
          delivered_at: string | null
          delivered_by: string | null
          delivery_notes: string | null
          delivery_status: string | null
          hull_number_id: string | null
          id: string
          quotation_id: string
          signed_at: string | null
          signed_by_email: string | null
          signed_by_name: string | null
          status: string
          updated_at: string | null
          yacht_model_id: string
        }
        Insert: {
          base_delivery_days: number
          base_price: number
          base_snapshot?: Json | null
          client_id: string
          contract_number: string
          created_at?: string | null
          created_by?: string | null
          current_total_delivery_days: number
          current_total_price: number
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_notes?: string | null
          delivery_status?: string | null
          hull_number_id?: string | null
          id?: string
          quotation_id: string
          signed_at?: string | null
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string
          updated_at?: string | null
          yacht_model_id: string
        }
        Update: {
          base_delivery_days?: number
          base_price?: number
          base_snapshot?: Json | null
          client_id?: string
          contract_number?: string
          created_at?: string | null
          created_by?: string | null
          current_total_delivery_days?: number
          current_total_price?: number
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_notes?: string | null
          delivery_status?: string | null
          hull_number_id?: string | null
          id?: string
          quotation_id?: string
          signed_at?: string | null
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string
          updated_at?: string | null
          yacht_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_hull_number_id_fkey"
            columns: ["hull_number_id"]
            isOneToOne: false
            referencedRelation: "hull_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_yacht_model_id_fkey"
            columns: ["yacht_model_id"]
            isOneToOne: false
            referencedRelation: "yacht_models"
            referencedColumns: ["id"]
          },
        ]
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
      hull_numbers: {
        Row: {
          brand: string
          contract_id: string | null
          created_at: string | null
          estimated_delivery_date: string
          hull_entry_date: string
          hull_number: string
          id: string
          status: string
          updated_at: string | null
          yacht_model_id: string
        }
        Insert: {
          brand?: string
          contract_id?: string | null
          created_at?: string | null
          estimated_delivery_date: string
          hull_entry_date: string
          hull_number: string
          id?: string
          status?: string
          updated_at?: string | null
          yacht_model_id: string
        }
        Update: {
          brand?: string
          contract_id?: string | null
          created_at?: string | null
          estimated_delivery_date?: string
          hull_entry_date?: string
          hull_number?: string
          id?: string
          status?: string
          updated_at?: string | null
          yacht_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hull_numbers_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hull_numbers_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "live_contracts"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "hull_numbers_yacht_model_id_fkey"
            columns: ["yacht_model_id"]
            isOneToOne: false
            referencedRelation: "yacht_models"
            referencedColumns: ["id"]
          },
        ]
      }
      job_stops: {
        Row: {
          created_at: string | null
          days_limit: number | null
          display_order: number
          id: string
          is_active: boolean | null
          item_name: string
          stage: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_limit?: number | null
          display_order: number
          id?: string
          is_active?: boolean | null
          item_name: string
          stage?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_limit?: number | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          item_name?: string
          stage?: string | null
          updated_at?: string | null
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
          configurable_sub_items: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number
          has_upgrades: boolean | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_configurable: boolean | null
          is_customizable: boolean | null
          item_name: string
          job_stop_id: string | null
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
          configurable_sub_items?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number
          has_upgrades?: boolean | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_configurable?: boolean | null
          is_customizable?: boolean | null
          item_name: string
          job_stop_id?: string | null
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
          configurable_sub_items?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number
          has_upgrades?: boolean | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_configurable?: boolean | null
          is_customizable?: boolean | null
          item_name?: string
          job_stop_id?: string | null
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
            foreignKeyName: "memorial_items_job_stop_id_fkey"
            columns: ["job_stop_id"]
            isOneToOne: false
            referencedRelation: "job_stops"
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
      memorial_upgrades: {
        Row: {
          allow_multiple: boolean | null
          brand: string | null
          code: string
          configurable_sub_items: Json | null
          created_at: string | null
          created_by: string | null
          delivery_days_impact: number | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_configurable: boolean | null
          is_customizable: boolean | null
          job_stop_id: string | null
          memorial_item_id: string | null
          model: string | null
          name: string
          price: number
          technical_specs: Json | null
          updated_at: string | null
          yacht_model_id: string
        }
        Insert: {
          allow_multiple?: boolean | null
          brand?: string | null
          code: string
          configurable_sub_items?: Json | null
          created_at?: string | null
          created_by?: string | null
          delivery_days_impact?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_configurable?: boolean | null
          is_customizable?: boolean | null
          job_stop_id?: string | null
          memorial_item_id?: string | null
          model?: string | null
          name: string
          price?: number
          technical_specs?: Json | null
          updated_at?: string | null
          yacht_model_id: string
        }
        Update: {
          allow_multiple?: boolean | null
          brand?: string | null
          code?: string
          configurable_sub_items?: Json | null
          created_at?: string | null
          created_by?: string | null
          delivery_days_impact?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_configurable?: boolean | null
          is_customizable?: boolean | null
          job_stop_id?: string | null
          memorial_item_id?: string | null
          model?: string | null
          name?: string
          price?: number
          technical_specs?: Json | null
          updated_at?: string | null
          yacht_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorial_upgrades_job_stop_id_fkey"
            columns: ["job_stop_id"]
            isOneToOne: false
            referencedRelation: "job_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorial_upgrades_memorial_item_id_fkey"
            columns: ["memorial_item_id"]
            isOneToOne: false
            referencedRelation: "memorial_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorial_upgrades_yacht_model_id_fkey"
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
          deprecated_at: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          deprecated_at?: string | null
          description?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          deprecated_at?: string | null
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
          allow_multiple: boolean | null
          base_price: number
          brand: string | null
          category_id: string | null
          code: string
          configurable_sub_items: Json | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          delivery_days_impact: number | null
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_configurable: boolean | null
          is_customizable: boolean | null
          job_stop_id: string | null
          model: string | null
          name: string
          technical_specifications: Json | null
          updated_at: string | null
          yacht_model_id: string | null
        }
        Insert: {
          allow_multiple?: boolean | null
          base_price: number
          brand?: string | null
          category_id?: string | null
          code: string
          configurable_sub_items?: Json | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          delivery_days_impact?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_configurable?: boolean | null
          is_customizable?: boolean | null
          job_stop_id?: string | null
          model?: string | null
          name: string
          technical_specifications?: Json | null
          updated_at?: string | null
          yacht_model_id?: string | null
        }
        Update: {
          allow_multiple?: boolean | null
          base_price?: number
          brand?: string | null
          category_id?: string | null
          code?: string
          configurable_sub_items?: Json | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          delivery_days_impact?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_configurable?: boolean | null
          is_customizable?: boolean | null
          job_stop_id?: string | null
          model?: string | null
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
            referencedRelation: "memorial_categories"
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
            foreignKeyName: "options_job_stop_id_fkey"
            columns: ["job_stop_id"]
            isOneToOne: false
            referencedRelation: "job_stops"
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
          ato_id: string | null
          attachments: Json | null
          created_at: string | null
          customization_code: string | null
          delivery_impact_days: number | null
          engineering_hours: number | null
          engineering_notes: string | null
          file_paths: string[] | null
          id: string
          included_in_contract: boolean | null
          item_name: string
          memorial_item_id: string | null
          notes: string | null
          option_id: string | null
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
          workflow_status: string
        }
        Insert: {
          additional_cost?: number | null
          ato_id?: string | null
          attachments?: Json | null
          created_at?: string | null
          customization_code?: string | null
          delivery_impact_days?: number | null
          engineering_hours?: number | null
          engineering_notes?: string | null
          file_paths?: string[] | null
          id?: string
          included_in_contract?: boolean | null
          item_name: string
          memorial_item_id?: string | null
          notes?: string | null
          option_id?: string | null
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
          workflow_status?: string
        }
        Update: {
          additional_cost?: number | null
          ato_id?: string | null
          attachments?: Json | null
          created_at?: string | null
          customization_code?: string | null
          delivery_impact_days?: number | null
          engineering_hours?: number | null
          engineering_notes?: string | null
          file_paths?: string[] | null
          id?: string
          included_in_contract?: boolean | null
          item_name?: string
          memorial_item_id?: string | null
          notes?: string | null
          option_id?: string | null
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
          workflow_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_customizations_ato_id_fkey"
            columns: ["ato_id"]
            isOneToOne: false
            referencedRelation: "additional_to_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_customizations_memorial_item_id_fkey"
            columns: ["memorial_item_id"]
            isOneToOne: false
            referencedRelation: "memorial_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_customizations_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
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
      quotation_upgrades: {
        Row: {
          created_at: string | null
          customization_notes: string | null
          delivery_days_impact: number | null
          id: string
          memorial_item_id: string
          price: number
          quotation_id: string
          upgrade_id: string
        }
        Insert: {
          created_at?: string | null
          customization_notes?: string | null
          delivery_days_impact?: number | null
          id?: string
          memorial_item_id: string
          price?: number
          quotation_id: string
          upgrade_id: string
        }
        Update: {
          created_at?: string | null
          customization_notes?: string | null
          delivery_days_impact?: number | null
          id?: string
          memorial_item_id?: string
          price?: number
          quotation_id?: string
          upgrade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_upgrades_memorial_item_id_fkey"
            columns: ["memorial_item_id"]
            isOneToOne: false
            referencedRelation: "memorial_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_upgrades_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_upgrades_upgrade_id_fkey"
            columns: ["upgrade_id"]
            isOneToOne: false
            referencedRelation: "memorial_upgrades"
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
          hull_number_id: string | null
          id: string
          options_discount_percentage: number | null
          parent_quotation_id: string | null
          quotation_number: string
          sales_representative_id: string | null
          secure_token: string | null
          sent_at: string | null
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
          hull_number_id?: string | null
          id?: string
          options_discount_percentage?: number | null
          parent_quotation_id?: string | null
          quotation_number: string
          sales_representative_id?: string | null
          secure_token?: string | null
          sent_at?: string | null
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
          hull_number_id?: string | null
          id?: string
          options_discount_percentage?: number | null
          parent_quotation_id?: string | null
          quotation_number?: string
          sales_representative_id?: string | null
          secure_token?: string | null
          sent_at?: string | null
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
            foreignKeyName: "quotations_hull_number_id_fkey"
            columns: ["hull_number_id"]
            isOneToOne: false
            referencedRelation: "hull_numbers"
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
      role_permissions_config: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean
          is_granted: boolean
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean
          is_granted?: boolean
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean
          is_granted?: boolean
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          category: string | null
          config_key: string
          config_value: Json
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          config_key: string
          config_value: Json
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          config_key?: string
          config_value?: Json
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
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
      workflow_settings: {
        Row: {
          config_data: Json | null
          created_at: string | null
          enabled: boolean
          id: string
          setting_key: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_data?: Json | null
          created_at?: string | null
          enabled?: boolean
          id?: string
          setting_key: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_data?: Json | null
          created_at?: string | null
          enabled?: boolean
          id?: string
          setting_key?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      yacht_models: {
        Row: {
          base_delivery_days: number
          base_price: number
          bathrooms: string | null
          beam: number | null
          brand: string | null
          cabins: number | null
          code: string
          created_at: string | null
          created_by: string | null
          cruise_speed: number | null
          delivery_date: string | null
          description: string | null
          displacement_light: number | null
          displacement_loaded: number | null
          display_order: number | null
          draft: number | null
          dry_weight: number | null
          engines: string | null
          exterior_images: Json | null
          fuel_capacity: number | null
          gallery_images: Json | null
          height_from_waterline: number | null
          hull_color: string | null
          hull_length: number | null
          id: string
          image_url: string | null
          interior_images: Json | null
          is_active: boolean | null
          length_overall: number | null
          max_speed: number | null
          model: string | null
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
          brand?: string | null
          cabins?: number | null
          code: string
          created_at?: string | null
          created_by?: string | null
          cruise_speed?: number | null
          delivery_date?: string | null
          description?: string | null
          displacement_light?: number | null
          displacement_loaded?: number | null
          display_order?: number | null
          draft?: number | null
          dry_weight?: number | null
          engines?: string | null
          exterior_images?: Json | null
          fuel_capacity?: number | null
          gallery_images?: Json | null
          height_from_waterline?: number | null
          hull_color?: string | null
          hull_length?: number | null
          id?: string
          image_url?: string | null
          interior_images?: Json | null
          is_active?: boolean | null
          length_overall?: number | null
          max_speed?: number | null
          model?: string | null
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
          brand?: string | null
          cabins?: number | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          cruise_speed?: number | null
          delivery_date?: string | null
          description?: string | null
          displacement_light?: number | null
          displacement_loaded?: number | null
          display_order?: number | null
          draft?: number | null
          dry_weight?: number | null
          engines?: string | null
          exterior_images?: Json | null
          fuel_capacity?: number | null
          gallery_images?: Json | null
          height_from_waterline?: number | null
          hull_color?: string | null
          hull_length?: number | null
          id?: string
          image_url?: string | null
          interior_images?: Json | null
          is_active?: boolean | null
          length_overall?: number | null
          max_speed?: number | null
          model?: string | null
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
      admin_dashboard_stats: {
        Row: {
          categories_count: number | null
          contracts_count: number | null
          models_count: number | null
          options_count: number | null
          quotations_count: number | null
          users_count: number | null
        }
        Relationships: []
      }
      contract_stats: {
        Row: {
          active_contracts: number | null
          approved_atos: number | null
          avg_delivery_days: number | null
          cancelled_contracts: number | null
          completed_contracts: number | null
          pending_atos: number | null
          rejected_atos: number | null
          total_ato_revenue: number | null
          total_atos: number | null
          total_contracts: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      live_contracts: {
        Row: {
          approved_atos_count: number | null
          base_delivery_days: number | null
          base_price: number | null
          client_id: string | null
          contract_id: string | null
          contract_number: string | null
          created_at: string | null
          current_total_delivery_days: number | null
          current_total_price: number | null
          pending_atos_count: number | null
          quotation_id: string | null
          signed_at: string | null
          status: string | null
          total_atos_count: number | null
          total_atos_delivery_days: number | null
          total_atos_price: number | null
          updated_at: string | null
          yacht_model_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_yacht_model_id_fkey"
            columns: ["yacht_model_id"]
            isOneToOne: false
            referencedRelation: "yacht_models"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_stats: {
        Row: {
          accepted: number | null
          accepted_value: number | null
          draft: number | null
          expiring_soon: number | null
          pending_approval: number | null
          ready_to_send: number | null
          recent_quotations: number | null
          sent: number | null
          total: number | null
          total_value: number | null
        }
        Relationships: []
      }
      workflow_pending_tasks: {
        Row: {
          pending_commercial_tasks: number | null
          pending_planning_tasks: number | null
          pending_pm_tasks: number | null
          pending_supply_tasks: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_effective_permissions: {
        Args: { _user_id: string }
        Returns: {
          permission: string
        }[]
      }
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
      reset_role_permissions_to_default: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      update_yacht_models_order: { Args: { updates: Json }; Returns: undefined }
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
        | "cockpit_praca_popa"
        | "cozinha_gourmet"
        | "proa"
        | "diversos"
        | "banheiro_social"
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
        "cockpit_praca_popa",
        "cozinha_gourmet",
        "proa",
        "diversos",
        "banheiro_social",
      ],
    },
  },
} as const
