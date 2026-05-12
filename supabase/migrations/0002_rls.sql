-- =============================================================================
-- PDP Certificates — Row Level Security (M2 / 0002)
-- =============================================================================
-- Principles:
--   * RLS is enabled on every table in `public`.
--   * `anon` has ZERO direct table access. Public lookup runs through
--     `SECURITY DEFINER` RPCs (see 0003_rpc_public_lookup.sql).
--   * `authenticated` admins are gated by the `is_admin()` helper.
--   * `service_role` (server-only) implicitly bypasses RLS — used by API
--     routes for legitimate admin operations and lookup logging.
-- =============================================================================

-- ---- helper ---------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ---- enable RLS on every table -------------------------------------------
alter table public.profiles        enable row level security;
alter table public.campaigns       enable row level security;
alter table public.certificates    enable row level security;
alter table public.import_batches  enable row level security;
alter table public.lookup_logs     enable row level security;

-- ---- profiles -------------------------------------------------------------
create policy "users read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "admin reads all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

create policy "users update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "super_admin manages roles"
  on public.profiles
  for update
  to authenticated
  using (
    exists(select 1 from public.profiles
           where id = auth.uid() and role = 'super_admin')
  )
  with check (
    exists(select 1 from public.profiles
           where id = auth.uid() and role = 'super_admin')
  );

-- ---- campaigns / certificates / import_batches ---------------------------
-- Admins have full access. Anonymous users have NO direct access — public
-- lookup is mediated by the SECURITY DEFINER RPC in 0003.
create policy "admin full access on campaigns"
  on public.campaigns
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin full access on certificates"
  on public.certificates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin full access on import_batches"
  on public.import_batches
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- lookup_logs ----------------------------------------------------------
-- Only admins read logs. Inserts come exclusively from the server-side
-- `service_role` client, which bypasses RLS, so no INSERT policy is needed.
create policy "admin reads logs"
  on public.lookup_logs
  for select
  to authenticated
  using (public.is_admin());
