/**
 * scripts/seed-supabase.mjs
 *
 * Pousse le contenu initial dans la base Supabase.
 * Usage :
 *   npm run cms:seed
 *   node --env-file=.env.local scripts/seed-supabase.mjs
 *   node --env-file=.env.local scripts/seed-supabase.mjs <email> <password>
 *
 * Identifiants : arguments CLI, ou CMS_SEED_EMAIL / CMS_SEED_PASSWORD dans .env.local
 * (compte Supabase > Authentication > Users).
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import {
  buildAboutPageContent,
  buildBlogPosts,
  buildBooks,
  buildCommunities,
  buildCvEntries,
  buildCvPageContent,
  buildHomePageContent,
  buildReferences,
  buildResources,
  buildServices,
  buildSiteSettingsContent,
  buildTestimonials,
} from "./lib/cms-default-content.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "../src/assets/resources");
const BUCKET = "media";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const [emailArg, passwordArg] = process.argv.slice(2);
const email = emailArg ?? process.env.CMS_SEED_EMAIL;
const password = passwordArg ?? process.env.CMS_SEED_PASSWORD;

if (!url || !key) {
  console.error("❌  VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquant dans .env.local");
  process.exit(1);
}
if (!email || !password) {
  console.error(
    "❌  Identifiants manquants. Ajoute CMS_SEED_EMAIL et CMS_SEED_PASSWORD dans .env.local",
  );
  console.error("    ou : node --env-file=.env.local scripts/seed-supabase.mjs <email> <password>");
  process.exit(1);
}

const sb = createClient(url, key);

// --- connexion ---------------------------------------------------------------
console.log(`\n🔐  Connexion en tant que ${email}…`);
const { error: authError } = await sb.auth.signInWithPassword({ email, password });
if (authError) {
  console.error("❌  Échec de connexion :", authError.message);
  process.exit(1);
}
console.log("✅  Connecté.\n");

// --- helpers -----------------------------------------------------------------
const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const L = (fr, en = "") => ({ fr, en });
const TABLE = "cms_documents";
const PUBLIC_TABLE = "cms_public_documents";

async function insertIfMissing(type, docId, data, position) {
  const { data: existing, error: lookupError } = await sb
    .from(TABLE)
    .select("doc_id, data, status, position, slug")
    .eq("type", type)
    .eq("doc_id", docId)
    .maybeSingle();
  if (lookupError) throw new Error(`${type}/${docId}: ${lookupError.message}`);
  if (existing) {
    const { data: revision, error: revisionLookupError } = await sb
      .from("cms_revisions")
      .select("revision_id")
      .eq("type", type)
      .eq("doc_id", docId)
      .limit(1)
      .maybeSingle();
    if (revisionLookupError) throw new Error(`${type}/${docId} revision: ${revisionLookupError.message}`);
    if (!revision) {
      const { error: revisionError } = await sb.from("cms_revisions").insert({
        type,
        doc_id: docId,
        data: existing.data,
        status: existing.status,
        position: existing.position,
        slug: existing.slug,
      });
      if (revisionError) throw new Error(`${type}/${docId} revision: ${revisionError.message}`);
    }
    process.stdout.write("·");
    return;
  }

  const now = new Date().toISOString();
  const payload = { ...data, id: docId };
  const slug = typeof data.slug === "string" ? data.slug : null;
  const { error } = await sb.from(TABLE).insert({
    type,
    doc_id: docId,
    data: payload,
    status: "published",
    position,
    slug,
    created_at: now,
    updated_at: now,
    published_at: now,
  });
  if (error) throw new Error(`${type}/${docId}: ${error.message}`);

  const { error: publicError } = await sb.from(PUBLIC_TABLE).insert({
    type,
    doc_id: docId,
    data: payload,
    position,
    slug,
    published_at: now,
  });
  if (publicError) throw new Error(`${type}/${docId} public: ${publicError.message}`);

  const { error: revisionError } = await sb.from("cms_revisions").insert({
    type,
    doc_id: docId,
    data: payload,
    status: "published",
    position,
    slug,
  });
  if (revisionError) throw new Error(`${type}/${docId} revision: ${revisionError.message}`);
  process.stdout.write(".");
}

const CARNET_FILES = {
  "le-depot": "le-depot.webp",
  laveiye: "laveiye.webp",
  "calendrier-cm-229": "calendrier-cm229.webp",
  "social-media-room": "social-media-room.webp",
  "women-in-tech-benin": "women-in-tech-benin.webp",
  "women-techmakers-abomey-calavi": "women-techmakers-abomey-calavi.webp",
};

const BOOK_COVERS = {
  "everybody-writes":
    "https://books.google.com/books/content?id=QGtECQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
  storybrand:
    "https://books.google.com/books/content?id=b3xDDgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
  "le-bug-humain":
    "https://books.google.com/books/content?id=_yODDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
};

const imageCache = new Map();

async function carnetImage(slug) {
  if (imageCache.has(slug)) return imageCache.get(slug);
  const file = CARNET_FILES[slug];
  if (!file) return null;

  const fallback = { url: `/cms/resources/${file}`, alt: { fr: `Visuel ${slug}`, en: `Visual ${slug}` } };
  try {
    const buffer = readFileSync(join(ASSETS_DIR, file));
    const path = `seed/carnet/${file}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
      upsert: true,
      contentType: "image/webp",
    });
    if (error) {
      console.log(`\n  ⚠️  upload ${slug}: ${error.message} — fallback public`);
      imageCache.set(slug, fallback);
      return fallback;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    const img = { url: data.publicUrl, alt: fallback.alt };
    imageCache.set(slug, img);
    return img;
  } catch (err) {
    console.log(`\n  ⚠️  fichier ${slug}: ${err.message} — fallback public`);
    imageCache.set(slug, fallback);
    return fallback;
  }
}

function bookImage(slug) {
  const url = BOOK_COVERS[slug];
  if (!url) return null;
  return { url, alt: { fr: `Couverture ${slug}`, en: `${slug} cover` } };
}

async function hydrateCarnetImages(data) {
  for (const doc of data.resource ?? []) {
    doc.image = await carnetImage(doc.slug);
  }
  for (const doc of data.community ?? []) {
    doc.image = await carnetImage(doc.slug);
  }
  for (const doc of data.book ?? []) {
    doc.image = bookImage(doc.slug);
  }
}

// --- données de seed ---------------------------------------------------------
const seed = {
  homePage: buildHomePageContent(),
  aboutPage: buildAboutPageContent(),
  cvPage: buildCvPageContent(),
  siteSettings: buildSiteSettingsContent(),
  service: buildServices(),
  blogPost: buildBlogPosts(),
  testimonial: buildTestimonials(),
  resource: buildResources(),
  community: buildCommunities(),
  book: buildBooks(),
  reference: buildReferences(),
  cvEntry: buildCvEntries(),
};


// --- insertion ---------------------------------------------------------------
const singletons = ["homePage", "aboutPage", "cvPage", "siteSettings"];

console.log("\n🖼️  Préparation des visuels carnet…");
await hydrateCarnetImages(seed);

console.log("\n📥  Initialisation additive (les contenus existants sont préservés)…\n");

for (const [type, value] of Object.entries(seed)) {
  process.stdout.write(`  ${type.padEnd(16)} `);
  try {
    if (singletons.includes(type)) {
      await insertIfMissing(type, type, value, 0);
    } else {
      for (const [position, doc] of value.entries()) {
        const { id: stableId, ...docData } = doc;
        const docId = doc.slug ?? stableId ?? doc.name?.fr ?? id(type);
        await insertIfMissing(type, docId, docData, position);
      }
    }
    console.log(" ✅");
  } catch (err) {
    console.log(` ❌  ${err.message}`);
  }
}

console.log("\n🎉  Initialisation terminée. Aucun contenu existant n'a été écrasé.\n");
