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
import { createClient } from "@supabase/supabase-js";
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
const shouldSeed = process.argv.includes("--seed");
const fresh = process.argv.includes("--fresh");
const shouldOpen = !process.argv.includes("--no-open");
const openAll = process.argv.includes("--open-all");
const openPath = resolveOpenPath();

function fail(message) {
  throw new Error(message);
}

function ok(message) {
  console.log(`✅  ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function openFirstCollectionDocument(page, collectionLabel) {
  await page.getByRole("heading", { name: collectionLabel, exact: true }).waitFor();
  const rows = page.locator("main ul > li");
  const rowCount = await rows.count();
  if (rowCount === 0) fail(`Collection "${collectionLabel}" vide.`);

  const firstRow = rows.first();
  const editButton = firstRow.locator('button[aria-label^="Modifier "]');
  if ((await editButton.count()) !== 1) {
    fail(`Action d'édition introuvable dans "${collectionLabel}".`);
  }
  await editButton.click();
  await page.waitForTimeout(400);
}

async function waitForPublishedEditor(page) {
  try {
    await page.getByRole("button", { name: "Mettre à jour", exact: true }).waitFor({ timeout: 8_000 });
  } catch {
    const alerts = await page.locator('[role="alert"]').allTextContents();
    fail(alerts.length
      ? `Publication non finalisée : ${alerts.join(" · ")}`
      : "Publication non finalisée : l'éditeur n'est pas revenu à l'état publié.");
  }
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
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
  const emailInput = page.locator('input[type="email"]');
  const dashboardNav = page.locator("nav");
  const state = await Promise.race([
    emailInput.waitFor({ state: "visible", timeout: 15_000 }).then(() => "login"),
    dashboardNav.waitFor({ state: "visible", timeout: 15_000 }).then(() => "dashboard"),
  ]);
  if (state === "dashboard") return;

  await emailInput.fill(email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await dashboardNav.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});

  if (await emailInput.isVisible().catch(() => false)) {
    const error = await page.locator('[role="alert"]').textContent().catch(() => null);
    fail(error
      ? `Connexion dashboard impossible : ${error}`
      : "Connexion dashboard impossible — vérifie CMS_SEED_EMAIL / CMS_SEED_PASSWORD.");
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

    await page.getByRole("heading", { name: "Ressources", exact: true }).waitFor();
    if ((await page.locator("main ul > li").count()) === 0) fail("Collection Ressources vide.");
    ok("Liste ressources peuplée");

    await openFirstCollectionDocument(page, "Ressources");

    const saveBtn = page.locator("button", { hasText: "Enregistrer" });
    if (!(await saveBtn.isDisabled())) {
      fail('Bouton "Enregistrer" devrait être inactif sans modification.');
    }
    ok("Bouton Enregistrer inactif (état propre)");

    const titleInput = page.locator("#cms-title-fr");
    const originalTitle = await titleInput.inputValue();
    await titleInput.fill(`${originalTitle} test`);
    await page.waitForTimeout(200);
    if (await saveBtn.isDisabled()) {
      fail('Bouton "Enregistrer" devrait être actif après modification.');
    }
    ok("Bouton Enregistrer actif (état dirty)");

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.locator("nav button", { hasText: "Articles du blog" }).first().click();
    if (!(await page.locator("#cms-title-fr").count())) {
      fail("La garde de navigation n'a pas conservé l'éditeur après annulation.");
    }
    await titleInput.fill(originalTitle);
    for (let attempt = 0; attempt < 20 && !(await saveBtn.isDisabled()); attempt += 1) {
      await sleep(50);
    }
    if (!(await saveBtn.isDisabled())) {
      fail("L'éditeur n'est pas revenu à un état propre après restauration du champ.");
    }
    ok("Navigation protégée en cas de modifications non enregistrées");

    const img = page.locator("img[src]").first();
    const src = await img.getAttribute("src");
    if (!src || src.startsWith("data:")) {
      fail("Visuel ressource absent — relance le seed ou vérifie public/cms/resources/.");
    }
    ok(`Visuel ressource présent (${src.slice(0, 48)}…)`);

    await page.locator("nav button", { hasText: "Lectures & références" }).click();
    await page.waitForTimeout(500);
    await page.locator("nav button", { hasText: "Ouvrages recommandés" }).click();
    await openFirstCollectionDocument(page, "Ouvrages recommandés");

    const bookImg = page.locator("main img[src]").first();
    if (!(await bookImg.count())) {
      fail("Couverture ouvrage absente.");
    }
    ok("Couverture ouvrage présente");

    await verifyBlogFlow(page);
    await verifyPublicFallback(page);
    await verifyDashboardErrorState(page);

    console.log("\n🎉  Vérification dashboard OK.\n");
  } finally {
    await browser.close();
  }
}

// Exercises the full blog editorial flow: create a draft, preview it, publish
// it, then clean up so the run leaves no test data behind.
async function verifyBlogFlow(page) {
  const marker = `__E2E__ ${Date.now().toString(36)}`;
  const slug = `e2e-${Date.now().toString(36)}`;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const sb = createClient(supabaseUrl, supabaseKey);
  const { error: authError } = await sb.auth.signInWithPassword({ email, password });
  if (authError) fail(`Connexion Supabase E2E impossible : ${authError.message}`);
  const { data: baselineOrder, error: baselineError } = await sb
    .from("cms_documents")
    .select("doc_id, position")
    .eq("type", "blogPost")
    .is("deleted_at", null)
    .order("position");
  if (baselineError) fail(`Lecture de l'ordre initial impossible : ${baselineError.message}`);

  try {
    await page.locator("nav button", { hasText: "Articles du blog" }).first().click();
    await page.waitForTimeout(500);
    await page.locator("main button", { hasText: "Nouveau" }).first().click();
    await page.waitForTimeout(500);

    await page.fill("#cms-slug", slug);
    await page.fill("#cms-title-fr", marker);
    await page.fill("#cms-title-en", `${marker} EN`);
    await page.fill("#cms-excerpt-fr", "Extrait de vérification");
    await page.fill("#cms-excerpt-en", "Verification excerpt");
    await page.fill("#cms-body-fr", "Contenu de vérification");
    await page.fill("#cms-body-en", "Verification content");
    ok("Nouvel article bilingue créé en brouillon");

    await page.locator("button", { hasText: "Enregistrer" }).click();
    await page.waitForTimeout(500);
    const { data: unpublishedDraft } = await sb
      .from("cms_public_documents")
      .select("doc_id")
      .eq("type", "blogPost")
      .eq("slug", slug)
      .maybeSingle();
    if (unpublishedDraft) fail("Le brouillon est visible dans la table publique.");
    ok("Brouillon invisible publiquement");

    await page.locator("button", { hasText: "Aperçu" }).first().click();
    await page.waitForTimeout(300);
    if (!(await page.locator("main").innerText()).includes(marker)) {
      fail("Aperçu français incomplet.");
    }
    await page.getByRole("button", { name: "EN", exact: true }).click();
    if (!(await page.locator("main").innerText()).includes(`${marker} EN`)) {
      fail("Aperçu anglais incomplet.");
    }
    ok("Aperçus FR et EN");
    await page.locator("button", { hasText: "Éditer" }).first().click();

    await page.locator("button", { hasText: /^Publier$/ }).click();
    await waitForPublishedEditor(page);
    const { data: published } = await sb
      .from("cms_public_documents")
      .select("data")
      .eq("type", "blogPost")
      .eq("slug", slug)
      .maybeSingle();
    if (!published) fail("L'article publié est absent de cms_public_documents.");
    ok("Publication transactionnelle visible dans la table publique");

    await page.fill("#cms-title-fr", `${marker} modifié`);
    await page.locator("button", { hasText: "Enregistrer" }).click();
    await page.waitForTimeout(700);
    const { data: stillPublished } = await sb
      .from("cms_public_documents")
      .select("data")
      .eq("type", "blogPost")
      .eq("slug", slug)
      .single();
    if (stillPublished?.data?.title?.fr !== marker) {
      fail("La copie publique a changé pendant une simple sauvegarde de brouillon.");
    }
    ok("La version publique reste stable pendant l'édition");

    await page.getByRole("button", { name: "Publier les modifications", exact: true }).click();
    await waitForPublishedEditor(page);
    const { data: updatedPublic } = await sb
      .from("cms_public_documents")
      .select("data")
      .eq("type", "blogPost")
      .eq("slug", slug)
      .single();
    if (updatedPublic?.data?.title?.fr !== `${marker} modifié`) {
      fail("La mise à jour publiée n'est pas visible dans la table publique.");
    }
    ok("Mise à jour publiée");

    await page.locator("button", { hasText: "Historique" }).click();
    const history = page.getByRole("dialog", { name: "Historique des versions" });
    await history.waitFor({ state: "visible", timeout: 5_000 });
    await history.getByText("Chargement…", { exact: true }).waitFor({ state: "hidden", timeout: 5_000 });
    const restoreButtons = history.getByRole("button", { name: "Restaurer cette version" });
    await restoreButtons.nth(2).waitFor({ state: "visible", timeout: 5_000 });
    if ((await restoreButtons.count()) < 3) {
      fail("L'historique ne contient pas assez de versions pour tester la restauration.");
    }
    page.once("dialog", (dialog) => dialog.accept());
    await restoreButtons.last().click();
    await page.locator("#cms-title-fr").waitFor({ state: "visible", timeout: 5_000 });
    await page.waitForFunction(
      (expected) => document.querySelector("#cms-title-fr")?.value === expected,
      marker,
      { timeout: 5_000 },
    );
    if ((await page.locator("#cms-title-fr").inputValue()) !== marker) {
      fail("La restauration de révision n'a pas restauré le titre initial.");
    }
    const { data: publicDuringRestore } = await sb
      .from("cms_public_documents")
      .select("data")
      .eq("type", "blogPost")
      .eq("slug", slug)
      .single();
    if (publicDuringRestore?.data?.title?.fr !== `${marker} modifié`) {
      fail("Restaurer une révision a modifié la version publique avant publication.");
    }
    ok("Restauration d'une révision en brouillon");

    await page.getByRole("button", { name: "Publier les modifications", exact: true }).click();
    await waitForPublishedEditor(page);

    const { data: beforeOrder } = await sb
      .from("cms_documents")
      .select("position")
      .eq("type", "blogPost")
      .eq("slug", slug)
      .single();
    await page.locator("main").getByRole("button", { name: "Articles du blog", exact: true }).click();
    await page.waitForTimeout(300);
    const testRow = page.locator("main li").filter({ hasText: marker }).first();
    const upButton = testRow.getByRole("button", { name: "Monter", exact: true });
    if (await upButton.isDisabled()) {
      fail("Le document E2E devrait pouvoir être déplacé vers le haut.");
    }
    await upButton.click();
    await page.getByRole("button", { name: "Enregistrer l'ordre", exact: true }).click();
    await page.waitForTimeout(500);
    const { data: afterOrder } = await sb
      .from("cms_public_documents")
      .select("position")
      .eq("type", "blogPost")
      .eq("slug", slug)
      .single();
    if (afterOrder?.position === beforeOrder?.position) {
      fail("L'ordre public n'a pas été mis à jour.");
    }
    ok("Réorganisation publique vérifiée");

    await testRow.getByRole("button", { name: `Modifier ${marker}`, exact: true }).click();
    await page.waitForTimeout(300);

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("button", { hasText: "Dépublier" }).click();
    await page.waitForTimeout(700);
    const { data: unpublished } = await sb
      .from("cms_public_documents")
      .select("doc_id")
      .eq("type", "blogPost")
      .eq("slug", slug)
      .maybeSingle();
    if (unpublished) fail("L'article dépublié reste dans la table publique.");
    ok("Dépublication vérifiée");

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("main").getByRole("button", { name: "Corbeille", exact: true }).click();
    await page.waitForTimeout(500);
    const { data: trashed } = await sb
      .from("cms_documents")
      .select("status, deleted_at")
      .eq("type", "blogPost")
      .eq("slug", slug)
      .single();
    if (trashed?.status !== "trashed" || !trashed.deleted_at) {
      fail("Le document n'a pas été déplacé dans la corbeille.");
    }

    await page.locator("nav").getByRole("button", { name: "Corbeille", exact: true }).click();
    await page.waitForTimeout(300);
    const trashRow = page.locator("main li").filter({ hasText: marker }).first();
    await trashRow.getByRole("button", { name: "Restaurer", exact: true }).click();
    await page.waitForTimeout(400);
    const { data: restored } = await sb
      .from("cms_documents")
      .select("status, deleted_at")
      .eq("type", "blogPost")
      .eq("slug", slug)
      .single();
    if (restored?.status !== "draft" || restored.deleted_at) {
      fail("La restauration depuis la corbeille a échoué.");
    }
    ok("Corbeille et restauration vérifiées");
  } finally {
    await sb.from("cms_revisions").delete().eq("type", "blogPost").eq("slug", slug);
    await sb.from("cms_public_documents").delete().eq("type", "blogPost").eq("slug", slug);
    await sb.from("cms_documents").delete().eq("type", "blogPost").eq("slug", slug);
    if (baselineOrder?.length) {
      await sb.rpc("cms_reorder_documents", {
        p_type: "blogPost",
        p_items: baselineOrder.map((item) => ({ id: item.doc_id, position: item.position })),
      });
    }
    ok("Données E2E nettoyées");
  }
}

async function verifyPublicFallback(page) {
  const pattern = "**/rest/v1/cms_public_documents*";
  const abortRequest = (route) => route.abort("failed");
  await page.route(pattern, abortRequest);
  try {
    await page.goto(`${BASE_URL}/blog`, { waitUntil: "networkidle" });
    if (!(await page.getByRole("heading", { name: "Blog", exact: true }).count())) {
      fail("La page Blog ne s'affiche pas pendant une erreur Supabase publique.");
    }
    if ((await page.locator('main a[href^="/blog/"]').count()) === 0) {
      fail("Le fallback local du Blog est vide pendant une erreur Supabase.");
    }
    ok("Fallback public conservé pendant une erreur Supabase");
  } finally {
    await page.unroute(pattern, abortRequest);
  }
}

async function verifyDashboardErrorState(page) {
  const pattern = "**/rest/v1/cms_documents*";
  const abortRequest = (route) => route.abort("failed");
  await page.route(pattern, abortRequest);
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    const errorHeading = page.getByRole("heading", {
      name: "Le contenu n'a pas pu être chargé",
      exact: true,
    });
    await errorHeading.waitFor({ state: "visible", timeout: 8_000 }).catch(() => {});
    if (!(await errorHeading.count())) {
      fail("L'erreur de chargement dashboard n'est pas affichée explicitement.");
    }
  } finally {
    await page.unroute(pattern, abortRequest);
  }
  await page.getByRole("button", { name: "Réessayer", exact: true }).click();
  await page.getByRole("heading", { name: /Bonjour/ }).waitFor();
  ok("Erreur dashboard explicite et bouton Réessayer");
}

// --- main --------------------------------------------------------------------

console.log("\n🔍  Vérification dashboard CMS\n");

try {
  if (!email || !password) {
    fail("CMS_SEED_EMAIL et CMS_SEED_PASSWORD requis dans .env.local (voir docs/workflows/AGENT_DEV.md).");
  }

  if (shouldSeed) {
    await runSeed();
    ok("Seed terminé");
  } else {
    console.log("⏭️   Initialisation ignorée (mode non destructif par défaut)");
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
  console.error(`\n❌  ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
