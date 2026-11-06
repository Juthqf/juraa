CREATE TYPE public.interaction_severity AS ENUM ('high','moderate','low','unknown');
CREATE TYPE public.review_status AS ENUM ('unverified','under_review','verified','rejected');
CREATE TYPE public.app_role AS ENUM ('admin','reviewer');

CREATE TABLE public."references" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 500),
  organization_or_authors text CHECK (length(organization_or_authors) <= 500),
  publication_year int CHECK (publication_year BETWEEN 1800 AND 2100),
  url_or_doi text CHECK (length(url_or_doi) <= 1000),
  verification_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generic_name text NOT NULL UNIQUE CHECK (length(btrim(generic_name)) BETWEEN 1 AND 200),
  brand_names text[] NOT NULL DEFAULT '{}',
  active_ingredients text[] NOT NULL DEFAULT '{}',
  strength text CHECK (length(strength) <= 100),
  dosage_form text CHECK (length(dosage_form) <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.drug_food_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE RESTRICT,
  food_or_beverage text NOT NULL CHECK (length(btrim(food_or_beverage)) BETWEEN 1 AND 200),
  interaction_description text NOT NULL CHECK (length(btrim(interaction_description)) BETWEEN 1 AND 4000),
  severity public.interaction_severity NOT NULL DEFAULT 'unknown',
  recommendation text CHECK (length(recommendation) <= 4000),
  reference_id uuid REFERENCES public."references"(id) ON DELETE RESTRICT,
  review_status public.review_status NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dfi_verified_needs_reference CHECK (review_status <> 'verified' OR reference_id IS NOT NULL)
);
CREATE INDEX ON public.drug_food_interactions(medication_id);

CREATE TABLE public.drug_drug_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_1_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE RESTRICT,
  medication_2_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE RESTRICT,
  interaction_description text NOT NULL CHECK (length(btrim(interaction_description)) BETWEEN 1 AND 4000),
  severity public.interaction_severity NOT NULL DEFAULT 'unknown',
  recommendation text CHECK (length(recommendation) <= 4000),
  reference_id uuid REFERENCES public."references"(id) ON DELETE RESTRICT,
  review_status public.review_status NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ddi_distinct_meds CHECK (medication_1_id <> medication_2_id),
  CONSTRAINT ddi_verified_needs_reference CHECK (review_status <> 'verified' OR reference_id IS NOT NULL)
);
CREATE UNIQUE INDEX ddi_unique_pair ON public.drug_drug_interactions (LEAST(medication_1_id, medication_2_id), GREATEST(medication_1_id, medication_2_id));
CREATE INDEX ON public.drug_drug_interactions(medication_2_id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.medications, public."references", public.drug_food_interactions, public.drug_drug_interactions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.medications, public."references", public.drug_food_interactions, public.drug_drug_interactions TO authenticated;
GRANT ALL ON public.medications, public."references", public.drug_food_interactions, public.drug_drug_interactions TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_food_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Read: public reference data (review_status is always returned so the app can label it)
CREATE POLICY "Public read medications" ON public.medications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read references" ON public."references" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read food interactions" ON public.drug_food_interactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read drug interactions" ON public.drug_drug_interactions FOR SELECT TO anon, authenticated USING (true);

-- Write: admins only
CREATE POLICY "Admins write medications" ON public.medications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins write references" ON public."references" FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins write food interactions" ON public.drug_food_interactions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins write drug interactions" ON public.drug_drug_interactions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Only reviewers/admins may mark an interaction verified; enforced in DB.
CREATE OR REPLACE FUNCTION public.guard_review_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.review_status = 'verified'
     AND (TG_OP = 'INSERT' OR OLD.review_status IS DISTINCT FROM 'verified')
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(),'reviewer') THEN
    RAISE EXCEPTION 'Only a clinical reviewer can mark an interaction as verified';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER dfi_guard_review BEFORE INSERT OR UPDATE ON public.drug_food_interactions FOR EACH ROW EXECUTE FUNCTION public.guard_review_status();
CREATE TRIGGER ddi_guard_review BEFORE INSERT OR UPDATE ON public.drug_drug_interactions FOR EACH ROW EXECUTE FUNCTION public.guard_review_status();