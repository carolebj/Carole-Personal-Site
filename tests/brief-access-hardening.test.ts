// @ts-nocheck
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/20260812190000_harden_brief_data_access.sql", import.meta.url),
  "utf8",
);

test("brief data hardening resets public roles before restoring only required dashboard access", () => {
  for (const table of ["brief_submissions", "design_brief_submissions"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} force row level security`, "i"));
    assert.match(
      migration,
      new RegExp(
        `revoke all privileges on table public\\.${table}\\s+from public, anon, authenticated`,
        "i",
      ),
    );
    assert.match(migration, new RegExp(`grant select, update on table public\\.${table} to authenticated`, "i"));
    assert.match(
      migration,
      new RegExp(`grant select, insert, update, delete on table public\\.${table}\\s+to service_role`, "i"),
    );
  }
});

test("brief data hardening removes obsolete anonymous policies only", () => {
  const policies = [
    "design brief public submit",
    "brief assets public upload",
  ];
  for (const policy of policies) {
    assert.match(migration, new RegExp(`drop policy if exists "${policy}"`, "i"));
  }
  assert.doesNotMatch(migration, /drop policy if exists "Client briefs authenticated/i);
  assert.doesNotMatch(migration, /drop policy if exists "design brief authenticated/i);
  assert.doesNotMatch(migration, /drop policy if exists "brief assets authenticated/i);
});

test("brief hardening does not alter CMS or public media authorization", () => {
  assert.doesNotMatch(migration, /cms_documents|cms_public_documents|cms_revisions/i);
  assert.doesNotMatch(migration, /bucket_id\s*=\s*'media'|update\s+storage\.buckets/i);
});
