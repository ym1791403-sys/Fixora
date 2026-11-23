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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles add column if not exists avatar_url text;

alter table public.profiles enable row level security;
create policy "Allow public read access to profiles" on public.profiles for select using (true);
create policy "Allow authenticated users to insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger for auto-creating profile when user signs up via Supabase Auth (Email / Google OAuth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, avatar_initial, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    upper(substring(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email) from 1 for 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
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
