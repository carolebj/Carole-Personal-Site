import assert from "node:assert/strict";
import test from "node:test";
import {
  ESTIMATE_GENERATION_SESSION_KEY,
  ESTIMATE_RESULT_SESSION_KEY,
  buildEstimateInputSignature,
  classifyEstimateFailure,
  filterAnswersForSelectedServices,
  resolveEstimateGeneration,
  saveEstimateSessionMetadata,
} from "../src/app/estimator/estimateUiState.ts";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    value: (key: string) => values.get(key),
  };
}

const input = {
  serviceIds: ["editorial-strategy"] as const,
  currency: "XOF" as const,
  profile: { organizationType: "business", timeline: "flexible" },
  answers: {
    "editorial.currentState": "none",
    "editorial.channels": ["instagram", "linkedin"],
    "visual.logoState": "none",
  },
};

test("answers from a removed service are purged before estimation", () => {
  assert.deepEqual(filterAnswersForSelectedServices(input.serviceIds, input.answers), {
    "editorial.currentState": "none",
    "editorial.channels": ["instagram", "linkedin"],
  });
});

test("the estimate signature ignores answer ordering but changes with real inputs", () => {
  const signature = buildEstimateInputSignature(input);
  assert.equal(signature, buildEstimateInputSignature({
    ...input,
    answers: {
      "visual.logoState": "none",
      "editorial.channels": ["linkedin", "instagram"],
      "editorial.currentState": "none",
    },
  }));
  assert.notEqual(signature, buildEstimateInputSignature({ ...input, currency: "EUR" }));
});

test("idempotency is stable for one generation and rotates when inputs change", () => {
  const storage = memoryStorage();
  let keyNumber = 0;
  const createKey = () => `stable-generation-key-${++keyNumber}`;
  const first = resolveEstimateGeneration(storage, "signature-a", createKey);
  const remount = resolveEstimateGeneration(storage, "signature-a", createKey);
  const changed = resolveEstimateGeneration(storage, "signature-b", createKey);

  assert.equal(remount.idempotencyKey, first.idempotencyKey);
  assert.notEqual(changed.idempotencyKey, first.idempotencyKey);
  assert.equal(keyNumber, 2);
  assert.match(storage.value(ESTIMATE_GENERATION_SESSION_KEY) ?? "", /signature-b/);
});

test("server estimate identifiers are retained only in session storage", () => {
  const storage = memoryStorage();
  saveEstimateSessionMetadata(storage, "signature-a", {
    estimateId: "44444444-4444-4444-8444-444444444444",
    estimateToken: "session-token", // secret-scan:allow — inert test fixture
    expiresAt: "2026-07-30T12:00:00.000Z",
  });

  assert.deepEqual(JSON.parse(storage.value(ESTIMATE_RESULT_SESSION_KEY) ?? "null"), {
    inputSignature: "signature-a",
    estimateId: "44444444-4444-4444-8444-444444444444",
    estimateToken: "session-token", // secret-scan:allow — inert test fixture
    expiresAt: "2026-07-30T12:00:00.000Z",
  });
});

test("estimate failures are classified into safe, actionable public states", () => {
  assert.equal(classifyEstimateFailure("pricing_model_unavailable"), "calibration");
  assert.equal(classifyEstimateFailure("rate_limit_exceeded"), "rate-limited");
  assert.equal(classifyEstimateFailure("invalid_answers"), "invalid-input");
  assert.equal(classifyEstimateFailure("estimate_persistence_failed"), "save-failed");
  assert.equal(classifyEstimateFailure("invalid_response", { isDevelopment: true }), "local-preview");
  assert.equal(classifyEstimateFailure("invalid_response", { isDevelopment: false }), "connection");
  assert.equal(classifyEstimateFailure("Failed to fetch"), "connection");
  assert.equal(classifyEstimateFailure("request_timeout"), "connection");
  assert.equal(classifyEstimateFailure("unknown", { isOnline: false }), "connection");
  assert.equal(classifyEstimateFailure(undefined), "unavailable");
});
