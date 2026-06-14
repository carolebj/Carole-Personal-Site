/**
 * Resynchronise le texte CMS avec scripts/lib/cms-default-content.mjs (aligné i18n).
 *
 * Usage :
 *   npm run cms:sync-i18n              # aperçu
 *   npm run cms:sync-i18n -- --apply   # enregistre + publie
 */

import { createClient } from "@supabase/supabase-js";
import {
  i18nCollections,
  i18nOrphanDepublishTypes,
  i18nSingletons,
} from "./lib/cms-default-content.mjs";
import { cmsDataEqual, syncTextFromCanonical } from "./lib/sync-text.mjs";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.CMS_SEED_EMAIL;
const password = process.env.CMS_SEED_PASSWORD;
const apply = process.argv.includes("--apply");

if (!url || !key || !email || !password) {
  console.error("Configuration Supabase ou identifiants CMS manquants dans .env.local.");
  process.exit(1);
}

function canonicalKey(doc, matchKey) {
  return doc[matchKey] ?? doc.slug ?? null;
}

function findCollectionRow(rows, canonical, matchKey) {
  const key = canonicalKey(canonical, matchKey);
  const byKey = rows.find(
    (row) => row.doc_id === key || row.slug === key || row.data?.slug === key,
  );
  if (byKey) return byKey;

  if (canonical.name) {
    const byName = rows.find((row) => row.data?.name === canonical.name);
    if (byName) return byName;
  }

  return null;
}

async function saveAndPublish(sb, type, docId, merged, slug, position) {
  const { error: saveError } = await sb.rpc("cms_save_document", {
    p_type: type,
    p_doc_id: docId,
    p_data: merged,
    p_slug: slug ?? null,
    p_position: position ?? 0,
  });
  if (saveError) throw saveError;

  const { error: publishError } = await sb.rpc("cms_publish_document", {
    p_type: type,
    p_doc_id: docId,
  });
  if (publishError) throw publishError;
}

const sb = createClient(url, key);
const { error: authError } = await sb.auth.signInWithPassword({ email, password });
if (authError) throw authError;

const changes = [];
const created = [];
const depublished = [];

for (const [type, buildContent] of Object.entries(i18nSingletons)) {
  const docId = type;
  const canonical = buildContent();

  const { data: row, error } = await sb
    .from("cms_documents")
    .select("data, slug, position")
    .eq("type", type)
    .eq("doc_id", docId)
    .maybeSingle();
  if (error) throw error;

  if (!row) {
    console.warn(`Ignoré, document absent : ${type}/${docId} (lancez npm run cms:seed d'abord).`);
    continue;
  }

  const merged = syncTextFromCanonical(row.data, canonical);
  if (cmsDataEqual(merged, row.data)) continue;

  changes.push(`${type}/${docId}`);
  if (!apply) continue;

  await saveAndPublish(sb, type, docId, merged, row.slug ?? null, row.position ?? 0);
}

for (const [type, config] of Object.entries(i18nCollections)) {
  const canonicalDocs = config.build();
  const matchKey = config.matchKey;

  const { data: rows, error } = await sb
    .from("cms_documents")
    .select("doc_id, data, slug, position, status")
    .eq("type", type)
    .is("deleted_at", null)
    .order("position", { ascending: true });
  if (error) throw error;

  const canonicalKeys = new Set(
    canonicalDocs.map((doc) => canonicalKey(doc, matchKey)).filter(Boolean),
  );
  const usedDocIds = new Set();

  for (const [position, canonical] of canonicalDocs.entries()) {
    const key = canonicalKey(canonical, matchKey);
    const row = findCollectionRow(rows ?? [], canonical, matchKey);
    const docId = row?.doc_id ?? key;
    const slug = canonical.slug ?? null;
    const { id: _stableId, ...payload } = canonical;

    const merged = syncTextFromCanonical(row?.data ?? {}, payload);
    const isNew = !row;
    const changed = isNew || !cmsDataEqual(merged, row?.data ?? {});

    if (changed) {
      changes.push(`${type}/${docId}${isNew ? " (nouveau)" : ""}`);
      if (apply) {
        await saveAndPublish(sb, type, docId, merged, slug, position);
        if (isNew) created.push(`${type}/${docId}`);
      }
    }

    usedDocIds.add(docId);
  }

  if (!i18nOrphanDepublishTypes.has(type)) continue;

  for (const row of rows ?? []) {
    const rowKey = row.slug ?? row.data?.slug ?? row.doc_id;
    const rowName = row.data?.name;
    const isUsed =
      usedDocIds.has(row.doc_id) ||
      canonicalKeys.has(rowKey) ||
      (rowName && canonicalDocs.some((doc) => doc.name === rowName));
    if (isUsed) continue;
    if (row.status !== "published") continue;

    depublished.push(`${type}/${row.doc_id}`);
    if (!apply) continue;

    const { error: unpublishError } = await sb.rpc("cms_unpublish_document", {
      p_type: type,
      p_doc_id: row.doc_id,
    });
    if (unpublishError) throw unpublishError;
  }
}

console.log(`${apply ? "Synchronisés" : "À synchroniser"} : ${changes.length} document(s).`);
for (const change of changes) console.log(`- ${change}`);

if (created.length) {
  console.log(`\nCréés : ${created.length}`);
  for (const item of created) console.log(`- ${item}`);
}

if (depublished.length) {
  console.log(`\n${apply ? "Dépubliés" : "À dépublier"} (hors i18n) : ${depublished.length}`);
  for (const item of depublished) console.log(`- ${item}`);
}

if (!apply && (changes.length || depublished.length)) {
  console.log("\nRelance avec --apply pour enregistrer et publier.");
}
