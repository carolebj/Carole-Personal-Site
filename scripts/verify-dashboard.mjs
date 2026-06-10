/**
 * Seed Supabase (optionnel) puis vérifie le dashboard dans un navigateur headless.
 *
 * Usage :
 *   npm run cms:verify
 *   node --env-file=.env.local scripts/verify-dashboard.mjs --skip-seed
 *   node --env-file=.env.local scripts/verify-dashboard.mjs --fresh --no-open
 *
 * Par défaut : réutilise Vite s'il tourne déjà ; --fresh pour tuer le port et invalider le cache deps.
 */

import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import {
  ensureFreshDevServer,
  openPreview,
  printVerificationManifest,
  resolveBaseUrl,
  resolveOpenPath,
} from "./dev-utils.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const BASE_URL = resolveBaseUrl();
const email = process.env.CMS_SEED_EMAIL;
const password = process.env.CMS_SEED_PASSWORD;
const skipSeed = process.argv.includes("--skip-seed");
const fresh = process.argv.includes("--fresh");
const shouldOpen = !process.argv.includes("--no-open");
const openAll = process.argv.includes("--open-all");
const openPath = resolveOpenPath();

function fail(message) {
  console.error(`\n❌  ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`✅  ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSeed() {
  console.log("\n📥  Seed Supabase…");
  await new Promise((resolve, reject) => {
    const child = spawn("node", ["--env-file=.env.local", "scripts/seed-supabase.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`seed exit ${code}`))));
  });
}

async function login(page) {
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const onLogin = await page.locator('input[type="email"]').isVisible().catch(() => false);
  if (!onLogin) return;

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  if (await page.locator('input[type="email"]').isVisible().catch(() => false)) {
    fail("Connexion dashboard impossible — vérifie CMS_SEED_EMAIL / CMS_SEED_PASSWORD.");
  }
  ok("Connexion dashboard");
}

async function verifyDashboard() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  try {
    await login(page);

    const navText = await page.locator("nav").innerText();
    if (!navText.includes("Ressources & communautés")) {
      fail('Accordéon "Ressources & communautés" absent de la sidebar.');
    }
    if (!navText.includes("Lectures & références")) {
      fail('Accordéon "Lectures & références" absent de la sidebar.');
    }
    ok("Sidebar accordéon Carnet");

    await page.locator("nav button", { hasText: "Ressources & communautés" }).click();
    await page.waitForTimeout(500);
    await page.locator("nav button", { hasText: "Ressources" }).first().click();
    await page.waitForTimeout(600);

    const listText = await page.locator("main").innerText();
    if (!listText.includes("LE DÉPÔT")) {
      fail("Ressource LE DÉPÔT absente — le seed n'a peut-être pas abouti.");
    }
    ok("Liste ressources peuplée");

    await page.locator("main button", { hasText: "LE DÉPÔT" }).first().click();
    await page.waitForTimeout(600);

    const saveBtn = page.locator("button", { hasText: "Enregistrer" });
    if (!(await saveBtn.isDisabled())) {
      fail('Bouton "Enregistrer" devrait être inactif sans modification.');
    }
    ok("Bouton Enregistrer inactif (état propre)");

    const titleInput = page.locator("input").first();
    await titleInput.fill("LE DÉPÔT test");
    await page.waitForTimeout(200);
    if (await saveBtn.isDisabled()) {
      fail('Bouton "Enregistrer" devrait être actif après modification.');
    }
    ok("Bouton Enregistrer actif (état dirty)");

    const img = page.locator("img[src]").first();
    const src = await img.getAttribute("src");
    if (!src || src.startsWith("data:")) {
      fail("Visuel ressource absent — relance le seed ou vérifie public/cms/resources/.");
    }
    ok(`Visuel ressource présent (${src.slice(0, 48)}…)`);

    await page.locator("nav button", { hasText: "Lectures & références" }).click();
    await page.waitForTimeout(500);
    await page.locator("nav button", { hasText: "Ouvrages recommandés" }).click();
    await page.waitForTimeout(600);
    await page.locator("main button", { hasText: "Everybody Writes" }).first().click();
    await page.waitForTimeout(600);

    const bookImg = page.locator('img[src*="books.google"]').first();
    if (!(await bookImg.count())) {
      fail("Couverture ouvrage absente.");
    }
    ok("Couverture ouvrage présente");

    await verifyBlogFlow(page);

    console.log("\n🎉  Vérification dashboard OK.\n");
  } finally {
    await browser.close();
  }
}

// Exercises the full blog editorial flow: create a draft, preview it, publish
// it, then clean up so the run leaves no test data behind.
async function verifyBlogFlow(page) {
  const marker = `__E2E__ ${Date.now().toString(36)}`;

  page.on("dialog", (dialog) => dialog.accept());

  await page.locator("nav button", { hasText: "Articles du blog" }).first().click();
  await page.waitForTimeout(500);

  await page.locator("main button", { hasText: "Nouveau" }).first().click();
  await page.waitForTimeout(500);

  const draftPill = page.locator("main", { hasText: "Brouillon" });
  if (!(await draftPill.count())) {
    fail('Nouvel article : badge "Brouillon" attendu dans l\'éditeur.');
  }
  const publishBtn = page.locator("button", { hasText: "Publier" }).first();
  if (!(await publishBtn.count())) {
    fail('Nouvel article : bouton "Publier" attendu.');
  }
  ok("Nouvel article créé en brouillon");

  // Title is the second text input (first is the slug field).
  const inputs = page.locator("main input");
  await inputs.nth(0).fill(`e2e-${Date.now().toString(36)}`);
  await inputs.nth(1).fill(marker);
  await page.waitForTimeout(200);

  // Preview must render the shared reader without crashing.
  await page.locator("button", { hasText: "Aperçu" }).first().click();
  await page.waitForTimeout(500);
  const previewText = await page.locator("main").innerText();
  if (!previewText.includes(marker)) {
    fail("Aperçu : le titre saisi devrait apparaître dans le rendu.");
  }
  ok("Aperçu article rend le contenu saisi");
  await page.locator("button", { hasText: "Éditer" }).first().click();
  await page.waitForTimeout(300);

  await publishBtn.click();
  await page.waitForTimeout(1500);
  const publishedPill = page.locator("main", { hasText: "Publié" });
  const unpublishBtn = page.locator("button", { hasText: "Repasser en brouillon" });
  if (!(await publishedPill.count()) || !(await unpublishBtn.count())) {
    fail('Publication : badge "Publié" + bouton "Repasser en brouillon" attendus.');
  }
  ok("Article publié");

  // Cleanup: back to the list and delete the test article.
  await page.locator('main button', { hasText: "Articles du blog" }).first().click();
  await page.waitForTimeout(600);
  const row = page.locator("li", { hasText: marker }).first();
  if (await row.count()) {
    await row.locator('button[title="Supprimer"]').first().click();
    await page.waitForTimeout(800);
    ok("Article de test supprimé (nettoyage)");
  }
}

// --- main --------------------------------------------------------------------

if (!email || !password) {
  fail("CMS_SEED_EMAIL et CMS_SEED_PASSWORD requis dans .env.local (voir docs/workflows/AGENT_DEV.md).");
}

console.log("\n🔍  Vérification dashboard CMS\n");

try {
  if (!skipSeed) {
    await runSeed();
    ok("Seed terminé");
  } else {
    console.log("⏭️   Seed ignoré (--skip-seed)");
  }

  await new Promise((resolve, reject) => {
    const child = spawn("node", ["scripts/ensure-playwright.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`playwright setup exit ${code}`))));
  });

  await ensureFreshDevServer(BASE_URL, { root: ROOT, force: fresh });
  await verifyDashboard();

  const { primary, pages } = printVerificationManifest(BASE_URL, { openPath });

  if (shouldOpen) {
    const urls = openAll ? pages.map((p) => p.url) : [primary.url];
    await openPreview(urls);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
