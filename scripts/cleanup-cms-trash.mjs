import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.CMS_SEED_EMAIL;
const password = process.env.CMS_SEED_PASSWORD;
if (!url || !key || !email || !password) {
  console.error("Variables Supabase et CMS_SEED_* requises.");
  process.exit(1);
}

const sb = createClient(url, key);
const { error: authError } = await sb.auth.signInWithPassword({ email, password });
if (authError) throw authError;

const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const { data: expired, error } = await sb
  .from("cms_documents")
  .select("type, doc_id, deleted_at")
  .eq("status", "trashed")
  .lt("deleted_at", cutoff);
if (error) throw error;

if (!expired?.length) {
  console.log("Aucun élément de corbeille arrivé à expiration.");
  process.exit(0);
}

if (!apply) {
  console.log(`Simulation : ${expired.length} élément(s) arrivé(s) à expiration.`);
  expired.forEach((item) => console.log(`- ${item.type}/${item.doc_id} (${item.deleted_at})`));
  console.log("Relance avec --apply pour supprimer définitivement.");
  process.exit(0);
}

for (const item of expired) {
  const { error: revisionError } = await sb
    .from("cms_revisions")
    .delete()
    .eq("type", item.type)
    .eq("doc_id", item.doc_id);
  if (revisionError) throw revisionError;
  const { error: deleteError } = await sb
    .from("cms_documents")
    .delete()
    .eq("type", item.type)
    .eq("doc_id", item.doc_id);
  if (deleteError) throw deleteError;
}
console.log(`${expired.length} élément(s) expiré(s) supprimé(s).`);
