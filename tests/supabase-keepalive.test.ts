import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHealthcheckUrls,
  isAuthorizedCronRequest,
} from "../api/supabase-keepalive.js";

test("keepalive accepts only the configured Vercel cron bearer token", () => {
  assert.equal(
    isAuthorizedCronRequest({ headers: { authorization: "Bearer expected" } }, "expected"),
    true,
  );
  assert.equal(
    isAuthorizedCronRequest({ headers: { authorization: "Bearer wrong" } }, "expected"),
    false,
  );
  assert.equal(isAuthorizedCronRequest({ headers: {} }, ""), false);
});

test("keepalive performs bounded public CMS reads", () => {
  const urls = buildHealthcheckUrls("https://project.supabase.co");

  assert.equal(urls.length, 3);
  for (const value of urls) {
    const url = new URL(value);
    assert.equal(url.origin, "https://project.supabase.co");
    assert.equal(url.pathname, "/rest/v1/cms_public_documents");
    assert.equal(url.searchParams.get("select"), "doc_id");
    assert.equal(url.searchParams.get("limit"), "1");
  }
});
