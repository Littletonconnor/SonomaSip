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
      data_health_checks: {
        Row: {
          check_type: Database["public"]["Enums"]["check_type"]
          checked_at: string
          details: Json | null
          id: number
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["check_status"]
          winery_id: string
        }
        Insert: {
          check_type: Database["public"]["Enums"]["check_type"]
          checked_at?: string
          details?: Json | null
          id?: never
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["check_status"]
          winery_id: string
        }
        Update: {
          check_type?: Database["public"]["Enums"]["check_type"]
          checked_at?: string
          details?: Json | null
          id?: never
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["check_status"]
          winery_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_health_checks_winery_id_fkey"
            columns: ["winery_id"]
            isOneToOne: false
            referencedRelation: "wineries"
            referencedColumns: ["id"]
          },
        ]
      }
      field_overrides: {
        Row: {
          created_at: string
          field_name: string
          id: number
          override_value: string | null
          reason: string | null
          winery_id: string
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: never
          override_value?: string | null
          reason?: string | null
          winery_id: string
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: never
          override_value?: string | null
          reason?: string | null
          winery_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_overrides_winery_id_fkey"
            columns: ["winery_id"]
            isOneToOne: false
            referencedRelation: "wineries"
            referencedColumns: ["id"]
          },
        ]
      }
      flights: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          food_included: boolean
          format: Database["public"]["Enums"]["flight_format"] | null
          id: number
          name: string
          price: number | null
          reservation_required: boolean
          updated_at: string
          winery_id: string
          wines_count: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          food_included?: boolean
          format?: Database["public"]["Enums"]["flight_format"] | null
          id?: never
          name: string
          price?: number | null
          reservation_required?: boolean
          updated_at?: string
          winery_id: string
          wines_count?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          food_included?: boolean
          format?: Database["public"]["Enums"]["flight_format"] | null
          id?: never
          name?: string
          price?: number | null
          reservation_required?: boolean
          updated_at?: string
          winery_id?: string
          wines_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flights_winery_id_fkey"
            columns: ["winery_id"]
            isOneToOne: false
            referencedRelation: "wineries"
            referencedColumns: ["id"]
          },
        ]
      }
      import_runs: {
        Row: {
          errors: Json
          finished_at: string | null
          flights_upserted: number
          id: number
          source_file_hash: string | null
          started_at: string
          varietals_upserted: number
          warnings: Json
          wineries_upserted: number
        }
        Insert: {
          errors?: Json
          finished_at?: string | null
          flights_upserted?: number
          id?: never
          source_file_hash?: string | null
          started_at?: string
          varietals_upserted?: number
          warnings?: Json
          wineries_upserted?: number
        }
        Update: {
          errors?: Json
          finished_at?: string | null
          flights_upserted?: number
          id?: never
          source_file_hash?: string | null
          started_at?: string
          varietals_upserted?: number
          warnings?: Json
          wineries_upserted?: number
        }
        Relationships: []
      }
      pipeline_runs: {
        Row: {
          completed_at: string | null
          error_summary: string | null
          id: number
          metadata: Json
          stage: Database["public"]["Enums"]["pipeline_stage"]
          started_at: string
          status: Database["public"]["Enums"]["pipeline_run_status"]
          wineries_failed: number
          wineries_processed: number
        }
        Insert: {
          completed_at?: string | null
          error_summary?: string | null
          id?: never
          metadata?: Json
          stage: Database["public"]["Enums"]["pipeline_stage"]
          started_at?: string
          status?: Database["public"]["Enums"]["pipeline_run_status"]
          wineries_failed?: number
          wineries_processed?: number
        }
        Update: {
          completed_at?: string | null
          error_summary?: string | null
          id?: never
          metadata?: Json
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          started_at?: string
          status?: Database["public"]["Enums"]["pipeline_run_status"]
          wineries_failed?: number
          wineries_processed?: number
        }
        Relationships: []
      }
      shared_itineraries: {
        Row: {
          created_at: string
          id: string
          payload_version: number
          quiz_answers: Json
          results: Json
        }
        Insert: {
          created_at?: string
          id?: string
          payload_version?: number
          quiz_answers: Json
          results: Json
        }
        Update: {
          created_at?: string
          id?: string
          payload_version?: number
          quiz_answers?: Json
          results?: Json
        }
        Relationships: []
      }
      url_health_checks: {
        Row: {
          checked_at: string
          id: number
          redirect_url: string | null
          response_time_ms: number | null
          status_code: number | null
          url: string
          winery_id: string
        }
        Insert: {
          checked_at?: string
          id?: never
          redirect_url?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          url: string
          winery_id: string
        }
        Update: {
          checked_at?: string
          id?: never
          redirect_url?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          url?: string
          winery_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "url_health_checks_winery_id_fkey"
            columns: ["winery_id"]
            isOneToOne: false
            referencedRelation: "wineries"
            referencedColumns: ["id"]
          },
        ]
      }
      wineries: {
        Row: {
          accessibility_notes: string | null
          address_city: string | null
          address_street: string | null
          address_zip: string | null
          annual_cases: number | null
          ava_primary: Database["public"]["Enums"]["ava_region"] | null
          ava_secondary: Database["public"]["Enums"]["ava_region"] | null
          awards: string | null
          best_for: string | null
          content_status: Database["public"]["Enums"]["content_status"]
          coverage_tier: Database["public"]["Enums"]["coverage_tier"]
          created_at: string
          data_source: string | null
          data_sources: Json
          description: string | null
          dog_notes: string | null
          good_for_mix_grand: boolean
          good_for_mix_intimate: boolean
          has_barrel_tasting: boolean
          has_bike_parking: boolean
          has_blending_session: boolean
          has_cave_tour: boolean
          has_food_pairing: boolean
          has_live_music: boolean
          has_outdoor_seating: boolean
          has_picnic_area: boolean
          has_restaurant: boolean
          has_sunset_views: boolean
          has_vineyard_walk: boolean
          hours: Json
          id: string
          is_active: boolean
          is_bike_friendly: boolean
          is_dog_friendly: boolean
          is_hidden_gem: boolean
          is_kid_friendly: boolean
          is_local_favorite: boolean
          is_members_only: boolean
          is_must_visit: boolean
          is_rideshare_friendly: boolean
          is_wheelchair_accessible: boolean
          kid_activities: string | null
          large_group_friendly: boolean
          last_places_sync_at: string | null
          last_scraped_at: string | null
          last_seating_offset: number | null
          last_verified_at: string | null
          latitude: number
          live_music_schedule: string | null
          longitude: number
          max_group_size: number | null
          name: string
          nearby_wineries: string | null
          nearest_town: string | null
          noise_level: Database["public"]["Enums"]["noise_level"] | null
          not_ideal_for: string | null
          osm_id: number | null
          osm_type: string | null
          ownership_type: string | null
          pairs_well_with: string | null
          parking_notes: string | null
          parking_type: string | null
          phone: string | null
          popularity_score: number | null
          private_tasting_available: boolean
          production_size: string | null
          quality_score: number | null
          rating_google: number | null
          rating_tripadvisor: number | null
          rating_yelp: number | null
          reservation_type:
            | Database["public"]["Enums"]["reservation_type"]
            | null
          reservation_url: string | null
          review_count_total: number | null
          setting: Database["public"]["Enums"]["winery_setting"] | null
          signature_wines: string | null
          slug: string
          style_adventure: number | null
          style_classic: number | null
          style_family_friendly: number | null
          style_luxury: number | null
          style_social: number | null
          style_sustainable: number | null
          tagline: string | null
          tasting_duration_typical: number | null
          tasting_room_vibe: string | null
          unique_selling_point: string | null
          updated_at: string
          verification_notes: string | null
          vibe: string | null
          walk_in_likelihood: string | null
          walkable_from: string | null
          website_url: string | null
          winery_scale: string | null
        }
        Insert: {
          accessibility_notes?: string | null
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          annual_cases?: number | null
          ava_primary?: Database["public"]["Enums"]["ava_region"] | null
          ava_secondary?: Database["public"]["Enums"]["ava_region"] | null
          awards?: string | null
          best_for?: string | null
          content_status?: Database["public"]["Enums"]["content_status"]
          coverage_tier?: Database["public"]["Enums"]["coverage_tier"]
          created_at?: string
          data_source?: string | null
          data_sources?: Json
          description?: string | null
          dog_notes?: string | null
          good_for_mix_grand?: boolean
          good_for_mix_intimate?: boolean
          has_barrel_tasting?: boolean
          has_bike_parking?: boolean
          has_blending_session?: boolean
          has_cave_tour?: boolean
          has_food_pairing?: boolean
          has_live_music?: boolean
          has_outdoor_seating?: boolean
          has_picnic_area?: boolean
          has_restaurant?: boolean
          has_sunset_views?: boolean
          has_vineyard_walk?: boolean
          hours?: Json
          id: string
          is_active?: boolean
          is_bike_friendly?: boolean
          is_dog_friendly?: boolean
          is_hidden_gem?: boolean
          is_kid_friendly?: boolean
          is_local_favorite?: boolean
          is_members_only?: boolean
          is_must_visit?: boolean
          is_rideshare_friendly?: boolean
          is_wheelchair_accessible?: boolean
          kid_activities?: string | null
          large_group_friendly?: boolean
          last_places_sync_at?: string | null
          last_scraped_at?: string | null
          last_seating_offset?: number | null
          last_verified_at?: string | null
          latitude: number
          live_music_schedule?: string | null
          longitude: number
          max_group_size?: number | null
          name: string
          nearby_wineries?: string | null
          nearest_town?: string | null
          noise_level?: Database["public"]["Enums"]["noise_level"] | null
          not_ideal_for?: string | null
          osm_id?: number | null
          osm_type?: string | null
          ownership_type?: string | null
          pairs_well_with?: string | null
          parking_notes?: string | null
          parking_type?: string | null
          phone?: string | null
          popularity_score?: number | null
          private_tasting_available?: boolean
          production_size?: string | null
          quality_score?: number | null
          rating_google?: number | null
          rating_tripadvisor?: number | null
          rating_yelp?: number | null
          reservation_type?:
            | Database["public"]["Enums"]["reservation_type"]
            | null
          reservation_url?: string | null
          review_count_total?: number | null
          setting?: Database["public"]["Enums"]["winery_setting"] | null
          signature_wines?: string | null
          slug: string
          style_adventure?: number | null
          style_classic?: number | null
          style_family_friendly?: number | null
          style_luxury?: number | null
          style_social?: number | null
          style_sustainable?: number | null
          tagline?: string | null
          tasting_duration_typical?: number | null
          tasting_room_vibe?: string | null
          unique_selling_point?: string | null
          updated_at?: string
          verification_notes?: string | null
          vibe?: string | null
          walk_in_likelihood?: string | null
          walkable_from?: string | null
          website_url?: string | null
          winery_scale?: string | null
        }
        Update: {
          accessibility_notes?: string | null
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          annual_cases?: number | null
          ava_primary?: Database["public"]["Enums"]["ava_region"] | null
          ava_secondary?: Database["public"]["Enums"]["ava_region"] | null
          awards?: string | null
          best_for?: string | null
          content_status?: Database["public"]["Enums"]["content_status"]
          coverage_tier?: Database["public"]["Enums"]["coverage_tier"]
          created_at?: string
          data_source?: string | null
          data_sources?: Json
          description?: string | null
          dog_notes?: string | null
          good_for_mix_grand?: boolean
          good_for_mix_intimate?: boolean
          has_barrel_tasting?: boolean
          has_bike_parking?: boolean
          has_blending_session?: boolean
          has_cave_tour?: boolean
          has_food_pairing?: boolean
          has_live_music?: boolean
          has_outdoor_seating?: boolean
          has_picnic_area?: boolean
          has_restaurant?: boolean
          has_sunset_views?: boolean
          has_vineyard_walk?: boolean
          hours?: Json
          id?: string
          is_active?: boolean
          is_bike_friendly?: boolean
          is_dog_friendly?: boolean
          is_hidden_gem?: boolean
          is_kid_friendly?: boolean
          is_local_favorite?: boolean
          is_members_only?: boolean
          is_must_visit?: boolean
          is_rideshare_friendly?: boolean
          is_wheelchair_accessible?: boolean
          kid_activities?: string | null
          large_group_friendly?: boolean
          last_places_sync_at?: string | null
          last_scraped_at?: string | null
          last_seating_offset?: number | null
          last_verified_at?: string | null
          latitude?: number
          live_music_schedule?: string | null
          longitude?: number
          max_group_size?: number | null
          name?: string
          nearby_wineries?: string | null
          nearest_town?: string | null
          noise_level?: Database["public"]["Enums"]["noise_level"] | null
          not_ideal_for?: string | null
          osm_id?: number | null
          osm_type?: string | null
          ownership_type?: string | null
          pairs_well_with?: string | null
          parking_notes?: string | null
          parking_type?: string | null
          phone?: string | null
          popularity_score?: number | null
          private_tasting_available?: boolean
          production_size?: string | null
          quality_score?: number | null
          rating_google?: number | null
          rating_tripadvisor?: number | null
          rating_yelp?: number | null
          reservation_type?:
            | Database["public"]["Enums"]["reservation_type"]
            | null
          reservation_url?: string | null
          review_count_total?: number | null
          setting?: Database["public"]["Enums"]["winery_setting"] | null
          signature_wines?: string | null
          slug?: string
          style_adventure?: number | null
          style_classic?: number | null
          style_family_friendly?: number | null
          style_luxury?: number | null
          style_social?: number | null
          style_sustainable?: number | null
          tagline?: string | null
          tasting_duration_typical?: number | null
          tasting_room_vibe?: string | null
          unique_selling_point?: string | null
          updated_at?: string
          verification_notes?: string | null
          vibe?: string | null
          walk_in_likelihood?: string | null
          walkable_from?: string | null
          website_url?: string | null
          winery_scale?: string | null
        }
        Relationships: []
      }
      winery_extractions: {
        Row: {
          extracted_at: string
          extracted_fields: Json
          id: number
          model_used: string
          run_id: number
          token_count: number | null
          winery_id: string
        }
        Insert: {
          extracted_at?: string
          extracted_fields?: Json
          id?: never
          model_used: string
          run_id: number
          token_count?: number | null
          winery_id: string
        }
        Update: {
          extracted_at?: string
          extracted_fields?: Json
          id?: never
          model_used?: string
          run_id?: number
          token_count?: number | null
          winery_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "winery_extractions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winery_extractions_winery_id_fkey"
            columns: ["winery_id"]
            isOneToOne: false
            referencedRelation: "wineries"
            referencedColumns: ["id"]
          },
        ]
      }
      winery_scrapes: {
        Row: {
          id: number
          page_title: string | null
          page_url: string
          raw_markdown: string
          run_id: number
          scraped_at: string
          winery_id: string
          word_count: number | null
        }
        Insert: {
          id?: never
          page_title?: string | null
          page_url: string
          raw_markdown: string
          run_id: number
          scraped_at?: string
          winery_id: string
          word_count?: number | null
        }
        Update: {
          id?: never
          page_title?: string | null
          page_url?: string
          raw_markdown?: string
          run_id?: number
          scraped_at?: string
          winery_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "winery_scrapes_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winery_scrapes_winery_id_fkey"
            columns: ["winery_id"]
            isOneToOne: false
            referencedRelation: "wineries"
            referencedColumns: ["id"]
          },
        ]
      }
      winery_snapshots: {
        Row: {
          created_at: string
          id: number
          reason: string
          run_id: number
          snapshot: Json
          winery_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          reason?: string
          run_id: number
          snapshot: Json
          winery_id: string
        }
        Update: {
          created_at?: string
          id?: never
          reason?: string
          run_id?: number
          snapshot?: Json
          winery_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "winery_snapshots_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winery_snapshots_winery_id_fkey"
            columns: ["winery_id"]
            isOneToOne: false
            referencedRelation: "wineries"
            referencedColumns: ["id"]
          },
        ]
      }
      winery_varietals: {
        Row: {
          created_at: string
          id: number
          is_signature: boolean
          varietal: string
          winery_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_signature?: boolean
          varietal: string
          winery_id: string
        }
        Update: {
          created_at?: string
          id?: never
          is_signature?: boolean
          varietal?: string
          winery_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "winery_varietals_winery_id_fkey"
            columns: ["winery_id"]
            isOneToOne: false
            referencedRelation: "wineries"
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
      ava_region:
        | "russian_river_valley"
        | "dry_creek_valley"
        | "alexander_valley"
        | "sonoma_valley"
        | "carneros"
        | "sonoma_coast"
        | "sonoma_mountain"
        | "green_valley"
        | "petaluma_gap"
        | "rockpile"
        | "bennett_valley"
        | "chalk_hill"
        | "fort_ross_seaview"
      check_status: "open" | "resolved" | "ignored"
      check_type:
        | "url_health"
        | "hours_drift"
        | "rating_drift"
        | "missing_data"
        | "user_report"
      content_status: "draft" | "review" | "published"
      coverage_tier: "editorial" | "verified" | "discovered"
      flight_format:
        | "seated"
        | "standing"
        | "tour"
        | "outdoor"
        | "picnic"
        | "bar"
      noise_level: "quiet" | "moderate" | "lively"
      pipeline_run_status: "running" | "completed" | "failed" | "partial"
      pipeline_stage:
        | "discovery"
        | "crawl"
        | "extraction"
        | "enrichment"
        | "publish"
        | "health_check"
      reservation_type:
        | "walk_ins_welcome"
        | "reservations_recommended"
        | "appointment_only"
      winery_setting: "vineyard" | "estate" | "downtown" | "hilltop" | "cave"
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
      ava_region: [
        "russian_river_valley",
        "dry_creek_valley",
        "alexander_valley",
        "sonoma_valley",
        "carneros",
        "sonoma_coast",
        "sonoma_mountain",
        "green_valley",
        "petaluma_gap",
        "rockpile",
        "bennett_valley",
        "chalk_hill",
        "fort_ross_seaview",
      ],
      check_status: ["open", "resolved", "ignored"],
      check_type: [
        "url_health",
        "hours_drift",
        "rating_drift",
        "missing_data",
        "user_report",
      ],
      content_status: ["draft", "review", "published"],
      coverage_tier: ["editorial", "verified", "discovered"],
      flight_format: ["seated", "standing", "tour", "outdoor", "picnic", "bar"],
      noise_level: ["quiet", "moderate", "lively"],
      pipeline_run_status: ["running", "completed", "failed", "partial"],
      pipeline_stage: [
        "discovery",
        "crawl",
        "extraction",
        "enrichment",
        "publish",
        "health_check",
      ],
      reservation_type: [
        "walk_ins_welcome",
        "reservations_recommended",
        "appointment_only",
      ],
      winery_setting: ["vineyard", "estate", "downtown", "hilltop", "cave"],
    },
  },
} as const
