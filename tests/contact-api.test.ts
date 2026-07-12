// @ts-nocheck
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import handler from "../api/contact.js";
import { renderContactEmail } from "../api/contact-email.js";
import { isSuccessfulContactResponse } from "../src/app/components/contactResponse.ts";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.CONTACT_FROM_EMAIL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.RESEND_API_KEY = originalApiKey;
  process.env.CONTACT_FROM_EMAIL = originalFrom;
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
  globalThis.fetch = async (_url, options) => {
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
