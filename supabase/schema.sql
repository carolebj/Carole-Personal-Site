-- Carole Personal Site CMS — current Supabase schema.
-- For an existing project, export first (`npm run cms:export`) then run:
-- supabase/migrations/20260610194517_editorial_workflow.sql

create table if not exists public.cms_documents (
  type text not null,
  doc_id text not null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'trashed')),
  position integer not null default 0,
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  deleted_at timestamptz,
  updated_by uuid,
  primary key (type, doc_id)
);

create table if not exists public.cms_public_documents (
  type text not null,
  doc_id text not null,
  data jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  slug text,
  published_at timestamptz not null default now(),
  primary key (type, doc_id)
);

create table if not exists public.cms_revisions (
  revision_id bigint generated always as identity primary key,
  type text not null,
  doc_id text not null,
  data jsonb not null,
  status text not null,
  position integer not null,
  slug text,
  created_at timestamptz not null default now(),
  created_by uuid
);

create unique index if not exists cms_documents_type_slug_unique
  on public.cms_documents (type, slug) where slug is not null and deleted_at is null;
create index if not exists cms_documents_active_order_idx
  on public.cms_documents (type, position) where deleted_at is null;
create unique index if not exists cms_public_documents_type_slug_unique
  on public.cms_public_documents (type, slug) where slug is not null;
create index if not exists cms_public_documents_type_order_idx
  on public.cms_public_documents (type, position);
create index if not exists cms_revisions_document_idx
  on public.cms_revisions (type, doc_id, created_at desc);

alter table public.cms_documents enable row level security;
alter table public.cms_public_documents enable row level security;
alter table public.cms_revisions enable row level security;

create policy "cms authenticated manage"
  on public.cms_documents for all to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);
create policy "cms published read"
  on public.cms_public_documents for select using (true);
create policy "cms authenticated publish insert"
  on public.cms_public_documents for insert to authenticated
  with check ((select auth.uid()) is not null);
create policy "cms authenticated publish update"
  on public.cms_public_documents for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);
create policy "cms authenticated publish delete"
  on public.cms_public_documents for delete to authenticated
  using ((select auth.uid()) is not null);
create policy "cms authenticated revisions"
  on public.cms_revisions for all to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

revoke all on table public.cms_documents from anon;
revoke all on table public.cms_public_documents from anon;
revoke all on table public.cms_revisions from anon;
grant select on table public.cms_public_documents to anon, authenticated;
grant select, insert, update, delete on table public.cms_documents to authenticated;
grant select, insert, update, delete on table public.cms_public_documents to authenticated;
grant select, insert, update, delete on table public.cms_revisions to authenticated;
grant usage, select on sequence public.cms_revisions_revision_id_seq to authenticated;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media authenticated write"
  on storage.objects for all to authenticated
  using (bucket_id = 'media') with check (bucket_id = 'media');

create table if not exists public.design_brief_submissions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new' check (status in ('new', 'reviewed', 'processed', 'archived')),
  client_name text,
  contact_name text,
  contact_email text,
  project_type text,
  answers jsonb not null default '{}'::jsonb,
  logo_styles text[] not null default '{}'::text[],
  color_palette jsonb not null default '[]'::jsonb,
  inspiration_links text[] not null default '{}'::text[],
  asset_paths text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  processed_at timestamptz,
  archived_at timestamptz
);

create index if not exists design_brief_submissions_created_at_idx
  on public.design_brief_submissions (created_at desc);
create index if not exists design_brief_submissions_status_idx
  on public.design_brief_submissions (status, created_at desc);

alter table public.design_brief_submissions enable row level security;

create policy "design brief public submit"
  on public.design_brief_submissions for insert to anon
  with check (true);
create policy "design brief authenticated read"
  on public.design_brief_submissions for select to authenticated
  using ((select auth.uid()) is not null);
create policy "design brief authenticated update"
  on public.design_brief_submissions for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);
create policy "design brief authenticated delete"
  on public.design_brief_submissions for delete to authenticated
  using ((select auth.uid()) is not null);

grant insert on table public.design_brief_submissions to anon;
grant select, insert, update, delete on table public.design_brief_submissions to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brief-assets',
  'brief-assets',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "brief assets public upload"
  on storage.objects for insert to anon
  with check (bucket_id = 'brief-assets');
create policy "brief assets authenticated read"
  on storage.objects for select to authenticated
  using (bucket_id = 'brief-assets' and (select auth.uid()) is not null);
create policy "brief assets authenticated manage"
  on storage.objects for all to authenticated
  using (bucket_id = 'brief-assets' and (select auth.uid()) is not null)
  with check (bucket_id = 'brief-assets' and (select auth.uid()) is not null);

-- Transactional workflow functions are defined in the migration file above.
