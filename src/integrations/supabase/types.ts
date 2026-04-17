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
      applications: {
        Row: {
          created_at: string
          id: string
          job_offer_id: string
          message: string | null
          professional_id: string
          proposed_amount: number | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_offer_id: string
          message?: string | null
          professional_id: string
          proposed_amount?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_offer_id?: string
          message?: string | null
          professional_id?: string
          proposed_amount?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          institution_name: string
          institution_type: string | null
          nit: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          institution_name: string
          institution_type?: string | null
          nit?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          institution_name?: string
          institution_type?: string | null
          nit?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      job_offers: {
        Row: {
          address: string | null
          amount: number
          city: string
          contact_phone: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          modality: Database["public"]["Enums"]["offer_modality"]
          posted_by: string
          poster_type: Database["public"]["Enums"]["poster_type"]
          requirements: string[] | null
          shifts_count: number | null
          specialty_required: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["offer_status"]
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amount: number
          city: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          modality: Database["public"]["Enums"]["offer_modality"]
          posted_by: string
          poster_type: Database["public"]["Enums"]["poster_type"]
          requirements?: string[] | null
          shifts_count?: number | null
          specialty_required?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amount?: number
          city?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          modality?: Database["public"]["Enums"]["offer_modality"]
          posted_by?: string
          poster_type?: Database["public"]["Enums"]["poster_type"]
          requirements?: string[] | null
          shifts_count?: number | null
          specialty_required?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      professional_profiles: {
        Row: {
          active: boolean | null
          ai_strengths: string[] | null
          ai_suggestions: string[] | null
          ai_summary: string | null
          availability: Json | null
          avg_rating: number | null
          certifications: Json | null
          created_at: string
          hourly_rate: number | null
          id: string
          languages: string[] | null
          monthly_rate: number | null
          rethus_number: string | null
          rethus_verified: boolean | null
          service_cities: string[] | null
          shift_rate: number | null
          specialty: string | null
          sub_specialties: string[] | null
          total_jobs: number | null
          trust_score: number | null
          updated_at: string
          user_id: string
          verified: boolean | null
          years_experience: number | null
        }
        Insert: {
          active?: boolean | null
          ai_strengths?: string[] | null
          ai_suggestions?: string[] | null
          ai_summary?: string | null
          availability?: Json | null
          avg_rating?: number | null
          certifications?: Json | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          monthly_rate?: number | null
          rethus_number?: string | null
          rethus_verified?: boolean | null
          service_cities?: string[] | null
          shift_rate?: number | null
          specialty?: string | null
          sub_specialties?: string[] | null
          total_jobs?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          years_experience?: number | null
        }
        Update: {
          active?: boolean | null
          ai_strengths?: string[] | null
          ai_suggestions?: string[] | null
          ai_summary?: string | null
          availability?: Json | null
          avg_rating?: number | null
          certifications?: Json | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          monthly_rate?: number | null
          rethus_number?: string | null
          rethus_verified?: boolean | null
          service_cities?: string[] | null
          shift_rate?: number | null
          specialty?: string | null
          sub_specialties?: string[] | null
          total_jobs?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          years_experience?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          job_offer_id: string | null
          rated_user_id: string
          rater_user_id: string
          stars: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          job_offer_id?: string | null
          rated_user_id: string
          rater_user_id: string
          stars: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          job_offer_id?: string | null
          rated_user_id?: string
          rater_user_id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          expires_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "professional"
        | "family"
        | "institution"
        | "superadmin"
        | "hr_staff"
        | "evaluator"
      application_status: "pending" | "accepted" | "rejected" | "withdrawn"
      offer_modality: "hour" | "shift" | "month" | "package"
      offer_status: "open" | "closed" | "filled"
      poster_type: "family" | "institution"
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
        "professional",
        "family",
        "institution",
        "superadmin",
        "hr_staff",
        "evaluator",
      ],
      application_status: ["pending", "accepted", "rejected", "withdrawn"],
      offer_modality: ["hour", "shift", "month", "package"],
      offer_status: ["open", "closed", "filled"],
      poster_type: ["family", "institution"],
    },
  },
} as const
