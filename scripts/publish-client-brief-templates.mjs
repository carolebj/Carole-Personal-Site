import { createHash } from "node:crypto";
import {
  CLIENT_BRIEF_SERVICE_KEYS,
  CLIENT_BRIEF_TEMPLATES,
} from "../shared/client-brief-contract.js";

const apply = process.argv.includes("--apply");
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, stable(entry)]));
  return value;
}

async function request(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

const report = CLIENT_BRIEF_SERVICE_KEYS.map((serviceKey) => {
  const template = CLIENT_BRIEF_TEMPLATES[serviceKey];
  const definition = stable(template);
  return {
    serviceKey,
    version: template.version,
    sections: template.sections.length,
    fields: template.sections.reduce((count, section) => count + section.fields.length, 0),
    sha256: createHash("sha256").update(JSON.stringify(definition)).digest("hex"),
  };
});

if (!apply) {
  console.log(JSON.stringify({ mode: "dry-run", templates: report }, null, 2));
  process.exit(0);
}
if (!supabaseUrl || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required with --apply");

for (const serviceKey of CLIENT_BRIEF_SERVICE_KEYS) {
  const template = CLIENT_BRIEF_TEMPLATES[serviceKey];
  for (const locale of ["fr", "en"]) {
    await request("rpc/publish_client_brief_template", {
      method: "POST",
      body: JSON.stringify({ p_service_key: serviceKey, p_version: template.version, p_locale: locale, p_definition: template, p_prefill_mapping: Object.fromEntries(template.sections.flatMap((section) => section.fields).filter((field) => field.prefill).map((field) => [field.key, field.prefill])) }),
    });
  }
}

console.log(JSON.stringify({ mode: "applied", templates: report }, null, 2));
