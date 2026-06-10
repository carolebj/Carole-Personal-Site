/**
 * Utilitaires partagés : serveur Vite frais, ouverture navigateur, URLs de vérif.
 */

import { exec, spawn } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PREVIEW_URL_FILE = join(ROOT, ".cursor/preview.url");

export const DEFAULT_BASE_URL = "http://127.0.0.1:5173";

export function resolveBaseUrl() {
  return (process.env.DASHBOARD_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

/** Pages utiles à mentionner (référence agent) — une seule est ouverte par défaut. */
export function verificationPages(baseUrl = resolveBaseUrl()) {
  const v = Date.now();
  const bust = (path) => `${baseUrl}${path}?_v=${v}`;
  return [
    {
      id: "dashboard",
      label: "Dashboard CMS",
      path: "/dashboard",
      url: bust("/dashboard"),
      hint: "Point d'entrée édition — navigue ensuite dans la sidebar",
      defaultOpen: true,
    },
    {
      id: "carnet-ressources",
      label: "Site · Ressources & communautés",
      path: "/carnet/outils-inspirations",
      url: bust("/carnet/outils-inspirations"),
      hint: "Rendu public des ressources et communautés",
    },
    {
      id: "carnet-lectures",
      label: "Site · Lectures & références",
      path: "/carnet/lectures-references",
      url: bust("/carnet/lectures-references"),
      hint: "Rendu public des ouvrages et références",
    },
  ];
}

export function cacheBustUrl(baseUrl, path) {
  return `${baseUrl}${path}?_v=${Date.now()}`;
}

/** Une seule URL à ouvrir : CMS_OPEN_PATH dans .env, --open=/chemin, ou /dashboard. */
export function resolveOpenPath(argv = process.argv) {
  const fromEnv = process.env.CMS_OPEN_PATH;
  if (fromEnv) return fromEnv.startsWith("/") ? fromEnv : `/${fromEnv}`;

  const openArg = argv.find((a) => a.startsWith("--open="));
  if (openArg) {
    const path = openArg.slice("--open=".length);
    return path.startsWith("/") ? path : `/${path}`;
  }

  return "/dashboard";
}

export function printVerificationManifest(baseUrl = resolveBaseUrl(), { openPath } = {}) {
  const pages = verificationPages(baseUrl);
  const primary = pages.find((p) => p.path === openPath) ?? pages[0];

  console.log("\n┌─────────────────────────────────────────────────────────┐");
  console.log("│  OÙ VÉRIFIER                                            │");
  console.log("└─────────────────────────────────────────────────────────┘\n");
  console.log(`  ▶ Ouvrir maintenant : ${primary.label}`);
  console.log(`    ${primary.url}\n`);
  console.log("  Autres pages (si besoin, depuis le navigateur) :");
  for (const page of pages) {
    if (page.path === primary.path) continue;
    console.log(`    ${page.label} → ${page.url}`);
  }
  console.log(`\n  Serveur actif : ${baseUrl}`);
  console.log("  Affichage ancien ? Cmd+Shift+R sur l'onglet ouvert.\n");
  return { primary, pages };
}

export async function killPort(port) {
  try {
    await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
    await sleep(400);
  } catch {
    // port libre
  }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function isServerUp(baseUrl) {
  try {
    const res = await fetch(baseUrl, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Coupe l'ancien Vite sur le port, relance avec --force (cache deps invalidé).
 */
export async function ensureFreshDevServer(baseUrl, { root, force = true } = {}) {
  const port = new URL(baseUrl).port || "5173";

  if (force) {
    console.log(`\n♻️   Redémarrage serveur Vite (port ${port})…`);
    await killPort(port);
  } else if (await isServerUp(baseUrl)) {
    console.log(`\n✓  Serveur déjà actif (${baseUrl})`);
    return;
  }

  console.log(`🚀  Démarrage Vite sur ${baseUrl}…`);
  const args = ["run", "dev:site", "--", "--port", port, "--strictPort"];
  if (force) args.push("--force");

  const child = spawn("npm", args, {
    cwd: root,
    detached: true,
    stdio: "ignore",
    env: process.env,
  });
  child.unref();

  for (let i = 0; i < 45; i++) {
    await sleep(1000);
    if (await isServerUp(baseUrl)) {
      console.log(`✅  Serveur prêt : ${baseUrl}`);
      return;
    }
  }
  throw new Error(`Le serveur dev n'a pas répondu sur ${baseUrl}`);
}

/** agent = navigateur intégré de l'outil agent (défaut) · system = Safari/Chrome macOS */
export function resolveBrowserTarget(argv = process.argv) {
  if (argv.includes("--browser=system")) return "system";
  if (argv.includes("--browser=agent")) return "agent";
  const fromEnv = process.env.BROWSER_TARGET?.toLowerCase();
  if (fromEnv === "system") return "system";
  // "internal", "agent", ou non défini → navigateur de l'outil agent
  return "agent";
}

async function persistPreviewUrl(url) {
  await mkdir(dirname(PREVIEW_URL_FILE), { recursive: true });
  await writeFile(PREVIEW_URL_FILE, url, "utf8");
}

/**
 * Prépare la prévisualisation pour le navigateur intégré de l'outil agent
 * en cours (Cursor, Codex, Claude Code, …), via son MCP/navigateur interne.
 * Choix par défaut. Le navigateur système reste une option secondaire
 * (BROWSER_TARGET=system) quand il y a un bénéfice particulier.
 */
export async function openPreview(urls, { target } = {}) {
  const list = Array.isArray(urls) ? urls : [urls];
  const url = list[0];
  const mode = target ?? resolveBrowserTarget();

  await persistPreviewUrl(url);

  if (mode === "system") {
    console.log("\n🌐  Ouverture navigateur système (macOS)…");
    await new Promise((resolve, reject) => {
      exec(`open "${url}"`, (err) => (err ? reject(err) : resolve()));
    });
    console.log(`   → ${url}`);
    return;
  }

  console.log("\n🖥️  Navigateur intégré de l'outil agent (pas Safari/Chrome)");
  console.log(`   AGENT_PREVIEW_URL=${url}`);
  console.log("   → L'agent ouvre cette URL avec son navigateur interne / MCP.");
  console.log("   → Cursor : MCP browser_navigate, ou Cmd+Shift+P → « Simple Browser: Show ».\n");
}
