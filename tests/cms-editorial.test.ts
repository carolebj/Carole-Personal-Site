import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { contentTypes } from "../src/admin/schema.ts";
import { validateDocument } from "../src/admin/validation.ts";
import { moveDocument, resequenceDocuments } from "../src/admin/order.ts";
import { cmsFallback, cmsSuccess } from "../src/cms/cmsState.ts";
import {
  documentsEqual,
  markPublished,
  markTrashed,
  markUnpublished,
  restoreFromTrash,
  saveAsDraft,
} from "../src/admin/editorial.ts";
import type { AnyDoc } from "../src/admin/store.ts";

function doc(values: Record<string, unknown>): AnyDoc {
  return { id: "test", status: "draft", position: 0, ...values };
}

test("bilingual content blocks publication when English essentials are missing", () => {
  const blog = contentTypes.find((type) => type.name === "blogPost");
  assert.ok(blog);
  const issues = validateDocument(blog, doc({
    slug: "article-test",
    title: { fr: "Titre", en: "" },
    excerpt: { fr: "Extrait", en: "" },
    body: { fr: "Corps", en: "" },
  }));
  assert.ok(issues.some((issue) => issue.message.includes("anglais")));
});

test("French-first collections do not block on missing English", () => {
  const testimonial = contentTypes.find((type) => type.name === "testimonial");
  assert.ok(testimonial);
  const issues = validateDocument(testimonial, doc({
    name: "Cliente",
    quote: { fr: "Très bon accompagnement", en: "" },
  }));
  assert.equal(issues.filter((issue) => issue.severity === "error").length, 0);
  assert.ok(issues.some((issue) => issue.severity === "warning" && issue.locale === "en"));
});

test("slug and URL formats are validated", () => {
  const service = contentTypes.find((type) => type.name === "service");
  assert.ok(service);
  const issues = validateDocument(service, doc({
    slug: "Slug invalide",
    title: { fr: "Service", en: "Service" },
  }));
  assert.ok(issues.some((issue) => issue.path === "slug"));
});

test("dates and image URLs are validated by field type", () => {
  const blog = contentTypes.find((type) => type.name === "blogPost");
  assert.ok(blog);
  const issues = validateDocument(blog, doc({
    slug: "article-test",
    title: { fr: "Titre", en: "Title" },
    excerpt: { fr: "Extrait", en: "Excerpt" },
    body: { fr: "Corps", en: "Body" },
    publishedAt: "10/06/2026",
    coverImage: { url: "javascript:alert(1)", alt: { fr: "Image", en: "Image" } },
  }));
  assert.ok(issues.some((issue) => issue.path === "publishedAt"));
  assert.ok(issues.some((issue) => issue.path === "coverImage"));
});

test("manual ordering always produces contiguous positions", () => {
  const docs = ["a", "b", "c"].map((id, position) => doc({ id, position }));
  const moved = moveDocument(docs, "c", -1);
  assert.deepEqual(moved.map((item) => item.id), ["a", "c", "b"]);
  assert.deepEqual(resequenceDocuments(moved).map((item) => item.position), [0, 1, 2]);
});

test("editorial transitions preserve the working copy and publication metadata", () => {
  const now = "2026-06-10T10:00:00.000Z";
  const original = doc({ title: { fr: "Titre" } });
  const draft = saveAsDraft(original, now);
  assert.equal(draft.status, "draft");
  assert.deepEqual(draft.title, original.title);

  const published = markPublished(draft, now);
  assert.equal(published.status, "published");
  assert.equal(published.publishedAtMeta, now);

  const unpublished = markUnpublished(published, now);
  assert.equal(unpublished.status, "draft");
  assert.equal(unpublished.publishedAtMeta, undefined);

  const trashed = markTrashed(published, now);
  assert.equal(trashed.status, "trashed");
  assert.equal(trashed.deletedAt, now);
  assert.equal(trashed.publishedAtMeta, undefined);

  const restored = restoreFromTrash(trashed, now);
  assert.equal(restored.status, "draft");
  assert.equal(restored.deletedAt, undefined);
});

test("dirty comparison ignores JSON object key order", () => {
  const fromSupabase = doc({ title: { en: "Title", fr: "Titre" } });
  const fromForm = doc({ title: { fr: "Titre", en: "Title" } });
  assert.equal(documentsEqual(fromSupabase, fromForm), true);
  assert.equal(documentsEqual(fromSupabase, doc({ title: { fr: "Autre", en: "Title" } })), false);
});

test("CMS failures retain fallback while successful empty collections stay authoritative", () => {
  const fallback = [{ id: "fallback" }];
  const failed = cmsFallback(fallback, new Error("offline"));
  assert.equal(failed.usingCms, false);
  assert.equal(failed.data, fallback);
  assert.equal(failed.error, "offline");

  const empty = cmsSuccess<unknown[]>([]);
  assert.equal(empty.usingCms, true);
  assert.deepEqual(empty.data, []);
});

test("migration defines transactional publication and private working data", async () => {
  const sql = await readFile("supabase/migrations/20260610194517_editorial_workflow.sql", "utf8");
  assert.match(sql, /cms_publish_document/);
  assert.match(sql, /cms_public_documents/);
  assert.match(sql, /drop policy if exists "cms public read"/);
  assert.match(sql, /offset 10/);
  assert.match(sql, /revoke execute .* from public, anon/);
  assert.match(sql, /revoke all on table public\.cms_public_documents from anon/);
  assert.match(sql, /grant select on table public\.cms_public_documents to anon/);
  assert.match(sql, /select auth\.uid\(\)/);
  assert.doesNotMatch(sql, /cms authenticated publish"\s+on public\.cms_public_documents for all/i);
  assert.match(sql, /insert into public\.cms_revisions/);
});
