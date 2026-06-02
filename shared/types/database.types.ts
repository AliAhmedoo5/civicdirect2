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
      donors: {
        Row: {
          clerk_user_id: string
          created_at: string | null
          full_name: string
          id: string
          wallet_balance: number | null
        }
        Insert: {
          clerk_user_id: string
          created_at?: string | null
          full_name: string
          id?: string
          wallet_balance?: number | null
        }
        Update: {
          clerk_user_id?: string
          created_at?: string | null
          full_name?: string
          id?: string
          wallet_balance?: number | null
        }
        Relationships: []
      }
      ngos: {
        Row: {
          city_zone: string | null
          clerk_user_id: string
          created_at: string | null
          id: string
          is_verified: boolean | null
          location_lat: number | null
          location_lng: number | null
          name: string
          registration_number: string | null
        }
        Insert: {
          city_zone?: string | null
          clerk_user_id: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          name: string
          registration_number?: string | null
        }
        Update: {
          city_zone?: string | null
          clerk_user_id?: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          registration_number?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          ngo_id: string | null
          proof_image_url: string | null
          raised_amount: number | null
          request_type: string
          status: Database["public"]["Enums"]["request_status"] | null
          target_amount: number
          updated_at: string | null
          urgency_level: Database["public"]["Enums"]["urgency_level"] | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ngo_id?: string | null
          proof_image_url?: string | null
          raised_amount?: number | null
          request_type: string
          status?: Database["public"]["Enums"]["request_status"] | null
          target_amount: number
          updated_at?: string | null
          urgency_level?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ngo_id?: string | null
          proof_image_url?: string | null
          raised_amount?: number | null
          request_type?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          target_amount?: number
          updated_at?: string | null
          urgency_level?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "ngos"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          donor_id: string | null
          id: string
          request_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          donor_id?: string | null
          id?: string
          request_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          donor_id?: string | null
          id?: string
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_donation: {
        Args: { p_amount: number; p_donor_id: string; p_request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      request_status:
        | "pending"
        | "active"
        | "fully_funded"
        | "disbursed"
        | "rejected"
      urgency_level: "normal" | "high" | "critical"
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
      request_status: [
        "pending",
        "active",
        "fully_funded",
        "disbursed",
        "rejected",
      ],
      urgency_level: ["normal", "high", "critical"],
    },
  },
} as const

