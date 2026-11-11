CREATE TABLE public.interaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('food','supplement','otc')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.interaction_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.interaction_items TO authenticated;
GRANT ALL ON public.interaction_items TO service_role;
ALTER TABLE public.interaction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read items" ON public.interaction_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write items" ON public.interaction_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.medications
  ADD COLUMN source_key text UNIQUE,
  ADD COLUMN source_row_no numeric,
  ADD COLUMN name_ar text,
  ADD COLUMN brand_examples_text text,
  ADD COLUMN drug_class_ar text,
  ADD COLUMN indication_ar text,
  ADD COLUMN timing_ar text,
  ADD COLUMN time_of_day_code text,
  ADD COLUMN meal_ar text,
  ADD COLUMN meal_rule_code text,
  ADD COLUMN notes_ar text,
  ADD COLUMN reference_text text,
  ADD COLUMN evidence_status_ar text,
  ADD COLUMN evidence_status_code text,
  ADD COLUMN pharmacist_reviewed_ar text,
  ADD COLUMN reviewer_text text;

CREATE TABLE public.medication_brand_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE RESTRICT,
  brand_name text NOT NULL,
  source_row_no integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (medication_id, brand_name)
);
GRANT SELECT ON public.medication_brand_names TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.medication_brand_names TO authenticated;
GRANT ALL ON public.medication_brand_names TO service_role;
ALTER TABLE public.medication_brand_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read brands" ON public.medication_brand_names FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write brands" ON public.medication_brand_names FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.drug_food_interactions
  ADD COLUMN source_key text UNIQUE,
  ADD COLUMN source_row_no numeric,
  ADD COLUMN item_id uuid REFERENCES public.interaction_items(id) ON DELETE RESTRICT,
  ADD COLUMN drug_name_ar text,
  ADD COLUMN action_level_ar text,
  ADD COLUMN action_level text CHECK (action_level IN ('avoid','caution')),
  ADD COLUMN reference_text text,
  ADD COLUMN gap_text_ar text,
  ADD COLUMN gap_minutes numeric,
  ADD COLUMN gap_side text,
  ADD COLUMN note_ar text,
  ADD COLUMN evidence_status_ar text,
  ADD COLUMN evidence_status_code text,
  ADD COLUMN pharmacist_reviewed_ar text,
  ADD COLUMN conflict_group numeric,
  ADD COLUMN counts_once integer;
CREATE UNIQUE INDEX dfi_unique_med_item ON public.drug_food_interactions (medication_id, item_id) WHERE item_id IS NOT NULL;

ALTER TABLE public.drug_drug_interactions
  ADD COLUMN source_key text UNIQUE,
  ADD COLUMN source_row_no numeric,
  ADD COLUMN item_2_id uuid REFERENCES public.interaction_items(id) ON DELETE RESTRICT,
  ADD COLUMN drug_a_ar text,
  ADD COLUMN drug_b_en text,
  ADD COLUMN drug_b_ar text,
  ADD COLUMN action_level_ar text,
  ADD COLUMN action_level text CHECK (action_level IN ('avoid','caution')),
  ADD COLUMN reference_text text,
  ADD COLUMN gap_text_ar text,
  ADD COLUMN gap_minutes numeric,
  ADD COLUMN gap_side text,
  ADD COLUMN note_ar text,
  ADD COLUMN evidence_status_ar text,
  ADD COLUMN evidence_status_code text,
  ADD COLUMN pharmacist_reviewed_ar text,
  ADD COLUMN conflict_group numeric,
  ADD COLUMN counts_once integer;
ALTER TABLE public.drug_drug_interactions ALTER COLUMN medication_2_id DROP NOT NULL;
ALTER TABLE public.drug_drug_interactions ADD CONSTRAINT ddi_second_party_exactly_one
  CHECK ((medication_2_id IS NULL) <> (item_2_id IS NULL));
CREATE UNIQUE INDEX ddi_unique_pair_v2 ON public.drug_drug_interactions (
  LEAST(medication_1_id, COALESCE(medication_2_id, item_2_id)),
  GREATEST(medication_1_id, COALESCE(medication_2_id, item_2_id)),
  (item_2_id IS NULL));
DROP INDEX public.ddi_unique_pair;

ALTER TABLE public."references"
  ADD COLUMN code text UNIQUE,
  ADD COLUMN published_text text;

CREATE TABLE public.record_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet text NOT NULL,
  excel_row integer NOT NULL,
  record_key text NOT NULL,
  reference_id uuid NOT NULL REFERENCES public."references"(id) ON DELETE RESTRICT,
  section text,
  support_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sheet, excel_row, record_key, reference_id)
);
GRANT SELECT ON public.record_references TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.record_references TO authenticated;
GRANT ALL ON public.record_references TO service_role;
ALTER TABLE public.record_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read record refs" ON public.record_references FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write record refs" ON public.record_references FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.review_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  excel_row integer NOT NULL UNIQUE,
  priority text,
  sheet text,
  record_excel_row integer,
  record_key text,
  evidence_status text,
  required_decision text,
  review_status text,
  reviewer_comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_tasks TO authenticated;
GRANT ALL ON public.review_tasks TO service_role;
ALTER TABLE public.review_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read review tasks" ON public.review_tasks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reviewer'));
CREATE POLICY "Admins write review tasks" ON public.review_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.source_appendix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet text NOT NULL,
  excel_row integer NOT NULL,
  cells jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sheet, excel_row)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.source_appendix TO authenticated;
GRANT ALL ON public.source_appendix TO service_role;
ALTER TABLE public.source_appendix ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read appendix" ON public.source_appendix FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reviewer'));
CREATE POLICY "Admins write appendix" ON public.source_appendix FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

COMMENT ON COLUMN public.drug_drug_interactions.severity IS 'Not used for workbook rows; see action_level (avoid/caution = تجنب/انتبه)';
COMMENT ON COLUMN public.drug_food_interactions.severity IS 'Not used for workbook rows; see action_level (avoid/caution = تجنب/انتبه)';