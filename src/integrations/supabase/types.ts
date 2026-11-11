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
      drug_drug_interactions: {
        Row: {
          action_level: string | null
          action_level_ar: string | null
          conflict_group: number | null
          counts_once: number | null
          created_at: string
          drug_a_ar: string | null
          drug_b_ar: string | null
          drug_b_en: string | null
          evidence_status_ar: string | null
          evidence_status_code: string | null
          gap_minutes: number | null
          gap_side: string | null
          gap_text_ar: string | null
          id: string
          interaction_description: string
          item_2_id: string | null
          medication_1_id: string
          medication_2_id: string | null
          note_ar: string | null
          pharmacist_reviewed_ar: string | null
          recommendation: string | null
          reference_id: string | null
          reference_text: string | null
          review_status: Database["public"]["Enums"]["review_status"]
          severity: Database["public"]["Enums"]["interaction_severity"]
          source_key: string | null
          source_row_no: number | null
        }
        Insert: {
          action_level?: string | null
          action_level_ar?: string | null
          conflict_group?: number | null
          counts_once?: number | null
          created_at?: string
          drug_a_ar?: string | null
          drug_b_ar?: string | null
          drug_b_en?: string | null
          evidence_status_ar?: string | null
          evidence_status_code?: string | null
          gap_minutes?: number | null
          gap_side?: string | null
          gap_text_ar?: string | null
          id?: string
          interaction_description: string
          item_2_id?: string | null
          medication_1_id: string
          medication_2_id?: string | null
          note_ar?: string | null
          pharmacist_reviewed_ar?: string | null
          recommendation?: string | null
          reference_id?: string | null
          reference_text?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          severity?: Database["public"]["Enums"]["interaction_severity"]
          source_key?: string | null
          source_row_no?: number | null
        }
        Update: {
          action_level?: string | null
          action_level_ar?: string | null
          conflict_group?: number | null
          counts_once?: number | null
          created_at?: string
          drug_a_ar?: string | null
          drug_b_ar?: string | null
          drug_b_en?: string | null
          evidence_status_ar?: string | null
          evidence_status_code?: string | null
          gap_minutes?: number | null
          gap_side?: string | null
          gap_text_ar?: string | null
          id?: string
          interaction_description?: string
          item_2_id?: string | null
          medication_1_id?: string
          medication_2_id?: string | null
          note_ar?: string | null
          pharmacist_reviewed_ar?: string | null
          recommendation?: string | null
          reference_id?: string | null
          reference_text?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          severity?: Database["public"]["Enums"]["interaction_severity"]
          source_key?: string | null
          source_row_no?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "drug_drug_interactions_item_2_id_fkey"
            columns: ["item_2_id"]
            isOneToOne: false
            referencedRelation: "interaction_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_drug_interactions_medication_1_id_fkey"
            columns: ["medication_1_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_drug_interactions_medication_2_id_fkey"
            columns: ["medication_2_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_drug_interactions_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "references"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_food_interactions: {
        Row: {
          action_level: string | null
          action_level_ar: string | null
          conflict_group: number | null
          counts_once: number | null
          created_at: string
          drug_name_ar: string | null
          evidence_status_ar: string | null
          evidence_status_code: string | null
          food_or_beverage: string
          gap_minutes: number | null
          gap_side: string | null
          gap_text_ar: string | null
          id: string
          interaction_description: string
          item_id: string | null
          medication_id: string
          note_ar: string | null
          pharmacist_reviewed_ar: string | null
          recommendation: string | null
          reference_id: string | null
          reference_text: string | null
          review_status: Database["public"]["Enums"]["review_status"]
          severity: Database["public"]["Enums"]["interaction_severity"]
          source_key: string | null
          source_row_no: number | null
        }
        Insert: {
          action_level?: string | null
          action_level_ar?: string | null
          conflict_group?: number | null
          counts_once?: number | null
          created_at?: string
          drug_name_ar?: string | null
          evidence_status_ar?: string | null
          evidence_status_code?: string | null
          food_or_beverage: string
          gap_minutes?: number | null
          gap_side?: string | null
          gap_text_ar?: string | null
          id?: string
          interaction_description: string
          item_id?: string | null
          medication_id: string
          note_ar?: string | null
          pharmacist_reviewed_ar?: string | null
          recommendation?: string | null
          reference_id?: string | null
          reference_text?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          severity?: Database["public"]["Enums"]["interaction_severity"]
          source_key?: string | null
          source_row_no?: number | null
        }
        Update: {
          action_level?: string | null
          action_level_ar?: string | null
          conflict_group?: number | null
          counts_once?: number | null
          created_at?: string
          drug_name_ar?: string | null
          evidence_status_ar?: string | null
          evidence_status_code?: string | null
          food_or_beverage?: string
          gap_minutes?: number | null
          gap_side?: string | null
          gap_text_ar?: string | null
          id?: string
          interaction_description?: string
          item_id?: string | null
          medication_id?: string
          note_ar?: string | null
          pharmacist_reviewed_ar?: string | null
          recommendation?: string | null
          reference_id?: string | null
          reference_text?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          severity?: Database["public"]["Enums"]["interaction_severity"]
          source_key?: string | null
          source_row_no?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "drug_food_interactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "interaction_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_food_interactions_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_food_interactions_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "references"
            referencedColumns: ["id"]
          },
        ]
      }
      interaction_items: {
        Row: {
          created_at: string
          id: string
          item_type: string
          name_ar: string
          name_en: string
          source_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_type: string
          name_ar: string
          name_en: string
          source_key: string
        }
        Update: {
          created_at?: string
          id?: string
          item_type?: string
          name_ar?: string
          name_en?: string
          source_key?: string
        }
        Relationships: []
      }
      medication_brand_names: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          medication_id: string
          source_row_no: number | null
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          medication_id: string
          source_row_no?: number | null
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          medication_id?: string
          source_row_no?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_brand_names_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active_ingredients: string[]
          brand_examples_text: string | null
          brand_names: string[]
          created_at: string
          dosage_form: string | null
          drug_class_ar: string | null
          evidence_status_ar: string | null
          evidence_status_code: string | null
          generic_name: string
          id: string
          indication_ar: string | null
          meal_ar: string | null
          meal_rule_code: string | null
          name_ar: string | null
          notes_ar: string | null
          pharmacist_reviewed_ar: string | null
          reference_text: string | null
          reviewer_text: string | null
          source_key: string | null
          source_row_no: number | null
          strength: string | null
          time_of_day_code: string | null
          timing_ar: string | null
        }
        Insert: {
          active_ingredients?: string[]
          brand_examples_text?: string | null
          brand_names?: string[]
          created_at?: string
          dosage_form?: string | null
          drug_class_ar?: string | null
          evidence_status_ar?: string | null
          evidence_status_code?: string | null
          generic_name: string
          id?: string
          indication_ar?: string | null
          meal_ar?: string | null
          meal_rule_code?: string | null
          name_ar?: string | null
          notes_ar?: string | null
          pharmacist_reviewed_ar?: string | null
          reference_text?: string | null
          reviewer_text?: string | null
          source_key?: string | null
          source_row_no?: number | null
          strength?: string | null
          time_of_day_code?: string | null
          timing_ar?: string | null
        }
        Update: {
          active_ingredients?: string[]
          brand_examples_text?: string | null
          brand_names?: string[]
          created_at?: string
          dosage_form?: string | null
          drug_class_ar?: string | null
          evidence_status_ar?: string | null
          evidence_status_code?: string | null
          generic_name?: string
          id?: string
          indication_ar?: string | null
          meal_ar?: string | null
          meal_rule_code?: string | null
          name_ar?: string | null
          notes_ar?: string | null
          pharmacist_reviewed_ar?: string | null
          reference_text?: string | null
          reviewer_text?: string | null
          source_key?: string | null
          source_row_no?: number | null
          strength?: string | null
          time_of_day_code?: string | null
          timing_ar?: string | null
        }
        Relationships: []
      }
      record_references: {
        Row: {
          created_at: string
          excel_row: number
          id: string
          record_key: string
          reference_id: string
          section: string | null
          sheet: string
          support_note: string | null
        }
        Insert: {
          created_at?: string
          excel_row: number
          id?: string
          record_key: string
          reference_id: string
          section?: string | null
          sheet: string
          support_note?: string | null
        }
        Update: {
          created_at?: string
          excel_row?: number
          id?: string
          record_key?: string
          reference_id?: string
          section?: string | null
          sheet?: string
          support_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "record_references_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "references"
            referencedColumns: ["id"]
          },
        ]
      }
      references: {
        Row: {
          code: string | null
          created_at: string
          id: string
          organization_or_authors: string | null
          publication_year: number | null
          published_text: string | null
          title: string
          url_or_doi: string | null
          verification_date: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          organization_or_authors?: string | null
          publication_year?: number | null
          published_text?: string | null
          title: string
          url_or_doi?: string | null
          verification_date?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          organization_or_authors?: string | null
          publication_year?: number | null
          published_text?: string | null
          title?: string
          url_or_doi?: string | null
          verification_date?: string | null
        }
        Relationships: []
      }
      review_tasks: {
        Row: {
          created_at: string
          evidence_status: string | null
          excel_row: number
          id: string
          priority: string | null
          record_excel_row: number | null
          record_key: string | null
          required_decision: string | null
          review_status: string | null
          reviewer_comment: string | null
          sheet: string | null
        }
        Insert: {
          created_at?: string
          evidence_status?: string | null
          excel_row: number
          id?: string
          priority?: string | null
          record_excel_row?: number | null
          record_key?: string | null
          required_decision?: string | null
          review_status?: string | null
          reviewer_comment?: string | null
          sheet?: string | null
        }
        Update: {
          created_at?: string
          evidence_status?: string | null
          excel_row?: number
          id?: string
          priority?: string | null
          record_excel_row?: number | null
          record_key?: string | null
          required_decision?: string | null
          review_status?: string | null
          reviewer_comment?: string | null
          sheet?: string | null
        }
        Relationships: []
      }
      source_appendix: {
        Row: {
          cells: Json
          created_at: string
          excel_row: number
          id: string
          sheet: string
        }
        Insert: {
          cells: Json
          created_at?: string
          excel_row: number
          id?: string
          sheet: string
        }
        Update: {
          cells?: Json
          created_at?: string
          excel_row?: number
          id?: string
          sheet?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    }
    Enums: {
      app_role: "admin" | "reviewer"
      interaction_severity: "high" | "moderate" | "low" | "unknown"
      review_status: "unverified" | "under_review" | "verified" | "rejected"
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
    Enums: {
      app_role: ["admin", "reviewer"],
      interaction_severity: ["high", "moderate", "low", "unknown"],
      review_status: ["unverified", "under_review", "verified", "rejected"],
    },
  },
} as const
