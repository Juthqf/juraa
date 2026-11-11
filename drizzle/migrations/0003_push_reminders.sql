CREATE TABLE public.push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  time_zone text NOT NULL DEFAULT 'Asia/Riyadh' CHECK (length(time_zone) BETWEEN 1 AND 64),
  lang text NOT NULL DEFAULT 'ar' CHECK (lang IN ('ar','en')),
  companion text NOT NULL DEFAULT 'kabsoul' CHECK (companion IN ('kabsoul','kabsoula')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.push_devices TO service_role;
ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.push_devices(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE CHECK (endpoint LIKE 'https://%' AND length(endpoint) <= 1000),
  p256dh text NOT NULL CHECK (length(p256dh) <= 200),
  auth text NOT NULL CHECK (length(auth) <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.push_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.push_devices(id) ON DELETE CASCADE,
  med_id text NOT NULL CHECK (length(med_id) <= 100),
  med_name text NOT NULL CHECK (length(med_name) <= 120),
  ingredient text NOT NULL DEFAULT '' CHECK (length(ingredient) <= 120),
  generic_name text NOT NULL DEFAULT '' CHECK (length(generic_name) <= 120),
  dose_time text NOT NULL CHECK (dose_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  UNIQUE (device_id, med_id, dose_time)
);
GRANT ALL ON public.push_schedule TO service_role;
ALTER TABLE public.push_schedule ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.push_sent (
  device_id uuid NOT NULL REFERENCES public.push_devices(id) ON DELETE CASCADE,
  dose_date text NOT NULL,
  med_id text NOT NULL,
  dose_time text NOT NULL,
  kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, dose_date, med_id, dose_time, kind)
);
GRANT ALL ON public.push_sent TO service_role;
ALTER TABLE public.push_sent ENABLE ROW LEVEL SECURITY;
-- No policies: these tables are reachable only by server code after verifying the device token.