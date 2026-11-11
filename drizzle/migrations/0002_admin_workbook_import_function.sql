CREATE OR REPLACE FUNCTION public.import_workbook(payload jsonb, dry_run boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  res jsonb;
  n bigint;
  PROCEDURE_NAME text := 'import_workbook';
BEGIN
  -- Server-side authorization: only signed-in admins.
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;

  BEGIN
    INSERT INTO public."references" (code, title, organization_or_authors, published_text, url_or_doi)
    SELECT e->>'code', e->>'title', e->>'organization_or_authors', e->>'published_text', e->>'url_or_doi'
    FROM jsonb_array_elements(payload->'refs') e
    ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, organization_or_authors = EXCLUDED.organization_or_authors,
      published_text = EXCLUDED.published_text, url_or_doi = EXCLUDED.url_or_doi;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> jsonb_array_length(payload->'refs') THEN RAISE EXCEPTION 'references: % of % written', n, jsonb_array_length(payload->'refs') USING ERRCODE = '22000'; END IF;

    INSERT INTO public.interaction_items (source_key, name_en, name_ar, item_type)
    SELECT e->>'source_key', e->>'name_en', e->>'name_ar', e->>'item_type'
    FROM jsonb_array_elements(payload->'items') e
    ON CONFLICT (source_key) DO UPDATE SET name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar, item_type = EXCLUDED.item_type;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> jsonb_array_length(payload->'items') THEN RAISE EXCEPTION 'items: % of % written', n, jsonb_array_length(payload->'items') USING ERRCODE = '22000'; END IF;

    INSERT INTO public.medications (source_key, source_row_no, generic_name, active_ingredients, brand_names, name_ar, brand_examples_text,
      drug_class_ar, indication_ar, timing_ar, time_of_day_code, meal_ar, meal_rule_code, notes_ar, reference_text,
      evidence_status_ar, evidence_status_code, pharmacist_reviewed_ar, reviewer_text)
    SELECT e->>'source_key', (e->>'source_row_no')::numeric, e->>'generic_name', ARRAY[e->>'generic_name'],
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(e->'brand_names')), '{}'), e->>'name_ar', e->>'brand_examples_text',
      e->>'drug_class_ar', e->>'indication_ar', e->>'timing_ar', e->>'time_of_day_code', e->>'meal_ar', e->>'meal_rule_code',
      e->>'notes_ar', e->>'reference_text', e->>'evidence_status_ar', e->>'evidence_status_code', e->>'pharmacist_reviewed_ar', e->>'reviewer_text'
    FROM jsonb_array_elements(payload->'meds') e
    ON CONFLICT (source_key) DO UPDATE SET source_row_no = EXCLUDED.source_row_no, generic_name = EXCLUDED.generic_name,
      active_ingredients = EXCLUDED.active_ingredients, brand_names = EXCLUDED.brand_names, name_ar = EXCLUDED.name_ar,
      brand_examples_text = EXCLUDED.brand_examples_text, drug_class_ar = EXCLUDED.drug_class_ar, indication_ar = EXCLUDED.indication_ar,
      timing_ar = EXCLUDED.timing_ar, time_of_day_code = EXCLUDED.time_of_day_code, meal_ar = EXCLUDED.meal_ar,
      meal_rule_code = EXCLUDED.meal_rule_code, notes_ar = EXCLUDED.notes_ar, reference_text = EXCLUDED.reference_text,
      evidence_status_ar = EXCLUDED.evidence_status_ar, evidence_status_code = EXCLUDED.evidence_status_code,
      pharmacist_reviewed_ar = EXCLUDED.pharmacist_reviewed_ar, reviewer_text = EXCLUDED.reviewer_text;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> jsonb_array_length(payload->'meds') THEN RAISE EXCEPTION 'medications: % of % written', n, jsonb_array_length(payload->'meds') USING ERRCODE = '22000'; END IF;

    INSERT INTO public.medication_brand_names (medication_id, brand_name, source_row_no)
    SELECT (SELECT id FROM public.medications WHERE source_key = e->>'med'), e->>'brand_name', (e->>'source_row_no')::int
    FROM jsonb_array_elements(payload->'brands') e
    ON CONFLICT (medication_id, brand_name) DO UPDATE SET source_row_no = EXCLUDED.source_row_no;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> jsonb_array_length(payload->'brands') THEN RAISE EXCEPTION 'brands: % of % written', n, jsonb_array_length(payload->'brands') USING ERRCODE = '22000'; END IF;

    INSERT INTO public.drug_food_interactions (source_key, source_row_no, medication_id, item_id, food_or_beverage, interaction_description,
      recommendation, drug_name_ar, action_level_ar, action_level, reference_text, gap_text_ar, gap_minutes, gap_side, note_ar,
      evidence_status_ar, evidence_status_code, pharmacist_reviewed_ar, conflict_group, counts_once)
    SELECT e->>'source_key', (e->>'source_row_no')::numeric,
      (SELECT id FROM public.medications WHERE source_key = e->>'med'),
      (SELECT id FROM public.interaction_items WHERE source_key = e->>'item'),
      e->>'food_or_beverage', e->>'interaction_description', e->>'recommendation', e->>'drug_name_ar', e->>'action_level_ar',
      e->>'action_level', e->>'reference_text', e->>'gap_text_ar', (e->>'gap_minutes')::numeric, e->>'gap_side', e->>'note_ar',
      e->>'evidence_status_ar', e->>'evidence_status_code', e->>'pharmacist_reviewed_ar', (e->>'conflict_group')::numeric, (e->>'counts_once')::int
    FROM jsonb_array_elements(payload->'food') e
    ON CONFLICT (source_key) DO UPDATE SET source_row_no = EXCLUDED.source_row_no, medication_id = EXCLUDED.medication_id,
      item_id = EXCLUDED.item_id, food_or_beverage = EXCLUDED.food_or_beverage, interaction_description = EXCLUDED.interaction_description,
      recommendation = EXCLUDED.recommendation, drug_name_ar = EXCLUDED.drug_name_ar, action_level_ar = EXCLUDED.action_level_ar,
      action_level = EXCLUDED.action_level, reference_text = EXCLUDED.reference_text, gap_text_ar = EXCLUDED.gap_text_ar,
      gap_minutes = EXCLUDED.gap_minutes, gap_side = EXCLUDED.gap_side, note_ar = EXCLUDED.note_ar,
      evidence_status_ar = EXCLUDED.evidence_status_ar, evidence_status_code = EXCLUDED.evidence_status_code,
      pharmacist_reviewed_ar = EXCLUDED.pharmacist_reviewed_ar, conflict_group = EXCLUDED.conflict_group, counts_once = EXCLUDED.counts_once;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> jsonb_array_length(payload->'food') THEN RAISE EXCEPTION 'food interactions: % of % written', n, jsonb_array_length(payload->'food') USING ERRCODE = '22000'; END IF;

    INSERT INTO public.drug_drug_interactions (source_key, source_row_no, medication_1_id, medication_2_id, item_2_id, interaction_description,
      recommendation, drug_a_ar, drug_b_en, drug_b_ar, action_level_ar, action_level, reference_text, gap_text_ar, gap_minutes, gap_side,
      note_ar, evidence_status_ar, evidence_status_code, pharmacist_reviewed_ar, conflict_group, counts_once)
    SELECT e->>'source_key', (e->>'source_row_no')::numeric,
      (SELECT id FROM public.medications WHERE source_key = e->>'a'),
      CASE WHEN (e->>'b_is_item')::boolean THEN NULL ELSE (SELECT id FROM public.medications WHERE source_key = e->>'b') END,
      CASE WHEN (e->>'b_is_item')::boolean THEN (SELECT id FROM public.interaction_items WHERE source_key = e->>'b') ELSE NULL END,
      e->>'interaction_description', e->>'recommendation', e->>'drug_a_ar', e->>'drug_b_en', e->>'drug_b_ar', e->>'action_level_ar',
      e->>'action_level', e->>'reference_text', e->>'gap_text_ar', (e->>'gap_minutes')::numeric, e->>'gap_side', e->>'note_ar',
      e->>'evidence_status_ar', e->>'evidence_status_code', e->>'pharmacist_reviewed_ar', (e->>'conflict_group')::numeric, (e->>'counts_once')::int
    FROM jsonb_array_elements(payload->'ddi') e
    ON CONFLICT (source_key) DO UPDATE SET source_row_no = EXCLUDED.source_row_no, medication_1_id = EXCLUDED.medication_1_id,
      medication_2_id = EXCLUDED.medication_2_id, item_2_id = EXCLUDED.item_2_id, interaction_description = EXCLUDED.interaction_description,
      recommendation = EXCLUDED.recommendation, drug_a_ar = EXCLUDED.drug_a_ar, drug_b_en = EXCLUDED.drug_b_en, drug_b_ar = EXCLUDED.drug_b_ar,
      action_level_ar = EXCLUDED.action_level_ar, action_level = EXCLUDED.action_level, reference_text = EXCLUDED.reference_text,
      gap_text_ar = EXCLUDED.gap_text_ar, gap_minutes = EXCLUDED.gap_minutes, gap_side = EXCLUDED.gap_side, note_ar = EXCLUDED.note_ar,
      evidence_status_ar = EXCLUDED.evidence_status_ar, evidence_status_code = EXCLUDED.evidence_status_code,
      pharmacist_reviewed_ar = EXCLUDED.pharmacist_reviewed_ar, conflict_group = EXCLUDED.conflict_group, counts_once = EXCLUDED.counts_once;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> jsonb_array_length(payload->'ddi') THEN RAISE EXCEPTION 'drug interactions: % of % written', n, jsonb_array_length(payload->'ddi') USING ERRCODE = '22000'; END IF;

    INSERT INTO public.record_references (sheet, excel_row, record_key, reference_id, section, support_note)
    SELECT e->>'sheet', (e->>'excel_row')::int, e->>'record_key',
      (SELECT id FROM public."references" WHERE code = e->>'code'), e->>'section', e->>'support_note'
    FROM jsonb_array_elements(payload->'links') e
    ON CONFLICT (sheet, excel_row, record_key, reference_id) DO UPDATE SET section = EXCLUDED.section, support_note = EXCLUDED.support_note;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> jsonb_array_length(payload->'links') THEN RAISE EXCEPTION 'reference links: % of % written', n, jsonb_array_length(payload->'links') USING ERRCODE = '22000'; END IF;

    INSERT INTO public.review_tasks (excel_row, priority, sheet, record_excel_row, record_key, evidence_status, required_decision, review_status)
    SELECT (e->>'excel_row')::int, e->>'priority', e->>'sheet', (e->>'record_excel_row')::int, e->>'record_key',
      e->>'evidence_status', e->>'required_decision', e->>'review_status'
    FROM jsonb_array_elements(payload->'tasks') e
    ON CONFLICT (excel_row) DO UPDATE SET priority = EXCLUDED.priority, sheet = EXCLUDED.sheet, record_excel_row = EXCLUDED.record_excel_row,
      record_key = EXCLUDED.record_key, evidence_status = EXCLUDED.evidence_status, required_decision = EXCLUDED.required_decision,
      review_status = EXCLUDED.review_status;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> jsonb_array_length(payload->'tasks') THEN RAISE EXCEPTION 'review tasks: % of % written', n, jsonb_array_length(payload->'tasks') USING ERRCODE = '22000'; END IF;

    INSERT INTO public.source_appendix (sheet, excel_row, cells)
    SELECT e->>'sheet', (e->>'excel_row')::int, e->'cells'
    FROM jsonb_array_elements(payload->'appendix') e
    ON CONFLICT (sheet, excel_row) DO UPDATE SET cells = EXCLUDED.cells;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> jsonb_array_length(payload->'appendix') THEN RAISE EXCEPTION 'appendix: % of % written', n, jsonb_array_length(payload->'appendix') USING ERRCODE = '22000'; END IF;

    IF EXISTS (SELECT 1 FROM public.drug_drug_interactions WHERE review_status <> 'unverified')
       OR EXISTS (SELECT 1 FROM public.drug_food_interactions WHERE review_status <> 'unverified') THEN
      RAISE EXCEPTION 'imported interactions must stay unverified' USING ERRCODE = '22000';
    END IF;

    res := jsonb_build_object(
      'references', (SELECT count(*) FROM public."references"),
      'items', (SELECT count(*) FROM public.interaction_items),
      'medications', (SELECT count(*) FROM public.medications),
      'brands', (SELECT count(*) FROM public.medication_brand_names),
      'food_interactions', (SELECT count(*) FROM public.drug_food_interactions),
      'drug_interactions', (SELECT count(*) FROM public.drug_drug_interactions),
      'drug_item_rows', (SELECT count(*) FROM public.drug_drug_interactions WHERE item_2_id IS NOT NULL),
      'reference_links', (SELECT count(*) FROM public.record_references),
      'review_tasks', (SELECT count(*) FROM public.review_tasks),
      'appendix', (SELECT count(*) FROM public.source_appendix));

    IF dry_run THEN
      RAISE EXCEPTION 'JURAA_DRY_RUN_ROLLBACK' USING ERRCODE = 'P0J01';
    END IF;
    RETURN res || jsonb_build_object('dry_run', false);
  EXCEPTION WHEN SQLSTATE 'P0J01' THEN
    -- Every write in this block was rolled back.
    RETURN res || jsonb_build_object('dry_run', true);
  END;
END;
$fn$;

REVOKE ALL ON FUNCTION public.import_workbook(jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_workbook(jsonb, boolean) TO authenticated;
COMMENT ON FUNCTION public.import_workbook(jsonb, boolean) IS 'Admin-only, single-transaction workbook import. dry_run=true writes then rolls back everything.';