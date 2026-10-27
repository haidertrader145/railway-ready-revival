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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bot_messages: {
        Row: {
          chat_id: number
          created_at: string
          delete_after: string
          id: number
          message_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string
          delete_after: string
          id?: never
          message_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string
          delete_after?: string
          id?: never
          message_id?: number
        }
        Relationships: []
      }
      bot_settings: {
        Row: {
          key: string
          value: string | null
        }
        Insert: {
          key: string
          value?: string | null
        }
        Update: {
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      bot_users: {
        Row: {
          chat_id: number
          created_at: string
          last_balance: number
          last_deposit: number
          platform: string | null
          selected_service: string | null
          state: string
          trader_id: string | null
          trader_verified: boolean
          updated_at: string
        }
        Insert: {
          chat_id: number
          created_at?: string
          last_balance?: number
          last_deposit?: number
          platform?: string | null
          selected_service?: string | null
          state?: string
          trader_id?: string | null
          trader_verified?: boolean
          updated_at?: string
        }
        Update: {
          chat_id?: number
          created_at?: string
          last_balance?: number
          last_deposit?: number
          platform?: string | null
          selected_service?: string | null
          state?: string
          trader_id?: string | null
          trader_verified?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      bridge_state: {
        Row: {
          created_at: string
          id: number
          last_seen: string | null
          login_code: string | null
          session_string: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: number
          last_seen?: string | null
          login_code?: string | null
          session_string?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          last_seen?: string | null
          login_code?: string | null
          session_string?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      license_keys: {
        Row: {
          created_at: string
          id: number
          issued_at: string | null
          issued_to_chat_id: number | null
          issued_to_trader_id: string | null
          key: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: never
          issued_at?: string | null
          issued_to_chat_id?: number | null
          issued_to_trader_id?: string | null
          key: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: never
          issued_at?: string | null
          issued_to_chat_id?: number | null
          issued_to_trader_id?: string | null
          key?: string
          status?: string
        }
        Relationships: []
      }
      service_config: {
        Row: {
          invite_link: string | null
          min_balance: number
          service_key: string
          sort: number
          title: string
        }
        Insert: {
          invite_link?: string | null
          min_balance?: number
          service_key: string
          sort?: number
          title: string
        }
        Update: {
          invite_link?: string | null
          min_balance?: number
          service_key?: string
          sort?: number
          title?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          affiliate_reply: string | null
          chat_id: number
          created_at: string
          id: string
          platform: string
          purpose: string
          resolved_at: string | null
          service_key: string | null
          status: string
          trader_id: string
        }
        Insert: {
          affiliate_reply?: string | null
          chat_id: number
          created_at?: string
          id?: string
          platform?: string
          purpose?: string
          resolved_at?: string | null
          service_key?: string | null
          status?: string
          trader_id: string
        }
        Update: {
          affiliate_reply?: string | null
          chat_id?: number
          created_at?: string
          id?: string
          platform?: string
          purpose?: string
          resolved_at?: string | null
          service_key?: string | null
          status?: string
          trader_id?: string
        }
        Relationships: []
      }
      verified_users: {
        Row: {
          chat_id: number
          id: number
          license_key_id: number | null
          trader_id: string | null
          username: string | null
          verified_at: string
        }
        Insert: {
          chat_id: number
          id?: never
          license_key_id?: number | null
          trader_id?: string | null
          username?: string | null
          verified_at?: string
        }
        Update: {
          chat_id?: number
          id?: never
          license_key_id?: number | null
          trader_id?: string | null
          username?: string | null
          verified_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
