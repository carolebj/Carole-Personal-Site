// @ts-nocheck
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import handler, {
  createRequestHashes,
  createRateLimitScopeHash,
  loadActivePricingContext,
  validateAnswersAgainstContract,
  validateProjectEstimatePayload,
} from "../api/project-estimate.js";

const originalFetch = globalThis.fetch;
const originalSupabaseUrl = process.env.SUPABASE_URL;
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalHashPepper = process.env.ESTIMATOR_HASH_PEPPER;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = originalSupabaseUrl;
  if (originalServiceRoleKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
  if (originalHashPepper === undefined) delete process.env.ESTIMATOR_HASH_PEPPER;
  else process.env.ESTIMATOR_HASH_PEPPER = originalHashPepper;
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

const profile = {
  organizationType: "business",
  organizationScale: "startup-small",
  clientLocation: "benin",
  projectStage: "launch",
  marketScope: "local",
  languageScope: "one",
  timeline: "one-two-months",
  validationProcess: "one",
};

const emptyContract = Object.fromEntries(
  ["editorial-strategy", "digital-communication", "content-creation", "audit-advice", "visual-identity"]
    .map((serviceId) => [serviceId, { serviceId, questions: [] }]),
);

function activeCatalog(questionnaireContract = emptyContract) {
  const configured = () => ({
    status: "configured",
    baseRangeXof: { lower: 100_000, upper: 150_000 },
    rules: [],
  });
  return {
    status: "active",
    questionnaireContract,
    services: {
      "editorial-strategy": configured(),
      "digital-communication": configured(),
      "content-creation": configured(),
      "audit-advice": configured(),
      "visual-identity": configured(),
    },
    mutualizationRules: [],
    rounding: { status: "configured", incrementXof: 5_000, lower: "down", upper: "up" },
    tax: {
      status: "configured",
      treatment: "not-applicable",
      rateBasisPoints: 0,
      label: { fr: "Fixture", en: "Fixture" },
    },
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("payload validation rejects client preflight flags, duplicate services and incomplete profiles", () => {
  const { organizationType: _organizationType, ...pricingProfile } = profile;
  assert.deepEqual(
    validateProjectEstimatePayload({
      serviceIds: ["editorial-strategy"],
      currency: "XOF",
      answers: {},
      profile,
      preflightReasons: [],
    }),
    { ok: false, status: 422, error: "unexpected_fields", details: ["preflightReasons"] },
  );
  assert.equal(validateProjectEstimatePayload({
    serviceIds: ["editorial-strategy", "editorial-strategy"],
    currency: "XOF",
    answers: {},
    profile,
  }).error, "invalid_service_ids");
  assert.equal(validateProjectEstimatePayload({
    serviceIds: ["editorial-strategy", "content-creation"],
    currency: "XOF",
    answers: {},
    profile,
  }).error, "invalid_service_ids");
  assert.equal(validateProjectEstimatePayload({
    serviceIds: ["editorial-strategy"],
    currency: "XOF",
    answers: {},
    profile: { ...profile, extra: "unknown" },
  }).error, "invalid_profile_fields");
  assert.equal(validateProjectEstimatePayload({
    serviceIds: ["editorial-strategy"],
    currency: "XOF",
    answers: {},
    profile: pricingProfile,
  }).ok, true);
  const { projectStage: _projectStage, ...incompleteProfile } = pricingProfile;
  assert.deepEqual(validateProjectEstimatePayload({
    serviceIds: ["editorial-strategy"],
    currency: "XOF",
    answers: {},
    profile: incompleteProfile,
  }), {
    ok: false,
    status: 422,
    error: "invalid_profile_value",
    details: ["projectStage"],
  });
  assert.deepEqual(validateProjectEstimatePayload({
    serviceIds: ["editorial-strategy"],
    currency: "XOF",
    answers: {},
    profile: { ...profile, organizationType: "company" },
  }), {
    ok: false,
    status: 422,
    error: "invalid_profile_value",
    details: ["organizationType"],
  });
});

test("answer validation recomputes manual review from the trusted contract", () => {
  const contract = structuredClone(emptyContract);
  contract["editorial-strategy"].questions = [{
    key: "editorial.scope",
    type: "choice",
    requiredForEstimate: true,
    purpose: "pricing-and-prefill",
    pricingDimensions: ["base-scope"],
    optionValues: ["standard", "custom"],
    manualReviewOptions: ["custom"],
  }];

  const validation = validateAnswersAgainstContract({
    serviceIds: ["editorial-strategy"],
    answers: { "editorial.scope": "custom" },
  }, contract);

  assert.equal(validation.ok, true);
  assert.deepEqual(validation.value.preflightReasons, [{
    code: "questionnaire-manual-review",
    serviceId: "editorial-strategy",
    questionKey: "editorial.scope",
    details: ["custom"],
  }]);
});

test("answer validation rejects the exclusive none option combined with other multi values", () => {
  const contract = structuredClone(emptyContract);
  contract["editorial-strategy"].questions = [{
    key: "editorial.support",
    type: "multi",
    requiredForEstimate: true,
    purpose: "pricing-and-prefill",
    pricingDimensions: ["base-scope"],
    optionValues: ["none", "presentation"],
    manualReviewOptions: [],
  }];

  assert.deepEqual(validateAnswersAgainstContract({
    serviceIds: ["editorial-strategy"],
    answers: { "editorial.support": ["none", "presentation"] },
  }, contract), {
    ok: false,
    status: 422,
    error: "invalid_answer",
    details: ["editorial.support"],
  });
});

test("numeric answers follow the minimum, step and maximum published in the questionnaire contract", () => {
  const numberContract = {
    ...emptyContract,
    "editorial-strategy": {
      serviceId: "editorial-strategy",
      questions: [{
        key: "editorial.brandCount",
        type: "number",
        requiredForEstimate: true,
        purpose: "pricing-and-prefill",
        pricingDimensions: ["volume"],
        optionValues: [],
        manualReviewOptions: [],
        number: { min: 1, step: 2, max: 1_000_000 },
      }],
    },
  };
  const request = { serviceIds: ["editorial-strategy"], answers: { "editorial.brandCount": 3 } };

  assert.equal(validateAnswersAgainstContract(request, numberContract).ok, true);
  assert.equal(validateAnswersAgainstContract({ ...request, answers: { "editorial.brandCount": 2 } }, numberContract).error, "invalid_answer");
  assert.equal(validateAnswersAgainstContract({ ...request, answers: { "editorial.brandCount": 1_000_001 } }, numberContract).error, "invalid_answer");
  const missingMaximum = structuredClone(numberContract);
  delete missingMaximum["editorial-strategy"].questions[0].number.max;
  assert.equal(validateAnswersAgainstContract(request, missingMaximum).error, "pricing_model_unavailable");
});

test("endpoint requires a stable idempotency key before any server-side work", async () => {
  globalThis.fetch = async () => { throw new Error("fetch must not run"); };
  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { serviceIds: ["editorial-strategy"], currency: "XOF", answers: {}, profile },
  }, response);

  assert.equal(response.statusCode, 422);
  assert.deepEqual(response.body, { error: "invalid_idempotency_key" });
});

test("trusted questionnaire contract rejects global key collisions and invalid dependency values", () => {
  const collision = structuredClone(emptyContract);
  const duplicateQuestion = {
    key: "shared.duplicate",
    type: "choice",
    requiredForEstimate: false,
    purpose: "pricing-and-prefill",
    pricingDimensions: ["base-scope"],
    optionValues: ["yes"],
    manualReviewOptions: [],
  };
  collision["editorial-strategy"].questions = [duplicateQuestion];
  collision["content-creation"].questions = [duplicateQuestion];
  assert.equal(validateAnswersAgainstContract({
    serviceIds: ["editorial-strategy"],
    answers: {},
  }, collision).error, "pricing_model_unavailable");

  const invalidDependency = structuredClone(emptyContract);
  invalidDependency["editorial-strategy"].questions = [
    duplicateQuestion,
    {
      key: "editorial.dependent",
      type: "choice",
      requiredForEstimate: false,
      purpose: "pricing-and-prefill",
      pricingDimensions: ["base-scope"],
      optionValues: ["basic"],
      manualReviewOptions: [],
      dependsOn: { questionKey: "shared.duplicate", operator: "equals", value: "unknown" },
    },
  ];
  assert.equal(validateAnswersAgainstContract({
    serviceIds: ["editorial-strategy"],
    answers: {},
  }, invalidDependency).error, "pricing_model_unavailable");

  const invalidBriefOnly = structuredClone(emptyContract);
  invalidBriefOnly["editorial-strategy"].questions = [{
    key: "editorial.reference",
    type: "choice",
    requiredForEstimate: true,
    purpose: "brief-prefill-only",
    pricingDimensions: [],
    optionValues: ["example"],
    manualReviewOptions: [],
  }];
  assert.equal(validateAnswersAgainstContract({
    serviceIds: ["editorial-strategy"],
    answers: {},
  }, invalidBriefOnly).error, "pricing_model_unavailable");
});

test("endpoint returns no amount when server-only pricing configuration is unavailable", async () => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.ESTIMATOR_HASH_PEPPER;

  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": "unavailable-model-0001" },
    body: { serviceIds: ["editorial-strategy"], currency: "XOF", answers: {}, profile },
  }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { error: "pricing_model_unavailable" });
  assert.equal("estimate" in response.body, false);
});

test("endpoint fails closed before model reads when the protected rate limit is exceeded", async () => {
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key";
  process.env.ESTIMATOR_HASH_PEPPER = "test-only-estimator-hash-pepper-32-bytes";
  const paths = [];
  globalThis.fetch = async (url) => {
    paths.push(new URL(String(url)).pathname);
    return jsonResponse(false);
  };

  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "192.0.2.50",
      "user-agent": "rate-limit-test",
      "idempotency-key": "rate-limit-action-0001",
    },
    body: { serviceIds: ["editorial-strategy"], currency: "XOF", answers: {}, profile },
  }, response);

  assert.equal(response.statusCode, 429);
  assert.deepEqual(response.body, { error: "rate_limit_exceeded" });
  assert.equal(response.headers["Retry-After"], "600");
  assert.deepEqual(paths, ["/rest/v1/rpc/consume_estimator_rate_limit"]);
});

test("pricing context rejects USD snapshots older than the validated seven-day window", async () => {
  const fetchImpl = async (url) => {
    const path = new URL(String(url)).pathname;
    if (path === "/rest/v1/estimator_pricing_models") {
      return jsonResponse([{
        id: "11111111-1111-4111-8111-111111111111",
        version: 3,
        catalog: activeCatalog(),
        effective_from: "2026-07-15T00:00:00Z",
        published_at: "2026-07-15T00:00:00Z",
      }]);
    }
    return jsonResponse([
      { id: "55555555-5555-4555-8555-555555555555", currency: "XOF", xof_per_unit: 1, source: "BCEAO", source_url: "https://www.bceao.int/xof", observed_on: "2026-07-15", published_at: "2026-07-15T00:00:00Z" },
      { id: "22222222-2222-4222-8222-222222222222", currency: "EUR", xof_per_unit: 655.957, source: "BCEAO", source_url: "https://www.bceao.int/eur", observed_on: "2026-07-15", published_at: "2026-07-15T00:00:00Z" },
      { id: "33333333-3333-4333-8333-333333333333", currency: "USD", xof_per_unit: 574.19, source: "BCEAO", source_url: "https://www.bceao.int/usd-stale", observed_on: "2026-07-01", published_at: "2026-07-01T00:00:00Z" },
    ]);
  };

  const context = await loadActivePricingContext({
    supabaseUrl: "https://project.supabase.co",
    serviceRoleKey: "service-role-test-key",
    fetchImpl,
    now: new Date("2026-07-15T12:00:00Z"),
  });
  assert.equal(context, null);
});

test("pricing context rejects a catalog rule targeting brief-only shared-profile data", async () => {
  const catalog = activeCatalog();
  catalog.services["editorial-strategy"].rules = [{
    id: "forbidden-organization-rule",
    input: { scope: "shared-profile", key: "organizationType" },
    dimension: "complexity",
    when: { operator: "equals", value: "business" },
    operation: "add-range",
    rangeXof: { lower: 1, upper: 1 },
  }];
  const fetchImpl = async (url) => {
    const path = new URL(String(url)).pathname;
    if (path === "/rest/v1/estimator_pricing_models") {
      return jsonResponse([{
        id: "11111111-1111-4111-8111-111111111111",
        version: 3,
        catalog,
        effective_from: "2026-07-15T00:00:00Z",
        published_at: "2026-07-15T00:00:00Z",
      }]);
    }
    return jsonResponse([
      { id: "55555555-5555-4555-8555-555555555555", currency: "XOF", xof_per_unit: 1, source: "BCEAO", source_url: "https://www.bceao.int/xof", observed_on: "2026-07-15", published_at: "2026-07-15T00:00:00Z" },
      { id: "22222222-2222-4222-8222-222222222222", currency: "EUR", xof_per_unit: 655.957, source: "BCEAO", source_url: "https://www.bceao.int/eur", observed_on: "2026-07-15", published_at: "2026-07-15T00:00:00Z" },
      { id: "33333333-3333-4333-8333-333333333333", currency: "USD", xof_per_unit: 574.19, source: "BCEAO", source_url: "https://www.bceao.int/usd", observed_on: "2026-07-13", published_at: "2026-07-15T00:00:00Z" },
    ]);
  };

  const context = await loadActivePricingContext({
    supabaseUrl: "https://project.supabase.co",
    serviceRoleKey: "service-role-test-key",
    fetchImpl,
    now: new Date("2026-07-15T12:00:00Z"),
  });
  assert.equal(context, null);
});

test("endpoint persists a server-derived manual review without inventing amounts", async () => {
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key";
  process.env.ESTIMATOR_HASH_PEPPER = "test-only-estimator-hash-pepper-32-bytes";
  const contract = structuredClone(emptyContract);
  contract["editorial-strategy"].questions = [{
    key: "editorial.scope",
    type: "choice",
    requiredForEstimate: true,
    purpose: "pricing-and-prefill",
    pricingDimensions: ["base-scope"],
    optionValues: ["standard", "custom"],
    manualReviewOptions: ["custom"],
  }];
  const paths = [];
  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(String(url)).pathname;
    paths.push(path);
    if (path === "/rest/v1/rpc/consume_estimator_rate_limit") return jsonResponse(true);
    if (path === "/rest/v1/estimator_pricing_models") {
      return jsonResponse([{
        id: "11111111-1111-4111-8111-111111111111",
        version: 3,
        catalog: activeCatalog(contract),
        effective_from: "2026-07-15T00:00:00Z",
        published_at: "2026-07-15T00:00:00Z",
      }]);
    }
    if (path === "/rest/v1/estimator_exchange_rates") {
      return jsonResponse([
        { id: "55555555-5555-4555-8555-555555555555", currency: "XOF", xof_per_unit: 1, source: "BCEAO", source_url: "https://www.bceao.int/xof", observed_on: "2026-07-15", published_at: "2026-07-15T00:00:00Z" },
        { id: "22222222-2222-4222-8222-222222222222", currency: "EUR", xof_per_unit: 655.957, source: "BCEAO", source_url: "https://www.bceao.int/eur", observed_on: "2026-07-15", published_at: "2026-07-15T00:00:00Z" },
        { id: "33333333-3333-4333-8333-333333333333", currency: "USD", xof_per_unit: 574.19, source: "BCEAO", source_url: "https://www.bceao.int/usd", observed_on: "2026-07-13", published_at: "2026-07-15T00:00:00Z" },
      ]);
    }
    if (path === "/rest/v1/rpc/record_project_estimate") {
      const persisted = JSON.parse(options.body ?? "{}");
      assert.equal(persisted.p_result_status, "manual-review");
      assert.equal(persisted.p_amount_low_xof, null);
      assert.equal(persisted.p_amount_high_xof, null);
      assert.deepEqual(
        persisted.p_breakdown.services[0].calculationScope.inclusions[0],
        {
          input: { scope: "service-question", key: "editorial.scope" },
          value: "custom",
          dimensions: ["base-scope"],
          appliedRuleIds: [],
        },
      );
      return jsonResponse({
        id: "66666666-6666-4666-8666-666666666666",
        expires_at: "2026-07-30T12:00:00.000Z",
      });
    }
    return jsonResponse({ error: "unexpected call" }, 500);
  };

  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "manual-review-action-0001",
      "x-forwarded-for": "192.0.2.10",
    },
    body: {
      serviceIds: ["editorial-strategy"],
      currency: "XOF",
      answers: { "editorial.scope": "custom" },
      profile,
    },
  }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.estimate.status, "manual-review");
  assert.equal(response.body.estimate.totalXof, null);
  assert.equal(response.body.estimateId, "66666666-6666-4666-8666-666666666666");
  assert.equal(paths.includes("/rest/v1/rpc/record_project_estimate"), true);
});

test("endpoint loads an active model, calculates server-side and persists through the protected RPC", async () => {
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key";
  process.env.ESTIMATOR_HASH_PEPPER = "test-only-estimator-hash-pepper-32-bytes";
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    const parsed = new URL(String(url));
    if (parsed.pathname === "/rest/v1/rpc/consume_estimator_rate_limit") return jsonResponse(true);
    if (parsed.pathname === "/rest/v1/estimator_pricing_models") {
      return jsonResponse([{
        id: "11111111-1111-4111-8111-111111111111",
        version: 3,
        catalog: activeCatalog(),
        effective_from: "2026-07-15T00:00:00Z",
        published_at: "2026-07-15T00:00:00Z",
      }]);
    }
    if (parsed.pathname === "/rest/v1/estimator_exchange_rates") {
      return jsonResponse([
        {
          id: "55555555-5555-4555-8555-555555555555",
          currency: "XOF",
          xof_per_unit: 1,
          source: "BCEAO — monnaie canonique",
          source_url: "https://www.bceao.int/xof",
          observed_on: "2026-07-15",
          published_at: "2026-07-15T00:00:00Z",
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          currency: "EUR",
          xof_per_unit: 655.957,
          source: "BCEAO",
          source_url: "https://www.bceao.int/eur",
          observed_on: "2026-07-15",
          published_at: "2026-07-15T00:00:00Z",
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          currency: "USD",
          xof_per_unit: 574.19,
          source: "BCEAO",
          source_url: "https://www.bceao.int/usd",
          observed_on: "2026-07-13",
          published_at: "2026-07-15T00:00:00Z",
        },
      ]);
    }
    if (parsed.pathname === "/rest/v1/rpc/record_project_estimate") {
      return jsonResponse({
        id: "44444444-4444-4444-8444-444444444444",
        expires_at: "2026-07-30T12:00:00.000Z",
      });
    }
    return jsonResponse({ error: "unexpected" }, 500);
  };

  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "estimate-action-0000001",
      "x-forwarded-for": "192.0.2.11",
    },
    body: { serviceIds: ["editorial-strategy"], currency: "EUR", answers: {}, profile },
  }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.estimateId, "44444444-4444-4444-8444-444444444444");
  assert.equal(response.body.expiresAt, "2026-07-30T12:00:00.000Z");
  assert.equal(response.body.estimate.status, "estimated");
  assert.deepEqual(response.body.estimate.totalXof, { lower: 100_000, upper: 150_000 });
  assert.deepEqual(response.body.estimate.services[0].calculationScope, {
    baseScope: {
      source: "catalog-base-range",
      pricingStatus: "configured",
      entries: [],
    },
    inclusions: [],
    volumes: [],
    options: [],
    exclusions: [],
  });
  assert.match(response.body.estimateToken, /^[A-Za-z0-9_-]{40,}$/);

  const rpc = calls.find((call) => new URL(call.url).pathname === "/rest/v1/rpc/record_project_estimate");
  const rateLimit = calls.find((call) => new URL(call.url).pathname === "/rest/v1/rpc/consume_estimator_rate_limit");
  const persisted = JSON.parse(rpc.options.body);
  const rateLimitPayload = JSON.parse(rateLimit.options.body);
  assert.match(rateLimitPayload.p_scope_hash, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(rateLimitPayload).includes("192.0.2.11"), false);
  assert.match(persisted.p_session_token_hash, /^[a-f0-9]{64}$/);
  assert.match(persisted.p_idempotency_key_hash, /^[a-f0-9]{64}$/);
  assert.equal(persisted.p_pricing_model_version, 3);
  assert.equal(persisted.p_result_status, "estimated");
  assert.equal(persisted.p_exchange_rate_snapshot_id, "22222222-2222-4222-8222-222222222222");
  assert.equal(persisted.p_rate_source_url, "https://www.bceao.int/eur");
  assert.deepEqual(persisted.p_answers.profile, profile);
  assert.equal("email" in persisted.p_answers.profile, false);
  assert.equal(persisted.p_expires_at, undefined);
  assert.equal(calls.some((call) => new URL(call.url).pathname === "/rest/v1/project_estimates"), false);
  for (const call of calls) {
    assert.equal(call.options.headers.Authorization, "Bearer service-role-test-key");
  }
});

test("idempotent retries derive the same protected session while distinct actions remain separate", () => {
  const base = {
    request: {
      headers: {
        "idempotency-key": "estimate-action-0000001",
        "x-forwarded-for": "192.0.2.11",
        "user-agent": "test-agent",
      },
    },
    normalizedPayload: { serviceIds: ["editorial-strategy"], currency: "XOF", answers: {}, profile },
    modelId: "11111111-1111-4111-8111-111111111111",
    modelVersion: 3,
    pepper: "test-only-estimator-hash-pepper-32-bytes",
  };
  const first = createRequestHashes(base);
  const retry = createRequestHashes(base);
  const distinct = createRequestHashes({
    ...base,
    request: { headers: { ...base.request.headers, "idempotency-key": "estimate-action-0000002" } },
  });

  assert.deepEqual(first, retry);
  assert.notEqual(first.idempotencyKeyHash, distinct.idempotencyKeyHash);
  assert.notEqual(first.session.token, distinct.session.token);
  assert.match(first.session.tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(
    createRateLimitScopeHash(base.request, base.pepper),
    createRateLimitScopeHash({
      headers: { ...base.request.headers, "user-agent": "rotated-agent" },
    }, base.pepper),
  );
});
