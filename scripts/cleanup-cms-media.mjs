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

const referenced = new Set();
const collectUrls = (value) => {
  if (Array.isArray(value)) return value.forEach(collectUrls);
  if (!value || typeof value !== "object") return;
  for (const [keyName, child] of Object.entries(value)) {
    if (keyName === "url" && typeof child === "string") referenced.add(child);
    else collectUrls(child);
  }
};

for (const table of ["cms_documents", "cms_public_documents", "cms_revisions"]) {
  const { data, error } = await sb.from(table).select("data");
  if (error) throw new Error(`${table}: ${error.message}`);
  for (const row of data ?? []) collectUrls(row.data);
}

const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
const { data: folders, error: folderError } = await sb.storage.from("media").list("uploads", {
  limit: 1000,
});
if (folderError) throw folderError;

const orphanPaths = [];
for (const object of folders ?? []) {
  const path = `uploads/${object.name}`;
  const publicUrl = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  const createdAt = object.created_at ? new Date(object.created_at).getTime() : Date.now();
  if (!referenced.has(publicUrl) && createdAt < cutoff) orphanPaths.push(path);
}

if (orphanPaths.length === 0) {
  console.log("Aucun média orphelin de plus de 30 jours.");
} else if (!apply) {
  console.log(`Simulation : ${orphanPaths.length} média(s) supprimable(s).`);
  orphanPaths.forEach((path) => console.log(`- ${path}`));
  console.log("Relance avec --apply pour supprimer.");
} else {
  const { error } = await sb.storage.from("media").remove(orphanPaths);
  if (error) throw error;
  console.log(`${orphanPaths.length} média(s) orphelin(s) supprimé(s).`);
}
