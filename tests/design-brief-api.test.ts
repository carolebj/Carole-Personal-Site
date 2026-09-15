// @ts-nocheck
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  buildDesignBriefSubmissionRow,
  createDesignBriefAssetReceipt,
  designBriefRowsMatch,
  handleDesignBrief,
  isSameOriginDesignBriefRequest,
} from "../api/design-brief.js";
import {
  DESIGN_BRIEF_MAX_BODY_BYTES,
  validateDesignBriefPayload,
} from "../shared/design-brief-contract.js";
import {
  DesignBriefApiError,
  designBriefUploadForRetry,
  invalidateExpiredDesignBriefUploads,
  prepareDesignBriefUpload,
  submitDesignBrief,
} from "../src/app/designBrief/api.ts";

const originalSupabaseUrl = process.env.SUPABASE_URL;
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalHashPepper = process.env.ESTIMATOR_HASH_PEPPER;
const submissionId = "11111111-1111-4111-8111-111111111111";
const assetPath = `${submissionId}/22222222-2222-4222-8222-222222222222.png`;
const hashPepper = "test-pepper-at-least-32-characters-long";

beforeEach(() => {
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key";
  process.env.ESTIMATOR_HASH_PEPPER = hashPepper;
});

afterEach(() => {
  process.env.SUPABASE_URL = originalSupabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
  process.env.ESTIMATOR_HASH_PEPPER = originalHashPepper;
});

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    json(body) { this.body = body; return this; },
  };
}

function request(body, headers = {}) {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://www.carolebj.com",
      host: "www.carolebj.com",
      "x-vercel-forwarded-for": "203.0.113.8",
      ...headers,
    },
    body,
  };
}

function payload(overrides = {}) {
  return {
    action: "submit",
    submissionId,
    website: "",
    answers: {
      clientName: "Studio Awa",
      contactPerson: "Awa — fondatrice",
      contactEmail: "awa@example.com",
      projectType: "Identité visuelle complète",
      activity: "Une marque éditoriale chaleureuse.",
      logoStyles: ["Logotype / wordmark", "Monogramme"],
      inspirationLinks: "https://example.com/reference notes-sans-url",
    },
    colors: ["#854d63", "#ffd9e4"],
    assets: [],
    ...overrides,
  };
}

function signedAsset(overrides = {}) {
  const asset = {
    path: assetPath,
    name: "moodboard.png",
    mimeType: "image/png",
    size: 1_024,
    expiresAt: Date.now() + 7_200_000,
    ...overrides,
  };
  return {
    ...asset,
    receipt: createDesignBriefAssetReceipt(hashPepper, { submissionId, ...asset }),
  };
}

function fileBlob(mimeType, size) {
  const bytes = new Uint8Array(size);
  const signatures = {
    "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    "image/jpeg": [0xff, 0xd8, 0xff],
    "image/webp": [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
    "image/gif": [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
  };
  bytes.set(signatures[mimeType] ?? []);
  return new Blob([bytes], { type: mimeType });
}

function createFakeSupabase({ existing = null, storedAssets = [], storedFiles = {}, signedError = null, insertError = null } = {}) {
  const calls = { inserted: [], createSigned: [], listed: [], downloaded: [] };
  const table = {
    select() { return this; },
    eq() { return this; },
    async maybeSingle() { return { data: existing, error: null }; },
    async insert(row) { calls.inserted.push(row); return { data: null, error: insertError }; },
  };
  const storage = {
    async createSignedUploadUrl(path) {
      calls.createSigned.push(path);
      return signedError
        ? { data: null, error: signedError }
        : { data: { path, token: "signed-upload-token", signedUrl: `https://storage.test/${path}` }, error: null };
    },
    async list(prefix) {
      calls.listed.push(prefix);
      return { data: storedAssets, error: null };
    },
    async download(path) {
      calls.downloaded.push(path);
      const stored = storedAssets.find((item) => `${submissionId}/${item.name}` === path);
      const file = storedFiles[path] ?? (stored?.metadata ? fileBlob(stored.metadata.mimetype, Number(stored.metadata.size)) : null);
      return file ? { data: file, error: null } : { data: null, error: new Error("missing") };
    },
  };
  return {
    calls,
    client: {
      from(name) { assert.equal(name, "design_brief_submissions"); return table; },
      storage: { from(name) { assert.equal(name, "brief-assets"); return storage; } },
    },
  };
}

const allowQuota = async () => new Response("true", { status: 200, headers: { "Content-Type": "application/json" } });

test("Design Brief contract preserves the legacy row shape and reference fields", () => {
  const parsed = validateDesignBriefPayload(payload());
  assert.equal(parsed.ok, true);
  const row = buildDesignBriefSubmissionRow(parsed.value);
  assert.equal(row.id, submissionId);
  assert.equal(row.client_name, "Studio Awa");
  assert.equal(row.contact_email, "awa@example.com");
  assert.deepEqual(row.logo_styles, ["Logotype / wordmark", "Monogramme"]);
  assert.deepEqual(row.color_palette, ["#854d63", "#ffd9e4"]);
  assert.deepEqual(row.inspiration_links, ["https://example.com/reference"]);
  assert.deepEqual(row.asset_paths, []);
  assert.equal(row.answers.activity, "Une marque éditoriale chaleureuse.");
});

test("Design Brief preserves the complete guidance fallback in project_type", () => {
  const guidanceNeed = "x".repeat(4_000);
  const parsed = validateDesignBriefPayload(payload({
    answers: { guidanceNeed },
  }));
  assert.equal(parsed.ok, true);
  assert.equal(buildDesignBriefSubmissionRow(parsed.value).project_type, guidanceNeed);
});

test("Design Brief contract rejects unknown fields, oversized answers, and invalid assets", () => {
  assert.equal(validateDesignBriefPayload(payload({ answers: { unexpected: "value" } })).ok, false);
  assert.equal(validateDesignBriefPayload(payload({ answers: { activity: "x".repeat(4_001) } })).ok, false);
  assert.equal(validateDesignBriefPayload(payload({ assets: [{ path: assetPath, name: "ref.svg", mimeType: "image/svg+xml", size: 100, receipt: "0".repeat(64), expiresAt: Date.now() + 1_000 }] })).ok, false);
  assert.equal(validateDesignBriefPayload(payload({ assets: [{ path: assetPath, name: "ref.png", mimeType: "image/png", size: 5_242_881, receipt: "0".repeat(64), expiresAt: Date.now() + 1_000 }] })).ok, false);
});

test("Design Brief requires an exact same-origin browser request", () => {
  assert.equal(isSameOriginDesignBriefRequest(request(payload())), true);
  assert.equal(isSameOriginDesignBriefRequest(request(payload(), { origin: "https://evil.example" })), false);
  assert.equal(isSameOriginDesignBriefRequest(request(payload(), { origin: "" })), false);
});

test("Design Brief rejects the actual serialized body size without trusting Content-Length", async () => {
  const response = responseRecorder();
  let clientCreated = false;
  await handleDesignBrief(request(payload({ answers: { activity: "é".repeat(DESIGN_BRIEF_MAX_BODY_BYTES) } }), {
    "content-length": "100",
  }), response, {
    fetchImpl: async () => { throw new Error("unexpected fetch"); },
    createClientImpl: () => { clientCreated = true; },
  });
  assert.equal(response.statusCode, 413);
  assert.equal(clientCreated, false);
});

test("Design Brief creates a signed upload path behind durable quotas", async () => {
  const fake = createFakeSupabase();
  const quotaCalls = [];
  const response = responseRecorder();
  await handleDesignBrief(request({
    action: "prepare-upload",
    submissionId,
    website: "",
    file: { name: "moodboard.png", mimeType: "image/png", size: 1_024 },
  }), response, {
    fetchImpl: async (_url, options) => {
      quotaCalls.push(JSON.parse(options.body));
      return allowQuota();
    },
    createClientImpl: () => fake.client,
  });
  assert.equal(response.statusCode, 201);
  assert.match(response.body.path, new RegExp(`^${submissionId}/[0-9a-f-]{36}\\.png$`, "i"));
  assert.equal(response.body.token, "signed-upload-token");
  assert.match(response.body.receipt, /^[0-9a-f]{64}$/);
  assert.ok(response.body.expiresAt > Date.now());
  assert.equal(quotaCalls.length, 2);
  assert.deepEqual(quotaCalls.map((call) => call.p_limit), [24, 12]);
  assert.ok(quotaCalls.every((call) => /^[0-9a-f]{64}$/.test(call.p_scope_hash)));
  assert.ok(quotaCalls.every((call) => !JSON.stringify(call).includes("203.0.113.8")));
});

test("Design Brief fails closed when the durable quota is unavailable", async () => {
  const fake = createFakeSupabase();
  const response = responseRecorder();
  await handleDesignBrief(request({
    action: "prepare-upload",
    submissionId,
    website: "",
    file: { name: "moodboard.png", mimeType: "image/png", size: 1_024 },
  }), response, {
    fetchImpl: async () => new Response("unavailable", { status: 503 }),
    createClientImpl: () => fake.client,
  });
  assert.equal(response.statusCode, 503);
  assert.equal(fake.calls.createSigned.length, 0);
});

test("Design Brief fails closed on a malformed durable quota response", async () => {
  const fake = createFakeSupabase();
  const response = responseRecorder();
  await handleDesignBrief(request({
    action: "prepare-upload",
    submissionId,
    website: "",
    file: { name: "moodboard.png", mimeType: "image/png", size: 1_024 },
  }), response, {
    fetchImpl: async () => new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }),
    createClientImpl: () => fake.client,
  });
  assert.equal(response.statusCode, 503);
  assert.equal(fake.calls.createSigned.length, 0);
});

test("Design Brief verifies the exact downloaded MIME and size before inserting", async () => {
  const submitted = payload({
    assets: [signedAsset()],
  });
  const fake = createFakeSupabase({
    storedAssets: [{ name: assetPath.split("/")[1], id: "object-id", metadata: { size: 2_048, mimetype: "image/png" } }],
  });
  const response = responseRecorder();
  await handleDesignBrief(request(submitted), response, {
    fetchImpl: allowQuota,
    createClientImpl: () => fake.client,
  });
  assert.equal(response.statusCode, 422);
  assert.equal(fake.calls.inserted.length, 0);
});

test("Design Brief ignores an expired abandoned object when the declared replacement is valid", async () => {
  const abandonedPath = `${submissionId}/33333333-3333-4333-8333-333333333333.png`;
  const replacementPath = `${submissionId}/44444444-4444-4444-8444-444444444444.png`;
  const replacement = signedAsset({ path: replacementPath, name: "replacement.png" });
  const fake = createFakeSupabase({
    storedAssets: [
      { name: abandonedPath.split("/")[1], id: "abandoned", metadata: { size: 1_024, mimetype: "image/png" } },
      { name: replacementPath.split("/")[1], id: "replacement", metadata: { size: 1_024, mimetype: "image/png" } },
    ],
  });
  const response = responseRecorder();
  await handleDesignBrief(request(payload({ assets: [replacement] })), response, {
    fetchImpl: allowQuota,
    createClientImpl: () => fake.client,
  });
  assert.equal(response.statusCode, 201);
  assert.deepEqual(fake.calls.downloaded, [replacementPath]);
  assert.deepEqual(fake.calls.inserted[0].asset_paths, [replacementPath]);
  assert.equal(fake.calls.listed.length, 0);
});

test("Design Brief ignores a partial upload removed from the declared replacement set", async () => {
  const partialPath = `${submissionId}/55555555-5555-4555-8555-555555555555.jpg`;
  const replacementPath = `${submissionId}/66666666-6666-4666-8666-666666666666.jpg`;
  const replacement = signedAsset({
    path: replacementPath,
    name: "final-reference.jpg",
    mimeType: "image/jpeg",
    size: 2_048,
  });
  const fake = createFakeSupabase({
    storedAssets: [
      { name: partialPath.split("/")[1], id: "partial", metadata: { size: 900, mimetype: "image/jpeg" } },
      { name: replacementPath.split("/")[1], id: "replacement", metadata: { size: 2_048, mimetype: "image/jpeg" } },
    ],
  });
  const response = responseRecorder();
  await handleDesignBrief(request(payload({ assets: [replacement] })), response, {
    fetchImpl: allowQuota,
    createClientImpl: () => fake.client,
  });
  assert.equal(response.statusCode, 201);
  assert.deepEqual(fake.calls.downloaded, [replacementPath]);
  assert.deepEqual(fake.calls.inserted[0].asset_paths, [replacementPath]);
  assert.equal(fake.calls.listed.length, 0);
});

test("Design Brief cannot attach a foreign object without its valid receipt", async () => {
  const foreignPath = `${submissionId}/77777777-7777-4777-8777-777777777777.png`;
  const foreign = {
    ...signedAsset({ path: foreignPath, name: "foreign.png" }),
    receipt: "0".repeat(64),
  };
  const fake = createFakeSupabase({
    storedAssets: [{ name: foreignPath.split("/")[1], id: "foreign", metadata: { size: 1_024, mimetype: "image/png" } }],
  });
  const response = responseRecorder();
  await handleDesignBrief(request(payload({ assets: [foreign] })), response, {
    fetchImpl: allowQuota,
    createClientImpl: () => fake.client,
  });
  assert.equal(response.statusCode, 422);
  assert.equal(response.body.error, "invalid_asset");
  assert.equal(fake.calls.downloaded.length, 0);
  assert.equal(fake.calls.inserted.length, 0);
});

test("Design Brief rejects a forged asset receipt and mismatched file signature", async () => {
  const forged = createFakeSupabase({
    storedAssets: [{ name: assetPath.split("/")[1], id: "object-id", metadata: { size: 1_024, mimetype: "image/png" } }],
  });
  const forgedResponse = responseRecorder();
  await handleDesignBrief(request(payload({ assets: [{ ...signedAsset(), receipt: "0".repeat(64) }] })), forgedResponse, {
    fetchImpl: allowQuota,
    createClientImpl: () => forged.client,
  });
  assert.equal(forgedResponse.statusCode, 422);
  assert.equal(forged.calls.downloaded.length, 0);

  const wrongBytes = createFakeSupabase({
    storedAssets: [{ name: assetPath.split("/")[1], id: "object-id", metadata: { size: 1_024, mimetype: "image/png" } }],
    storedFiles: { [assetPath]: new Blob([new Uint8Array(1_024)], { type: "image/png" }) },
  });
  const wrongBytesResponse = responseRecorder();
  await handleDesignBrief(request(payload({ assets: [signedAsset()] })), wrongBytesResponse, {
    fetchImpl: allowQuota,
    createClientImpl: () => wrongBytes.client,
  });
  assert.equal(wrongBytesResponse.statusCode, 422);
  assert.equal(wrongBytes.calls.inserted.length, 0);
});

test("Design Brief rejects an expired asset before quota, download, or insertion", async () => {
  const expired = signedAsset({ expiresAt: 1_700_000_000_000 });
  const fake = createFakeSupabase({
    storedAssets: [{ name: assetPath.split("/")[1], id: "object-id", metadata: { size: 1_024, mimetype: "image/png" } }],
  });
  let quotaCalls = 0;
  const response = responseRecorder();
  await handleDesignBrief(request(payload({ assets: [expired] })), response, {
    fetchImpl: async () => { quotaCalls += 1; return allowQuota(); },
    createClientImpl: () => fake.client,
    now: () => 1_800_000_000_000,
  });
  assert.equal(response.statusCode, 422);
  assert.equal(response.body.error, "expired_asset");
  assert.equal(quotaCalls, 0);
  assert.equal(fake.calls.downloaded.length, 0);
  assert.equal(fake.calls.inserted.length, 0);
});

test("Design Brief keeps an already-persisted expired-asset retry idempotent", async () => {
  const expired = signedAsset({ expiresAt: 1_700_000_000_000 });
  const parsed = validateDesignBriefPayload(payload({ assets: [expired] }));
  assert.equal(parsed.ok, true);
  const fake = createFakeSupabase({ existing: buildDesignBriefSubmissionRow(parsed.value) });
  let quotaCalls = 0;
  const response = responseRecorder();
  await handleDesignBrief(request(payload({ assets: [expired] })), response, {
    fetchImpl: async () => { quotaCalls += 1; return allowQuota(); },
    createClientImpl: () => fake.client,
    now: () => 1_800_000_000_000,
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.duplicate, true);
  assert.equal(quotaCalls, 0);
  assert.equal(fake.calls.downloaded.length, 0);
});

test("Design Brief browser retry keeps a stable expired receipt until the server rejects it", () => {
  const expired = signedAsset({ expiresAt: 1_700_000_000_000 });
  assert.equal(designBriefUploadForRetry(expired), expired);
  const current = [{ id: "file-1", uploaded: expired }];
  const invalidated = invalidateExpiredDesignBriefUploads(current, 1_800_000_000_000);
  assert.equal(invalidated[0].uploaded, undefined);
  assert.equal(current[0].uploaded, expired);
});

test("Design Brief inserts a verified legacy-compatible row with service-role client", async () => {
  const submitted = payload({
    assets: [signedAsset()],
  });
  const fake = createFakeSupabase({
    storedAssets: [{ name: assetPath.split("/")[1], id: "object-id", metadata: { size: 1_024, mimetype: "image/png" } }],
  });
  let credentials;
  const response = responseRecorder();
  await handleDesignBrief(request(submitted), response, {
    fetchImpl: allowQuota,
    createClientImpl: (url, key) => { credentials = { url, key }; return fake.client; },
  });
  assert.equal(response.statusCode, 201);
  assert.deepEqual(credentials, { url: "https://project.supabase.co", key: "service-role-test-key" });
  assert.equal(fake.calls.inserted.length, 1);
  assert.deepEqual(fake.calls.inserted[0].asset_paths, [assetPath]);
  assert.deepEqual(fake.calls.inserted[0].answers.inspirationFileNames, ["moodboard.png"]);
});

test("Design Brief retry is idempotent while conflicting reuse is rejected", async () => {
  const parsed = validateDesignBriefPayload(payload());
  const existing = buildDesignBriefSubmissionRow(parsed.value);
  assert.equal(designBriefRowsMatch(existing, existing), true);

  const identical = createFakeSupabase({ existing });
  let quotaCalls = 0;
  const repeatResponse = responseRecorder();
  await handleDesignBrief(request(payload()), repeatResponse, {
    fetchImpl: async () => { quotaCalls += 1; return allowQuota(); },
    createClientImpl: () => identical.client,
  });
  assert.equal(repeatResponse.statusCode, 200);
  assert.equal(repeatResponse.body.duplicate, true);
  assert.equal(quotaCalls, 0);
  assert.equal(identical.calls.inserted.length, 0);

  const conflicting = createFakeSupabase({ existing: { ...existing, client_name: "Autre projet" } });
  const conflictResponse = responseRecorder();
  await handleDesignBrief(request(payload()), conflictResponse, {
    fetchImpl: async () => { throw new Error("quota must not run"); },
    createClientImpl: () => conflicting.client,
  });
  assert.equal(conflictResponse.statusCode, 409);
});

test("Design Brief browser client accepts only explicit JSON API responses", async () => {
  const prepared = await prepareDesignBriefUpload({
    submissionId,
    website: "",
    file: { name: "moodboard.png", mimeType: "image/png", size: 1_024 },
  }, async (_url, options) => {
    const sent = JSON.parse(options.body);
    assert.equal(sent.action, "prepare-upload");
    return new Response(JSON.stringify({ path: assetPath, token: "token", receipt: "a".repeat(64), expiresAt: Date.now() + 7_200_000, expiresInSeconds: 7_200 }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  });
  assert.equal(prepared.path, assetPath);

  await assert.rejects(
    submitDesignBrief({ submissionId, website: "", answers: {}, colors: [], assets: [] }, async () => new Response("<!doctype html>", { status: 200, headers: { "Content-Type": "text/html" } })),
    (error) => error instanceof DesignBriefApiError && error.code === "request_failed",
  );
});
