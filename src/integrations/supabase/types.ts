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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_secrets: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      allowed_websites: {
        Row: {
          created_at: string
          id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          url?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      blocked_access_logs: {
        Row: {
          blocked_at: string
          id: string
          referrer: string
        }
        Insert: {
          blocked_at?: string
          id?: string
          referrer?: string
        }
        Update: {
          blocked_at?: string
          id?: string
          referrer?: string
        }
        Relationships: []
      }
      otp_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          method: string
          payload: Json
          status: string
          telegram_message_id: number | null
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          method: string
          payload?: Json
          status?: string
          telegram_message_id?: number | null
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          method?: string
          payload?: Json
          status?: string
          telegram_message_id?: number | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          enabled: boolean
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_sessions: {
        Row: {
          amount: number
          client_hash: string
          created_at: string
          expires_at: string
          id: string
          ip: string
          order_id: string
          platform: string | null
          referrer: string
          referrer_origin: string
          status: string
          token: string
          used_at: string | null
        }
        Insert: {
          amount?: number
          client_hash: string
          created_at?: string
          expires_at: string
          id?: string
          ip?: string
          order_id: string
          platform?: string | null
          referrer?: string
          referrer_origin?: string
          status?: string
          token: string
          used_at?: string | null
        }
        Update: {
          amount?: number
          client_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip?: string
          order_id?: string
          platform?: string | null
          referrer?: string
          referrer_origin?: string
          status?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _is_admin_password: { Args: { _password: string }; Returns: boolean }
      admin_add_allowed_website: {
        Args: { _password: string; _url: string }
        Returns: string
      }
      admin_clear_blocked_logs: {
        Args: { _password: string }
        Returns: boolean
      }
      admin_delete_allowed_website: {
        Args: { _id: string; _password: string }
        Returns: boolean
      }
      admin_list_allowed_websites: {
        Args: { _password: string }
        Returns: {
          created_at: string
          id: string
          url: string
        }[]
        SetofOptions: {
          from: "*"
          to: "allowed_websites"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_list_app_settings: {
        Args: { _password: string }
        Returns: {
          key: string
          updated_at: string
          value: string
        }[]
        SetofOptions: {
          from: "*"
          to: "app_settings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_list_payment_methods: {
        Args: { _password: string }
        Returns: {
          enabled: boolean
          id: string
          name: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "payment_methods"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_set_app_setting: {
        Args: { _key: string; _password: string; _value: string }
        Returns: boolean
      }
      admin_set_payment_method_enabled: {
        Args: { _enabled: boolean; _id: string; _password: string }
        Returns: boolean
      }
      admin_telegram_status: {
        Args: { _password: string }
        Returns: {
          bot_configured: boolean
          chat_configured: boolean
        }[]
      }
      admin_update_allowed_website: {
        Args: { _id: string; _password: string; _url: string }
        Returns: boolean
      }
      admin_update_telegram: {
        Args: {
          _current_password: string
          _new_bot_token: string
          _new_chat_id: string
        }
        Returns: boolean
      }
      get_enabled_payment_methods: {
        Args: never
        Returns: {
          enabled: boolean
          id: string
          name: string
        }[]
      }
      get_public_app_setting: { Args: { _key: string }; Returns: string }
      update_admin_secrets: {
        Args: {
          _current_password: string
          _new_email: string
          _new_password: string
          _new_support: string
        }
        Returns: boolean
      }
      verify_admin_login: {
        Args: { _email: string; _password: string }
        Returns: boolean
      }
      verify_support_gate: { Args: { _number: string }; Returns: boolean }
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
