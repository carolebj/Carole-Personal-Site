import { createClient } from "@supabase/supabase-js";
import {
  DESIGN_BRIEF_ORPHAN_GRACE_MS,
  classifyDesignBriefAssets,
  collectClientBriefAssetReferences,
  collectDesignBriefAssetReferences,
} from "../shared/design-brief-retention.js";

const PAGE_SIZE = 1_000;
const apply = process.argv.includes("--apply");

if (apply) {
  console.error("Suppression désactivée : le bucket brief-assets est partagé et cet outil est un inventaire en lecture seule.");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function readRows(table, select, orderColumn = "id") {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order(orderColumn, { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Lecture ${table} impossible : ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

async function listPage(prefix) {
  const entries = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.storage.from("brief-assets").list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Listing brief-assets/${prefix} impossible : ${error.message}`);
    entries.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return entries;
  }
}

async function inventoryBriefAssets() {
  const objects = [];
  const protectedUnexpected = [];
  for (const rootEntry of await listPage("")) {
    if (rootEntry.id) {
      protectedUnexpected.push(rootEntry.name);
      continue;
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rootEntry.name)) {
      protectedUnexpected.push(`${rootEntry.name}/`);
      continue;
    }
    for (const entry of await listPage(rootEntry.name)) {
      if (!entry.id) {
        protectedUnexpected.push(`${rootEntry.name}/${entry.name}/`);
        continue;
      }
      objects.push({
        path: `${rootEntry.name}/${entry.name}`,
        createdAt: entry.created_at ?? entry.updated_at ?? null,
      });
    }
  }
  return { objects, protectedUnexpected };
}

function printSummary(classification, protectedUnexpected) {
  console.log(`Référencés conservés : ${classification.referenced.length}`);
  console.log(`Orphelins récents conservés (< 30 jours) : ${classification.recent.length}`);
  console.log(`Âge inconnu conservé : ${classification.unknownAge.length}`);
  console.log(`Chemins inattendus conservés : ${protectedUnexpected.length}`);
  console.log(`Objets anciens sans référence observée (aucune suppression) : ${classification.candidates.length}`);
  classification.candidates.forEach((object) => console.log(`- ${object.path}`));
}

const designRows = await readRows("design_brief_submissions", "id,asset_paths");
const clientAssetRows = await readRows("brief_assets", "id,storage_bucket,storage_path,deleted_at");
const clientSubmissionRows = await readRows("brief_submissions", "id,payload");
const challengeRows = await readRows("brief_email_challenges", "id,brief_payload");
const deletionRows = await readRows("estimator_deletion_logs", "id,storage_bucket,storage_path,storage_cleanup_required,storage_cleaned_at");
const designReferences = collectDesignBriefAssetReferences(designRows);
const clientReferences = collectClientBriefAssetReferences({
  assets: clientAssetRows,
  submissions: clientSubmissionRows,
  challenges: challengeRows,
  deletionLogs: deletionRows,
});
const references = new Set([...designReferences, ...clientReferences]);
const { objects, protectedUnexpected } = await inventoryBriefAssets();
const classification = classifyDesignBriefAssets(objects, references);
console.log(`Références Design Brief historique/pont : ${designReferences.size}`);
console.log(`Protections Client Brief moderne : ${clientReferences.size}`);
printSummary(classification, protectedUnexpected);
console.log("Inventaire en lecture seule : aucune suppression n'est implémentée par cet outil.");
