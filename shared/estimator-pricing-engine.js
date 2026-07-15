const BASIS_POINTS = 10_000;

function assertFiniteNonNegative(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a finite non-negative number`);
  }
}

function assertRange(range, name) {
  assertFiniteNonNegative(range?.lower, `${name}.lower`);
  assertFiniteNonNegative(range?.upper, `${name}.upper`);
  if (range.lower > range.upper) {
    throw new RangeError(`${name}.lower must not exceed ${name}.upper`);
  }
}

export function evaluatePricingPredicate(answer, predicate) {
  if (predicate.operator === "equals") return answer === predicate.value;
  if (predicate.operator === "includes") {
    return Array.isArray(answer) && answer.includes(predicate.value);
  }
  if (predicate.operator === "one-of") {
    if (Array.isArray(answer)) return answer.some((value) => predicate.value.includes(value));
    return predicate.value.includes(answer);
  }
  if (predicate.operator === "number-at-least") {
    return typeof answer === "number" && Number.isFinite(answer) && answer >= predicate.value;
  }
  if (predicate.operator === "number-above") {
    return typeof answer === "number" && Number.isFinite(answer) && answer > predicate.value;
  }
  return false;
}

function isScopeDependencyMet(dependency, answers) {
  if (!dependency) return true;
  const answer = answers[dependency.questionKey];
  if (dependency.operator === "equals") return answer === dependency.value;
  if (dependency.operator === "notEquals") return answer !== dependency.value;
  if (dependency.operator === "includes") return Array.isArray(answer) && answer.includes(dependency.value);
  if (dependency.operator === "oneOf") {
    const values = Array.isArray(dependency.value) ? dependency.value : [dependency.value];
    return values.includes(answer);
  }
  return false;
}

function normalizeScopeValue(question, value) {
  if (question.type === "number") return Number.isFinite(value) ? value : undefined;
  if (question.type === "choice") {
    if (typeof value !== "string") return undefined;
    const normalized = value.trim();
    return question.optionValues.includes(normalized) ? normalized : undefined;
  }
  if (!Array.isArray(value)) return undefined;
  const selected = new Set(value.filter((entry) => typeof entry === "string").map((entry) => entry.trim()));
  const normalized = question.optionValues.filter((option) => selected.has(option));
  return normalized.length > 0 ? Object.freeze(normalized) : undefined;
}

function freezeScopeEntry(input, value, dimensions, appliedRuleIds) {
  return Object.freeze({
    input: Object.freeze({ ...input }),
    value,
    dimensions: Object.freeze([...dimensions]),
    appliedRuleIds: Object.freeze([...appliedRuleIds]),
  });
}

function freezeScopeExclusion(input, reason, value) {
  return Object.freeze({
    input: Object.freeze({ ...input }),
    reason,
    ...(value === undefined ? {} : { value }),
  });
}

/**
 * Builds the public, semantic snapshot of what a service estimate did and did
 * not take into account. It carries stable keys and normalized values only;
 * labels remain resolved by the versioned questionnaire/profile contracts.
 */
export function buildServiceCalculationScope({
  questions,
  answers,
  profile,
  profileContract,
  rules,
  pricingStatus,
}) {
  const inclusions = [];
  const exclusions = [];

  for (const question of questions) {
    if (!isScopeDependencyMet(question.dependsOn, answers)) continue;
    const input = { scope: "service-question", key: question.key };
    const normalized = normalizeScopeValue(question, answers[question.key]);

    if (question.purpose === "brief-prefill-only") {
      if (normalized !== undefined) {
        exclusions.push(freezeScopeExclusion(input, "brief-prefill-only", normalized));
      }
      continue;
    }
    if (normalized === undefined) {
      exclusions.push(freezeScopeExclusion(input, "not-provided"));
      continue;
    }
    const normalizedValues = Array.isArray(normalized) ? normalized : [normalized];
    if (normalizedValues.some((value) => question.calculationExclusionOptions?.includes(value))) {
      exclusions.push(freezeScopeExclusion(input, "explicit-exclusion", normalized));
      continue;
    }

    const appliedRuleIds = rules
      .filter((rule) =>
        rule.input?.scope === "service-question" &&
        rule.input.key === question.key &&
        evaluatePricingPredicate(normalized, rule.when),
      )
      .map((rule) => rule.id);
    inclusions.push(freezeScopeEntry(input, normalized, question.pricingDimensions, appliedRuleIds));
  }

  const sharedInputs = [...new Set(
    rules
      .filter((rule) => rule.input?.scope === "shared-profile")
      .map((rule) => rule.input.key),
  )];
  for (const key of sharedInputs) {
    const field = profileContract[key];
    if (!field || field.purpose !== "pricing-and-prefill") continue;
    const value = typeof profile[key] === "string" ? profile[key].trim() : "";
    const input = { scope: "shared-profile", key };
    if (!value || !field.values.includes(value)) {
      exclusions.push(freezeScopeExclusion(input, "not-provided"));
      continue;
    }
    const appliedRuleIds = rules
      .filter((rule) =>
        rule.input?.scope === "shared-profile" &&
        rule.input.key === key &&
        evaluatePricingPredicate(value, rule.when),
      )
      .map((rule) => rule.id);
    inclusions.push(freezeScopeEntry(input, value, field.pricingDimensions, appliedRuleIds));
  }

  const baseEntries = inclusions.filter((entry) => entry.dimensions.includes("base-scope"));
  const volumeEntries = inclusions.filter((entry) => entry.dimensions.includes("volume"));
  const optionEntries = inclusions.filter((entry) => entry.dimensions.includes("options"));
  return Object.freeze({
    baseScope: Object.freeze({
      source: "catalog-base-range",
      pricingStatus,
      entries: Object.freeze(baseEntries),
    }),
    inclusions: Object.freeze(inclusions),
    volumes: Object.freeze(volumeEntries),
    options: Object.freeze(optionEntries),
    exclusions: Object.freeze(exclusions),
  });
}

function emptyServiceCalculationScope(pricingStatus = "awaiting-business-values") {
  return Object.freeze({
    baseScope: Object.freeze({
      source: "catalog-base-range",
      pricingStatus,
      entries: Object.freeze([]),
    }),
    inclusions: Object.freeze([]),
    volumes: Object.freeze([]),
    options: Object.freeze([]),
    exclusions: Object.freeze([]),
  });
}

function roundAmount(amount, increment, mode) {
  const scaled = amount / increment;
  if (mode === "down") return Math.floor(scaled) * increment;
  if (mode === "up") return Math.ceil(scaled) * increment;
  return Math.round(scaled) * increment;
}

export function roundXofRange(range, policy) {
  assertRange(range, "range");
  assertFiniteNonNegative(policy?.incrementXof, "rounding.incrementXof");
  if (policy.incrementXof === 0) throw new RangeError("rounding.incrementXof must be greater than zero");

  return {
    lower: roundAmount(range.lower, policy.incrementXof, policy.lower),
    upper: roundAmount(range.upper, policy.incrementXof, policy.upper),
  };
}

export function convertXofRange(range, currency, snapshot) {
  assertRange(range, "range");
  const rate = snapshot?.rates?.[currency];
  if (!rate) throw new RangeError(`missing exchange rate for ${currency}`);
  if (!Number.isFinite(rate.xofPerUnit) || rate.xofPerUnit <= 0) {
    throw new RangeError(`invalid exchange rate for ${currency}`);
  }

  const scale = 10 ** rate.displayDecimals;
  const convert = (amount) => Math.round((amount / rate.xofPerUnit) * scale) / scale;

  return {
    currency,
    lower: convert(range.lower),
    upper: convert(range.upper),
    xofPerUnit: rate.xofPerUnit,
    rateDate: rate.rateDate,
    sourceName: rate.sourceName,
    sourceUrl: rate.sourceUrl,
    snapshotId: snapshot.snapshotId,
  };
}

function globalReason(code, details) {
  return details?.length ? { code, details } : { code };
}

function unavailableResult(catalog, request, reasons, serviceReasons = new Map()) {
  return {
    status: "manual-review",
    modelVersion: catalog.modelVersion,
    services: request.serviceIds.map((serviceId) => ({
      serviceId,
      status: "manual-review",
      rangeXof: null,
      appliedAdjustments: [],
      calculationScope: request.calculationScopeByService?.[serviceId] ??
        emptyServiceCalculationScope(catalog.services[serviceId]?.status),
      manualReviewReasons: serviceReasons.get(serviceId) ?? reasons,
    })),
    subtotalXof: null,
    mutualizations: [],
    taxXof: null,
    totalXof: null,
    displayRange: null,
    assumptions: [
      "canonical-currency:XOF",
      `pricing-model:${catalog.modelVersion}`,
      `exchange-rate-snapshot:${request.rateSnapshot.snapshotId}`,
    ],
    manualReviewReasons: reasons,
  };
}

function applyRule(range, rule, answer) {
  if (rule.operation === "add-range") {
    assertRange(rule.rangeXof, `rule:${rule.id}.rangeXof`);
    return {
      range: {
        lower: range.lower + rule.rangeXof.lower,
        upper: range.upper + rule.rangeXof.upper,
      },
      effect: rule.rangeXof,
    };
  }

  if (rule.operation === "per-unit-range") {
    assertRange(rule.unitRangeXof, `rule:${rule.id}.unitRangeXof`);
    const units = typeof answer === "number" ? Math.max(0, answer - rule.includedUnits) : 0;
    const effect = {
      lower: units * rule.unitRangeXof.lower,
      upper: units * rule.unitRangeXof.upper,
    };
    return {
      range: { lower: range.lower + effect.lower, upper: range.upper + effect.upper },
      effect,
    };
  }

  if (rule.operation === "multiply-bps") {
    assertFiniteNonNegative(rule.lowerBasisPoints, `rule:${rule.id}.lowerBasisPoints`);
    assertFiniteNonNegative(rule.upperBasisPoints, `rule:${rule.id}.upperBasisPoints`);
    const next = {
      lower: (range.lower * rule.lowerBasisPoints) / BASIS_POINTS,
      upper: (range.upper * rule.upperBasisPoints) / BASIS_POINTS,
    };
    return {
      range: next,
      effect: { lower: next.lower - range.lower, upper: next.upper - range.upper },
    };
  }

  return { range, effect: { lower: 0, upper: 0 } };
}

/**
 * Pure calculation core shared by the browser adapter and a future Vercel
 * endpoint. It performs no network or persistence operation and never reads a
 * live exchange rate.
 */
export function calculateEstimateCore({
  catalog,
  request,
  rateSnapshot,
  preflightReasons = [],
  calculationScopeByService = {},
}) {
  const selectedServiceIds = [...new Set(request.serviceIds)];
  const normalizedRequest = {
    ...request,
    serviceIds: selectedServiceIds,
    rateSnapshot,
    calculationScopeByService,
  };

  if (selectedServiceIds.length === 0) {
    return unavailableResult(catalog, normalizedRequest, [globalReason("no-service-selected")]);
  }

  if (catalog.status !== "active") {
    return unavailableResult(catalog, normalizedRequest, [globalReason("catalog-not-active")]);
  }

  if (catalog.rounding.status !== "configured") {
    return unavailableResult(catalog, normalizedRequest, [
      globalReason("rounding-not-configured", catalog.rounding.missingFields),
    ]);
  }

  if (catalog.tax.status !== "configured") {
    return unavailableResult(catalog, normalizedRequest, [
      globalReason("tax-not-configured", catalog.tax.missingFields),
    ]);
  }

  const globalPreflightReasons = preflightReasons.filter((reason) => !reason.serviceId);
  if (globalPreflightReasons.length > 0) {
    return unavailableResult(catalog, normalizedRequest, globalPreflightReasons);
  }

  const preflightByService = new Map();
  for (const reason of preflightReasons) {
    if (!reason.serviceId) continue;
    const current = preflightByService.get(reason.serviceId) ?? [];
    current.push(reason);
    preflightByService.set(reason.serviceId, current);
  }

  const serviceEstimates = selectedServiceIds.map((serviceId) => {
    const definition = catalog.services[serviceId];
    if (!definition || definition.status !== "configured") {
      const reason = {
        code: "pricing-not-configured",
        serviceId,
        details: definition?.missingFields ?? ["serviceDefinition"],
      };
      return {
        serviceId,
        status: "manual-review",
        rangeXof: null,
        appliedAdjustments: [],
        calculationScope: calculationScopeByService[serviceId] ??
          emptyServiceCalculationScope(definition?.status),
        manualReviewReasons: [reason],
      };
    }

    assertRange(definition.baseRangeXof, `service:${serviceId}.baseRangeXof`);
    let range = { ...definition.baseRangeXof };
    const appliedAdjustments = [];
    const manualReviewReasons = [...(preflightByService.get(serviceId) ?? [])];

    for (const rule of definition.rules) {
      const answer = rule.input.scope === "shared-profile"
        ? request.profile?.[rule.input.key]
        : request.answers[rule.input.key];
      if (!evaluatePricingPredicate(answer, rule.when)) continue;

      if (rule.operation === "manual-review") {
        manualReviewReasons.push({
          code: "pricing-rule-manual-review",
          serviceId,
          ...(rule.input.scope === "shared-profile"
            ? { profileKey: rule.input.key }
            : { questionKey: rule.input.key }),
          details: [rule.reasonCode],
        });
        continue;
      }

      const applied = applyRule(range, rule, answer);
      range = applied.range;
      assertRange(range, `service:${serviceId}.rangeAfterRule:${rule.id}`);
      appliedAdjustments.push({
        id: rule.id,
        input: rule.input,
        dimension: rule.dimension,
        label: rule.label,
        effectXof: applied.effect,
      });
    }

    if (manualReviewReasons.length > 0) {
      return {
        serviceId,
        status: "manual-review",
        rangeXof: null,
        appliedAdjustments,
        calculationScope: calculationScopeByService[serviceId] ??
          emptyServiceCalculationScope(definition.status),
        manualReviewReasons,
      };
    }

    return {
      serviceId,
      status: "estimated",
      rangeXof: roundXofRange(range, catalog.rounding),
      appliedAdjustments,
      calculationScope: calculationScopeByService[serviceId] ??
        emptyServiceCalculationScope(definition.status),
      manualReviewReasons: [],
    };
  });

  const manualServices = serviceEstimates.filter((service) => service.status === "manual-review");
  if (manualServices.length > 0) {
    const reasons = manualServices.flatMap((service) => service.manualReviewReasons);
    return {
      ...unavailableResult(catalog, normalizedRequest, reasons),
      services: serviceEstimates,
    };
  }

  let subtotalXof = serviceEstimates.reduce(
    (sum, service) => ({
      lower: sum.lower + service.rangeXof.lower,
      upper: sum.upper + service.rangeXof.upper,
    }),
    { lower: 0, upper: 0 },
  );

  const mutualizations = [];
  for (const rule of catalog.mutualizationRules) {
    if (!rule.requiredServiceIds.every((serviceId) => selectedServiceIds.includes(serviceId))) continue;

    const applicableRange = serviceEstimates
      .filter((service) => rule.appliedToServiceIds.includes(service.serviceId))
      .reduce(
        (sum, service) => ({
          lower: sum.lower + service.rangeXof.lower,
          upper: sum.upper + service.rangeXof.upper,
        }),
        { lower: 0, upper: 0 },
      );
    const lowerDiscount = (applicableRange.lower * rule.discountBasisPoints) / BASIS_POINTS;
    const upperDiscount = (applicableRange.upper * rule.discountBasisPoints) / BASIS_POINTS;
    const effectXof = { lower: -lowerDiscount, upper: -upperDiscount };

    subtotalXof = {
      lower: subtotalXof.lower + effectXof.lower,
      upper: subtotalXof.upper + effectXof.upper,
    };
    assertRange(subtotalXof, `mutualization:${rule.id}.result`);
    mutualizations.push({
      id: rule.id,
      dimension: "mutualization",
      label: rule.label,
      effectXof,
    });
  }

  subtotalXof = roundXofRange(subtotalXof, catalog.rounding);
  const taxRate = catalog.tax.rateBasisPoints / BASIS_POINTS;
  let taxXof;
  let totalXof;

  if (catalog.tax.treatment === "excluded") {
    taxXof = roundXofRange(
      { lower: subtotalXof.lower * taxRate, upper: subtotalXof.upper * taxRate },
      catalog.rounding,
    );
    totalXof = roundXofRange(
      { lower: subtotalXof.lower + taxXof.lower, upper: subtotalXof.upper + taxXof.upper },
      catalog.rounding,
    );
  } else if (catalog.tax.treatment === "included") {
    totalXof = subtotalXof;
    const includedRate = taxRate === 0 ? 0 : taxRate / (1 + taxRate);
    taxXof = roundXofRange(
      { lower: totalXof.lower * includedRate, upper: totalXof.upper * includedRate },
      catalog.rounding,
    );
  } else {
    taxXof = null;
    totalXof = subtotalXof;
  }

  const displayRange = convertXofRange(totalXof, request.currency, rateSnapshot);
  const assumptions = [
    "canonical-currency:XOF",
    `pricing-model:${catalog.modelVersion}`,
    `exchange-rate-snapshot:${rateSnapshot.snapshotId}`,
    `tax:${catalog.tax.treatment}:${catalog.tax.rateBasisPoints}bps`,
    ...serviceEstimates.flatMap((service) => service.appliedAdjustments.map((rule) => `pricing-rule:${rule.id}`)),
    ...mutualizations.map((rule) => `mutualization:${rule.id}`),
  ];

  return {
    status: "estimated",
    modelVersion: catalog.modelVersion,
    services: serviceEstimates,
    subtotalXof,
    mutualizations,
    taxXof,
    totalXof,
    displayRange,
    assumptions,
    manualReviewReasons: [],
  };
}
