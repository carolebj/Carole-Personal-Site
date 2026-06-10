#!/usr/bin/env node
// Installe les hooks Git versionnés dans .git/hooks (sans toucher à la config Git).
//   node scripts/install-hooks.mjs

import { copyFileSync, chmodSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const gitDir = execSync("git rev-parse --git-dir", { encoding: "utf8" }).trim();
const hooksDir = join(gitDir, "hooks");
const hooks = ["pre-commit"];

if (!existsSync(hooksDir)) mkdirSync(hooksDir, { recursive: true });

for (const hook of hooks) {
  const src = join("scripts", "git-hooks", hook);
  const dest = join(hooksDir, hook);
  copyFileSync(src, dest);
  chmodSync(dest, 0o755);
  console.log(`✓ Hook installé : ${dest}`);
}

console.log("Hooks Git prêts. Le scan de secrets s'exécutera avant chaque commit.");
