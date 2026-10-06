-- Dr. Virgil Beasly website production schema.
-- Additive and safe to run more than once in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(), title text not null,
  slug text not null unique, short_description text not null,
  long_description text, resource_type text not null,
  file_path text not null, file_name text not null, file_size bigint not null default 0,
  cover_image_path text, is_demo_content boolean not null default false,
  published boolean not null default false, featured boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(), name text not null, city text,
  email text not null unique, updates_opt_in boolean not null default false,
  updates_opt_in_at timestamptz, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resource_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete restrict,
  resource_id uuid not null references public.resources(id) on delete restrict,
  opted_in_this_request boolean not null default false,
  requested_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
  short_description text not null, body text not null, topic text,
  content_type text not null default 'article', cover_image_path text,
  is_demo_content boolean not null default false, published boolean not null default false,
  featured boolean not null default false, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(), question_text text not null,
  submitter_name text, submitter_email text not null,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  answer_body text, slug text unique, created_at timestamptz not null default now(),
  answered_at timestamptz
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
  kind text not null default 'book', description text not null, status text not null default 'draft',
  cta_label text, cta_url text, cover_image_path text, price_cents integer,
  stripe_price_id text, published boolean not null default false,
  featured boolean not null default false, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  relationship_note text not null default 'Draft — relationship to be confirmed.',
  description text, url text, logo_path text, published boolean not null default false,
  featured boolean not null default false, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(), name text not null, email text not null,
  topic text not null default 'general', message text not null,
  created_at timestamptz not null default now()
);

create index if not exists resource_requests_resource_idx on public.resource_requests(resource_id);
create index if not exists resource_requests_lead_idx on public.resource_requests(lead_id);
create index if not exists questions_status_idx on public.questions(status);

alter table public.resources enable row level security;
alter table public.leads enable row level security;
alter table public.resource_requests enable row level security;
alter table public.articles enable row level security;
alter table public.questions enable row level security;
alter table public.books enable row level security;
alter table public.projects enable row level security;
alter table public.contact_enquiries enable row level security;

-- Public reads expose only intentionally published, non-sensitive content.
drop policy if exists "published resources are public" on public.resources;
create policy "published resources are public" on public.resources for select using (published);
drop policy if exists "published articles are public" on public.articles;
create policy "published articles are public" on public.articles for select using (published);
drop policy if exists "published questions are public" on public.questions;
create policy "published questions are public" on public.questions for select
  using (status = 'published');
drop policy if exists "published books are public" on public.books;
create policy "published books are public" on public.books for select using (published);
drop policy if exists "published projects are public" on public.projects;
create policy "published projects are public" on public.projects for select using (published);

-- Leads, submissions, requests and all admin writes are server-only through
-- SUPABASE_SECRET_KEY. No anonymous insert/update/delete policies are granted.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resource-files', 'resource-files', false, 26214400, array['application/pdf'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cover-images', 'cover-images', true, 5242880,
  array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Atomic lead-capture + resource-request creation. Mirrors the exact
-- business logic of the SQLite path's captureLeadAndRequestResource
-- (lib/resources/queries.ts): email-keyed upsert, name/city always
-- overwritten to the latest submission, consent can only ever turn ON
-- here (never silently revoked by a later unchecked request), and
-- updates_opt_in_at is set once. Runs as a single statement so a lead
-- can never be created without its request, or vice versa.
create or replace function public.capture_lead_and_request(
  p_name text,
  p_email text,
  p_city text,
  p_opt_in boolean,
  p_resource_id uuid
) returns jsonb
language plpgsql
as $$
declare
  v_lead_id uuid;
  v_existing_opt_in boolean;
  v_next_opt_in boolean;
  v_now timestamptz := now();
  v_request_id uuid;
  v_email text := lower(p_email);
begin
  select id, updates_opt_in into v_lead_id, v_existing_opt_in
  from public.leads where email = v_email;

  if v_lead_id is null then
    v_next_opt_in := p_opt_in;
    insert into public.leads
      (id, name, city, email, updates_opt_in, updates_opt_in_at, created_at, updated_at)
    values (gen_random_uuid(), p_name, p_city, v_email, v_next_opt_in,
            case when v_next_opt_in then v_now else null end, v_now, v_now)
    returning id into v_lead_id;
  else
    v_next_opt_in := v_existing_opt_in or p_opt_in;
    update public.leads set
      name = p_name,
      city = p_city,
      updates_opt_in = v_next_opt_in,
      updates_opt_in_at = case
        when v_next_opt_in and updates_opt_in_at is null then v_now
        else updates_opt_in_at
      end,
      updated_at = v_now
    where id = v_lead_id;
  end if;

  insert into public.resource_requests (id, lead_id, resource_id, opted_in_this_request, requested_at)
  values (gen_random_uuid(), v_lead_id, p_resource_id, p_opt_in, v_now)
  returning id into v_request_id;

  return jsonb_build_object(
    'lead_id', v_lead_id,
    'request_id', v_request_id,
    'requested_at', v_now
  );
end;
$$;

-- This function writes leads/requests directly, bypassing the row-level
-- security policies above — it must only ever be callable by the app's
-- service-role client, never by an anonymous or merely-authenticated
-- caller. Revoking first (idempotent even if nothing was ever granted)
-- then granting only to service_role keeps this safe to rerun.
revoke execute on function public.capture_lead_and_request(text, text, text, boolean, uuid)
  from public, anon, authenticated;
grant execute on function public.capture_lead_and_request(text, text, text, boolean, uuid)
  to service_role;
