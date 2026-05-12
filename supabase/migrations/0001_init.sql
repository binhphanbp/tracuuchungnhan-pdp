-- =============================================================================
-- PDP Certificates — initial schema (M2 / 0001)
-- =============================================================================
-- Run this in Supabase Dashboard → SQL Editor on a freshly-created project.
-- Apply 0001 → 0002 → 0003 in order, then optionally `seed.sql`.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---- profiles -------------------------------------------------------------
-- One row per admin user, linked 1:1 to auth.users(id). Auto-created by the
-- trigger below when a new user signs up via Supabase Auth.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text  not null
                    check (role in ('super_admin','admin','viewer'))
                    default 'viewer',
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---- campaigns ------------------------------------------------------------
create table public.campaigns (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  description       text,
  issue_date        date not null,
  signer_name       text,
  signer_title      text,
  drive_folder_id   text,
  status            text not null
                          check (status in ('draft','published','archived'))
                          default 'draft',
  template_config   jsonb not null default '{}'::jsonb,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---- certificates ---------------------------------------------------------
create table public.certificates (
  id                    uuid primary key default gen_random_uuid(),
  campaign_id           uuid not null references public.campaigns(id) on delete cascade,
  student_code          text not null,                   -- normalized: trim, upper
  full_name             text not null,                   -- with diacritics
  full_name_normalized  text not null,                   -- diacritic-free, for filenames + search
  class_name            text,
  email                 text,
  date_of_birth         date,
  certificate_title     text,
  issue_date            date not null,
  file_name             text not null,
  drive_file_id         text,
  drive_view_url        text,
  drive_download_url    text,
  verification_code     text not null unique,
  qr_payload            text not null,
  status                text not null
                              check (status in ('draft','published','revoked'))
                              default 'draft',
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (campaign_id, student_code)
);

create index certificates_campaign_id_idx
  on public.certificates (campaign_id);

create index certificates_student_code_idx
  on public.certificates (student_code);

create index certificates_status_idx
  on public.certificates (status);

create index certificates_created_at_desc_idx
  on public.certificates (created_at desc);

-- Hot path for public lookup: only published rows are ever returned, so a
-- partial index is dramatically smaller and faster.
create index certificates_published_student_code_idx
  on public.certificates (student_code)
  where status = 'published';

-- ---- import_batches -------------------------------------------------------
create table public.import_batches (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid not null references public.campaigns(id) on delete cascade,
  original_file_name  text,
  row_count           int  not null default 0,
  success_count       int  not null default 0,
  error_count         int  not null default 0,
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now()
);

create index import_batches_campaign_id_idx
  on public.import_batches (campaign_id);

-- ---- lookup_logs ----------------------------------------------------------
create table public.lookup_logs (
  id                  uuid primary key default gen_random_uuid(),
  student_code        text,
  verification_code   text,
  certificate_id      uuid references public.certificates(id) on delete set null,
  success             boolean not null,
  ip_hash             text,    -- SHA-256(ip + daily salt) — never raw IPs
  user_agent          text,
  created_at          timestamptz not null default now()
);

create index lookup_logs_created_at_desc_idx
  on public.lookup_logs (created_at desc);

create index lookup_logs_student_code_idx
  on public.lookup_logs (student_code);

-- ---- updated_at triggers --------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger campaigns_touch_updated_at
before update on public.campaigns
for each row execute function public.touch_updated_at();

create trigger certificates_touch_updated_at
before update on public.certificates
for each row execute function public.touch_updated_at();
