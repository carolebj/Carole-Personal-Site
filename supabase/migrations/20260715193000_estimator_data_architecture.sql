-- Project estimator and Client Brief data architecture.
--
-- This migration is additive. It does not import, alter, or delete legacy
-- design_brief_submissions. Future migration code can link a historical row
-- through brief_submissions.legacy_design_brief_submission_id.
--
-- Private estimator data is server-only. Browser roles do not receive direct
-- access to contacts, pricing, estimates, briefs, consent events, or deletion
-- logs. Published Client Brief template definitions are the only public rows.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists public.estimator_contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text generated always as (lower(btrim(email))) stored,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified', 'bounced')),
  verified_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_operational_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint estimator_contacts_email_length_check
    check (char_length(email_normalized) between 3 and 320),
  constraint estimator_contacts_email_shape_check
    check (email_normalized ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  constraint estimator_contacts_verified_at_check
    check (verification_status <> 'verified' or verified_at is not null),
  constraint estimator_contacts_email_normalized_key unique (email_normalized)
);

create index if not exists estimator_contacts_last_activity_idx
  on public.estimator_contacts (last_operational_activity_at);

create table if not exists public.estimator_pricing_models (
  id uuid primary key default gen_random_uuid(),
  model_key text not null default 'project-estimator',
  version integer not null check (version > 0),
  status text not null default 'draft'
    check (status in ('draft', 'validated', 'published', 'retired')),
  catalog jsonb not null,
  reference_scenarios jsonb not null default '[]'::jsonb,
  effective_from timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint estimator_pricing_models_catalog_object_check
    check (jsonb_typeof(catalog) = 'object'),
  constraint estimator_pricing_models_scenarios_array_check
    check (jsonb_typeof(reference_scenarios) = 'array'),
  constraint estimator_pricing_models_publication_check
    check (
      status <> 'published'
      or (effective_from is not null and published_at is not null)
    ),
  constraint estimator_pricing_models_key_version_key unique (model_key, version),
  constraint estimator_pricing_models_id_version_key unique (id, version)
);

create index if not exists estimator_pricing_models_active_idx
  on public.estimator_pricing_models (model_key, effective_from desc)
  where status = 'published';

create table if not exists public.estimator_exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency text not null check (currency in ('XOF', 'EUR', 'USD')),
  xof_per_unit numeric(18, 8) not null check (xof_per_unit > 0),
  source text not null check (btrim(source) <> ''),
  source_url text not null check (source_url ~ '^https://'),
  observed_on date not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'retired')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  constraint estimator_exchange_rates_xof_parity_check
    check (currency <> 'XOF' or xof_per_unit = 1),
  constraint estimator_exchange_rates_eur_parity_check
    check (currency <> 'EUR' or xof_per_unit = 655.957),
  constraint estimator_exchange_rates_bceao_source_check
    check (
      currency not in ('EUR', 'USD')
      or source_url ~ '^https://www[.]bceao[.]int/'
    ),
  constraint estimator_exchange_rates_publication_check
    check (status <> 'published' or published_at is not null),
  constraint estimator_exchange_rates_snapshot_key
    unique (currency, observed_on, source),
  constraint estimator_exchange_rates_id_snapshot_key
    unique (id, currency, xof_per_unit, source, source_url, observed_on)
);

create unique index if not exists estimator_exchange_rates_current_published_key
  on public.estimator_exchange_rates (currency)
  where status = 'published';
create index if not exists estimator_exchange_rates_published_lookup_idx
  on public.estimator_exchange_rates (currency, observed_on desc, published_at desc)
  where status = 'published';

create table if not exists public.project_estimates (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null,
  idempotency_key_hash text not null,
  contact_id uuid references public.estimator_contacts(id) on delete set null,
  pricing_model_id uuid not null,
  pricing_model_version integer not null,
  exchange_rate_snapshot_id uuid not null,
  services text[] not null,
  answers jsonb not null,
  breakdown jsonb not null,
  assumptions jsonb not null default '[]'::jsonb,
  result_status text not null check (result_status in ('estimated', 'manual-review')),
  amount_low_xof numeric(16, 2),
  amount_high_xof numeric(16, 2),
  display_currency text not null check (display_currency in ('XOF', 'EUR', 'USD')),
  display_rate_xof_per_unit numeric(18, 8) not null
    check (display_rate_xof_per_unit > 0),
  rate_source text not null check (btrim(rate_source) <> ''),
  rate_source_url text not null check (rate_source_url ~ '^https://'),
  rate_observed_on date not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 days'),
  constraint project_estimates_session_hash_check
    check (session_token_hash ~ '^[0-9a-f]{64}$'),
  constraint project_estimates_idempotency_hash_check
    check (idempotency_key_hash ~ '^[0-9a-f]{64}$'),
  constraint project_estimates_idempotency_key unique (idempotency_key_hash),
  constraint project_estimates_services_check
    check (cardinality(services) > 0),
  constraint project_estimates_answers_object_check
    check (jsonb_typeof(answers) = 'object'),
  constraint project_estimates_breakdown_object_check
    check (jsonb_typeof(breakdown) = 'object'),
  constraint project_estimates_assumptions_array_check
    check (jsonb_typeof(assumptions) = 'array'),
  constraint project_estimates_result_amounts_check
    check (
      (
        result_status = 'estimated'
        and amount_low_xof is not null
        and amount_high_xof is not null
        and amount_low_xof >= 0
        and amount_high_xof >= amount_low_xof
      )
      or (
        result_status = 'manual-review'
        and amount_low_xof is null
        and amount_high_xof is null
      )
    ),
  constraint project_estimates_xof_rate_check
    check (display_currency <> 'XOF' or display_rate_xof_per_unit = 1),
  constraint project_estimates_retention_check
    check (expires_at = created_at + interval '15 days'),
  constraint project_estimates_pricing_model_fkey
    foreign key (pricing_model_id, pricing_model_version)
    references public.estimator_pricing_models(id, version) on delete restrict,
  constraint project_estimates_exchange_rate_snapshot_fkey
    foreign key (
      exchange_rate_snapshot_id,
      display_currency,
      display_rate_xof_per_unit,
      rate_source,
      rate_source_url,
      rate_observed_on
    ) references public.estimator_exchange_rates (
      id,
      currency,
      xof_per_unit,
      source,
      source_url,
      observed_on
    ) on delete restrict
);

create index if not exists project_estimates_contact_id_idx
  on public.project_estimates (contact_id);
create index if not exists project_estimates_pricing_model_idx
  on public.project_estimates (pricing_model_id, pricing_model_version);
create index if not exists project_estimates_exchange_rate_idx
  on public.project_estimates (exchange_rate_snapshot_id);
create index if not exists project_estimates_session_idx
  on public.project_estimates (session_token_hash, created_at desc);
create index if not exists project_estimates_expiry_idx
  on public.project_estimates (expires_at, id);

create table if not exists public.estimator_api_rate_limits (
  scope_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  constraint estimator_api_rate_limits_scope_hash_check
    check (scope_hash ~ '^[0-9a-f]{64}$')
);

create index if not exists estimator_api_rate_limits_updated_at_idx
  on public.estimator_api_rate_limits (updated_at);

create table if not exists public.estimator_consent_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.estimator_contacts(id) on delete cascade,
  purpose text not null check (purpose in ('commercial_email')),
  action text not null check (action in ('granted', 'withdrawn')),
  notice_version text,
  source text not null check (btrim(source) <> ''),
  proof jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint estimator_consent_events_proof_object_check
    check (jsonb_typeof(proof) = 'object'),
  constraint estimator_consent_events_notice_check
    check (action <> 'granted' or btrim(coalesce(notice_version, '')) <> '')
);

create index if not exists estimator_consent_events_contact_idx
  on public.estimator_consent_events (contact_id, purpose, occurred_at desc, id desc);

create table if not exists public.estimator_contact_suppressions (
  id uuid primary key default gen_random_uuid(),
  email_sha256 text not null,
  reason text not null check (reason in ('withdrawn', 'objected', 'bounced', 'abuse')),
  source text not null check (btrim(source) <> ''),
  created_at timestamptz not null default now(),
  constraint estimator_contact_suppressions_hash_check
    check (email_sha256 ~ '^[0-9a-f]{64}$'),
  constraint estimator_contact_suppressions_email_key unique (email_sha256)
);

create table if not exists public.brief_templates (
  id uuid primary key default gen_random_uuid(),
  service_key text not null,
  status text not null default 'active' check (status in ('active', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brief_templates_service_key_format_check
    check (service_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint brief_templates_service_key_key unique (service_key)
);

create table if not exists public.brief_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.brief_templates(id) on delete restrict,
  version integer not null check (version > 0),
  locale text not null check (locale in ('fr', 'en')),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'retired')),
  definition jsonb not null,
  prefill_mapping jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  constraint brief_template_versions_definition_object_check
    check (jsonb_typeof(definition) = 'object'),
  constraint brief_template_versions_mapping_object_check
    check (jsonb_typeof(prefill_mapping) = 'object'),
  constraint brief_template_versions_publication_check
    check (status <> 'published' or published_at is not null),
  constraint brief_template_versions_template_version_locale_key
    unique (template_id, version, locale),
  constraint brief_template_versions_id_template_locale_key unique (id, template_id, locale)
);

create unique index if not exists brief_template_versions_current_idx
  on public.brief_template_versions (template_id, locale)
  where status = 'published';
create index if not exists brief_template_versions_template_idx
  on public.brief_template_versions (template_id, version desc);

create table if not exists public.brief_packages (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid references public.project_estimates(id) on delete set null,
  contact_id uuid references public.estimator_contacts(id) on delete set null,
  session_token_hash text not null,
  shared_profile jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brief_packages_session_hash_check
    check (session_token_hash ~ '^[0-9a-f]{64}$'),
  constraint brief_packages_shared_profile_object_check
    check (jsonb_typeof(shared_profile) = 'object')
);

create unique index if not exists brief_packages_estimate_key
  on public.brief_packages (estimate_id) where estimate_id is not null;
create index if not exists brief_packages_contact_id_idx
  on public.brief_packages (contact_id);
create index if not exists brief_packages_session_idx
  on public.brief_packages (session_token_hash, created_at desc);

create table if not exists public.brief_instances (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.brief_packages(id) on delete cascade,
  template_id uuid not null references public.brief_templates(id) on delete restrict,
  template_version_id uuid not null,
  locale text not null check (locale in ('fr', 'en')),
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'exported', 'submitted', 'archived')),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz,
  constraint brief_instances_answers_object_check
    check (jsonb_typeof(answers) = 'object'),
  constraint brief_instances_finalized_check
    check (status = 'draft' or finalized_at is not null),
  constraint brief_instances_template_version_fkey
    foreign key (template_version_id, template_id, locale)
    references public.brief_template_versions(id, template_id, locale) on delete restrict,
  constraint brief_instances_package_template_key unique (package_id, template_id)
);

create index if not exists brief_instances_package_id_idx
  on public.brief_instances (package_id);
create index if not exists brief_instances_template_id_idx
  on public.brief_instances (template_id);
create index if not exists brief_instances_template_version_idx
  on public.brief_instances (template_version_id, template_id);

create table if not exists public.brief_prefill_values (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.brief_instances(id) on delete cascade,
  source_estimate_id uuid references public.project_estimates(id) on delete set null,
  field_key text not null check (btrim(field_key) <> ''),
  source_kind text not null check (source_kind in ('estimate', 'shared_profile')),
  source_field_key text not null check (btrim(source_field_key) <> ''),
  prefill_value jsonb not null,
  was_modified boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brief_prefill_values_instance_field_key unique (instance_id, field_key)
);

create index if not exists brief_prefill_values_instance_id_idx
  on public.brief_prefill_values (instance_id);
create index if not exists brief_prefill_values_source_estimate_idx
  on public.brief_prefill_values (source_estimate_id);

create table if not exists public.brief_assets (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.brief_instances(id) on delete cascade,
  storage_bucket text not null default 'brief-assets',
  storage_path text not null check (btrim(storage_path) <> ''),
  original_filename text not null check (btrim(original_filename) <> ''),
  mime_type text not null check (btrim(mime_type) <> ''),
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint brief_assets_storage_object_key unique (storage_bucket, storage_path)
);

create index if not exists brief_assets_instance_id_idx
  on public.brief_assets (instance_id);
create index if not exists brief_assets_active_idx
  on public.brief_assets (instance_id, created_at desc) where deleted_at is null;

create table if not exists public.brief_exports (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.brief_instances(id) on delete restrict,
  contact_id uuid not null references public.estimator_contacts(id) on delete restrict,
  status text not null default 'requested'
    check (status in ('requested', 'generating', 'ready', 'delivered', 'expired', 'failed')),
  email_verified_at timestamptz not null,
  storage_bucket text,
  storage_path text,
  content_sha256 text,
  created_at timestamptz not null default now(),
  ready_at timestamptz,
  downloaded_at timestamptz,
  expires_at timestamptz,
  constraint brief_exports_hash_check
    check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$'),
  constraint brief_exports_storage_pair_check
    check ((storage_bucket is null) = (storage_path is null)),
  constraint brief_exports_ready_payload_check
    check (
      status not in ('ready', 'delivered', 'expired')
      or (storage_path is not null and ready_at is not null and expires_at is not null)
    ),
  constraint brief_exports_expiry_check
    check (expires_at is null or expires_at > created_at)
);

create index if not exists brief_exports_instance_id_idx
  on public.brief_exports (instance_id, created_at desc);
create index if not exists brief_exports_contact_id_idx
  on public.brief_exports (contact_id, created_at desc);
create index if not exists brief_exports_expiry_idx
  on public.brief_exports (expires_at, id)
  where status in ('ready', 'delivered');

create table if not exists public.brief_submissions (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid references public.brief_instances(id) on delete set null,
  contact_id uuid references public.estimator_contacts(id) on delete set null,
  legacy_design_brief_submission_id uuid
    references public.design_brief_submissions(id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'processed', 'archived')),
  payload jsonb not null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  processed_at timestamptz,
  archived_at timestamptz,
  constraint brief_submissions_payload_object_check
    check (jsonb_typeof(payload) = 'object'),
  constraint brief_submissions_legacy_key unique (legacy_design_brief_submission_id)
);

create index if not exists brief_submissions_instance_id_idx
  on public.brief_submissions (instance_id);
create index if not exists brief_submissions_contact_id_idx
  on public.brief_submissions (contact_id, submitted_at desc);
create index if not exists brief_submissions_status_idx
  on public.brief_submissions (status, submitted_at desc);

create table if not exists public.estimator_deletion_logs (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('project_estimate', 'brief_export')),
  entity_id uuid not null,
  reason text not null check (btrim(reason) <> ''),
  storage_cleanup_required boolean not null default false,
  storage_bucket text,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz not null default now(),
  constraint estimator_deletion_logs_storage_pair_check
    check ((storage_bucket is null) = (storage_path is null)),
  constraint estimator_deletion_logs_storage_cleanup_check
    check (not storage_cleanup_required or storage_path is not null),
  constraint estimator_deletion_logs_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists estimator_deletion_logs_entity_idx
  on public.estimator_deletion_logs (entity_type, entity_id);
create index if not exists estimator_deletion_logs_deleted_at_idx
  on public.estimator_deletion_logs (deleted_at desc);

create or replace function private.set_estimator_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists estimator_contacts_set_updated_at on public.estimator_contacts;
create trigger estimator_contacts_set_updated_at
before update on public.estimator_contacts
for each row execute function private.set_estimator_updated_at();

drop trigger if exists estimator_pricing_models_set_updated_at on public.estimator_pricing_models;
create trigger estimator_pricing_models_set_updated_at
before update on public.estimator_pricing_models
for each row execute function private.set_estimator_updated_at();

drop trigger if exists brief_templates_set_updated_at on public.brief_templates;
create trigger brief_templates_set_updated_at
before update on public.brief_templates
for each row execute function private.set_estimator_updated_at();

drop trigger if exists brief_packages_set_updated_at on public.brief_packages;
create trigger brief_packages_set_updated_at
before update on public.brief_packages
for each row execute function private.set_estimator_updated_at();

drop trigger if exists brief_instances_set_updated_at on public.brief_instances;
create trigger brief_instances_set_updated_at
before update on public.brief_instances
for each row execute function private.set_estimator_updated_at();

drop trigger if exists brief_prefill_values_set_updated_at on public.brief_prefill_values;
create trigger brief_prefill_values_set_updated_at
before update on public.brief_prefill_values
for each row execute function private.set_estimator_updated_at();

create or replace function public.upsert_estimator_contact(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id uuid;
begin
  if p_email is null or char_length(lower(btrim(p_email))) not between 3 and 320 then
    raise exception 'A valid email is required';
  end if;

  insert into public.estimator_contacts (email)
  values (btrim(p_email))
  on conflict (email_normalized) do update
    set email = excluded.email,
        last_seen_at = now(),
        last_operational_activity_at = now()
  returning id into saved_id;

  return saved_id;
end;
$$;

create or replace function public.record_project_estimate(
  p_session_token_hash text,
  p_idempotency_key_hash text,
  p_pricing_model_id uuid,
  p_pricing_model_version integer,
  p_exchange_rate_snapshot_id uuid,
  p_services text[],
  p_answers jsonb,
  p_breakdown jsonb,
  p_assumptions jsonb,
  p_result_status text,
  p_amount_low_xof numeric,
  p_amount_high_xof numeric,
  p_display_currency text,
  p_display_rate_xof_per_unit numeric,
  p_rate_source text,
  p_rate_source_url text,
  p_rate_observed_on date,
  p_contact_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id uuid;
  saved_expires_at timestamptz;
begin
  select estimate.id, estimate.expires_at
  into saved_id, saved_expires_at
  from public.project_estimates estimate
  where estimate.idempotency_key_hash = p_idempotency_key_hash;

  if saved_id is not null then
    return jsonb_build_object('id', saved_id, 'expires_at', saved_expires_at);
  end if;

  if not exists (
    select 1
    from public.estimator_pricing_models model
    where model.id = p_pricing_model_id
      and model.version = p_pricing_model_version
      and model.status = 'published'
      and model.effective_from <= now()
  ) then
    raise exception 'A published and effective pricing model is required';
  end if;

  if not exists (
    select 1
    from public.estimator_exchange_rates rate
    where rate.id = p_exchange_rate_snapshot_id
      and rate.currency = p_display_currency
      and rate.xof_per_unit = p_display_rate_xof_per_unit
      and rate.source = p_rate_source
      and rate.source_url = p_rate_source_url
      and rate.observed_on = p_rate_observed_on
      and rate.status = 'published'
      and (rate.currency <> 'USD' or rate.observed_on >= current_date - 7)
  ) then
    raise exception 'A matching published exchange-rate snapshot is required';
  end if;

  insert into public.project_estimates (
    session_token_hash,
    idempotency_key_hash,
    contact_id,
    pricing_model_id,
    pricing_model_version,
    exchange_rate_snapshot_id,
    services,
    answers,
    breakdown,
    assumptions,
    result_status,
    amount_low_xof,
    amount_high_xof,
    display_currency,
    display_rate_xof_per_unit,
    rate_source,
    rate_source_url,
    rate_observed_on
  ) values (
    p_session_token_hash,
    p_idempotency_key_hash,
    p_contact_id,
    p_pricing_model_id,
    p_pricing_model_version,
    p_exchange_rate_snapshot_id,
    p_services,
    p_answers,
    p_breakdown,
    coalesce(p_assumptions, '[]'::jsonb),
    p_result_status,
    p_amount_low_xof,
    p_amount_high_xof,
    p_display_currency,
    p_display_rate_xof_per_unit,
    p_rate_source,
    p_rate_source_url,
    p_rate_observed_on
  )
  on conflict (idempotency_key_hash) do nothing
  returning id, expires_at into saved_id, saved_expires_at;

  if saved_id is null then
    select estimate.id, estimate.expires_at
    into saved_id, saved_expires_at
    from public.project_estimates estimate
    where estimate.idempotency_key_hash = p_idempotency_key_hash;
  end if;

  return jsonb_build_object('id', saved_id, 'expires_at', saved_expires_at);
end;
$$;

create or replace function public.consume_estimator_rate_limit(
  p_scope_hash text,
  p_limit integer default 20,
  p_window_seconds integer default 600
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_count integer;
begin
  if p_scope_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'p_scope_hash must be a SHA-256 hex digest';
  end if;
  if p_limit < 1 or p_limit > 1000 then
    raise exception 'p_limit must be between 1 and 1000';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'p_window_seconds must be between 1 and 86400';
  end if;

  insert into public.estimator_api_rate_limits (
    scope_hash,
    window_started_at,
    request_count,
    updated_at
  ) values (
    p_scope_hash,
    now(),
    1,
    now()
  )
  on conflict (scope_hash) do update
  set window_started_at = case
        when estimator_api_rate_limits.window_started_at
          + make_interval(secs => p_window_seconds) <= now()
        then now()
        else estimator_api_rate_limits.window_started_at
      end,
      request_count = case
        when estimator_api_rate_limits.window_started_at
          + make_interval(secs => p_window_seconds) <= now()
        then 1
        else least(estimator_api_rate_limits.request_count + 1, p_limit + 1)
      end,
      updated_at = now()
  returning request_count into next_count;

  return next_count <= p_limit;
end;
$$;

create or replace function public.purge_expired_project_estimates(p_limit integer default 500)
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
    select estimate.id
    from public.project_estimates estimate
    where estimate.expires_at <= now()
    order by estimate.expires_at, estimate.id
    for update skip locked
    limit p_limit
  ), logged as (
    insert into public.estimator_deletion_logs (
      entity_type,
      entity_id,
      reason,
      metadata
    )
    select
      'project_estimate',
      expired.id,
      'retention_expired',
      jsonb_build_object('retention_days', 15)
    from expired
    returning entity_id
  ), deleted as (
    delete from public.project_estimates estimate
    using logged
    where estimate.id = logged.entity_id
    returning estimate.id
  )
  select count(*)::integer into deleted_count from deleted;

  return deleted_count;
end;
$$;

create or replace function public.purge_estimator_rate_limits(
  p_before timestamptz default (now() - interval '1 day'),
  p_limit integer default 1000
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  if p_before > now() then
    raise exception 'p_before cannot be in the future';
  end if;
  if p_limit < 1 or p_limit > 5000 then
    raise exception 'p_limit must be between 1 and 5000';
  end if;

  with stale as (
    select rate_limit.scope_hash
    from public.estimator_api_rate_limits rate_limit
    where rate_limit.updated_at < p_before
    order by rate_limit.updated_at, rate_limit.scope_hash
    for update skip locked
    limit p_limit
  ), deleted as (
    delete from public.estimator_api_rate_limits rate_limit
    using stale
    where rate_limit.scope_hash = stale.scope_hash
    returning rate_limit.scope_hash
  )
  select count(*)::integer into deleted_count from deleted;

  return deleted_count;
end;
$$;

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
    where export.expires_at <= now()
      and export.status in ('ready', 'delivered', 'expired')
    order by export.expires_at, export.id
    for update skip locked
    limit p_limit
  ), logged as (
    insert into public.estimator_deletion_logs (
      entity_type,
      entity_id,
      reason,
      storage_cleanup_required,
      storage_bucket,
      storage_path
    )
    select
      'brief_export',
      expired.id,
      'export_expired',
      expired.storage_path is not null,
      expired.storage_bucket,
      expired.storage_path
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

create or replace function public.publish_estimator_pricing_model(
  p_model_key text,
  p_catalog jsonb,
  p_reference_scenarios jsonb,
  p_effective_from timestamptz,
  p_rates jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_version integer;
  published_at timestamptz := now();
  rate jsonb;
  public_model_version text;
begin
  if btrim(coalesce(p_model_key, '')) = '' then
    raise exception 'p_model_key is required';
  end if;
  if jsonb_typeof(p_catalog) <> 'object' then
    raise exception 'p_catalog must be a JSON object';
  end if;
  if jsonb_typeof(p_reference_scenarios) <> 'array' then
    raise exception 'p_reference_scenarios must be a JSON array';
  end if;
  if p_effective_from is null then
    raise exception 'p_effective_from is required';
  end if;
  if jsonb_typeof(p_rates) <> 'array' or jsonb_array_length(p_rates) <> 3 then
    raise exception 'p_rates must contain the XOF, EUR and USD snapshots';
  end if;
  if (
    select count(distinct item.value ->> 'currency')
    from jsonb_array_elements(p_rates) item(value)
  ) <> 3 then
    raise exception 'p_rates must contain three distinct currencies';
  end if;

  public_model_version := nullif(btrim(p_catalog ->> 'modelVersion'), '');
  if public_model_version is null then
    raise exception 'catalog.modelVersion is required';
  end if;

  -- One model key is published at a time. Every statement in this function is
  -- part of the same database transaction, so a failure restores the previous
  -- published model and exchange-rate snapshot.
  perform pg_advisory_xact_lock(hashtextextended(p_model_key, 0));

  if exists (
    select 1
    from public.estimator_pricing_models model
    where model.model_key = p_model_key
      and model.catalog ->> 'modelVersion' = public_model_version
  ) then
    raise exception 'catalog.modelVersion % has already been published', public_model_version;
  end if;

  select coalesce(max(model.version), 0) + 1
  into next_version
  from public.estimator_pricing_models model
  where model.model_key = p_model_key;

  update public.estimator_exchange_rates
  set status = 'retired'
  where status = 'published';

  for rate in
    select item.value
    from jsonb_array_elements(p_rates) item(value)
  loop
    insert into public.estimator_exchange_rates (
      currency,
      xof_per_unit,
      source,
      source_url,
      observed_on,
      status,
      published_at
    ) values (
      rate ->> 'currency',
      (rate ->> 'xof_per_unit')::numeric,
      rate ->> 'source',
      rate ->> 'source_url',
      (rate ->> 'observed_on')::date,
      'published',
      published_at
    )
    on conflict on constraint estimator_exchange_rates_snapshot_key
    do update set
      xof_per_unit = excluded.xof_per_unit,
      source_url = excluded.source_url,
      status = 'published',
      published_at = excluded.published_at;
  end loop;

  insert into public.estimator_pricing_models (
    model_key,
    version,
    status,
    catalog,
    reference_scenarios,
    effective_from,
    published_at
  ) values (
    p_model_key,
    next_version,
    'published',
    p_catalog,
    p_reference_scenarios,
    p_effective_from,
    published_at
  );

  return jsonb_build_object(
    'version', next_version,
    'model_version', public_model_version,
    'published_at', published_at
  );
end;
$$;

-- RLS is mandatory even though application access is server-only.
alter table public.estimator_contacts enable row level security;
alter table public.estimator_contacts force row level security;
alter table public.estimator_pricing_models enable row level security;
alter table public.estimator_pricing_models force row level security;
alter table public.estimator_exchange_rates enable row level security;
alter table public.estimator_exchange_rates force row level security;
alter table public.project_estimates enable row level security;
alter table public.project_estimates force row level security;
alter table public.estimator_api_rate_limits enable row level security;
alter table public.estimator_api_rate_limits force row level security;
alter table public.estimator_consent_events enable row level security;
alter table public.estimator_consent_events force row level security;
alter table public.estimator_contact_suppressions enable row level security;
alter table public.estimator_contact_suppressions force row level security;
alter table public.brief_templates enable row level security;
alter table public.brief_templates force row level security;
alter table public.brief_template_versions enable row level security;
alter table public.brief_template_versions force row level security;
alter table public.brief_packages enable row level security;
alter table public.brief_packages force row level security;
alter table public.brief_instances enable row level security;
alter table public.brief_instances force row level security;
alter table public.brief_prefill_values enable row level security;
alter table public.brief_prefill_values force row level security;
alter table public.brief_assets enable row level security;
alter table public.brief_assets force row level security;
alter table public.brief_exports enable row level security;
alter table public.brief_exports force row level security;
alter table public.brief_submissions enable row level security;
alter table public.brief_submissions force row level security;
alter table public.estimator_deletion_logs enable row level security;
alter table public.estimator_deletion_logs force row level security;

drop policy if exists "published brief templates are public" on public.brief_templates;
create policy "published brief templates are public"
  on public.brief_templates for select to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1
      from public.brief_template_versions version
      where version.template_id = brief_templates.id
        and version.status = 'published'
    )
  );

drop policy if exists "published brief template versions are public" on public.brief_template_versions;
create policy "published brief template versions are public"
  on public.brief_template_versions for select to anon, authenticated
  using (status = 'published' and published_at is not null);

revoke all on table public.estimator_contacts from public, anon, authenticated;
revoke all on table public.estimator_pricing_models from public, anon, authenticated;
revoke all on table public.estimator_exchange_rates from public, anon, authenticated;
revoke all on table public.project_estimates from public, anon, authenticated;
revoke all on table public.estimator_api_rate_limits from public, anon, authenticated;
revoke all on table public.estimator_consent_events from public, anon, authenticated;
revoke all on table public.estimator_contact_suppressions from public, anon, authenticated;
revoke all on table public.brief_templates from public, anon, authenticated;
revoke all on table public.brief_template_versions from public, anon, authenticated;
revoke all on table public.brief_packages from public, anon, authenticated;
revoke all on table public.brief_instances from public, anon, authenticated;
revoke all on table public.brief_prefill_values from public, anon, authenticated;
revoke all on table public.brief_assets from public, anon, authenticated;
revoke all on table public.brief_exports from public, anon, authenticated;
revoke all on table public.brief_submissions from public, anon, authenticated;
revoke all on table public.estimator_deletion_logs from public, anon, authenticated;

grant select on table public.brief_templates to anon, authenticated;
grant select on table public.brief_template_versions to anon, authenticated;

grant select, insert, update on table public.estimator_contacts to service_role;
grant select, insert, update, delete on table public.estimator_pricing_models to service_role;
grant select, insert, update, delete on table public.estimator_exchange_rates to service_role;
grant select on table public.project_estimates to service_role;
grant select on table public.estimator_api_rate_limits to service_role;
grant select, insert on table public.estimator_consent_events to service_role;
grant select, insert, update on table public.estimator_contact_suppressions to service_role;
grant select, insert, update, delete on table public.brief_templates to service_role;
grant select, insert, update, delete on table public.brief_template_versions to service_role;
grant select, insert, update, delete on table public.brief_packages to service_role;
grant select, insert, update, delete on table public.brief_instances to service_role;
grant select, insert, update, delete on table public.brief_prefill_values to service_role;
grant select, insert, update, delete on table public.brief_assets to service_role;
grant select, insert, update, delete on table public.brief_exports to service_role;
grant select, insert, update, delete on table public.brief_submissions to service_role;
grant select, insert on table public.estimator_deletion_logs to service_role;
grant usage, select on sequence public.estimator_deletion_logs_id_seq to service_role;

revoke execute on function private.set_estimator_updated_at() from public, anon, authenticated;
revoke execute on function public.upsert_estimator_contact(text) from public, anon, authenticated;
revoke execute on function public.record_project_estimate(
  text, text, uuid, integer, uuid, text[], jsonb, jsonb, jsonb, text, numeric,
  numeric, text, numeric, text, text, date, uuid
) from public, anon, authenticated;
revoke execute on function public.consume_estimator_rate_limit(text, integer, integer)
  from public, anon, authenticated;
revoke execute on function public.purge_expired_project_estimates(integer)
  from public, anon, authenticated;
revoke execute on function public.purge_estimator_rate_limits(timestamptz, integer)
  from public, anon, authenticated;
revoke execute on function public.purge_expired_brief_exports(integer)
  from public, anon, authenticated;
revoke execute on function public.publish_estimator_pricing_model(
  text, jsonb, jsonb, timestamptz, jsonb
) from public, anon, authenticated;

grant execute on function public.upsert_estimator_contact(text) to service_role;
grant execute on function public.record_project_estimate(
  text, text, uuid, integer, uuid, text[], jsonb, jsonb, jsonb, text, numeric,
  numeric, text, numeric, text, text, date, uuid
) to service_role;
grant execute on function public.consume_estimator_rate_limit(text, integer, integer)
  to service_role;
grant execute on function public.purge_expired_project_estimates(integer) to service_role;
grant execute on function public.purge_estimator_rate_limits(timestamptz, integer)
  to service_role;
grant execute on function public.purge_expired_brief_exports(integer) to service_role;
grant execute on function public.publish_estimator_pricing_model(
  text, jsonb, jsonb, timestamptz, jsonb
) to service_role;

comment on function public.purge_expired_project_estimates(integer) is
  'Cron-ready server-only purge. Deletes detailed estimates exactly after the 15-day retention window and records a non-personal audit entry.';
comment on function public.purge_estimator_rate_limits(timestamptz, integer) is
  'Cron-ready server-only purge for hashed rate-limit scopes whose rolling window is no longer operationally useful.';
comment on function public.purge_expired_brief_exports(integer) is
  'Cron-ready server-only metadata purge. Storage paths are queued in estimator_deletion_logs for deletion through the Storage API.';
comment on function public.publish_estimator_pricing_model(
  text, jsonb, jsonb, timestamptz, jsonb
) is 'Atomically publishes one versioned estimator catalog and its XOF, EUR and USD exchange-rate snapshot.';
