-- Carole Portfolio CMS — Supabase schema
-- Run this once in Supabase > SQL Editor for your project.
--
-- Model: one JSONB table for all content types. Each row is (type, doc_id, data).
-- This matches the schema-driven dashboard, so adding a field never requires a
-- migration. The public site can read with the publishable (anon) key; only
-- authenticated users (the editor) can write.

-- 1. Content table -----------------------------------------------------------

create table if not exists public.cms_documents (
  type       text        not null,
  doc_id     text        not null,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (type, doc_id)
);

create index if not exists cms_documents_type_idx on public.cms_documents (type);

-- 2. Row Level Security ------------------------------------------------------

alter table public.cms_documents enable row level security;

-- Public read (the website fetches content with the anon key).
drop policy if exists "cms public read" on public.cms_documents;
create policy "cms public read"
  on public.cms_documents
  for select
  using (true);

-- Only authenticated users (the editor) can create/update/delete.
drop policy if exists "cms authenticated write" on public.cms_documents;
create policy "cms authenticated write"
  on public.cms_documents
  for all
  to authenticated
  using (true)
  with check (true);

-- 3. Image storage bucket ----------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Public read of media.
drop policy if exists "media public read" on storage.objects;
create policy "media public read"
  on storage.objects
  for select
  using (bucket_id = 'media');

-- Authenticated users can upload / replace / delete media.
drop policy if exists "media authenticated write" on storage.objects;
create policy "media authenticated write"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

-- 4. Editor account ----------------------------------------------------------
-- Create the editor login in Supabase > Authentication > Users > "Add user"
-- (email + password). Disable public sign-ups in Authentication > Providers
-- so only invited accounts can sign in.
