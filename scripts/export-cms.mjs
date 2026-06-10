import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "backups", "cms");
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.CMS_SEED_EMAIL;
const password = process.env.CMS_SEED_PASSWORD;

if (!url || !key || !email || !password) {
  console.error("Variables Supabase et CMS_SEED_* requises dans .env.local.");
  process.exit(1);
}

const sb = createClient(url, key);
const { error: authError } = await sb.auth.signInWithPassword({ email, password });
if (authError) {
  console.error(`Connexion impossible : ${authError.message}`);
  process.exit(1);
}

const tables = ["cms_documents", "cms_public_documents", "cms_revisions"];
const exported = { exportedAt: new Date().toISOString(), tables: {} };

for (const table of tables) {
  const { data, error } = await sb.from(table).select("*");
  if (error) {
    if (table !== "cms_documents") {
      exported.tables[table] = { unavailable: true, reason: error.message };
      continue;
    }
    console.error(`Export ${table} impossible : ${error.message}`);
    process.exit(1);
  }
  exported.tables[table] = data ?? [];
}

mkdirSync(outputDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = join(outputDir, `${stamp}.json`);
writeFileSync(output, `${JSON.stringify(exported, null, 2)}\n`, { mode: 0o600 });
console.log(`Export CMS créé : ${output}`);
