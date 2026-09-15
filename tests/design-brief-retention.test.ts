// @ts-nocheck
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DESIGN_BRIEF_ORPHAN_GRACE_MS,
  classifyDesignBriefAssets,
  collectClientBriefAssetReferences,
  collectDesignBriefAssetReferences,
} from "../shared/design-brief-retention.js";

const now = Date.parse("2026-09-14T12:00:00Z");

test("Design Brief retention preserves every legacy and current referenced path", () => {
  const references = collectDesignBriefAssetReferences([
    { asset_paths: ["legacy-id/reference.jpg", "bridge-id/reference.png"] },
    { asset_paths: ["legacy-id/reference.jpg", null, ""] },
  ]);
  assert.deepEqual([...references], ["legacy-id/reference.jpg", "bridge-id/reference.png"]);

  const classified = classifyDesignBriefAssets([
    { path: "legacy-id/reference.jpg", createdAt: "2020-01-01T00:00:00Z" },
    { path: "bridge-id/reference.png", createdAt: "2020-01-01T00:00:00Z" },
  ], references, { now });
  assert.equal(classified.referenced.length, 2);
  assert.equal(classified.candidates.length, 0);
});

test("Design Brief retention only proposes unreferenced objects older than 30 days", () => {
  const classified = classifyDesignBriefAssets([
    { path: "old/orphan.png", createdAt: new Date(now - DESIGN_BRIEF_ORPHAN_GRACE_MS - 1).toISOString() },
    { path: "recent/orphan.png", createdAt: new Date(now - DESIGN_BRIEF_ORPHAN_GRACE_MS + 1).toISOString() },
    { path: "unknown/orphan.png", createdAt: null },
  ], new Set(), { now });
  assert.deepEqual(classified.candidates.map((object) => object.path), ["old/orphan.png"]);
  assert.deepEqual(classified.recent.map((object) => object.path), ["recent/orphan.png"]);
  assert.deepEqual(classified.unknownAge.map((object) => object.path), ["unknown/orphan.png"]);
});

test("Design Brief retention reclassification protects a newly referenced candidate", () => {
  const object = { path: "old/orphan.png", createdAt: "2020-01-01T00:00:00Z" };
  assert.equal(classifyDesignBriefAssets([object], new Set(), { now }).candidates.length, 1);
  assert.equal(classifyDesignBriefAssets([object], new Set([object.path]), { now }).candidates.length, 0);
});

test("Design Brief inventory preserves modern assets older than 30 days across every known source", () => {
  const references = collectClientBriefAssetReferences({
    assets: [{ storage_bucket: "brief-assets", storage_path: "instance-a/pending.png", deleted_at: null }],
    submissions: [{ payload: { asset_paths: ["instance-b/submitted.pdf"] } }],
    challenges: [{ brief_payload: { assets: [{ path: "instance-c/challenge.jpg" }] } }],
    deletionLogs: [{ storage_bucket: "brief-assets", storage_path: "instance-d/queued.webp", storage_cleanup_required: true }],
  });
  const oldObjects = [...references].map((path) => ({ path, createdAt: "2020-01-01T00:00:00Z" }));
  const classified = classifyDesignBriefAssets(oldObjects, references, { now });
  assert.equal(classified.referenced.length, 4);
  assert.equal(classified.candidates.length, 0);
});
