-- =============================================================================
-- PDP Certificates — public lookup RPCs (M2 / 0003)
-- =============================================================================
-- These are the ONLY ways anonymous users can read certificate data. Both
-- functions are SECURITY DEFINER so they bypass RLS deliberately, but they
-- limit:
--   1. Which fields can come back (no email, no DOB, no metadata).
--   2. Which rows can come back (status='published' on both cert + campaign).
--   3. How they're queried (single-row lookup, no enumeration possible).
-- =============================================================================

-- Drop first so this file is idempotent on re-runs.
drop function if exists public.public_lookup_certificate(text);
drop function if exists public.public_verify_certificate(text);

create or replace function public.public_lookup_certificate(p_student_code text)
returns table (
  student_code        text,
  full_name           text,
  certificate_title   text,
  issue_date          date,
  signer_name         text,
  signer_title        text,
  campaign_title      text,
  verification_code   text,
  drive_view_url      text,
  drive_download_url  text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.student_code,
    c.full_name,
    c.certificate_title,
    c.issue_date,
    camp.signer_name,
    camp.signer_title,
    camp.title          as campaign_title,
    c.verification_code,
    c.drive_view_url,
    c.drive_download_url
  from public.certificates c
  join public.campaigns camp on camp.id = c.campaign_id
  where c.student_code = upper(trim(p_student_code))
    and c.status      = 'published'
    and camp.status   = 'published'
  order by c.issue_date desc
  limit 1;
$$;

create or replace function public.public_verify_certificate(p_code text)
returns table (
  student_code        text,
  full_name           text,
  certificate_title   text,
  issue_date          date,
  signer_name         text,
  signer_title        text,
  campaign_title      text,
  verification_code   text,
  drive_view_url      text,
  drive_download_url  text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.student_code,
    c.full_name,
    c.certificate_title,
    c.issue_date,
    camp.signer_name,
    camp.signer_title,
    camp.title          as campaign_title,
    c.verification_code,
    c.drive_view_url,
    c.drive_download_url
  from public.certificates c
  join public.campaigns camp on camp.id = c.campaign_id
  where c.verification_code = trim(p_code)
    and c.status    = 'published'
    and camp.status = 'published'
  limit 1;
$$;

-- Allow anonymous + authenticated callers. RLS does not apply to these
-- functions (SECURITY DEFINER) — the WHERE-clause filters above are the
-- gate.
grant execute on function public.public_lookup_certificate(text)
  to anon, authenticated;

grant execute on function public.public_verify_certificate(text)
  to anon, authenticated;
