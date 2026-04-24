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
      outfit_history: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          occasion: string | null
          outfit_id: string | null
          user_id: string
          worn_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          occasion?: string | null
          outfit_id?: string | null
          user_id: string
          worn_date: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          occasion?: string | null
          outfit_id?: string | null
          user_id?: string
          worn_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_history_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          ai_explanation: string | null
          bottom_id: string | null
          compatibility_score: number
          created_at: string
          id: string
          is_favorite: boolean
          is_saved: boolean
          jacket_id: string | null
          occasion_tags: string[] | null
          shoes_id: string | null
          top_id: string | null
          user_id: string
          worn_count: number
        }
        Insert: {
          ai_explanation?: string | null
          bottom_id?: string | null
          compatibility_score?: number
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_saved?: boolean
          jacket_id?: string | null
          occasion_tags?: string[] | null
          shoes_id?: string | null
          top_id?: string | null
          user_id: string
          worn_count?: number
        }
        Update: {
          ai_explanation?: string | null
          bottom_id?: string | null
          compatibility_score?: number
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_saved?: boolean
          jacket_id?: string | null
          occasion_tags?: string[] | null
          shoes_id?: string | null
          top_id?: string | null
          user_id?: string
          worn_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "outfits_bottom_id_fkey"
            columns: ["bottom_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfits_jacket_id_fkey"
            columns: ["jacket_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfits_shoes_id_fkey"
            columns: ["shoes_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfits_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          created_at: string
          display_name: string
          eye_color_hex: string
          hair_color_hex: string
          id: string
          skin_tone_hex: string
          skin_tone_type: string
          style_preferences: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          eye_color_hex?: string
          hair_color_hex?: string
          id: string
          skin_tone_hex?: string
          skin_tone_type?: string
          style_preferences?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          eye_color_hex?: string
          hair_color_hex?: string
          id?: string
          skin_tone_hex?: string
          skin_tone_type?: string
          style_preferences?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          brand: string | null
          category: string
          color_family: string
          created_at: string
          id: string
          image_url: string | null
          last_worn: string | null
          name: string
          occasion_tags: string[] | null
          pattern: string
          primary_color: string
          season: string[] | null
          secondary_color: string | null
          style_tags: string[] | null
          sub_category: string | null
          times_worn: number
          user_id: string
        }
        Insert: {
          brand?: string | null
          category: string
          color_family: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_worn?: string | null
          name: string
          occasion_tags?: string[] | null
          pattern?: string
          primary_color: string
          season?: string[] | null
          secondary_color?: string | null
          style_tags?: string[] | null
          sub_category?: string | null
          times_worn?: number
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string
          color_family?: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_worn?: string | null
          name?: string
          occasion_tags?: string[] | null
          pattern?: string
          primary_color?: string
          season?: string[] | null
          secondary_color?: string | null
          style_tags?: string[] | null
          sub_category?: string | null
          times_worn?: number
          user_id?: string
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
    Enums: {},
  },
} as const
