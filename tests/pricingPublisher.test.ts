import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publisherUrl = new URL("../scripts/publish-estimator-pricing.mjs", import.meta.url);
const source = (await readFile(publisherUrl, "utf8")).replace(/\s+/g, " ");

test("remote publication is blocked while a pricing decision remains unresolved", () => {
  assert.match(source, /missingPricingDecisions/);
  assert.match(source, /function assertRemotePublicationDecisionsResolved\(\)/);
  assert.match(source, /else \{ assertRemotePublicationDecisionsResolved\(\); await publish\(\); \}/);
});

test("pricing and exchange rates are published through one atomic database RPC", () => {
  assert.match(source, /supabase\.rpc\("publish_estimator_pricing_model"/);
  assert.doesNotMatch(source, /\.from\("estimator_exchange_rates"\)/);
  assert.doesNotMatch(source, /\.from\("estimator_pricing_models"\)/);
});
