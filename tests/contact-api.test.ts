// @ts-nocheck
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, test } from "node:test";
import handler from "../api/contact.js";
import { renderContactEmail } from "../api/contact-email.js";
import { isSuccessfulContactResponse } from "../src/app/components/contactResponse.ts";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.CONTACT_FROM_EMAIL;
const originalSupabaseUrl = process.env.SUPABASE_URL;
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalHashPepper = process.env.ESTIMATOR_HASH_PEPPER;

beforeEach(() => {
  process.env.RESEND_API_KEY = "server-test-key";
  process.env.CONTACT_FROM_EMAIL = "Carole Tonoukouen <contact@example.com>";
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key";
  process.env.ESTIMATOR_HASH_PEPPER = "test-pepper-at-least-32-characters-long";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.RESEND_API_KEY = originalApiKey;
  process.env.CONTACT_FROM_EMAIL = originalFrom;
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

test("contact delivery keeps secrets server-side and marks messages important", async () => {
  process.env.RESEND_API_KEY = "server-test-key";
  process.env.CONTACT_FROM_EMAIL = "Carole Tonoukouen <contact@example.com>";
  let outbound;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("consume_estimator_rate_limit")) {
      return new Response("true", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    outbound = options;
    return { ok: true };
  };

  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { name: "Awa", email: "awa@example.com", subject: "Audit", message: "Bonjour" },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(outbound.headers.Authorization, "Bearer server-test-key");
  const payload = JSON.parse(outbound.body);
  assert.equal(payload.from, "Carole Tonoukouen <contact@example.com>");
  assert.deepEqual(payload.to, ["caroletonoukouen@gmail.com"]);
  assert.equal(payload.reply_to, "awa@example.com");
  assert.equal(payload.subject, "[Carole Site] Audit");
  assert.equal(payload.headers["X-Priority"], "1");
  assert.equal(payload.headers.Importance, "high");
  assert.match(payload.html, /NOUVEAU MESSAGE DEPUIS CAROLEBJ\.COM/);
  assert.match(payload.html, /Répondre à Awa/);
  assert.match(payload.html, /mailto:awa@example\.com\?subject=Re%3A%20Audit/);
});

test("contact email escapes untrusted form content", () => {
  const html = renderContactEmail({
    name: "<Awa>",
    email: "awa@example.com",
    subject: 'Audit "urgent"',
    message: "Bonjour\n<script>alert(1)</script>",
    receivedAt: new Date("2026-07-12T20:35:00Z"),
  });

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Audit &quot;urgent&quot;/);
  assert.match(html, /12 juillet 2026 · 21:35/);
});

test("contact delivery rejects the honeypot", async () => {
  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { name: "Bot", email: "bot@example.com", message: "Spam", website: "https://spam.test" },
  }, response);
  assert.equal(response.statusCode, 400);
});

test("contact delivery rejects the actual serialized body above 12 KB without trusting Content-Length", async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => { fetchCalled = true; return new Response("true"); };
  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: { "content-type": "application/json", "content-length": "100" },
    body: { name: "Awa", email: "awa@example.com", message: "x".repeat(12_000) },
  }, response);
  assert.equal(response.statusCode, 413);
  assert.equal(fetchCalled, false);
});

test("contact delivery enforces the durable Supabase rate limit before Resend", async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response("false", { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.8" },
    body: { name: "Awa", email: "awa@example.com", message: "Bonjour" },
  }, response);
  assert.equal(response.statusCode, 429);
  assert.equal(response.headers["Retry-After"], "600");
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /consume_estimator_rate_limit/);
  const rpcBody = JSON.parse(calls[0].options.body);
  assert.equal(rpcBody.p_limit, 5);
  assert.equal(rpcBody.p_window_seconds, 600);
  assert.match(rpcBody.p_scope_hash, /^[0-9a-f]{64}$/);
  assert.doesNotMatch(calls[0].options.body, /203\.0\.113\.8/);
});

test("contact quota uses the Vercel address before other forwarded headers", async () => {
  let scope;
  globalThis.fetch = async (_url, options) => {
    scope = JSON.parse(options.body).p_scope_hash;
    return new Response("false");
  };
  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-vercel-forwarded-for": "203.0.113.8",
      "x-forwarded-for": "198.51.100.9",
      "x-real-ip": "198.51.100.10",
    },
    body: { name: "Awa", email: "awa@example.com", message: "Bonjour" },
  }, response);
  assert.equal(response.statusCode, 429);
  assert.equal(scope, createHmac("sha256", process.env.ESTIMATOR_HASH_PEPPER)
    .update("contact-rate-limit\0" + "203.0.113.8").digest("hex"));
});

test("contact rejects oversized UTF-8 bodies even below 12000 characters", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("unexpected fetch"); };
  const response = responseRecorder();
  const body = { name: "Awa", email: "awa@example.com", message: "é".repeat(6000) };
  assert.ok(JSON.stringify(body).length < 12_000);
  await handler({ method: "POST", headers: { "content-type": "application/json" }, body }, response);
  assert.equal(response.statusCode, 413);
  assert.equal(calls, 0);
});

test("contact rejects malformed and non-boolean quota responses without sending email", async () => {
  for (const payload of ["not-json", '"true"', "null", "{}", "1"]) {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response(payload); };
    const response = responseRecorder();
    await handler({
      method: "POST",
      headers: { "content-type": "application/json" },
      body: { name: "Awa", email: "awa@example.com", message: "Bonjour" },
    }, response);
    assert.equal(response.statusCode, 503, payload);
    assert.equal(calls, 1, "only the quota RPC may be called");
  }
});

test("contact delivery fails closed when the durable rate limiter is unavailable", async () => {
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { name: "Awa", email: "awa@example.com", message: "Bonjour" },
  }, response);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { error: "contact_service_unavailable" });
});

test("contact delivery fails closed when the durable rate limiter cannot be reached", async () => {
  globalThis.fetch = async () => { throw new Error("network unavailable"); };
  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { name: "Awa", email: "awa@example.com", message: "Bonjour" },
  }, response);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { error: "contact_service_unavailable" });
});

test("contact delivery stays unavailable without server credentials", async () => {
  delete process.env.RESEND_API_KEY;
  delete process.env.CONTACT_FROM_EMAIL;
  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { name: "Awa", email: "awa@example.com", message: "Bonjour" },
  }, response);
  assert.equal(response.statusCode, 503);
});

test("contact client rejects a Vite SPA fallback returned as 200 HTML", async () => {
  const response = new Response("<!doctype html><html></html>", {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
  assert.equal(await isSuccessfulContactResponse(response), false);
});

test("contact client accepts only an explicit JSON success payload", async () => {
  const response = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(await isSuccessfulContactResponse(response), true);
});
