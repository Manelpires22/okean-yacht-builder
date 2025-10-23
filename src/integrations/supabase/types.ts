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
      clients: {
        Row: {
          company: string | null
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
      memorial_items: {
        Row: {
          brand: string | null
          category: Database["public"]["Enums"]["memorial_category"]
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
          quotation_number: string
          sales_representative_id: string | null
          status: string
          total_customizations_price: number | null
          total_delivery_days: number
          total_options_price: number | null
          updated_at: string | null
          valid_until: string
          yacht_model_id: string | null
        }
        Insert: {
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
          quotation_number: string
          sales_representative_id?: string | null
          status: string
          total_customizations_price?: number | null
          total_delivery_days: number
          total_options_price?: number | null
          updated_at?: string | null
          valid_until: string
          yacht_model_id?: string | null
        }
        Update: {
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
          quotation_number?: string
          sales_representative_id?: string | null
          status?: string
          total_customizations_price?: number | null
          total_delivery_days?: number
          total_options_price?: number | null
          updated_at?: string | null
          valid_until?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "administrador"
        | "gerente_comercial"
        | "comercial"
        | "producao"
        | "financeiro"
      approval_status: "pending" | "approved" | "rejected"
      approval_type: "discount" | "customization"
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
      ],
      approval_status: ["pending", "approved", "rejected"],
      approval_type: ["discount", "customization"],
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
      ],
    },
  },
} as const
