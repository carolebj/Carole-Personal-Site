-- Editorial workflow migration for the Carole Personal Site CMS.
-- Before applying: npm run cms:export

alter table public.cms_documents
  add column if not exists status text not null default 'published',
  add column if not exists position integer not null default 0,
  add column if not exists slug text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists published_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_by uuid;

update public.cms_documents
set slug = nullif(data->>'slug', ''),
    published_at = coalesce(published_at, updated_at, now()),
    created_at = coalesce(updated_at, created_at, now()),
    status = 'published'
where true;

with ordered as (
  select type, doc_id, row_number() over (partition by type order by updated_at, doc_id) - 1 as next_position
  from public.cms_documents
)
update public.cms_documents d
set position = ordered.next_position
from ordered
where d.type = ordered.type and d.doc_id = ordered.doc_id;

alter table public.cms_documents drop constraint if exists cms_documents_status_check;
alter table public.cms_documents
  add constraint cms_documents_status_check check (status in ('draft', 'published', 'trashed'));

create unique index if not exists cms_documents_type_slug_unique
  on public.cms_documents (type, slug)
  where slug is not null and deleted_at is null;

create index if not exists cms_documents_active_order_idx
  on public.cms_documents (type, position)
  where deleted_at is null;

create table if not exists public.cms_public_documents (
  type text not null,
  doc_id text not null,
  data jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  slug text,
  published_at timestamptz not null default now(),
  primary key (type, doc_id)
);

create unique index if not exists cms_public_documents_type_slug_unique
  on public.cms_public_documents (type, slug)
  where slug is not null;

create index if not exists cms_public_documents_type_order_idx
  on public.cms_public_documents (type, position);

insert into public.cms_public_documents (type, doc_id, data, position, slug, published_at)
select type, doc_id, data, position, slug, coalesce(published_at, updated_at, now())
from public.cms_documents
where deleted_at is null
on conflict (type, doc_id) do nothing;

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

create index if not exists cms_revisions_document_idx
  on public.cms_revisions (type, doc_id, created_at desc);

insert into public.cms_revisions (
  type, doc_id, data, status, position, slug, created_at, created_by
)
select
  document.type,
  document.doc_id,
  document.data,
  document.status,
  document.position,
  document.slug,
  coalesce(document.updated_at, document.created_at, now()),
  null
from public.cms_documents document
where not exists (
  select 1
  from public.cms_revisions revision
  where revision.type = document.type and revision.doc_id = document.doc_id
);

alter table public.cms_documents enable row level security;
alter table public.cms_public_documents enable row level security;
alter table public.cms_revisions enable row level security;

drop policy if exists "cms public read" on public.cms_documents;
drop policy if exists "cms authenticated write" on public.cms_documents;
drop policy if exists "cms authenticated manage" on public.cms_documents;
create policy "cms authenticated manage"
  on public.cms_documents for all to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "cms published read" on public.cms_public_documents;
create policy "cms published read"
  on public.cms_public_documents for select
  using (true);

drop policy if exists "cms authenticated publish" on public.cms_public_documents;
drop policy if exists "cms authenticated publish insert" on public.cms_public_documents;
drop policy if exists "cms authenticated publish update" on public.cms_public_documents;
drop policy if exists "cms authenticated publish delete" on public.cms_public_documents;
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

drop policy if exists "cms authenticated revisions" on public.cms_revisions;
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

create or replace function public.cms_record_revision(
  p_type text,
  p_doc_id text,
  p_data jsonb,
  p_status text,
  p_position integer,
  p_slug text
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.cms_revisions (type, doc_id, data, status, position, slug, created_by)
  values (p_type, p_doc_id, p_data, p_status, p_position, p_slug, auth.uid());

  delete from public.cms_revisions
  where revision_id in (
    select revision_id
    from public.cms_revisions
    where type = p_type and doc_id = p_doc_id
    order by created_at desc, revision_id desc
    offset 10
  );
end;
$$;

create or replace function public.cms_save_document(
  p_type text,
  p_doc_id text,
  p_data jsonb,
  p_slug text default null,
  p_position integer default 0
) returns public.cms_documents
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved public.cms_documents;
begin
  insert into public.cms_documents (
    type, doc_id, data, status, position, slug, created_at, updated_at, updated_by, deleted_at
  )
  values (
    p_type, p_doc_id, p_data, 'draft', p_position, nullif(p_slug, ''), now(), now(), auth.uid(), null
  )
  on conflict (type, doc_id) do update
  set data = excluded.data,
      position = excluded.position,
      slug = excluded.slug,
      updated_at = now(),
      updated_by = auth.uid(),
      deleted_at = null,
      status = 'draft'
  returning * into saved;

  perform public.cms_record_revision(
    saved.type, saved.doc_id, saved.data, saved.status, saved.position, saved.slug
  );
  return saved;
end;
$$;

create or replace function public.cms_publish_document(p_type text, p_doc_id text)
returns public.cms_documents
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved public.cms_documents;
begin
  update public.cms_documents
  set status = 'published',
      published_at = now(),
      updated_at = now(),
      updated_by = auth.uid(),
      deleted_at = null
  where type = p_type and doc_id = p_doc_id
  returning * into saved;

  if saved.doc_id is null then
    raise exception 'Document not found';
  end if;

  insert into public.cms_public_documents (type, doc_id, data, position, slug, published_at)
  values (saved.type, saved.doc_id, saved.data, saved.position, saved.slug, saved.published_at)
  on conflict (type, doc_id) do update
  set data = excluded.data,
      position = excluded.position,
      slug = excluded.slug,
      published_at = excluded.published_at;

  perform public.cms_record_revision(
    saved.type, saved.doc_id, saved.data, saved.status, saved.position, saved.slug
  );
  return saved;
end;
$$;

create or replace function public.cms_unpublish_document(p_type text, p_doc_id text)
returns public.cms_documents
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved public.cms_documents;
begin
  update public.cms_documents
  set status = 'draft', published_at = null, updated_at = now(), updated_by = auth.uid()
  where type = p_type and doc_id = p_doc_id and deleted_at is null
  returning * into saved;

  if saved.doc_id is null then
    raise exception 'Document not found';
  end if;

  delete from public.cms_public_documents where type = p_type and doc_id = p_doc_id;
  perform public.cms_record_revision(
    saved.type, saved.doc_id, saved.data, saved.status, saved.position, saved.slug
  );
  return saved;
end;
$$;

create or replace function public.cms_trash_document(p_type text, p_doc_id text)
returns public.cms_documents
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved public.cms_documents;
begin
  update public.cms_documents
  set status = 'trashed', deleted_at = now(), published_at = null, updated_at = now(), updated_by = auth.uid()
  where type = p_type and doc_id = p_doc_id
  returning * into saved;

  if saved.doc_id is null then
    raise exception 'Document not found';
  end if;

  delete from public.cms_public_documents where type = p_type and doc_id = p_doc_id;
  perform public.cms_record_revision(
    saved.type, saved.doc_id, saved.data, saved.status, saved.position, saved.slug
  );
  return saved;
end;
$$;

create or replace function public.cms_restore_document(p_type text, p_doc_id text)
returns public.cms_documents
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved public.cms_documents;
begin
  update public.cms_documents
  set status = 'draft', deleted_at = null, updated_at = now(), updated_by = auth.uid()
  where type = p_type and doc_id = p_doc_id
  returning * into saved;

  if saved.doc_id is null then
    raise exception 'Document not found';
  end if;

  perform public.cms_record_revision(
    saved.type, saved.doc_id, saved.data, saved.status, saved.position, saved.slug
  );
  return saved;
end;
$$;

create or replace function public.cms_reorder_documents(p_type text, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    update public.cms_documents
    set position = (item->>'position')::integer, updated_at = now(), updated_by = auth.uid()
    where type = p_type and doc_id = item->>'id' and deleted_at is null;

    update public.cms_public_documents
    set position = (item->>'position')::integer
    where type = p_type and doc_id = item->>'id';
  end loop;
end;
$$;

create or replace function public.cms_restore_revision(p_revision_id bigint)
returns public.cms_documents
language plpgsql
security invoker
set search_path = public
as $$
declare
  revision public.cms_revisions;
  saved public.cms_documents;
begin
  select * into revision from public.cms_revisions where revision_id = p_revision_id;
  if revision.revision_id is null then
    raise exception 'Revision not found';
  end if;

  update public.cms_documents
  set data = revision.data,
      slug = revision.slug,
      position = revision.position,
      status = 'draft',
      deleted_at = null,
      updated_at = now(),
      updated_by = auth.uid()
  where type = revision.type and doc_id = revision.doc_id
  returning * into saved;

  if saved.doc_id is null then
    raise exception 'Document not found';
  end if;

  perform public.cms_record_revision(
    saved.type, saved.doc_id, saved.data, saved.status, saved.position, saved.slug
  );
  return saved;
end;
$$;

revoke execute on function public.cms_record_revision(text, text, jsonb, text, integer, text) from public, anon;
revoke execute on function public.cms_save_document(text, text, jsonb, text, integer) from public, anon;
revoke execute on function public.cms_publish_document(text, text) from public, anon;
revoke execute on function public.cms_unpublish_document(text, text) from public, anon;
revoke execute on function public.cms_trash_document(text, text) from public, anon;
revoke execute on function public.cms_restore_document(text, text) from public, anon;
revoke execute on function public.cms_reorder_documents(text, jsonb) from public, anon;
revoke execute on function public.cms_restore_revision(bigint) from public, anon;

grant execute on function public.cms_record_revision(text, text, jsonb, text, integer, text) to authenticated;
grant execute on function public.cms_save_document(text, text, jsonb, text, integer) to authenticated;
grant execute on function public.cms_publish_document(text, text) to authenticated;
grant execute on function public.cms_unpublish_document(text, text) to authenticated;
grant execute on function public.cms_trash_document(text, text) to authenticated;
grant execute on function public.cms_restore_document(text, text) to authenticated;
grant execute on function public.cms_reorder_documents(text, jsonb) to authenticated;
grant execute on function public.cms_restore_revision(bigint) to authenticated;
