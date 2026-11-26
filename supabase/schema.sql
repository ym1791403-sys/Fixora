-- ==========================================
-- Fixora Certified Database Schema for Supabase
-- Project Ref: czwndaulnxvmncbtzsao
-- ==========================================

-- 1. Profiles Table (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'user',
  phone text,
  avatar_initial text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists is_active boolean default true;

alter table public.profiles enable row level security;
create policy "Allow public read access to profiles" on public.profiles for select using (true);
create policy "Allow authenticated users to insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Allow admin update any profile" on public.profiles for update using (lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com');

-- Trigger for auto-creating profile when user signs up via Supabase Auth (Exclusive Admin = snsr19344@gmail.com ONLY)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  assigned_role text;
begin
  if lower(trim(new.email)) = 'snsr19344@gmail.com' then
    assigned_role := 'admin';
  elsif lower(coalesce(new.raw_user_meta_data->>'role', '')) = 'technician' then
    assigned_role := 'technician';
  else
    assigned_role := 'user';
  end if;

  insert into public.profiles (id, email, full_name, role, avatar_initial, avatar_url, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    assigned_role,
    upper(substring(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email) from 1 for 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    role = case when lower(trim(excluded.email)) = 'snsr19344@gmail.com' then 'admin' else coalesce(profiles.role, excluded.role) end,
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Devices Table
create table if not exists public.devices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  device_category text not null,
  brand text,
  model text,
  serial_number text,
  purchase_date text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.devices enable row level security;
create policy "Allow read devices" on public.devices for select using (true);
create policy "Allow insert devices" on public.devices for insert with check (true);
create policy "Allow update devices" on public.devices for update using (true);
create policy "Allow delete devices" on public.devices for delete using (true);

-- 3. Diagnosis Reports Table
create table if not exists public.diagnosis_reports (
  id uuid default gen_random_uuid() primary key,
  report_code text unique,
  user_id uuid references auth.users on delete set null,
  device_category text not null,
  brand text,
  model text,
  problem_category text,
  description text,
  severity text default 'medium',
  empirical_statistics jsonb,
  verified_guide jsonb,
  possible_causes jsonb,
  troubleshooting_steps jsonb,
  required_tools jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.diagnosis_reports enable row level security;
create policy "Allow read reports" on public.diagnosis_reports for select using (true);
create policy "Allow insert reports" on public.diagnosis_reports for insert with check (true);
create policy "Allow delete reports" on public.diagnosis_reports for delete using (true);

-- 4. Repair Service Requests Table
create table if not exists public.repair_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  user_name text,
  user_phone text,
  device_info text,
  problem_summary text,
  status text default 'pending',
  technician_id uuid references auth.users on delete set null,
  technician_name text,
  estimated_cost text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.repair_requests enable row level security;
create policy "Allow read repair_requests" on public.repair_requests for select using (true);
create policy "Allow insert repair_requests" on public.repair_requests for insert with check (true);
create policy "Allow update repair_requests" on public.repair_requests for update using (true);
create policy "Allow delete repair_requests" on public.repair_requests for delete using (true);

-- 5. Certified Datasets Inventory Table
create table if not exists public.certified_datasets (
  dataset_key text primary key,
  name text not null,
  source_url text not null,
  total_records integer not null,
  status text not null,
  license text not null,
  verification_notes text,
  last_verified_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.certified_datasets enable row level security;
create policy "Allow public read certified_datasets" on public.certified_datasets for select using (true);

-- Seed Dataset Verifications
insert into public.certified_datasets (dataset_key, name, source_url, total_records, status, license, verification_notes)
values 
  ('open_repair_alliance', 'Open Repair Alliance Aggregate', 'https://raw.githubusercontent.com/openrepair/data/main/OpenRepairData_v0.3_aggregate_202607_eee.csv', 416282, 'operational', 'ODbL 1.0', '416,282 empirical repair records across 10 equipment categories.'),
  ('myfixit', 'MyFixit Verified Repair Manuals', 'https://github.com/rub-ksv/MyFixit-Dataset', 18995, 'operational', 'CC BY-NC-SA 3.0', '18,995 verified step-by-step disassembly manuals with iFixit source attribution.'),
  ('backblaze_telemetry', 'Backblaze Hard Drive SMART ML', 'https://f001.backblazeb2.com/file/Backblaze-Hard-Drive-Data/data_Q2_2026.zip', 12442, 'operational', 'Open Research', 'Binary classification Random Forest model with ROC-AUC 0.9117.')
on conflict (dataset_key) do update set
  total_records = excluded.total_records,
  status = excluded.status,
  last_verified_at = now();

-- 6. Repair Guides Table (MyFixit Verified Manuals)
create table if not exists public.repair_guides (
  id integer primary key,
  title text not null,
  device_category text,
  device_model text,
  component text,
  repair_type text,
  difficulty text,
  time_required text,
  summary text,
  url text,
  tools jsonb default '[]'::jsonb,
  steps jsonb default '[]'::jsonb,
  step_count integer default 0,
  file_source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists idx_repair_guides_cat on public.repair_guides(device_category);
create index if not exists idx_repair_guides_diff on public.repair_guides(difficulty);
create index if not exists idx_repair_guides_comp on public.repair_guides(component);

alter table public.repair_guides enable row level security;
create policy "Allow public read repair_guides" on public.repair_guides for select using (true);

-- 7. Open Repair Statistics Table (Open Repair Alliance Real Records)
create table if not exists public.openrepair_statistics (
  category_name text primary key,
  sample_size integer not null,
  repair_rate numeric(5,2) not null,
  repairable_rate numeric(5,2),
  end_of_life_rate numeric(5,2),
  average_age_years numeric(4,1),
  top_faults jsonb default '[]'::jsonb,
  barriers jsonb default '[]'::jsonb,
  source_info text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.openrepair_statistics enable row level security;
create policy "Allow public read openrepair_statistics" on public.openrepair_statistics for select using (true);

-- 8. Open Repair Incidents Table (Individual empirical repair events from Open Repair Alliance)
create table if not exists public.repair_incidents (
  id text primary key,
  data_provider text,
  country text,
  partner_category text,
  normalized_category text not null,
  brand text,
  product_age numeric(5,1),
  repair_status text not null,
  repair_barrier text,
  problem text,
  problem_cluster text,
  event_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists idx_repair_incidents_cat on public.repair_incidents(normalized_category);
create index if not exists idx_repair_incidents_brand on public.repair_incidents(brand);
create index if not exists idx_repair_incidents_status on public.repair_incidents(repair_status);
create index if not exists idx_repair_incidents_cluster on public.repair_incidents(problem_cluster);

alter table public.repair_incidents enable row level security;
create policy "Allow public read repair_incidents" on public.repair_incidents for select using (true);
create policy "Allow service write repair_incidents" on public.repair_incidents for all using (true);

-- 9. Backblaze Models Table
create table if not exists public.backblaze_models (
  model_id text primary key,
  task text not null,
  dataset text not null,
  metrics jsonb not null,
  feature_importances jsonb not null,
  feature_columns jsonb not null,
  device_scope text not null,
  trained_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.backblaze_models enable row level security;
create policy "Allow public read backblaze_models" on public.backblaze_models for select using (true);

-- 10. Technicians Directory Table (Zero Default Fake Ratings)
create table if not exists public.technicians (
  id serial primary key,
  user_id uuid references auth.users on delete set null,
  name text not null,
  email text,
  business_name text not null,
  kind text default 'TECHNICIAN',
  city text not null,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  specializations text,
  bio text,
  working_hours text,
  experience_years integer,
  home_service boolean default false,
  rating numeric(3,1) default 0.0,
  reviews_count integer default 0,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.technicians enable row level security;
create policy "Allow read approved or own or admin technicians" on public.technicians for select using (
  status = 'approved' or auth.uid() = user_id or lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com'
);
create policy "Allow pending tech insert" on public.technicians for insert with check (status = 'pending');
create policy "Allow admin update technicians" on public.technicians for update using (
  lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com' or auth.uid() = user_id
);

-- 11. Notifications Table
create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info',
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.notifications enable row level security;
create policy "Allow own read notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Allow auth insert notifications" on public.notifications for insert with check (auth.role() = 'authenticated' or auth.uid() = user_id);
create policy "Allow own update notifications" on public.notifications for update using (auth.uid() = user_id);

-- 12. Request Chat Messages Table (customer <-> assigned technician per repair request)
create table if not exists public.request_messages (
  id uuid default gen_random_uuid() primary key,
  request_id uuid not null,
  sender_id uuid references auth.users on delete set null,
  sender_name text,
  sender_role text not null default 'customer',
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists idx_request_messages_req on public.request_messages(request_id);
alter table public.request_messages enable row level security;
create policy "Allow participants read request_messages" on public.request_messages for select using (
  exists (select 1 from public.repair_requests r where r.id = request_messages.request_id and (r.user_id = auth.uid() or r.technician_id = auth.uid()))
  or lower(trim(auth.jwt() ->> 'email')) = 'snsr19344@gmail.com'
);
create policy "Allow participants insert request_messages" on public.request_messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from public.repair_requests r where r.id = request_messages.request_id and (r.user_id = auth.uid() or r.technician_id = auth.uid()))
);
