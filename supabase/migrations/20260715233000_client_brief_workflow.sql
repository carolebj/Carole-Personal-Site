-- Client Brief operational workflow: version publication support, one-time
-- email challenges and private PDF storage. All operational rows remain
-- server-only; no browser role receives direct access.

create table if not exists public.brief_email_challenges (
  id uuid primary key,
  instance_id uuid not null references public.brief_instances(id) on delete cascade,
  email_normalized text not null,
  email_sha256 text not null,
  session_token_hash text not null,
  code_hash text not null,
  contact_name text,
  commercial_consent boolean not null default false,
  attempts integer not null default 0 check (attempts between 0 and 8),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint brief_email_challenges_email_shape_check
    check (email_normalized ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  constraint brief_email_challenges_email_hash_check check (email_sha256 ~ '^[0-9a-f]{64}$'),
  constraint brief_email_challenges_session_hash_check check (session_token_hash ~ '^[0-9a-f]{64}$'),
  constraint brief_email_challenges_code_hash_check check (code_hash ~ '^[0-9a-f]{64}$'),
  constraint brief_email_challenges_expiry_check check (expires_at > created_at)
);

create index if not exists brief_email_challenges_instance_idx
  on public.brief_email_challenges (instance_id, created_at desc);
create index if not exists brief_email_challenges_expiry_idx
  on public.brief_email_challenges (expires_at) where consumed_at is null;

alter table public.brief_email_challenges enable row level security;
alter table public.brief_email_challenges force row level security;
revoke all on table public.brief_email_challenges from public, anon, authenticated;
grant select, insert, update, delete on table public.brief_email_challenges to service_role;

-- Create the stable service identities. Full bilingual definitions are
-- published from shared/client-brief-contract.js with npm run briefs:publish.
insert into public.brief_templates (service_key, status)
values
  ('editorial-strategy', 'active'),
  ('digital-communication', 'active'),
  ('content-creation', 'active'),
  ('audit-advice', 'active'),
  ('visual-identity', 'active')
on conflict (service_key) do update set status = 'active';

create or replace function public.publish_client_brief_template(
  p_service_key text,
  p_version integer,
  p_locale text,
  p_definition jsonb,
  p_prefill_mapping jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_template_id uuid;
  saved_version_id uuid;
begin
  if p_service_key is null or p_service_key !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or p_version < 1 or p_locale not in ('fr', 'en')
    or jsonb_typeof(p_definition) <> 'object'
    or jsonb_typeof(p_prefill_mapping) <> 'object' then
    raise exception 'Invalid Client Brief template publication';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('client-brief:' || p_service_key || ':' || p_locale, 0));
  insert into public.brief_templates (service_key, status)
  values (p_service_key, 'active')
  on conflict (service_key) do update set status = 'active'
  returning id into saved_template_id;

  update public.brief_template_versions
  set status = 'retired'
  where template_id = saved_template_id and locale = p_locale and status = 'published';

  insert into public.brief_template_versions (
    template_id, version, locale, status, definition, prefill_mapping, published_at
  ) values (
    saved_template_id, p_version, p_locale, 'published', p_definition, p_prefill_mapping, now()
  )
  on conflict (template_id, version, locale) do update
  set status = 'published',
      definition = excluded.definition,
      prefill_mapping = excluded.prefill_mapping,
      published_at = now()
  returning id into saved_version_id;

  return saved_version_id;
end;
$$;

revoke execute on function public.publish_client_brief_template(text, integer, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.publish_client_brief_template(text, integer, text, jsonb, jsonb)
  to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brief-exports', 'brief-exports', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- service_role bypasses storage RLS. Explicitly prevent public/authenticated
-- object access; PDF delivery always uses a short-lived signed URL.
drop policy if exists "Public brief exports are forbidden" on storage.objects;
create policy "Public brief exports are forbidden"
  on storage.objects for select to anon, authenticated
  using (false);
