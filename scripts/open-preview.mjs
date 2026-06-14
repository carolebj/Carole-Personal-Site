/**
 * Redémarre Vite et ouvre les pages de vérification dans le navigateur.
 * Usage : npm run cms:preview
 */

import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  ensureFreshDevServer,
  openPreview,
  printVerificationManifest,
  resolveBaseUrl,
  resolveOpenPath,
} from "./dev-utils.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE_URL = resolveBaseUrl();
const fresh = !process.argv.includes("--no-fresh");
const openPath = resolveOpenPath();

console.log("\n🌐  Prévisualisation\n");

await ensureFreshDevServer(BASE_URL, { root: ROOT, force: fresh });
const { primary } = printVerificationManifest(BASE_URL, { openPath });
await openPreview(primary.url);

console.log("✅  URL prête pour le navigateur intégré de l'outil agent.\n");
