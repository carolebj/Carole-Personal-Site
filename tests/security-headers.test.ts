// @ts-nocheck
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const vercelConfig = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

test("Vercel applies minimal anti-framing and safe hardening headers to every route", () => {
  const globalHeaders = vercelConfig.headers.find((entry) => entry.source === "/(.*)")?.headers;
  assert.ok(globalHeaders, "global Vercel headers must exist");
  const headers = Object.fromEntries(globalHeaders.map(({ key, value }) => [key, value]));

  assert.equal(headers["Content-Security-Policy"], "frame-ancestors 'none'");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["Permissions-Policy"], "camera=(), microphone=(), geolocation=()");
});
