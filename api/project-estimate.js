import { createHash, createHmac } from "node:crypto";
import {
  buildServiceCalculationScope,
  calculateEstimateCore,
} from "../shared/estimator-pricing-engine.js";
import { PROJECT_PROFILE_CONTRACT, PROJECT_PROFILE_KEYS } from "../shared/estimator-profile-contract.js";

const MAX_BODY_BYTES = 64_000;
const MAX_ANSWER_KEYS = 80;
const MAX_MULTI_VALUES = 40;
const MAX_TEXT_LENGTH = 240;
const RATE_LIMIT_REQUESTS = 20;
const RATE_LIMIT_WINDOW_SECONDS = 600;
const USD_MAX_AGE_DAYS = 7;
const SERVICE_IDS = [
  "editorial-strategy",
  "digital-communication",
  "content-creation",
  "audit-advice",
  "visual-identity",
];
const SERVICE_ID_SET = new Set(SERVICE_IDS);
const CURRENCIES = new Set(["XOF", "EUR", "USD"]);
const PRICING_DIMENSIONS = new Set([
  "base-scope", "volume", "complexity", "duration", "options",
  "rights", "urgency", "validation", "logistics", "mutualization",
]);
const QUESTION_PURPOSES = new Set(["pricing-and-prefill", "brief-prefill-only"]);
const TOP_LEVEL_KEYS = new Set(["serviceIds", "currency", "answers", "profile"]);

function json(response, status, body) {
  return response.status(status).setHeader("Cache-Control", "no-store").json(body);
}

function isPlainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function fail(status, error, details) {
  return { ok: false, status, error, ...(details ? { details } : {}) };
}

function normalizeNonEmptyString(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
}

function getBodyByteLength(body) {
  try {
    return Buffer.byteLength(typeof body === "string" ? body : JSON.stringify(body ?? null), "utf8");
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function parseBody(body) {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isPlainRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hmacHex(pepper, purpose, value) {
  return createHmac("sha256", pepper).update(`${purpose}\0${value}`).digest("hex");
}

function requestHeader(request, name) {
  return request.headers?.[name] || request.headers?.[name.toLowerCase()] || request.headers?.[name.toUpperCase()] || "";
}

function isValidIdempotencyKey(value) {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{16,128}$/.test(value);
}

function clientAddress(request) {
  const forwarded = requestHeader(request, "x-vercel-forwarded-for") ||
    requestHeader(request, "x-forwarded-for") ||
    requestHeader(request, "x-real-ip") ||
    request.socket?.remoteAddress ||
    "unknown";
  return String(forwarded).split(",")[0].trim().slice(0, 200) || "unknown";
}

export function createRequestHashes({ request, normalizedPayload, modelId, modelVersion, pepper }) {
  const requestedKey = requestHeader(request, "idempotency-key");
  if (!isValidIdempotencyKey(requestedKey)) throw new TypeError("A valid Idempotency-Key is required");
  const actionKey = requestedKey;
  const scopeHash = hmacHex(pepper, "rate-limit", clientAddress(request));
  const requestIdentity = stableJson({ actionKey, modelId, modelVersion, normalizedPayload });
  const idempotencyKeyHash = hmacHex(pepper, "idempotency", requestIdentity);
  const token = createHmac("sha256", pepper)
    .update(`estimate-session\0${idempotencyKeyHash}`)
    .digest("base64url");

  return {
    scopeHash,
    idempotencyKeyHash,
    session: {
      token,
      tokenHash: createHash("sha256").update(token).digest("hex"),
    },
  };
}

export function createRateLimitScopeHash(request, pepper) {
  return hmacHex(pepper, "rate-limit", clientAddress(request));
}

export function validateProjectEstimatePayload(rawBody) {
  if (getBodyByteLength(rawBody) > MAX_BODY_BYTES) return fail(413, "payload_too_large");
  const body = parseBody(rawBody);
  if (!isPlainRecord(body)) return fail(422, "invalid_payload");

  const unexpectedKeys = Object.keys(body).filter((key) => !TOP_LEVEL_KEYS.has(key));
  if (unexpectedKeys.length > 0) return fail(422, "unexpected_fields", unexpectedKeys);

  if (
    !Array.isArray(body.serviceIds) ||
    body.serviceIds.length !== 1 ||
    body.serviceIds.some((serviceId) => typeof serviceId !== "string" || !SERVICE_ID_SET.has(serviceId)) ||
    new Set(body.serviceIds).size !== body.serviceIds.length
  ) {
    return fail(422, "invalid_service_ids");
  }

  if (!CURRENCIES.has(body.currency)) return fail(422, "invalid_currency");
  if (!isPlainRecord(body.answers) || Object.keys(body.answers).length > MAX_ANSWER_KEYS) {
    return fail(422, "invalid_answers");
  }
  if (!isPlainRecord(body.profile)) return fail(422, "invalid_profile");

  const profileKeys = Object.keys(body.profile);
  if (profileKeys.some((key) => !PROJECT_PROFILE_KEYS.includes(key))) {
    return fail(422, "invalid_profile_fields");
  }

  const profile = {};
  for (const key of PROJECT_PROFILE_KEYS) {
    const field = PROJECT_PROFILE_CONTRACT[key];
    if (body.profile[key] === undefined && !field.requiredForEstimate) continue;
    const normalized = normalizeNonEmptyString(body.profile[key], 160);
    if (!normalized || !field.values.includes(normalized)) {
      return fail(422, "invalid_profile_value", [key]);
    }
    profile[key] = normalized;
  }

  return {
    ok: true,
    value: {
      serviceIds: [...body.serviceIds],
      currency: body.currency,
      answers: { ...body.answers },
      profile,
    },
  };
}

function isDependencyMet(dependency, answers) {
  if (!dependency) return true;
  const answer = answers[dependency.questionKey];
  if (dependency.operator === "equals") return answer === dependency.value;
  if (dependency.operator === "notEquals") return answer !== dependency.value;
  if (dependency.operator === "includes") {
    return Array.isArray(answer) && answer.includes(dependency.value);
  }
  if (dependency.operator === "oneOf") {
    const expected = Array.isArray(dependency.value) ? dependency.value : [dependency.value];
    return expected.includes(answer);
  }
  return false;
}

function validateContractQuestion(question) {
  if (!isPlainRecord(question)) return false;
  if (typeof question.key !== "string" || question.key.length === 0 || question.key.length > 120) return false;
  if (!["choice", "multi", "number"].includes(question.type)) return false;
  if (typeof question.requiredForEstimate !== "boolean") return false;
  if (!Array.isArray(question.optionValues) || !Array.isArray(question.manualReviewOptions)) return false;
  if (
    question.calculationExclusionOptions !== undefined &&
    !Array.isArray(question.calculationExclusionOptions)
  ) return false;
  if (!QUESTION_PURPOSES.has(question.purpose) || !Array.isArray(question.pricingDimensions)) return false;
  if (question.pricingDimensions.some((dimension) => !PRICING_DIMENSIONS.has(dimension))) return false;
  if (new Set(question.pricingDimensions).size !== question.pricingDimensions.length) return false;
  if (question.purpose === "brief-prefill-only") {
    if (question.requiredForEstimate || question.pricingDimensions.length > 0 || question.manualReviewOptions.length > 0) {
      return false;
    }
  } else if (question.pricingDimensions.length === 0) {
    return false;
  }
  if (question.optionValues.some((value) => typeof value !== "string" || value.length > 120)) return false;
  if (new Set(question.optionValues).size !== question.optionValues.length) return false;
  if (question.manualReviewOptions.some((value) => !question.optionValues.includes(value))) return false;
  if ((question.calculationExclusionOptions ?? []).some((value) => !question.optionValues.includes(value))) return false;
  if ((question.type === "choice" || question.type === "multi") && question.optionValues.length === 0) return false;
  if (question.dependsOn !== undefined) {
    if (!isPlainRecord(question.dependsOn)) return false;
    if (typeof question.dependsOn.questionKey !== "string") return false;
    if (!["equals", "notEquals", "includes", "oneOf"].includes(question.dependsOn.operator)) return false;
  }
  if (question.type === "number") {
    if (!isPlainRecord(question.number)) return false;
    if (
      !Number.isFinite(question.number.min) ||
      !Number.isFinite(question.number.step) ||
      !Number.isFinite(question.number.max) ||
      question.number.step <= 0 ||
      question.number.max < question.number.min ||
      question.number.max > 1_000_000
    ) return false;
  }
  return true;
}

function normalizeQuestionnaireContract(value) {
  if (!isPlainRecord(value)) return null;
  const normalized = {};
  const globalKeys = new Set();

  for (const serviceId of SERVICE_IDS) {
    const service = value[serviceId];
    if (!isPlainRecord(service) || service.serviceId !== serviceId || !Array.isArray(service.questions)) return null;
    if (!service.questions.every(validateContractQuestion)) return null;
    const keys = service.questions.map((question) => question.key);
    if (new Set(keys).size !== keys.length) return null;
    if (keys.some((key) => globalKeys.has(key))) return null;
    keys.forEach((key) => globalKeys.add(key));
    const keySet = new Set(keys);
    if (service.questions.some((question) => question.dependsOn && !keySet.has(question.dependsOn.questionKey))) return null;
    for (const question of service.questions) {
      if (!question.dependsOn) continue;
      const source = service.questions.find((entry) => entry.key === question.dependsOn.questionKey);
      const dependencyValues = Array.isArray(question.dependsOn.value)
        ? question.dependsOn.value
        : [question.dependsOn.value];
      if (source.optionValues.length > 0 && dependencyValues.some((entry) => !source.optionValues.includes(entry))) {
        return null;
      }
      if (source.type === "number" && dependencyValues.some((entry) => typeof entry !== "number")) return null;
      if (question.dependsOn.operator === "includes" && source.type !== "multi") return null;
    }
    normalized[serviceId] = service.questions;
  }

  return normalized;
}

function isRuntimeReadyPricingRule(rule, serviceQuestions) {
  if (!isPlainRecord(rule) || typeof rule.id !== "string" || !isPlainRecord(rule.input)) return false;
  if (!PRICING_DIMENSIONS.has(rule.dimension) || typeof rule.input.key !== "string") return false;
  if (!["service-question", "shared-profile"].includes(rule.input.scope)) return false;

  let inputType = "choice";
  let allowedValues = [];
  if (rule.input.scope === "service-question") {
    const question = serviceQuestions.find((entry) => entry.key === rule.input.key);
    if (!question || question.purpose !== "pricing-and-prefill") return false;
    if (!question.pricingDimensions.includes(rule.dimension)) return false;
    if (rule.operation === "per-unit-range" && question.type !== "number") return false;
    inputType = question.type;
    allowedValues = question.optionValues;
  } else {
    const profileField = PROJECT_PROFILE_CONTRACT[rule.input.key];
    if (!profileField || profileField.purpose !== "pricing-and-prefill") return false;
    if (!profileField.pricingDimensions.includes(rule.dimension)) return false;
    if (rule.operation === "per-unit-range") return false;
    allowedValues = profileField.values;
  }

  if (!isPlainRecord(rule.when)) return false;
  const predicateValues = rule.when.operator === "one-of"
    ? rule.when.value
    : ["equals", "includes", "number-at-least", "number-above"].includes(rule.when.operator)
      ? [rule.when.value]
      : null;
  if (!Array.isArray(predicateValues) || predicateValues.length === 0) return false;
  if (["number-at-least", "number-above"].includes(rule.when.operator)) {
    if (inputType !== "number" || predicateValues.some((value) => !Number.isFinite(value))) return false;
  } else if (rule.when.operator === "includes") {
    if (inputType !== "multi" || predicateValues.some((value) => typeof value !== "string")) return false;
  } else if (allowedValues.length > 0 && predicateValues.some((value) => !allowedValues.includes(value))) {
    return false;
  }

  const isRange = (range) =>
    isPlainRecord(range) &&
    Number.isFinite(range.lower) &&
    Number.isFinite(range.upper) &&
    range.lower >= 0 &&
    range.lower <= range.upper;
  if (rule.operation === "add-range") return isRange(rule.rangeXof);
  if (rule.operation === "per-unit-range") {
    return Number.isInteger(rule.includedUnits) && rule.includedUnits >= 0 && isRange(rule.unitRangeXof);
  }
  if (rule.operation === "multiply-bps") {
    return (
      Number.isFinite(rule.lowerBasisPoints) &&
      Number.isFinite(rule.upperBasisPoints) &&
      rule.lowerBasisPoints >= 0 &&
      rule.lowerBasisPoints <= rule.upperBasisPoints
    );
  }
  if (rule.operation === "manual-review") {
    return typeof rule.reasonCode === "string" && rule.reasonCode.length > 0;
  }
  return false;
}

function isRuntimeReadyCatalog(catalog, questionnaireContract) {
  if (!isPlainRecord(catalog) || catalog.status !== "active") return false;
  if (!isPlainRecord(catalog.services) || !Array.isArray(catalog.mutualizationRules)) return false;
  if (catalog.rounding?.status !== "configured" || catalog.tax?.status !== "configured") return false;
  return SERVICE_IDS.every((serviceId) => {
    const service = catalog.services[serviceId];
    return (
      isPlainRecord(service) &&
      service.status === "configured" &&
      isPlainRecord(service.baseRangeXof) &&
      Array.isArray(service.rules) &&
      service.rules.every((rule) => isRuntimeReadyPricingRule(rule, questionnaireContract[serviceId]))
    );
  });
}

function validateAnswerValue(question, value) {
  if (question.type === "choice") {
    return typeof value === "string" && value.length <= 120 && question.optionValues.includes(value);
  }
  if (question.type === "multi") {
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.length <= MAX_MULTI_VALUES &&
      new Set(value).size === value.length &&
      !(value.includes("none") && value.length > 1) &&
      value.every((entry) => typeof entry === "string" && entry.length <= 120 && question.optionValues.includes(entry))
    );
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < question.number.min || value > question.number.max) {
    return false;
  }
  const steps = (value - question.number.min) / question.number.step;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

export function validateAnswersAgainstContract(request, rawContract) {
  const contract = normalizeQuestionnaireContract(rawContract);
  if (!contract) return fail(503, "pricing_model_unavailable");

  const questionByKey = new Map();
  for (const serviceId of request.serviceIds) {
    for (const question of contract[serviceId]) {
      questionByKey.set(question.key, { ...question, serviceId });
    }
  }

  for (const [key, value] of Object.entries(request.answers)) {
    const question = questionByKey.get(key);
    if (!question || !validateAnswerValue(question, value)) {
      return fail(422, "invalid_answer", [key]);
    }
  }

  const visibleQuestions = [...questionByKey.values()].filter((question) =>
    isDependencyMet(question.dependsOn, request.answers),
  );
  const visibleKeys = new Set(visibleQuestions.map((question) => question.key));
  const sanitizedAnswers = Object.fromEntries(
    Object.entries(request.answers).filter(([key]) => visibleKeys.has(key)),
  );
  const incomplete = visibleQuestions
    .filter((question) => question.requiredForEstimate && !(question.key in sanitizedAnswers))
    .map((question) => question.key);

  if (incomplete.length > 0) return fail(422, "incomplete_answers", incomplete);

  const preflightReasons = [];
  for (const question of visibleQuestions) {
    const answer = sanitizedAnswers[question.key];
    const selectedValues = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [];
    const selectedManualValues = selectedValues.filter((value) => question.manualReviewOptions.includes(value));
    if (selectedManualValues.length > 0) {
      preflightReasons.push({
        code: "questionnaire-manual-review",
        serviceId: question.serviceId,
        questionKey: question.key,
        details: selectedManualValues,
      });
    }
  }

  return { ok: true, value: { answers: sanitizedAnswers, preflightReasons } };
}

function supabaseHeaders(serviceRoleKey, extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...extra,
  };
}

function buildRestUrl(baseUrl, table, searchParams) {
  const url = new URL(`/rest/v1/${table}`, baseUrl);
  for (const [key, value] of Object.entries(searchParams)) url.searchParams.set(key, value);
  return url.toString();
}

function activeRateByCurrency(rows, currency) {
  return rows.find((row) =>
    row.currency === currency &&
    typeof row.id === "string" &&
    Number.isFinite(Number(row.xof_per_unit)) &&
    Number(row.xof_per_unit) > 0 &&
    typeof row.source === "string" &&
    row.source.trim().length > 0 &&
    typeof row.source_url === "string" &&
    /^https:\/\//.test(row.source_url) &&
    typeof row.observed_on === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(row.observed_on),
  );
}

export async function loadActivePricingContext({
  supabaseUrl,
  serviceRoleKey,
  fetchImpl = fetch,
  now = new Date(),
}) {
  if (!supabaseUrl || !serviceRoleKey) return null;

  const modelUrl = buildRestUrl(supabaseUrl, "estimator_pricing_models", {
    select: "id,version,catalog,effective_from,published_at",
    model_key: "eq.project-estimator",
    status: "eq.published",
    effective_from: `lte.${now.toISOString()}`,
    order: "effective_from.desc,version.desc",
    limit: "1",
  });
  const ratesUrl = buildRestUrl(supabaseUrl, "estimator_exchange_rates", {
    select: "id,currency,xof_per_unit,source,source_url,observed_on,published_at",
    status: "eq.published",
    currency: "in.(XOF,EUR,USD)",
    order: "observed_on.desc,published_at.desc,id.desc",
  });

  const [modelResponse, ratesResponse] = await Promise.all([
    fetchImpl(modelUrl, {
      headers: supabaseHeaders(serviceRoleKey),
      signal: AbortSignal.timeout(8_000),
    }),
    fetchImpl(ratesUrl, {
      headers: supabaseHeaders(serviceRoleKey),
      signal: AbortSignal.timeout(8_000),
    }),
  ]);
  if (!modelResponse.ok || !ratesResponse.ok) return null;

  const [models, rates] = await Promise.all([modelResponse.json(), ratesResponse.json()]);
  const model = Array.isArray(models) ? models[0] : null;
  const xof = Array.isArray(rates) ? activeRateByCurrency(rates, "XOF") : null;
  const eur = Array.isArray(rates) ? activeRateByCurrency(rates, "EUR") : null;
  const usd = Array.isArray(rates) ? activeRateByCurrency(rates, "USD") : null;
  const catalog = model?.catalog;
  const questionnaireContract = catalog?.questionnaireContract;
  const normalizedQuestionnaireContract = normalizeQuestionnaireContract(questionnaireContract);
  const usdAgeDays = usd
    ? (Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`) - Date.parse(`${usd.observed_on}T00:00:00Z`)) / 86_400_000
    : Number.POSITIVE_INFINITY;

  if (
    !model?.id ||
    !normalizedQuestionnaireContract ||
    !isRuntimeReadyCatalog(catalog, normalizedQuestionnaireContract) ||
    !Number.isInteger(model.version) ||
    !xof ||
    Number(xof.xof_per_unit) !== 1 ||
    !eur ||
    !usd ||
    usdAgeDays < 0 ||
    usdAgeDays > USD_MAX_AGE_DAYS
  ) {
    return null;
  }

  const rateSnapshot = {
    snapshotId: `supabase:${xof.id}:${eur.id}:${usd.id}`,
    retrievedAt: now.toISOString(),
    rates: {
      XOF: {
        xofPerUnit: Number(xof.xof_per_unit),
        rateDate: xof.observed_on,
        sourceName: xof.source,
        sourceUrl: xof.source_url,
        displayDecimals: 0,
      },
      EUR: {
        xofPerUnit: Number(eur.xof_per_unit),
        rateDate: eur.observed_on,
        sourceName: eur.source,
        sourceUrl: eur.source_url,
        displayDecimals: 0,
      },
      USD: {
        xofPerUnit: Number(usd.xof_per_unit),
        rateDate: usd.observed_on,
        sourceName: usd.source,
        sourceUrl: usd.source_url,
        displayDecimals: 0,
      },
    },
  };

  return {
    modelId: model.id,
    modelVersion: model.version,
    catalog: { ...catalog, modelVersion: String(model.version) },
    questionnaireContract,
    rateSnapshot,
    rateRows: { XOF: xof, EUR: eur, USD: usd },
  };
}

async function consumeRateLimit({ supabaseUrl, serviceRoleKey, scopeHash, fetchImpl = fetch }) {
  const url = new URL("/rest/v1/rpc/consume_estimator_rate_limit", supabaseUrl).toString();
  const response = await fetchImpl(url, {
    method: "POST",
    headers: supabaseHeaders(serviceRoleKey, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      p_scope_hash: scopeHash,
      p_limit: RATE_LIMIT_REQUESTS,
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return null;
  const allowed = await response.json();
  return typeof allowed === "boolean" ? allowed : null;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "method_not_allowed" });
  }
  if (!String(requestHeader(request, "content-type")).includes("application/json")) {
    return json(response, 415, { error: "unsupported_media_type" });
  }

  const declaredLength = Number(request.headers?.["content-length"] || 0);
  if (declaredLength > MAX_BODY_BYTES) return json(response, 413, { error: "payload_too_large" });

  const payload = validateProjectEstimatePayload(request.body);
  if (!payload.ok) return json(response, payload.status, { error: payload.error, details: payload.details });
  if (!isValidIdempotencyKey(requestHeader(request, "idempotency-key"))) {
    return json(response, 422, { error: "invalid_idempotency_key" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hashPepper = process.env.ESTIMATOR_HASH_PEPPER;
  if (!supabaseUrl || !serviceRoleKey || !hashPepper || hashPepper.length < 32) {
    return json(response, 503, { error: "pricing_model_unavailable" });
  }

  let calculationCompleted = false;
  try {
    const now = new Date();
    const scopeHash = createRateLimitScopeHash(request, hashPepper);
    const rateLimitAllowed = await consumeRateLimit({ supabaseUrl, serviceRoleKey, scopeHash });
    if (rateLimitAllowed === null) return json(response, 503, { error: "pricing_model_unavailable" });
    if (!rateLimitAllowed) {
      response.setHeader("Retry-After", String(RATE_LIMIT_WINDOW_SECONDS));
      return json(response, 429, { error: "rate_limit_exceeded" });
    }

    const context = await loadActivePricingContext({ supabaseUrl, serviceRoleKey, now });
    if (!context) return json(response, 503, { error: "pricing_model_unavailable" });

    const validatedAnswers = validateAnswersAgainstContract(payload.value, context.questionnaireContract);
    if (!validatedAnswers.ok) {
      return json(response, validatedAnswers.status, {
        error: validatedAnswers.error,
        details: validatedAnswers.details,
      });
    }

    const result = calculateEstimateCore({
      catalog: context.catalog,
      request: {
        serviceIds: payload.value.serviceIds,
        currency: payload.value.currency,
        answers: validatedAnswers.value.answers,
        profile: payload.value.profile,
      },
      rateSnapshot: context.rateSnapshot,
      preflightReasons: validatedAnswers.value.preflightReasons,
      calculationScopeByService: Object.fromEntries(payload.value.serviceIds.map((serviceId) => {
        const definition = context.catalog.services[serviceId];
        return [serviceId, buildServiceCalculationScope({
          questions: context.questionnaireContract[serviceId].questions,
          answers: validatedAnswers.value.answers,
          profile: payload.value.profile,
          profileContract: PROJECT_PROFILE_CONTRACT,
          rules: definition.status === "configured" ? definition.rules : [],
          pricingStatus: definition.status,
        })];
      })),
    });

    calculationCompleted = true;

    const requestHashes = createRequestHashes({
      request,
      normalizedPayload: {
        serviceIds: payload.value.serviceIds,
        currency: payload.value.currency,
        answers: validatedAnswers.value.answers,
        profile: payload.value.profile,
      },
      modelId: context.modelId,
      modelVersion: context.modelVersion,
      pepper: hashPepper,
    });
    const session = requestHashes.session;
    const displayRate = context.rateSnapshot.rates[payload.value.currency];
    const displayRateRow = context.rateRows[payload.value.currency] ?? null;
    const rpcUrl = new URL("/rest/v1/rpc/record_project_estimate", supabaseUrl).toString();
    const persistenceResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: supabaseHeaders(serviceRoleKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        p_session_token_hash: session.tokenHash,
        p_idempotency_key_hash: requestHashes.idempotencyKeyHash,
        p_pricing_model_id: context.modelId,
        p_pricing_model_version: context.modelVersion,
        p_exchange_rate_snapshot_id: displayRateRow?.id ?? null,
        p_services: payload.value.serviceIds,
        p_answers: {
          profile: payload.value.profile,
          services: validatedAnswers.value.answers,
        },
        p_breakdown: result,
        p_assumptions: result.assumptions,
        p_result_status: result.status,
        p_amount_low_xof: result.totalXof?.lower ?? null,
        p_amount_high_xof: result.totalXof?.upper ?? null,
        p_display_currency: payload.value.currency,
        p_display_rate_xof_per_unit: displayRate.xofPerUnit,
        p_rate_source: displayRate.sourceName,
        p_rate_source_url: displayRate.sourceUrl,
        p_rate_observed_on: displayRate.rateDate,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!persistenceResponse.ok) return json(response, 503, { error: "estimate_persistence_failed" });
    const persisted = await persistenceResponse.json();
    const estimateId = persisted?.id ?? null;
    if (!estimateId || !persisted?.expires_at) {
      return json(response, 503, { error: "estimate_persistence_failed" });
    }

    return json(response, 201, {
      estimateId,
      estimateToken: session.token,
      expiresAt: persisted.expires_at,
      estimate: result,
    });
  } catch {
    return json(response, 503, {
      error: calculationCompleted ? "estimate_persistence_failed" : "pricing_model_unavailable",
    });
  }
}
