import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/20260715193000_estimator_data_architecture.sql",
  import.meta.url,
);
const sql = (await readFile(migrationUrl, "utf8")).replace(/\s+/g, " ");

const privateTables = [
  "estimator_contacts",
  "estimator_pricing_models",
  "estimator_exchange_rates",
  "project_estimates",
  "estimator_api_rate_limits",
  "estimator_consent_events",
  "estimator_contact_suppressions",
  "brief_packages",
  "brief_instances",
  "brief_prefill_values",
  "brief_assets",
  "brief_exports",
  "brief_submissions",
  "estimator_deletion_logs",
] as const;

const serviceRoleGrants: Record<(typeof privateTables)[number], string> = {
  estimator_contacts: "select, insert, update",
  estimator_pricing_models: "select, insert, update, delete",
  estimator_exchange_rates: "select, insert, update, delete",
  project_estimates: "select",
  estimator_api_rate_limits: "select",
  estimator_consent_events: "select, insert",
  estimator_contact_suppressions: "select, insert, update",
  brief_packages: "select, insert, update, delete",
  brief_instances: "select, insert, update, delete",
  brief_prefill_values: "select, insert, update, delete",
  brief_assets: "select, insert, update, delete",
  brief_exports: "select, insert, update, delete",
  brief_submissions: "select, insert, update, delete",
  estimator_deletion_logs: "select, insert",
};

test("the estimator migration creates the complete additive data model", () => {
  for (const table of ["brief_templates", "brief_template_versions", ...privateTables]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table} \\(`));
  }

  assert.doesNotMatch(sql, /drop table/i);
  assert.doesNotMatch(sql, /alter table public\.design_brief_submissions/i);
  assert.match(sql, /legacy_design_brief_submission_id uuid references public\.design_brief_submissions\(id\)/);
});

test("contacts are deduplicated while estimates remain separate and expire after exactly 15 days", () => {
  assert.match(
    sql,
    /email_normalized text generated always as \(lower\(btrim\(email\)\)\) stored/,
  );
  assert.match(sql, /unique \(email_normalized\)/);
  assert.doesNotMatch(sql, /unique \(contact_id\)/);
  assert.match(sql, /expires_at = created_at \+ interval '15 days'/);
  assert.match(sql, /result_status text not null check \(result_status in \('estimated', 'manual-review'\)\)/);
  assert.match(
    sql,
    /result_status = 'manual-review' and amount_low_xof is null and amount_high_xof is null/,
  );
  assert.match(
    sql,
    /result_status = 'estimated' and amount_low_xof is not null and amount_high_xof is not null/,
  );
  assert.match(sql, /create index if not exists project_estimates_expiry_idx/);
  assert.match(sql, /create or replace function public\.purge_expired_project_estimates/);
  assert.match(sql, /for update skip locked/);
  assert.match(sql, /'project_estimate', expired\.id, 'retention_expired'/);
});

test("pricing models and exchange-rate snapshots are private, versioned, and frozen on estimates", () => {
  assert.match(sql, /model_key text not null default 'project-estimator'/);
  assert.match(sql, /catalog jsonb not null/);
  assert.match(sql, /version integer not null check \(version > 0\)/);
  assert.match(sql, /effective_from timestamptz/);
  assert.match(sql, /currency text not null check \(currency in \('XOF', 'EUR', 'USD'\)\)/);
  assert.match(sql, /currency <> 'EUR' or xof_per_unit = 655\.957/);
  assert.match(sql, /source_url text not null check \(source_url ~ '\^https:\/\/'\)/);
  assert.match(sql, /create unique index if not exists estimator_exchange_rates_current_published_key/);
  assert.match(sql, /project_estimates_pricing_model_fkey/);
  assert.match(sql, /project_estimates_exchange_rate_snapshot_fkey/);
  assert.match(sql, /A published and effective pricing model is required/);
  assert.match(sql, /A matching published exchange-rate snapshot is required/);
  assert.match(sql, /rate\.observed_on >= current_date - 7/);
});

test("all private tables force RLS and grant browser roles no direct access", () => {
  for (const table of privateTables) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(sql, new RegExp(`alter table public\\.${table} force row level security`));
    assert.match(
      sql,
      new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`),
    );
    assert.match(
      sql,
      new RegExp(
        `grant ${serviceRoleGrants[table]} on table public\\.${table} to service_role`,
      ),
    );
  }

  assert.doesNotMatch(sql, /grant (select|insert|update|delete).*project_estimates to (anon|authenticated)/);
  assert.match(sql, /grant select on table public\.brief_templates to anon, authenticated/);
  assert.match(sql, /grant select on table public\.brief_template_versions to anon, authenticated/);
  assert.match(sql, /using \(status = 'published' and published_at is not null\)/);
});

test("server RPCs and purge functions are callable only with the service role", () => {
  for (const functionName of [
    "upsert_estimator_contact",
    "record_project_estimate",
    "publish_estimator_pricing_model",
    "purge_expired_project_estimates",
    "purge_estimator_rate_limits",
    "purge_expired_brief_exports",
  ]) {
    assert.match(sql, new RegExp(`create or replace function public\\.${functionName}\\(`));
    assert.match(sql, new RegExp(`grant execute on function public\\.${functionName}\\(`));
  }

  assert.match(
    sql,
    /revoke execute on function public\.record_project_estimate\([^)]+\) from public, anon, authenticated/,
  );
  assert.match(
    sql,
    /grant execute on function public\.record_project_estimate\([^)]+\) to service_role/,
  );
  assert.match(sql, /idempotency_key_hash text not null/);
  assert.match(sql, /unique \(idempotency_key_hash\)/);
  assert.match(sql, /on conflict \(idempotency_key_hash\) do nothing/);
  assert.match(sql, /return jsonb_build_object\('id', saved_id, 'expires_at', saved_expires_at\)/);
  assert.match(sql, /create or replace function public\.consume_estimator_rate_limit\(/);
  assert.match(
    sql,
    /grant execute on function public\.consume_estimator_rate_limit\(text, integer, integer\) to service_role/,
  );
  assert.match(sql, /perform pg_advisory_xact_lock\(hashtextextended\(p_model_key, 0\)\)/);
  assert.match(sql, /model\.catalog ->> 'modelVersion' = public_model_version/);
  assert.match(sql, /on conflict on constraint estimator_exchange_rates_snapshot_key do update set/);
  assert.match(
    sql,
    /grant execute on function public\.publish_estimator_pricing_model\( text, jsonb, jsonb, timestamptz, jsonb \) to service_role/,
  );
  assert.match(
    sql,
    /revoke execute on function public\.publish_estimator_pricing_model\( text, jsonb, jsonb, timestamptz, jsonb \) from public, anon, authenticated/,
  );
  assert.match(sql, /create or replace function public\.purge_estimator_rate_limits\(/);
  assert.match(
    sql,
    /grant execute on function public\.purge_estimator_rate_limits\(timestamptz, integer\) to service_role/,
  );
  assert.match(sql, /security definer set search_path = ''/);
});

test("foreign-key and retention access paths are indexed", () => {
  for (const indexName of [
    "project_estimates_contact_id_idx",
    "project_estimates_pricing_model_idx",
    "project_estimates_exchange_rate_idx",
    "estimator_consent_events_contact_idx",
    "brief_packages_contact_id_idx",
    "brief_instances_package_id_idx",
    "brief_instances_template_version_idx",
    "brief_prefill_values_source_estimate_idx",
    "brief_assets_instance_id_idx",
    "brief_exports_contact_id_idx",
    "brief_submissions_instance_id_idx",
    "brief_submissions_contact_id_idx",
  ]) {
    assert.match(sql, new RegExp(`create (unique )?index if not exists ${indexName}`));
  }

  assert.match(sql, /storage_cleanup_required boolean not null default false/);
  assert.match(sql, /jsonb_build_object\('retention_days', 15\)/);
});
