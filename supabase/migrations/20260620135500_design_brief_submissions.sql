create table if not exists public.design_brief_submissions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new' check (status in ('new', 'reviewed', 'archived')),
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
  reviewed_at timestamptz
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
