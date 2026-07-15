import {
  buildServiceCalculationScope,
  calculateEstimateCore,
} from "../../../shared/estimator-pricing-engine.js";
import {
  PROJECT_PROFILE_CONTRACT,
  PROJECT_PROFILE_KEYS,
} from "../../../shared/estimator-profile-contract.js";
import {
  getQuestionPurpose,
  getManualReviewFlags,
  getSerializableQuestionnaireContract,
  getVisibleQuestions,
  isQuestionAnswered,
  serviceQuestionnaires,
  type EstimatorServiceId,
  type PricingDimension,
  type ServiceQuestion,
} from "./serviceQuestionnaires.ts";
import { officialExchangeRateSnapshot, productionPricingCatalog } from "./pricingCatalog.ts";
import type {
  EstimateRequest,
  EstimateResult,
  ExchangeRateSnapshot,
  ManualReviewReason,
  PricingCatalog,
  PricingRule,
  ServiceCalculationScope,
  ServicePricingDefinition,
  XofRange,
} from "./pricingTypes.ts";

function isValidRange(range: XofRange): boolean {
  return Number.isFinite(range.lower) && Number.isFinite(range.upper) && range.lower >= 0 && range.lower <= range.upper;
}

function validateRule(
  serviceId: EstimatorServiceId,
  rule: PricingRule,
): string[] {
  const errors: string[] = [];
  const predicateValues = rule.when.operator === "one-of" ? rule.when.value : "value" in rule.when ? [rule.when.value] : [];
  let inputType: "choice" | "multi" | "number" = "choice";
  let allowedValues: readonly string[] | undefined;

  if (rule.input.scope === "service-question") {
    const questions = serviceQuestionnaires[serviceId].questions as readonly ServiceQuestion[];
    const question = questions.find((entry) => entry.key === rule.input.key);
    if (!question) return [`${serviceId}.${rule.id}: unknown question ${rule.input.key}`];
    if (getQuestionPurpose(question) === "brief-prefill-only") {
      errors.push(`${serviceId}.${rule.id}: brief-prefill-only question cannot drive pricing`);
    }
    if (!question.pricingDimension.includes(rule.dimension)) {
      errors.push(`${serviceId}.${rule.id}: dimension ${rule.dimension} is not declared by ${rule.input.key}`);
    }
    inputType = question.type;
    allowedValues = question.options?.map((option) => option.value);
  } else {
    const field = PROJECT_PROFILE_CONTRACT[rule.input.key];
    if (!field) return [`${serviceId}.${rule.id}: unknown shared profile field ${rule.input.key}`];
    if (field.purpose === "brief-prefill-only") {
      errors.push(`${serviceId}.${rule.id}: brief-prefill-only profile field cannot drive pricing`);
    }
    if (!(field.pricingDimensions as readonly PricingDimension[]).includes(rule.dimension)) {
      errors.push(`${serviceId}.${rule.id}: dimension ${rule.dimension} is not declared by shared profile ${rule.input.key}`);
    }
    allowedValues = field.values;
  }

  if (allowedValues && predicateValues.length > 0) {
    const optionValues = new Set(allowedValues);
    for (const value of predicateValues) {
      if (typeof value === "string" && !optionValues.has(value)) {
        errors.push(`${serviceId}.${rule.id}: unknown option ${value}`);
      }
    }
  }

  if (rule.operation === "per-unit-range" && inputType !== "number") {
    errors.push(`${serviceId}.${rule.id}: per-unit rule requires a number question`);
  }
  if (rule.operation === "add-range" && !isValidRange(rule.rangeXof)) {
    errors.push(`${serviceId}.${rule.id}: invalid additive range`);
  }
  if (rule.operation === "per-unit-range" && !isValidRange(rule.unitRangeXof)) {
    errors.push(`${serviceId}.${rule.id}: invalid unit range`);
  }
  if (rule.operation === "per-unit-range" && (!Number.isInteger(rule.includedUnits) || rule.includedUnits < 0)) {
    errors.push(`${serviceId}.${rule.id}: invalid included unit count`);
  }
  if (
    rule.operation === "multiply-bps" &&
    (!Number.isFinite(rule.lowerBasisPoints) ||
      !Number.isFinite(rule.upperBasisPoints) ||
      rule.lowerBasisPoints < 0 ||
      rule.upperBasisPoints < 0 ||
      rule.lowerBasisPoints > rule.upperBasisPoints)
  ) {
    errors.push(`${serviceId}.${rule.id}: invalid multiplier`);
  }

  return errors;
}

function validateServicePricing(
  serviceId: EstimatorServiceId,
  definition: ServicePricingDefinition,
): string[] {
  if (definition.status !== "configured") return [];
  const errors = isValidRange(definition.baseRangeXof) ? [] : [`${serviceId}: invalid base range`];
  const ruleIds = definition.rules.map((rule) => rule.id);
  if (new Set(ruleIds).size !== ruleIds.length) errors.push(`${serviceId}: duplicate pricing rule id`);
  return errors.concat(definition.rules.flatMap((rule) => validateRule(serviceId, rule)));
}

export function validatePricingCatalog(catalog: PricingCatalog): string[] {
  const errors = (Object.entries(catalog.services) as [EstimatorServiceId, ServicePricingDefinition][])
    .flatMap(([serviceId, definition]) => validateServicePricing(serviceId, definition));

  if (catalog.status === "active") {
    for (const [serviceId, definition] of Object.entries(catalog.services)) {
      if (definition.status !== "configured") errors.push(`${serviceId}: active catalog has no validated pricing`);
    }
    if (catalog.rounding.status !== "configured") errors.push("active catalog has no rounding policy");
    if (catalog.tax.status !== "configured") errors.push("active catalog has no tax policy");
  }

  if (
    catalog.rounding.status === "configured" &&
    (!Number.isFinite(catalog.rounding.incrementXof) || catalog.rounding.incrementXof <= 0)
  ) {
    errors.push("invalid rounding increment");
  }
  if (
    catalog.tax.status === "configured" &&
    (!Number.isFinite(catalog.tax.rateBasisPoints) || catalog.tax.rateBasisPoints < 0)
  ) {
    errors.push("invalid tax rate");
  }

  const mutualizationIds = catalog.mutualizationRules.map((rule) => rule.id);
  if (new Set(mutualizationIds).size !== mutualizationIds.length) errors.push("duplicate mutualization rule id");
  for (const rule of catalog.mutualizationRules) {
    if (!Number.isFinite(rule.discountBasisPoints) || rule.discountBasisPoints < 0 || rule.discountBasisPoints > 10_000) {
      errors.push(`${rule.id}: invalid mutualization rate`);
    }
  }

  return errors;
}

export function getEstimatePreflightReasons(request: EstimateRequest): ManualReviewReason[] {
  const reasons: ManualReviewReason[] = [];

  for (const profileKey of PROJECT_PROFILE_KEYS) {
    const field = PROJECT_PROFILE_CONTRACT[profileKey];
    if (!field.requiredForEstimate) continue;
    const answer = request.profile[profileKey];
    if (typeof answer === "string" && field.values.includes(answer)) continue;
    reasons.push({ code: "incomplete-profile", profileKey });
  }

  for (const serviceId of request.serviceIds) {
    for (const question of getVisibleQuestions(serviceId, request.answers)) {
      if (!question.requiredForEstimate || isQuestionAnswered(question, request.answers[question.key])) continue;
      reasons.push({
        code: "incomplete-answer",
        serviceId,
        questionKey: question.key,
      });
    }
  }

  for (const flag of getManualReviewFlags(request.serviceIds, request.answers)) {
    reasons.push({
      code: "questionnaire-manual-review",
      serviceId: flag.serviceId,
      questionKey: flag.questionKey,
      details: flag.selectedOptions,
    });
  }

  return reasons;
}

export function getCalculationScopeByService(
  request: EstimateRequest,
  catalog: PricingCatalog,
): Partial<Record<EstimatorServiceId, ServiceCalculationScope>> {
  const questionnaireContract = getSerializableQuestionnaireContract();
  return Object.fromEntries(request.serviceIds.map((serviceId) => {
    const definition = catalog.services[serviceId];
    return [serviceId, buildServiceCalculationScope({
      questions: questionnaireContract[serviceId].questions,
      answers: request.answers,
      profile: request.profile,
      profileContract: PROJECT_PROFILE_CONTRACT,
      rules: definition.status === "configured" ? definition.rules : [],
      pricingStatus: definition.status,
    })];
  }));
}

export function calculateEstimate(
  request: EstimateRequest,
  options: {
    catalog?: PricingCatalog;
    rateSnapshot?: ExchangeRateSnapshot;
  } = {},
): EstimateResult {
  const catalog = options.catalog ?? productionPricingCatalog;
  const catalogErrors = validatePricingCatalog(catalog);
  if (catalogErrors.length > 0) {
    throw new Error(`Invalid pricing catalog:\n${catalogErrors.join("\n")}`);
  }

  const normalizedRequest = {
    ...request,
    serviceIds: [...new Set(request.serviceIds)],
  };

  return calculateEstimateCore({
    catalog,
    request: normalizedRequest,
    rateSnapshot: options.rateSnapshot ?? officialExchangeRateSnapshot,
    preflightReasons: getEstimatePreflightReasons(normalizedRequest),
    calculationScopeByService: getCalculationScopeByService(normalizedRequest, catalog),
  });
}
