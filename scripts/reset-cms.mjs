import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const confirmation = process.argv.find((arg) => arg.startsWith("--confirm="))?.split("=")[1];
if (confirmation !== "RESET_CMS") {
  console.error("Commande destructive refusée. Utilise : npm run cms:reset -- --confirm=RESET_CMS");
  process.exit(1);
}

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

console.log("Export de sécurité avant réinitialisation…");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
await new Promise((resolve, reject) => {
  const child = spawn("node", ["--env-file=.env.local", "scripts/export-cms.mjs"], {
    cwd: root,
    stdio: "inherit",
  });
  child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("Export interrompu."))));
});

for (const table of ["cms_revisions", "cms_public_documents", "cms_documents"]) {
  const keyColumn = table === "cms_revisions" ? "revision_id" : "doc_id";
  const { error } = await sb.from(table).delete().not(keyColumn, "is", null);
  if (error) throw new Error(`${table}: ${error.message}`);
}

await new Promise((resolve, reject) => {
  const child = spawn("node", ["--env-file=.env.local", "scripts/seed-supabase.mjs"], {
    cwd: root,
    stdio: "inherit",
  });
  child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("Seed interrompu."))));
});
