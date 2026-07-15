import assert from "node:assert/strict";
import test from "node:test";
import { createCommercialUnsubscribeToken, verifyCommercialUnsubscribeToken } from "../api/commercial-unsubscribe.js";

test("commercial unsubscribe tokens are signed, normalized and tamper-evident", () => {
  const secret = "a".repeat(32);
  const token = createCommercialUnsubscribeToken(" Person@Example.com ", secret);
  assert.equal(verifyCommercialUnsubscribeToken(token, secret), "person@example.com");
  assert.equal(verifyCommercialUnsubscribeToken(`${token}x`, secret), null);
  assert.equal(verifyCommercialUnsubscribeToken(token, "b".repeat(32)), null);
});
