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
      ai_credits_ledger: {
        Row: {
          created_at: string
          credits_used: number
          feature: string
          id: string
          meta: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          feature: string
          id?: string
          meta?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          feature?: string
          id?: string
          meta?: Json | null
          user_id?: string
        }
        Relationships: []
      }
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
      availability_slots: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          job_offer_id: string | null
          note: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          job_offer_id?: string | null
          note?: string | null
          starts_at: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          job_offer_id?: string | null
          note?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          application_id: string
          created_at: string
          id: string
          last_message_at: string
          poster_id: string
          professional_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          poster_id: string
          professional_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          poster_id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_incidents: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          incident_type: string
          lat: number | null
          lng: number | null
          notes: string | null
          resolved: boolean
          resolved_at: string | null
          triggered_by: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          incident_type?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          triggered_by: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          incident_type?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "service_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      family_profiles: {
        Row: {
          created_at: string
          default_address: string | null
          default_lat: number | null
          default_lng: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          habeas_data_accepted: boolean
          habeas_data_accepted_at: string | null
          id: string
          id_doc_url: string | null
          id_number: string | null
          patient_age: number | null
          patient_name: string | null
          patient_relation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_address?: string | null
          default_lat?: number | null
          default_lng?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          habeas_data_accepted?: boolean
          habeas_data_accepted_at?: string | null
          id?: string
          id_doc_url?: string | null
          id_number?: string | null
          patient_age?: number | null
          patient_name?: string | null
          patient_relation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_address?: string | null
          default_lat?: number | null
          default_lng?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          habeas_data_accepted?: boolean
          habeas_data_accepted_at?: string | null
          id?: string
          id_doc_url?: string | null
          id_number?: string | null
          patient_age?: number | null
          patient_name?: string | null
          patient_relation?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fraud_flags: {
        Row: {
          created_at: string
          id: string
          meta: Json | null
          reason: string
          resolved: boolean
          severity: Database["public"]["Enums"]["fraud_severity"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json | null
          reason: string
          resolved?: boolean
          severity?: Database["public"]["Enums"]["fraud_severity"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json | null
          reason?: string
          resolved?: boolean
          severity?: Database["public"]["Enums"]["fraud_severity"]
          user_id?: string
        }
        Relationships: []
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
          lat: number | null
          lng: number | null
          modality: Database["public"]["Enums"]["offer_modality"]
          posted_by: string
          poster_type: Database["public"]["Enums"]["poster_type"]
          requirements: string[] | null
          reserved_until: string | null
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
          lat?: number | null
          lng?: number | null
          modality: Database["public"]["Enums"]["offer_modality"]
          posted_by: string
          poster_type: Database["public"]["Enums"]["poster_type"]
          requirements?: string[] | null
          reserved_until?: string | null
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
          lat?: number | null
          lng?: number | null
          modality?: Database["public"]["Enums"]["offer_modality"]
          posted_by?: string
          poster_type?: Database["public"]["Enums"]["poster_type"]
          requirements?: string[] | null
          reserved_until?: string | null
          shifts_count?: number | null
          specialty_required?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_ai_suggestion: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_ai_suggestion?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_ai_suggestion?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_embeddings: {
        Row: {
          embedding: string | null
          offer_id: string
          source_text: string | null
          updated_at: string
        }
        Insert: {
          embedding?: string | null
          offer_id: string
          source_text?: string | null
          updated_at?: string
        }
        Update: {
          embedding?: string | null
          offer_id?: string
          source_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_embeddings_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_documents: {
        Row: {
          ai_extracted: Json | null
          ai_notes: string | null
          ai_score: number | null
          ai_verified: boolean | null
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_name: string | null
          file_url: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: Database["public"]["Enums"]["doc_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_extracted?: Json | null
          ai_notes?: string | null
          ai_score?: number | null
          ai_verified?: boolean | null
          created_at?: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_name?: string | null
          file_url: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_extracted?: Json | null
          ai_notes?: string | null
          ai_score?: number | null
          ai_verified?: boolean | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          file_name?: string | null
          file_url?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_profiles: {
        Row: {
          active: boolean | null
          ai_preapproved: boolean | null
          ai_strengths: string[] | null
          ai_suggestions: string[] | null
          ai_summary: string | null
          availability: Json | null
          available: boolean
          avatar_url: string | null
          avg_rating: number | null
          bio: string | null
          certifications: Json | null
          created_at: string
          home_city: string | null
          hourly_rate: number | null
          id: string
          languages: string[] | null
          lat: number | null
          lng: number | null
          monthly_rate: number | null
          reserved_until: string | null
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
          work_experience: Json | null
          years_experience: number | null
        }
        Insert: {
          active?: boolean | null
          ai_preapproved?: boolean | null
          ai_strengths?: string[] | null
          ai_suggestions?: string[] | null
          ai_summary?: string | null
          availability?: Json | null
          available?: boolean
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          certifications?: Json | null
          created_at?: string
          home_city?: string | null
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          monthly_rate?: number | null
          reserved_until?: string | null
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
          work_experience?: Json | null
          years_experience?: number | null
        }
        Update: {
          active?: boolean | null
          ai_preapproved?: boolean | null
          ai_strengths?: string[] | null
          ai_suggestions?: string[] | null
          ai_summary?: string | null
          availability?: Json | null
          available?: boolean
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          certifications?: Json | null
          created_at?: string
          home_city?: string | null
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          monthly_rate?: number | null
          reserved_until?: string | null
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
          work_experience?: Json | null
          years_experience?: number | null
        }
        Relationships: []
      }
      professional_references: {
        Row: {
          created_at: string
          full_name: string
          id: string
          notes: string | null
          phone: string
          ref_type: string
          relation: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          ref_type: string
          relation?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          ref_type?: string
          relation?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      profile_embeddings: {
        Row: {
          embedding: string | null
          source_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          embedding?: string | null
          source_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          embedding?: string | null
          source_text?: string | null
          updated_at?: string
          user_id?: string
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
      service_bookings: {
        Row: {
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          duration_hours: number
          emergency_phone: string | null
          hourly_rate: number
          id: string
          job_offer_id: string | null
          notes: string | null
          platform_fee_amount: number
          platform_fee_pct: number
          professional_id: string
          professional_payout: number
          scheduled_at: string
          service_address: string | null
          service_lat: number | null
          service_lng: number | null
          started_at: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          duration_hours?: number
          emergency_phone?: string | null
          hourly_rate: number
          id?: string
          job_offer_id?: string | null
          notes?: string | null
          platform_fee_amount?: number
          platform_fee_pct?: number
          professional_id: string
          professional_payout?: number
          scheduled_at: string
          service_address?: string | null
          service_lat?: number | null
          service_lng?: number | null
          started_at?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          duration_hours?: number
          emergency_phone?: string | null
          hourly_rate?: number
          id?: string
          job_offer_id?: string | null
          notes?: string | null
          platform_fee_amount?: number
          platform_fee_pct?: number
          professional_id?: string
          professional_payout?: number
          scheduled_at?: string
          service_address?: string | null
          service_lat?: number | null
          service_lng?: number | null
          started_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_ratings: {
        Row: {
          ai_alert: boolean
          ai_sentiment: string | null
          ai_sentiment_score: number | null
          ai_summary: string | null
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rated_id: string
          rater_id: string
          stars: number
          voice_transcript: string | null
          voice_url: string | null
        }
        Insert: {
          ai_alert?: boolean
          ai_sentiment?: string | null
          ai_sentiment_score?: number | null
          ai_summary?: string | null
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rated_id: string
          rater_id: string
          stars: number
          voice_transcript?: string | null
          voice_url?: string | null
        }
        Update: {
          ai_alert?: boolean
          ai_sentiment?: string | null
          ai_sentiment_score?: number | null
          ai_summary?: string | null
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rated_id?: string
          rater_id?: string
          stars?: number
          voice_transcript?: string | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_ratings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "service_bookings"
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
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_pings: {
        Row: {
          accuracy_m: number | null
          booking_id: string
          created_at: string
          heading: number | null
          id: string
          lat: number
          lng: number
          professional_id: string
          speed_mps: number | null
        }
        Insert: {
          accuracy_m?: number | null
          booking_id: string
          created_at?: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          professional_id: string
          speed_mps?: number | null
        }
        Update: {
          accuracy_m?: number | null
          booking_id?: string
          created_at?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          professional_id?: string
          speed_mps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_pings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "service_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_type: string
          granted: boolean
          granted_at: string
          id: string
          ip_address: string | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          granted?: boolean
          granted_at?: string
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          granted?: boolean
          granted_at?: string
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
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
      whatsapp_contacts: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          owner_id: string
          phone: string
          tag: string | null
          unread_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          owner_id: string
          phone: string
          tag?: string | null
          unread_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          owner_id?: string
          phone?: string
          tag?: string | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body: string
          contact_id: string
          created_at: string
          direction: string
          id: string
          is_ai: boolean
          wa_message_id: string | null
        }
        Insert: {
          body: string
          contact_id: string
          created_at?: string
          direction: string
          id?: string
          is_ai?: boolean
          wa_message_id?: string | null
        }
        Update: {
          body?: string
          contact_id?: string
          created_at?: string
          direction?: string
          id?: string
          is_ai?: boolean
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles_safe: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          full_name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          full_name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          full_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_profile: {
        Args: never
        Returns: {
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
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      match_offers_for_professional: {
        Args: {
          _match_count?: number
          _min_similarity?: number
          _user_id: string
        }
        Returns: {
          offer_id: string
          similarity: number
        }[]
      }
      match_professionals_for_offer: {
        Args: {
          _match_count?: number
          _min_similarity?: number
          _offer_id: string
        }
        Returns: {
          similarity: number
          user_id: string
        }[]
      }
      redeem_staff_invitation: {
        Args: { _token: string }
        Returns: {
          email: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      release_expired_reservations: { Args: never; Returns: undefined }
      set_offer_reserved: {
        Args: { _offer_id: string; _professional_id: string }
        Returns: undefined
      }
      staff_get_profile: {
        Args: { _user_id: string }
        Returns: {
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
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
      doc_status: "pending" | "approved" | "rejected"
      doc_type:
        | "cv"
        | "rethus"
        | "diploma"
        | "id_document"
        | "other"
        | "utility_bill"
        | "work_reference"
        | "family_reference"
      fraud_severity: "low" | "medium" | "high" | "critical"
      offer_modality: "hour" | "shift" | "month" | "package"
      offer_status: "open" | "closed" | "filled"
      poster_type: "family" | "institution"
      subscription_plan: "free" | "pro" | "family" | "institution"
      subscription_status: "active" | "cancelled" | "past_due" | "trialing"
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
      doc_status: ["pending", "approved", "rejected"],
      doc_type: [
        "cv",
        "rethus",
        "diploma",
        "id_document",
        "other",
        "utility_bill",
        "work_reference",
        "family_reference",
      ],
      fraud_severity: ["low", "medium", "high", "critical"],
      offer_modality: ["hour", "shift", "month", "package"],
      offer_status: ["open", "closed", "filled"],
      poster_type: ["family", "institution"],
      subscription_plan: ["free", "pro", "family", "institution"],
      subscription_status: ["active", "cancelled", "past_due", "trialing"],
    },
  },
} as const
