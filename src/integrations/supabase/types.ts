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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          member_count: number | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          member_count?: number | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          profile_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          profile_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          current_question: Json | null
          current_round: number | null
          game_type: string
          id: string
          match_id: string
          max_rounds: number | null
          player1_answer: string | null
          player1_score: number | null
          player2_answer: string | null
          player2_score: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_question?: Json | null
          current_round?: number | null
          game_type: string
          id?: string
          match_id: string
          max_rounds?: number | null
          player1_answer?: string | null
          player1_score?: number | null
          player2_answer?: string | null
          player2_score?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_question?: Json | null
          current_round?: number | null
          game_type?: string
          id?: string
          match_id?: string
          max_rounds?: number | null
          player1_answer?: string | null
          player1_score?: number | null
          player2_answer?: string | null
          player2_score?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          profile1_id: string
          profile2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile1_id: string
          profile2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile1_id?: string
          profile2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_profile1_id_fkey"
            columns: ["profile1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_profile2_id_fkey"
            columns: ["profile2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_games: {
        Row: {
          compatibility_bonus: number | null
          completed_at: string | null
          created_at: string
          game_type: string
          id: string
          match_id: string
          player1_answers: Json | null
          player2_answers: Json | null
        }
        Insert: {
          compatibility_bonus?: number | null
          completed_at?: string | null
          created_at?: string
          game_type: string
          id?: string
          match_id: string
          player1_answers?: Json | null
          player2_answers?: Json | null
        }
        Update: {
          compatibility_bonus?: number | null
          completed_at?: string | null
          created_at?: string
          game_type?: string
          id?: string
          match_id?: string
          player1_answers?: Json | null
          player2_answers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mini_games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          order_index: number | null
          photo_url: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          order_index?: number | null
          photo_url: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          order_index?: number | null
          photo_url?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number
          bio: string | null
          boundaries: string[] | null
          break_mode_until: string | null
          city: string | null
          comfort_tags: string[] | null
          compatibility_data: Json | null
          created_at: string
          daily_usage_minutes: number | null
          dating_mode: string | null
          energy_preferences: Json | null
          gender: string
          hide_photos_until_message: number | null
          id: string
          interests: string[] | null
          location_lat: number | null
          location_lng: number | null
          looking_for: string[] | null
          max_age: number | null
          max_distance: number | null
          min_age: number | null
          name: string
          non_negotiables: string[] | null
          profile_theme: string | null
          pronouns: string | null
          session_start_time: string | null
          social_links: Json | null
          updated_at: string
          user_id: string
          vibe_status: string | null
          voice_intro_url: string | null
        }
        Insert: {
          age: number
          bio?: string | null
          boundaries?: string[] | null
          break_mode_until?: string | null
          city?: string | null
          comfort_tags?: string[] | null
          compatibility_data?: Json | null
          created_at?: string
          daily_usage_minutes?: number | null
          dating_mode?: string | null
          energy_preferences?: Json | null
          gender: string
          hide_photos_until_message?: number | null
          id?: string
          interests?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          looking_for?: string[] | null
          max_age?: number | null
          max_distance?: number | null
          min_age?: number | null
          name: string
          non_negotiables?: string[] | null
          profile_theme?: string | null
          pronouns?: string | null
          session_start_time?: string | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
          vibe_status?: string | null
          voice_intro_url?: string | null
        }
        Update: {
          age?: number
          bio?: string | null
          boundaries?: string[] | null
          break_mode_until?: string | null
          city?: string | null
          comfort_tags?: string[] | null
          compatibility_data?: Json | null
          created_at?: string
          daily_usage_minutes?: number | null
          dating_mode?: string | null
          energy_preferences?: Json | null
          gender?: string
          hide_photos_until_message?: number | null
          id?: string
          interests?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          looking_for?: string[] | null
          max_age?: number | null
          max_distance?: number | null
          min_age?: number | null
          name?: string
          non_negotiables?: string[] | null
          profile_theme?: string | null
          pronouns?: string | null
          session_start_time?: string | null
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          vibe_status?: string | null
          voice_intro_url?: string | null
        }
        Relationships: []
      }
      safety_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          created_at: string
          direction: string
          id: string
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          swiped_id: string
          swiper_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_swiped_id_fkey"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          duration_minutes: number | null
          ended_at: string | null
          id: string
          profile_id: string
          started_at: string
        }
        Insert: {
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          profile_id: string
          started_at?: string
        }
        Update: {
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          profile_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_intros: {
        Row: {
          audio_url: string
          created_at: string
          duration_seconds: number | null
          id: string
          profile_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          profile_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_intros_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
