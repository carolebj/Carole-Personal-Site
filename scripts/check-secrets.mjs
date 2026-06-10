#!/usr/bin/env node
// Secret scanner autonome (aucune dépendance).
//   node scripts/check-secrets.mjs            -> scanne tous les fichiers suivis
//   node scripts/check-secrets.mjs --staged   -> scanne les fichiers en staging (hook pre-commit)
//
// Faux positif sur une ligne : ajouter le marqueur `secret-scan:allow`.

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const STAGED = process.argv.includes("--staged");
const ALLOW_MARK = "secret-scan:allow";

// Fichiers qui ne doivent jamais être commités (hors template).
const BLOCKED_FILE_RULES = [
  /(^|\/)\.env$/,
  /(^|\/)\.env\.local$/,
  /(^|\/)\.env\.[^/]*\.local$/,
  /(^|\/)\.dev\.vars$/,
  /\.pem$/,
  /\.key$/,
  /(^|\/)id_rsa$/,
];

// Fichiers explicitement autorisés (templates, ce scanner lui-même, la doc).
const ALLOWLISTED_FILES = new Set([
  ".env.example",
  "scripts/check-secrets.mjs",
  "docs/SECURITY.md",
]);

// Motifs haute confiance (toujours bloquants).
const CONTENT_RULES = [
  { name: "Clé API OpenAI", re: /\bsk-(proj-)?[A-Za-z0-9_-]{20,}\b/ },
  { name: "AWS Access Key ID", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Clé secrète Supabase", re: /\bsb_secret_[A-Za-z0-9_-]{10,}\b/ },
  {
    name: "Bloc de clé privée",
    re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
  },
];

// Règle générique « NOM_SECRET = valeur » : plus sujette aux faux positifs,
// on l'ignore quand la ligne lit une variable d'env ou contient un placeholder.
// On exige une valeur entre guillemets après le séparateur : cela cible les
// secrets codés en dur (`PASSWORD = "…"`) sans alerter sur les références de
// code (`const token = getBearerToken(req)`, `process.env.X`, etc.).
const ASSIGNMENT_RULE = {
  name: "Affectation secret/token/mot de passe",
  re: /(?:SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY)\b["']?\s*[:=]\s*["'][^\s"'#<>${}]{12,}/i,
};

// Si l'un de ces marqueurs est présent, la valeur n'est pas un secret littéral
// (référence de code) ou est un placeholder de documentation.
const NON_SECRET_HINTS = [
  "process.env",
  "import.meta.env",
  "deno.env",
  "os.environ",
  "getenv",
  "mot-de-passe",
  "exemple",
  "example",
  "votre-",
  "your-",
  "changeme",
  "placeholder",
  "redacted",
  "dummy",
  "xxxx",
  "same-long-random",
];

function isLikelyFalsePositive(line) {
  const lower = line.toLowerCase();
  return NON_SECRET_HINTS.some((hint) => lower.includes(hint));
}

const sh = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();

function listFiles() {
  const out = STAGED
    ? sh("git diff --cached --name-only --diff-filter=ACM")
    : sh("git ls-files");
  return out ? out.split("\n").filter(Boolean) : [];
}

function readFileText(file) {
  try {
    const buf = readFileSync(file);
    if (buf.includes(0)) return null; // binaire -> on ignore
    return buf.toString("utf8");
  } catch {
    return null;
  }
}

const findings = [];

for (const file of listFiles()) {
  if (ALLOWLISTED_FILES.has(file)) continue;

  if (BLOCKED_FILE_RULES.some((re) => re.test(file))) {
    findings.push({ file, line: 0, rule: "Fichier de secrets interdit au commit" });
    continue;
  }

  const text = readFileText(file);
  if (text === null) continue;

  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (line.includes(ALLOW_MARK)) return;

    let matched = null;
    for (const rule of CONTENT_RULES) {
      if (rule.re.test(line)) {
        matched = rule.name;
        break;
      }
    }

    if (!matched && ASSIGNMENT_RULE.re.test(line) && !isLikelyFalsePositive(line)) {
      matched = ASSIGNMENT_RULE.name;
    }

    if (matched) findings.push({ file, line: i + 1, rule: matched });
  });
}

if (findings.length === 0) {
  console.log(`✓ Scan secrets OK (${STAGED ? "staging" : "fichiers suivis"}).`);
  process.exit(0);
}

console.error("\n✗ Secrets potentiels détectés :\n");
for (const f of findings) {
  const where = f.line ? `${f.file}:${f.line}` : f.file;
  console.error(`  • [${f.rule}] ${where}`);
}
console.error(
  `\nRetire le secret du commit. Faux positif ? Ajoute « ${ALLOW_MARK} » sur la ligne.\n`,
);
process.exit(1);
