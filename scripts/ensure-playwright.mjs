/**
 * Installe Chromium pour Playwright seulement s'il est absent.
 * Cible le cache utilisateur (~Library/Caches/ms-playwright sur macOS),
 * pas le cache éphémère du sandbox Cursor.
 *
 * Usage : node scripts/ensure-playwright.mjs
 *         npm run playwright:install   (force la (re)installation)
 */

import { access } from "fs/promises";
import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function browserPresent() {
  try {
    await access(chromium.executablePath());
    return true;
  } catch {
    return false;
  }
}

function runInstall() {
  return new Promise((resolve, reject) => {
    console.log("📥  Chromium Playwright absent — installation (une fois par machine / version)…");
    const child = spawn("npx", ["playwright", "install", "chromium"], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`playwright install exit ${code}`))));
  });
}

if (!(await browserPresent())) {
  await runInstall();
}
