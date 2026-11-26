-- Tighten repair_incidents writes to the service role only.
-- The previous policy allowed any role (including anon) to write to this public dataset table.
-- The ingest script uses the service_role key, which bypasses RLS, so it is unaffected.
-- Apply in the Supabase SQL editor.

alter table public.repair_incidents enable row level security;
drop policy if exists "Allow service write repair_incidents" on public.repair_incidents;
create policy "Allow service write repair_incidents" on public.repair_incidents
  for all using (auth.role() = 'service_role');
