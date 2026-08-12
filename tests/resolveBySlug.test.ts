import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeSlug,
  resolveBySlug,
  SERVICE_SLUG_ALIASES,
} from "../src/app/routing/resolveBySlug.ts";

const blogPosts = [
  { slug: "cas-client-coworking-cotonou", title: "A" },
  { slug: "calendrier-editorial-campagne-lancement", title: "B" },
];

const services = [
  { slug: "communication-digitale", title: "Com digitale" },
  { slug: "creation-contenus", title: "Contenus" },
  { slug: "identite-visuelle", title: "Identité" },
];

test("resolveBySlug returns undefined for unknown blog slug (no soft-404 fallback)", () => {
  assert.equal(resolveBySlug(blogPosts, "slug-inexistant"), undefined);
  assert.equal(resolveBySlug(blogPosts, ""), undefined);
  assert.equal(resolveBySlug(blogPosts, undefined), undefined);
});

test("resolveBySlug finds an exact blog slug", () => {
  assert.equal(resolveBySlug(blogPosts, "cas-client-coworking-cotonou")?.title, "A");
});

test("resolveBySlug returns undefined for unknown service slug", () => {
  assert.equal(resolveBySlug(services, "service-fantome", SERVICE_SLUG_ALIASES), undefined);
});

test("resolveBySlug honours service aliases without falling back to first item", () => {
  assert.equal(
    resolveBySlug(services, "direction-social-media", SERVICE_SLUG_ALIASES)?.slug,
    "communication-digitale",
  );
  assert.equal(
    resolveBySlug(services, "graphic-design", SERVICE_SLUG_ALIASES)?.slug,
    "identite-visuelle",
  );
  assert.notEqual(
    resolveBySlug(services, "unknown-alias", SERVICE_SLUG_ALIASES)?.slug,
    services[0].slug,
  );
});

test("normalizeSlug applies aliases", () => {
  assert.equal(normalizeSlug("content-creation", SERVICE_SLUG_ALIASES), "creation-contenus");
  assert.equal(normalizeSlug("creation-contenus", SERVICE_SLUG_ALIASES), "creation-contenus");
});
