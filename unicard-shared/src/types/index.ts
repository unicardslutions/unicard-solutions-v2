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
      advertisements: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string
          link_url: string | null
          display_order: number
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url: string
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          school_id: string
          status: Database["public"]["Enums"]["order_status"]
          submitted_at: string | null
          template_id: string | null
          total_students: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["order_status"]
          submitted_at?: string | null
          template_id?: string | null
          total_students?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          submitted_at?: string | null
          template_id?: string | null
          total_students?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string
          area: string | null
          contact_person: string
          contact_photo_url: string | null
          created_at: string
          id: string
          logo_url: string | null
          pin_code: string | null
          school_name: string
          updated_at: string
          user_id: string
          verified: boolean
          whatsapp_number: string
        }
        Insert: {
          address: string
          area?: string | null
          contact_person: string
          contact_photo_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          pin_code?: string | null
          school_name: string
          updated_at?: string
          user_id: string
          verified?: boolean
          whatsapp_number: string
        }
        Update: {
          address?: string
          area?: string | null
          contact_person?: string
          contact_photo_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          pin_code?: string | null
          school_name?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
          whatsapp_number?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          blood_group: string | null
          class: string
          created_at: string
          date_of_birth: string | null
          father_name: string | null
          gender: string | null
          id: string
          order_id: string
          phone_number: string | null
          photo_url: string | null
          roll_number: string | null
          section: string | null
          student_id: string | null
          student_name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          blood_group?: string | null
          class: string
          created_at?: string
          date_of_birth?: string | null
          father_name?: string | null
          gender?: string | null
          id?: string
          order_id: string
          phone_number?: string | null
          photo_url?: string | null
          roll_number?: string | null
          section?: string | null
          student_id?: string | null
          student_name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          blood_group?: string | null
          class?: string
          created_at?: string
          date_of_birth?: string | null
          father_name?: string | null
          gender?: string | null
          id?: string
          order_id?: string
          phone_number?: string | null
          photo_url?: string | null
          roll_number?: string | null
          section?: string | null
          student_id?: string | null
          student_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          design_data: Json
          id: string
          is_public: boolean
          name: string
          orientation: string
          thumbnail_url: string | null
          updated_at: string
          canvas_type?: string
          version?: number
          parent_template_id?: string | null
          tags?: string[] | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          design_data: Json
          id?: string
          is_public?: boolean
          name: string
          orientation: string
          thumbnail_url?: string | null
          updated_at?: string
          canvas_type?: string
          version?: number
          parent_template_id?: string | null
          tags?: string[] | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          design_data?: Json
          id?: string
          is_public?: boolean
          name?: string
          orientation?: string
          thumbnail_url?: string | null
          updated_at?: string
          canvas_type?: string
          version?: number
          parent_template_id?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      template_versions: {
        Row: {
          id: string
          template_id: string
          version: number
          design_data: Json
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          version: number
          design_data: Json
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          version?: number
          design_data?: Json
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      app_role: "admin" | "school"
      order_status:
        | "draft"
        | "submitted"
        | "in_design"
        | "printed"
        | "delivered"
        | "completed"
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
      app_role: ["admin", "school"],
      order_status: [
        "draft",
        "submitted",
        "in_design",
        "printed",
        "delivered",
        "completed",
      ],
    },
  },
} as const

// Common type aliases for easier use
export type School = Tables<'schools'>
export type Student = Tables<'students'>
export type Order = Tables<'orders'>
export type Template = Tables<'templates'>
export type Advertisement = Tables<'advertisements'>
export type UserRole = Tables<'user_roles'>
export type TemplateVersion = Tables<'template_versions'>

export type AppRole = Enums<'app_role'>
export type OrderStatus = Enums<'order_status'>

// Extended types for mobile apps
export interface StudentWithOrder extends Student {
  order?: Order
}

export interface OrderWithDetails extends Order {
  school?: School
  template?: Template
  students?: Student[]
}

export interface SchoolWithStats extends School {
  total_students?: number
  total_orders?: number
  pending_orders?: number
}
