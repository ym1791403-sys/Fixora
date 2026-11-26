-- Request chat messages (customer <-> assigned technician per repair request).
-- Apply in the Supabase SQL editor; the same table is also in supabase/schema.sql.

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
