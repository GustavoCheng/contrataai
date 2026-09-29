export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_body: string | null
          professional_id: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_body?: string | null
          professional_id: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_body?: string | null
          professional_id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_applications: {
        Row: {
          created_at: string
          gig_id: string
          professional_id: string
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          created_at?: string
          gig_id: string
          professional_id: string
          status?: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          created_at?: string
          gig_id?: string
          professional_id?: string
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "gig_applications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_applications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_applications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_checkpoints: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          failed_attempts: number
          gig_id: string
          kind: Database["public"]["Enums"]["checkpoint_kind"]
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          failed_attempts?: number
          gig_id: string
          kind: Database["public"]["Enums"]["checkpoint_kind"]
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          failed_attempts?: number
          gig_id?: string
          kind?: Database["public"]["Enums"]["checkpoint_kind"]
        }
        Relationships: [
          {
            foreignKeyName: "gig_checkpoints_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          amount_cents: number
          cancelled_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          confirmed_at: string | null
          created_at: string
          disputed_at: string | null
          ends_at: string
          id: string
          paid_at: string | null
          professional_id: string | null
          released_at: string | null
          restaurant_id: string
          role: Database["public"]["Enums"]["job_role"]
          starts_at: string
          status: Database["public"]["Enums"]["gig_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          cancelled_at?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          disputed_at?: string | null
          ends_at: string
          id?: string
          paid_at?: string | null
          professional_id?: string | null
          released_at?: string | null
          restaurant_id: string
          role: Database["public"]["Enums"]["job_role"]
          starts_at: string
          status?: Database["public"]["Enums"]["gig_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          cancelled_at?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          disputed_at?: string | null
          ends_at?: string
          id?: string
          paid_at?: string | null
          professional_id?: string | null
          released_at?: string | null
          restaurant_id?: string
          role?: Database["public"]["Enums"]["job_role"]
          starts_at?: string
          status?: Database["public"]["Enums"]["gig_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gigs_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gigs_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gigs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          job_id: string
          professional_id: string
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          job_id: string
          professional_id: string
          status?: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          job_id?: string
          professional_id?: string
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          closed_at: string | null
          created_at: string
          description: string
          id: string
          restaurant_id: string
          role: Database["public"]["Enums"]["job_role"]
          salary_max_cents: number | null
          salary_min_cents: number
          shift: Database["public"]["Enums"]["work_shift"]
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          description: string
          id?: string
          restaurant_id: string
          role: Database["public"]["Enums"]["job_role"]
          salary_max_cents?: number | null
          salary_min_cents: number
          shift: Database["public"]["Enums"]["work_shift"]
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["job_role"]
          salary_max_cents?: number | null
          salary_min_cents?: number
          shift?: Database["public"]["Enums"]["work_shift"]
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
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
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          charge_id: string
          created_at: string
          gig_id: string
          id: string
          payout_id: string | null
          payout_status: Database["public"]["Enums"]["payout_status"] | null
          pix_copy_paste: string
          platform_fee_cents: number
          provider: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          charge_id: string
          created_at?: string
          gig_id: string
          id?: string
          payout_id?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          pix_copy_paste: string
          platform_fee_cents?: number
          provider?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          charge_id?: string
          created_at?: string
          gig_id?: string
          id?: string
          payout_id?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          pix_copy_paste?: string
          platform_fee_cents?: number
          provider?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: true
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_accounts: {
        Row: {
          pix_key: string
          pix_key_type: Database["public"]["Enums"]["pix_key_type"]
          professional_id: string
          updated_at: string
        }
        Insert: {
          pix_key: string
          pix_key_type: Database["public"]["Enums"]["pix_key_type"]
          professional_id: string
          updated_at?: string
        }
        Update: {
          pix_key?: string
          pix_key_type?: Database["public"]["Enums"]["pix_key_type"]
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_accounts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professional_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_accounts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_locations: {
        Row: {
          latitude: number | null
          longitude: number | null
          postal_code: string
          professional_id: string
          updated_at: string
        }
        Insert: {
          latitude?: number | null
          longitude?: number | null
          postal_code: string
          professional_id: string
          updated_at?: string
        }
        Update: {
          latitude?: number | null
          longitude?: number | null
          postal_code?: string
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_locations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professional_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_locations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          available_for_gigs: boolean
          city: string
          city_key: string
          created_at: string
          experience: string | null
          full_name: string
          id: string
          main_role: Database["public"]["Enums"]["job_role"]
          neighborhood: string | null
          photo_path: string | null
          rating_avg: number
          rating_count: number
          secondary_roles: Database["public"]["Enums"]["job_role"][]
          state: string
          updated_at: string
        }
        Insert: {
          available_for_gigs?: boolean
          city: string
          city_key?: string
          created_at?: string
          experience?: string | null
          full_name: string
          id: string
          main_role: Database["public"]["Enums"]["job_role"]
          neighborhood?: string | null
          photo_path?: string | null
          rating_avg?: number
          rating_count?: number
          secondary_roles?: Database["public"]["Enums"]["job_role"][]
          state: string
          updated_at?: string
        }
        Update: {
          available_for_gigs?: boolean
          city?: string
          city_key?: string
          created_at?: string
          experience?: string | null
          full_name?: string
          id?: string
          main_role?: Database["public"]["Enums"]["job_role"]
          neighborhood?: string | null
          photo_path?: string | null
          rating_avg?: number
          rating_count?: number
          secondary_roles?: Database["public"]["Enums"]["job_role"][]
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          id: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      restaurant_photos: {
        Row: {
          created_at: string
          id: string
          path: string
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_photos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          city: string
          city_key: string
          cnpj: string
          complement: string | null
          cover_path: string | null
          created_at: string
          description: string | null
          founded_on: string | null
          id: string
          latitude: number | null
          legal_name: string
          longitude: number | null
          name: string
          neighborhood: string | null
          number: string | null
          postal_code: string | null
          rating_avg: number
          rating_count: number
          state: string
          street: string
          updated_at: string
        }
        Insert: {
          city: string
          city_key?: string
          cnpj: string
          complement?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          founded_on?: string | null
          id: string
          latitude?: number | null
          legal_name: string
          longitude?: number | null
          name: string
          neighborhood?: string | null
          number?: string | null
          postal_code?: string | null
          rating_avg?: number
          rating_count?: number
          state: string
          street: string
          updated_at?: string
        }
        Update: {
          city?: string
          city_key?: string
          cnpj?: string
          complement?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          founded_on?: string | null
          id?: string
          latitude?: number | null
          legal_name?: string
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          postal_code?: string | null
          rating_avg?: number
          rating_count?: number
          state?: string
          street?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          gig_id: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          gig_id: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          gig_id?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      openings: {
        Row: {
          city: string | null
          city_key: string | null
          cover_path: string | null
          created_at: string | null
          distance_km: number | null
          ends_at: string | null
          id: string | null
          kind: Database["public"]["Enums"]["opening_kind"] | null
          neighborhood: string | null
          pay_cents: number | null
          pay_max_cents: number | null
          rating_avg: number | null
          rating_count: number | null
          restaurant_id: string | null
          restaurant_name: string | null
          role: Database["public"]["Enums"]["job_role"] | null
          shift: Database["public"]["Enums"]["work_shift"] | null
          starts_at: string | null
          state: string | null
        }
        Relationships: []
      }
      professional_cards: {
        Row: {
          available_for_gigs: boolean | null
          city: string | null
          distance_km: number | null
          full_name: string | null
          id: string | null
          main_role: Database["public"]["Enums"]["job_role"] | null
          neighborhood: string | null
          photo_path: string | null
          rating_avg: number | null
          rating_count: number | null
          search_name: string | null
          secondary_roles: Database["public"]["Enums"]["job_role"][] | null
          state: string | null
        }
        Insert: {
          available_for_gigs?: boolean | null
          city?: string | null
          distance_km?: never
          full_name?: string | null
          id?: string | null
          main_role?: Database["public"]["Enums"]["job_role"] | null
          neighborhood?: string | null
          photo_path?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          search_name?: never
          secondary_roles?: Database["public"]["Enums"]["job_role"][] | null
          state?: string | null
        }
        Update: {
          available_for_gigs?: boolean | null
          city?: string | null
          distance_km?: never
          full_name?: string | null
          id?: string | null
          main_role?: Database["public"]["Enums"]["job_role"] | null
          neighborhood?: string | null
          photo_path?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          search_name?: never
          secondary_roles?: Database["public"]["Enums"]["job_role"][] | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_cards: {
        Row: {
          by_restaurant: boolean | null
          comment: string | null
          created_at: string | null
          gig_id: string | null
          id: string | null
          rating: number | null
          reviewee_id: string | null
          reviewer_name: string | null
          reviewer_photo_path: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      confirm_gig_professional: {
        Args: { p_gig_id: string; p_professional_id: string }
        Returns: undefined
      }
      issue_gig_checkpoint: {
        Args: { p_gig_id: string; p_renew?: boolean }
        Returns: {
          code: string
          expires_at: string
          kind: Database["public"]["Enums"]["checkpoint_kind"]
        }[]
      }
      open_gig_dispute: { Args: { p_gig_id: string }; Returns: undefined }
      redeem_gig_checkpoint: {
        Args: { p_code: string; p_gig_id: string }
        Returns: Database["public"]["Enums"]["checkpoint_outcome"]
      }
    }
    Enums: {
      account_type: "restaurant" | "professional"
      application_status: "sent" | "accepted" | "rejected"
      checkpoint_kind: "check_in" | "check_out"
      checkpoint_outcome:
        | "checked_in"
        | "checked_out"
        | "invalid_code"
        | "locked"
        | "expired"
      gig_status:
        | "open"
        | "confirmed"
        | "paid_held"
        | "checked_in"
        | "checked_out"
        | "released"
        | "cancelled"
        | "disputed"
      job_role:
        | "cook"
        | "kitchen_assistant"
        | "sushi_chef"
        | "griddle_cook"
        | "pizza_maker"
        | "confectioner"
        | "dishwasher"
        | "waiter"
        | "bartender"
        | "cashier"
        | "delivery_rider"
      job_status: "open" | "closed"
      opening_kind: "job" | "gig"
      payment_status: "pending" | "received" | "refunded"
      payout_status: "pending" | "done" | "failed"
      pix_key_type: "cpf" | "cnpj" | "email" | "phone" | "random"
      work_shift: "morning" | "afternoon" | "night" | "overnight" | "full_day"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: ["restaurant", "professional"],
      application_status: ["sent", "accepted", "rejected"],
      checkpoint_kind: ["check_in", "check_out"],
      checkpoint_outcome: [
        "checked_in",
        "checked_out",
        "invalid_code",
        "locked",
        "expired",
      ],
      gig_status: [
        "open",
        "confirmed",
        "paid_held",
        "checked_in",
        "checked_out",
        "released",
        "cancelled",
        "disputed",
      ],
      job_role: [
        "cook",
        "kitchen_assistant",
        "sushi_chef",
        "griddle_cook",
        "pizza_maker",
        "confectioner",
        "dishwasher",
        "waiter",
        "bartender",
        "cashier",
        "delivery_rider",
      ],
      job_status: ["open", "closed"],
      opening_kind: ["job", "gig"],
      payment_status: ["pending", "received", "refunded"],
      payout_status: ["pending", "done", "failed"],
      pix_key_type: ["cpf", "cnpj", "email", "phone", "random"],
      work_shift: ["morning", "afternoon", "night", "overnight", "full_day"],
    },
  },
} as const

