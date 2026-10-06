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
