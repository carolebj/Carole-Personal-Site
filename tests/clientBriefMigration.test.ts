import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sql = (await readFile(new URL("../supabase/migrations/20260715233000_client_brief_workflow.sql", import.meta.url), "utf8")).replace(/\s+/g, " ");
const retentionSql = (await readFile(new URL("../supabase/migrations/20260716001000_client_brief_retention_cleanup.sql", import.meta.url), "utf8")).replace(/\s+/g, " ");
const integritySql = (await readFile(new URL("../supabase/migrations/20260716013000_client_brief_integrity.sql", import.meta.url), "utf8")).replace(/\s+/g, " ");

test("Client Brief workflow keeps OTP and PDF objects private", () => {
  assert.match(sql, /create table if not exists public\.brief_email_challenges/);
  assert.match(sql, /alter table public\.brief_email_challenges force row level security/);
  assert.match(sql, /revoke all on table public\.brief_email_challenges from public, anon, authenticated/);
  assert.match(sql, /'brief-exports', 'brief-exports', false/);
  assert.match(sql, /using \(false\)/);
  assert.doesNotMatch(sql, /grant (select|insert|update|delete) on table public\.brief_email_challenges to (anon|authenticated)/);
  assert.match(sql, /create or replace function public\.publish_client_brief_template/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /grant execute on function public\.publish_client_brief_template\(text, integer, text, jsonb, jsonb\) to service_role/);
});

test("Client Brief integrity migration makes OTP, submissions, dashboard and versions robust", () => {
  assert.match(integritySql, /consume_client_brief_email_challenge/);
  assert.match(integritySql, /for update/);
  assert.match(integritySql, /brief_submissions_idempotency_key unique/);
  assert.match(integritySql, /Client briefs authenticated read/);
  assert.match(integritySql, /purge_abandoned_brief_packages/);
  assert.match(integritySql, /Published Client Brief versions are immutable/);
  assert.match(integritySql, /drop policy if exists "brief assets public upload"/);
});

test("expired codes and physical PDF cleanup are part of the retention chain", () => {
  assert.match(retentionSql, /purge_expired_brief_email_challenges/);
  assert.match(retentionSql, /storage_cleaned_at/);
  assert.match(retentionSql, /grant update on table public\.estimator_deletion_logs to service_role/);
});

test("all five stable service identities are seeded without replacing historical design briefs", () => {
  for (const serviceKey of ["editorial-strategy", "digital-communication", "content-creation", "audit-advice", "visual-identity"]) assert.match(sql, new RegExp(`'${serviceKey}'`));
  assert.doesNotMatch(sql, /delete from public\.design_brief_submissions/i);
  assert.doesNotMatch(sql, /alter table public\.design_brief_submissions/i);
});
