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
      audio_items: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          is_favorite: boolean
          title: string | null
          uploader_id: string
          url: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          title?: string | null
          uploader_id: string
          url: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          title?: string | null
          uploader_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_items_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      bucket_list: {
        Row: {
          completed: boolean
          couple_id: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          completed?: boolean
          couple_id: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          completed?: boolean
          couple_id?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_list_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_members: {
        Row: {
          couple_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          couple_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          couple_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          bg_blur: number
          bg_dim: number
          bg_text_theme: string
          bg_url: string | null
          created_at: string
          created_by: string
          id: string
          invite_code: string
          started_at: string | null
          theme: string | null
        }
        Insert: {
          bg_blur?: number
          bg_dim?: number
          bg_text_theme?: string
          bg_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          invite_code: string
          started_at?: string | null
          theme?: string | null
        }
        Update: {
          bg_blur?: number
          bg_dim?: number
          bg_text_theme?: string
          bg_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          started_at?: string | null
          theme?: string | null
        }
        Relationships: []
      }
      gallery_albums: {
        Row: {
          album_date: string | null
          couple_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          album_date?: string | null
          couple_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          album_date?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          album: string | null
          album_id: string | null
          caption: string | null
          couple_id: string
          created_at: string
          id: string
          is_favorite: boolean
          taken_at: string | null
          uploader_id: string
          url: string
        }
        Insert: {
          album?: string | null
          album_id?: string | null
          caption?: string | null
          couple_id: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          taken_at?: string | null
          uploader_id: string
          url: string
        }
        Update: {
          album?: string | null
          album_id?: string | null
          caption?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          taken_at?: string | null
          uploader_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "gallery_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_items_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          couple_id: string
          kind: string
          state: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          couple_id: string
          kind: string
          state?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          couple_id?: string
          kind?: string
          state?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          couple_id: string
          created_at: string
          id: string
          kind: string
          media_url: string | null
          reaction: string | null
          seen_at: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          couple_id: string
          created_at?: string
          id?: string
          kind?: string
          media_url?: string | null
          reaction?: string | null
          seen_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          kind?: string
          media_url?: string | null
          reaction?: string | null
          seen_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string
          content: string
          couple_id: string
          created_at: string
          handwritten: boolean
          id: string
          is_private: boolean
          mood: string | null
          title: string | null
        }
        Insert: {
          author_id: string
          content: string
          couple_id: string
          created_at?: string
          handwritten?: boolean
          id?: string
          is_private?: boolean
          mood?: string | null
          title?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          couple_id?: string
          created_at?: string
          handwritten?: boolean
          id?: string
          is_private?: boolean
          mood?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bg_blur: number
          bg_dim: number
          bg_text_theme: string
          bg_url: string | null
          created_at: string
          display_name: string | null
          id: string
          mood: string | null
          nickname: string | null
        }
        Insert: {
          avatar_url?: string | null
          bg_blur?: number
          bg_dim?: number
          bg_text_theme?: string
          bg_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          mood?: string | null
          nickname?: string | null
        }
        Update: {
          avatar_url?: string | null
          bg_blur?: number
          bg_dim?: number
          bg_text_theme?: string
          bg_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          mood?: string | null
          nickname?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_couple_member: {
        Args: { _couple_id: string; _user_id: string }
        Returns: boolean
      }
      join_couple_by_code: { Args: { _code: string }; Returns: string }
      my_couple_id: { Args: { _user_id: string }; Returns: string }
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
