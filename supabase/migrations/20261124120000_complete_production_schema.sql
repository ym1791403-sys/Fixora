-- ==============================================================================
-- ByteForce Production Schema Migration (Complete Data Hygiene & Multi-Device)
-- ==============================================================================

-- 1. Profiles: Exclusive Admin Enforcement (snsr19344@gmail.com ONLY) & User Active Toggle
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role text;
BEGIN
  IF lower(trim(new.email)) = 'snsr19344@gmail.com' THEN
    assigned_role := 'admin';
  ELSIF lower(coalesce(new.raw_user_meta_data->>'role', '')) = 'technician' THEN
    assigned_role := 'technician';
  ELSE
    assigned_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, avatar_initial, avatar_url, is_active)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    assigned_role,
    upper(substring(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email) from 1 for 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    role = CASE WHEN lower(trim(excluded.email)) = 'snsr19344@gmail.com' THEN 'admin' ELSE coalesce(profiles.role, excluded.role) END,
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Allow admin update any profile" ON public.profiles;
CREATE POLICY "Allow admin update any profile" ON public.profiles
  FOR UPDATE USING (lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com');

-- 2. Enforce exclusive admin role in existing profiles
UPDATE public.profiles SET role = 'admin' WHERE lower(trim(email)) = 'snsr19344@gmail.com';
UPDATE public.profiles SET role = 'user' WHERE lower(trim(email)) <> 'snsr19344@gmail.com' AND role = 'admin';

-- 3. Remove synthetic / fake / seeded records (Zero Mock Policy)
TRUNCATE TABLE public.repair_requests;
DELETE FROM public.devices WHERE user_id IS NULL;
DELETE FROM public.technicians;
SELECT setval(pg_get_serial_sequence('public.technicians', 'id'), 1, false);
DELETE FROM public.certified_datasets WHERE dataset_key IN ('openrepair', 'backblaze');

-- 4. Technicians & Repair Centers Full Schema + RLS
ALTER TABLE IF EXISTS public.technicians
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS kind text DEFAULT 'TECHNICIAN',
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS home_service boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS working_hours text,
  ADD COLUMN IF NOT EXISTS experience_years integer;

ALTER TABLE IF EXISTS public.technicians ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE IF EXISTS public.technicians ALTER COLUMN rating SET DEFAULT 0.0;
ALTER TABLE IF EXISTS public.technicians ALTER COLUMN reviews_count SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.prevent_non_admin_tech_status_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF lower(trim(coalesce(auth.jwt() ->> 'email', ''))) <> 'snsr19344@gmail.com'
       AND coalesce(current_setting('role', true), '') NOT IN ('postgres', 'service_role') THEN
      RAISE EXCEPTION 'Only system admin can approve or reject technician profiles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_non_admin_tech_status ON public.technicians;
CREATE TRIGGER trg_prevent_non_admin_tech_status
  BEFORE UPDATE ON public.technicians
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_non_admin_tech_status_change();

DROP POLICY IF EXISTS "Allow public read technicians" ON public.technicians;
DROP POLICY IF EXISTS "Allow read approved or own or admin technicians" ON public.technicians;
CREATE POLICY "Allow read approved or own or admin technicians" ON public.technicians
  FOR SELECT USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com'
  );

DROP POLICY IF EXISTS "Allow pending tech insert" ON public.technicians;
CREATE POLICY "Allow pending tech insert" ON public.technicians
  FOR INSERT WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Allow admin update technicians" ON public.technicians;
CREATE POLICY "Allow admin update technicians" ON public.technicians
  FOR UPDATE USING (lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin delete technicians" ON public.technicians;
CREATE POLICY "Allow admin delete technicians" ON public.technicians
  FOR DELETE USING (lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com');

-- 5. Repair Requests Lifecycle Schema & Scoped RLS
ALTER TABLE IF EXISTS public.repair_requests
  ADD COLUMN IF NOT EXISTS tech_profile_id integer REFERENCES public.technicians(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS technician_business text,
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS device_category text,
  ADD COLUMN IF NOT EXISTS device_model text,
  ADD COLUMN IF NOT EXISTS issue_description text,
  ADD COLUMN IF NOT EXISTS diagnosis_id text,
  ADD COLUMN IF NOT EXISTS scheduled_date text,
  ADD COLUMN IF NOT EXISTS customer_notes text,
  ADD COLUMN IF NOT EXISTS estimate numeric,
  ADD COLUMN IF NOT EXISTS extra_cost numeric,
  ADD COLUMN IF NOT EXISTS final_cost numeric,
  ADD COLUMN IF NOT EXISTS actual_fault text,
  ADD COLUMN IF NOT EXISTS appointment text,
  ADD COLUMN IF NOT EXISTS rating integer,
  ADD COLUMN IF NOT EXISTS review_comment text,
  ADD COLUMN IF NOT EXISTS reviewed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS history jsonb DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.sync_technician_rating_from_review()
RETURNS trigger AS $$
BEGIN
  IF NEW.rating IS NOT NULL AND NEW.tech_profile_id IS NOT NULL THEN
    UPDATE public.technicians t
    SET
      rating = coalesce((SELECT round(avg(r.rating)::numeric, 1) FROM public.repair_requests r WHERE r.tech_profile_id = NEW.tech_profile_id AND r.rating IS NOT NULL AND r.rating > 0), 0.0),
      reviews_count = (SELECT count(*) FROM public.repair_requests r WHERE r.tech_profile_id = NEW.tech_profile_id AND r.rating IS NOT NULL AND r.rating > 0)
    WHERE t.id = NEW.tech_profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_tech_rating ON public.repair_requests;
CREATE TRIGGER trg_sync_tech_rating
  AFTER INSERT OR UPDATE OF rating ON public.repair_requests
  FOR EACH ROW EXECUTE PROCEDURE public.sync_technician_rating_from_review();

DROP POLICY IF EXISTS "Allow read repair_requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Allow read requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Allow scoped read repair_requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Allow insert repair_requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Allow insert requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Allow auth insert repair_requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Allow update repair_requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Allow scoped update repair_requests" ON public.repair_requests;
DROP POLICY IF EXISTS "Allow delete repair_requests" ON public.repair_requests;

CREATE POLICY "Allow scoped read repair_requests" ON public.repair_requests
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = technician_id
    OR EXISTS (SELECT 1 FROM public.technicians t WHERE t.id = repair_requests.tech_profile_id AND t.user_id = auth.uid())
    OR lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com'
  );

CREATE POLICY "Allow auth insert repair_requests" ON public.repair_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow scoped update repair_requests" ON public.repair_requests
  FOR UPDATE USING (
    auth.uid() = user_id
    OR auth.uid() = technician_id
    OR EXISTS (SELECT 1 FROM public.technicians t WHERE t.id = repair_requests.tech_profile_id AND t.user_id = auth.uid())
    OR lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com'
  );

-- 6. Devices Table Alignment & Scoped RLS
ALTER TABLE IF EXISTS public.devices
  ADD COLUMN IF NOT EXISTS os_version text;

DROP POLICY IF EXISTS "Allow read devices" ON public.devices;
DROP POLICY IF EXISTS "Allow insert devices" ON public.devices;
DROP POLICY IF EXISTS "Allow update devices" ON public.devices;
DROP POLICY IF EXISTS "Allow delete devices" ON public.devices;
DROP POLICY IF EXISTS "Allow own read devices" ON public.devices;
DROP POLICY IF EXISTS "Allow own insert devices" ON public.devices;
DROP POLICY IF EXISTS "Allow own update devices" ON public.devices;
DROP POLICY IF EXISTS "Allow own delete devices" ON public.devices;

CREATE POLICY "Allow own read devices" ON public.devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow own insert devices" ON public.devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow own update devices" ON public.devices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow own delete devices" ON public.devices FOR DELETE USING (auth.uid() = user_id);

-- 7. Diagnosis Reports Alignment & Scoped RLS
ALTER TABLE IF EXISTS public.diagnosis_reports
  ADD COLUMN IF NOT EXISTS confidence_score numeric(4,2),
  ADD COLUMN IF NOT EXISTS empirical_evidence jsonb,
  ADD COLUMN IF NOT EXISTS extracted_symptoms jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS estimated_difficulty text,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer,
  ADD COLUMN IF NOT EXISTS safety_warnings jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS requires_technician boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed';

DROP POLICY IF EXISTS "Allow read reports" ON public.diagnosis_reports;
DROP POLICY IF EXISTS "Allow scoped read reports" ON public.diagnosis_reports;
CREATE POLICY "Allow scoped read reports" ON public.diagnosis_reports
  FOR SELECT USING (
    auth.uid() = user_id
    OR lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com'
  );

DROP POLICY IF EXISTS "Allow insert reports" ON public.diagnosis_reports;
CREATE POLICY "Allow insert reports" ON public.diagnosis_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow delete reports" ON public.diagnosis_reports;
DROP POLICY IF EXISTS "Allow own delete reports" ON public.diagnosis_reports;
CREATE POLICY "Allow own delete reports" ON public.diagnosis_reports
  FOR DELETE USING (auth.uid() = user_id OR lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com');

-- 8. Notifications Table & RLS
CREATE TABLE IF NOT EXISTS public.notifications (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow own read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow auth insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow own update notifications" ON public.notifications;

CREATE POLICY "Allow own read notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow auth insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.uid() = user_id);
CREATE POLICY "Allow own update notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
