-- Integrity and operational completion for Client Briefs: immutable template
-- versions, atomic OTP consumption, idempotent submissions, authenticated
-- dashboard access and bounded cleanup of abandoned drafts/assets.

alter table public.brief_email_challenges
  add column if not exists brief_payload jsonb not null default '{}'::jsonb;
alter table public.brief_email_challenges
  drop constraint if exists brief_email_challenges_payload_object_check;
alter table public.brief_email_challenges
  add constraint brief_email_challenges_payload_object_check
  check (jsonb_typeof(brief_payload) = 'object');

alter table public.brief_exports
  add column if not exists challenge_id uuid
  references public.brief_email_challenges(id) on delete set null;
create unique index if not exists brief_exports_challenge_key
  on public.brief_exports (challenge_id) where challenge_id is not null;

alter table public.brief_submissions
  add column if not exists idempotency_key_hash text,
  add column if not exists notification_claimed_at timestamptz,
  add column if not exists notification_sent_at timestamptz,
  add column if not exists notification_error text;
alter table public.brief_submissions
  drop constraint if exists brief_submissions_idempotency_hash_check;
alter table public.brief_submissions
  add constraint brief_submissions_idempotency_hash_check
  check (idempotency_key_hash is null or idempotency_key_hash ~ '^[0-9a-f]{64}$');
alter table public.brief_submissions
  drop constraint if exists brief_submissions_idempotency_key;
alter table public.brief_submissions
  add constraint brief_submissions_idempotency_key unique (idempotency_key_hash);

drop policy if exists "Client briefs authenticated read" on public.brief_submissions;
create policy "Client briefs authenticated read"
  on public.brief_submissions for select to authenticated
  using ((select auth.uid()) is not null);
drop policy if exists "Client briefs authenticated update" on public.brief_submissions;
create policy "Client briefs authenticated update"
  on public.brief_submissions for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);
grant select, update on table public.brief_submissions to authenticated;

drop policy if exists "brief assets public upload" on storage.objects;

alter table public.brief_instances
  drop constraint if exists brief_instances_package_template_key;
create unique index if not exists brief_instances_package_template_version_locale_key
  on public.brief_instances (package_id, template_id, template_version_id, locale);

alter table public.estimator_deletion_logs
  drop constraint if exists estimator_deletion_logs_entity_type_check;
alter table public.estimator_deletion_logs
  add constraint estimator_deletion_logs_entity_type_check
  check (entity_type in ('project_estimate', 'brief_export', 'brief_asset'));

create or replace function public.consume_client_brief_email_challenge(
  p_challenge_id uuid,
  p_session_token_hash text,
  p_code_hash text
) returns table (
  instance_id uuid,
  email_normalized text,
  contact_name text,
  commercial_consent boolean,
  brief_payload jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  challenge public.brief_email_challenges%rowtype;
begin
  select * into challenge
  from public.brief_email_challenges
  where id = p_challenge_id
  for update;

  if challenge.id is null then return; end if;
  if challenge.consumed_at is not null or challenge.expires_at <= now()
    or challenge.attempts >= 6
    or challenge.session_token_hash <> p_session_token_hash
    or challenge.code_hash <> p_code_hash then
    update public.brief_email_challenges
    set attempts = least(attempts + 1, 8)
    where id = p_challenge_id and attempts < 8;
    return;
  end if;

  update public.brief_email_challenges
  set consumed_at = now()
  where id = p_challenge_id;

  return query select challenge.instance_id, challenge.email_normalized,
    challenge.contact_name, challenge.commercial_consent, challenge.brief_payload;
end;
$$;

revoke execute on function public.consume_client_brief_email_challenge(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.consume_client_brief_email_challenge(uuid, text, text)
  to service_role;

create or replace function public.purge_abandoned_brief_packages(
  p_limit integer default 500
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  if p_limit < 1 or p_limit > 5000 then
    raise exception 'p_limit must be between 1 and 5000';
  end if;

  with stale as (
    select package.id
    from public.brief_packages package
    where package.updated_at < now() - interval '30 days'
      and not exists (
        select 1 from public.brief_instances instance
        join public.brief_submissions submission on submission.instance_id = instance.id
        where instance.package_id = package.id
      )
      and not exists (
        select 1 from public.brief_instances instance
        join public.brief_exports export on export.instance_id = instance.id
        where instance.package_id = package.id and export.status in ('ready', 'delivered')
      )
    order by package.updated_at, package.id
    for update skip locked
    limit p_limit
  ), logged_assets as (
    insert into public.estimator_deletion_logs (
      entity_type, entity_id, reason, storage_cleanup_required, storage_bucket, storage_path
    )
    select 'brief_asset', asset.id, 'abandoned_brief', true,
      asset.storage_bucket, asset.storage_path
    from public.brief_assets asset
    join public.brief_instances instance on instance.id = asset.instance_id
    join stale on stale.id = instance.package_id
    where asset.deleted_at is null
    returning entity_id
  ), deleted as (
    delete from public.brief_packages package
    using stale
    where package.id = stale.id
    returning package.id
  )
  select count(*)::integer into deleted_count from deleted;

  return deleted_count;
end;
$$;

revoke execute on function public.purge_abandoned_brief_packages(integer)
  from public, anon, authenticated;
grant execute on function public.purge_abandoned_brief_packages(integer)
  to service_role;

create or replace function public.purge_expired_brief_exports(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  if p_limit < 1 or p_limit > 5000 then
    raise exception 'p_limit must be between 1 and 5000';
  end if;

  with expired as (
    select export.id, export.storage_bucket, export.storage_path
    from public.brief_exports export
    where (
      export.expires_at <= now() and export.status in ('ready', 'delivered', 'expired')
    ) or (
      export.created_at < now() - interval '1 day' and export.status in ('generating', 'failed')
    )
    order by coalesce(export.expires_at, export.created_at), export.id
    for update skip locked
    limit p_limit
  ), logged as (
    insert into public.estimator_deletion_logs (
      entity_type, entity_id, reason, storage_cleanup_required, storage_bucket, storage_path
    )
    select 'brief_export', expired.id, 'export_expired_or_failed',
      expired.storage_path is not null, expired.storage_bucket, expired.storage_path
    from expired
    returning entity_id
  ), deleted as (
    delete from public.brief_exports export
    using logged
    where export.id = logged.entity_id
    returning export.id
  )
  select count(*)::integer into deleted_count from deleted;

  return deleted_count;
end;
$$;

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
  saved_version public.brief_template_versions%rowtype;
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

  select * into saved_version
  from public.brief_template_versions
  where template_id = saved_template_id and version = p_version and locale = p_locale;

  if saved_version.id is not null then
    if saved_version.definition <> p_definition or saved_version.prefill_mapping <> p_prefill_mapping then
      raise exception 'Published Client Brief versions are immutable; increment the version';
    end if;
    saved_version_id := saved_version.id;
  else
    insert into public.brief_template_versions (
      template_id, version, locale, status, definition, prefill_mapping, published_at
    ) values (
      saved_template_id, p_version, p_locale, 'draft', p_definition, p_prefill_mapping, null
    ) returning id into saved_version_id;
  end if;

  update public.brief_template_versions
  set status = 'retired'
  where template_id = saved_template_id and locale = p_locale
    and status = 'published' and id <> saved_version_id;

  update public.brief_template_versions
  set status = 'published', published_at = coalesce(published_at, now())
  where id = saved_version_id;

  return saved_version_id;
end;
$$;

revoke execute on function public.publish_client_brief_template(text, integer, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.publish_client_brief_template(text, integer, text, jsonb, jsonb)
  to service_role;
