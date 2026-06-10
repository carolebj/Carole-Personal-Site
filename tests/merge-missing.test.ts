import assert from "node:assert/strict";
import test from "node:test";
import { mergeMissing } from "../scripts/lib/merge-missing.mjs";

test("mergeMissing fills empty localized values without overwriting editorial content", () => {
  const current = {
    title: { fr: "Titre ajusté", en: "" },
    image: null,
    items: [{ fr: "Premier", en: "" }],
  };
  const source = {
    title: { fr: "Titre initial", en: "English title" },
    image: { url: "https://example.com/image.webp" },
    items: [{ fr: "Initial", en: "First" }, { fr: "Deuxième", en: "Second" }],
  };

  assert.deepEqual(mergeMissing(current, source), {
    title: { fr: "Titre ajusté", en: "English title" },
    image: { url: "https://example.com/image.webp" },
    items: [
      { fr: "Premier", en: "First" },
      { fr: "Deuxième", en: "Second" },
    ],
  });
});

test("mergeMissing preserves false, zero, and non-empty arrays", () => {
  assert.deepEqual(
    mergeMissing(
      { featured: false, position: 0, tags: ["existing"] },
      { featured: true, position: 4, tags: ["replacement"] },
    ),
    { featured: false, position: 0, tags: ["existing"] },
  );
});
