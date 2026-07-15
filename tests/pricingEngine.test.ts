import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateEstimateCore,
  convertXofRange,
  roundXofRange,
} from "../shared/estimator-pricing-engine.js";
import { officialExchangeRateSnapshot, productionPricingCatalog } from "../src/app/estimator/pricingCatalog.ts";
import {
  calculateEstimate,
  getCalculationScopeByService,
  getEstimatePreflightReasons,
  validatePricingCatalog,
} from "../src/app/estimator/pricingEngine.ts";
import type { PricingCatalog } from "../src/app/estimator/pricingTypes.ts";

const testOnlyCatalog = {
  modelVersion: "test-only-mechanical-reference",
  status: "active",
  effectiveFrom: "2026-07-15",
  services: {
    "editorial-strategy": {
      status: "configured",
      baseRangeXof: { lower: 100_000, upper: 150_000 },
      rules: [
        {
          id: "test-editorial-blog-option",
          input: { scope: "service-question", key: "editorial.channels" },
          dimension: "volume",
          label: { fr: "Fixture option blog", en: "Blog option fixture" },
          when: { operator: "includes", value: "blog" },
          operation: "add-range",
          rangeXof: { lower: 20_000, upper: 30_000 },
        },
        {
          id: "test-editorial-extra-brands",
          input: { scope: "service-question", key: "editorial.brandCount" },
          dimension: "volume",
          label: { fr: "Fixture marques", en: "Brands fixture" },
          when: { operator: "equals", value: "two-three" },
          operation: "add-range",
          rangeXof: { lower: 20_000, upper: 30_000 },
        },
        {
          id: "test-editorial-revision-complexity",
          input: { scope: "service-question", key: "editorial.currentState" },
          dimension: "complexity",
          label: { fr: "Fixture révision", en: "Revision fixture" },
          when: { operator: "equals", value: "revision" },
          operation: "multiply-bps",
          lowerBasisPoints: 11_000,
          upperBasisPoints: 12_000,
        },
        {
          id: "test-editorial-manual-limit",
          input: { scope: "service-question", key: "editorial.currentState" },
          dimension: "complexity",
          label: { fr: "Fixture hors cadre", en: "Manual fixture" },
          when: { operator: "equals", value: "multiple-to-merge" },
          operation: "manual-review",
          reasonCode: "test-complex-program",
        },
      ],
    },
    "digital-communication": {
      status: "configured",
      baseRangeXof: { lower: 90_000, upper: 130_000 },
      rules: [],
    },
    "content-creation": {
      status: "configured",
      baseRangeXof: { lower: 80_000, upper: 120_000 },
      rules: [],
    },
    "audit-advice": {
      status: "configured",
      baseRangeXof: { lower: 70_000, upper: 100_000 },
      rules: [],
    },
    "visual-identity": {
      status: "configured",
      baseRangeXof: { lower: 110_000, upper: 170_000 },
      rules: [],
    },
  },
  mutualizationRules: [
    {
      id: "test-editorial-content-mutualization",
      label: { fr: "Fixture mutualisation", en: "Mutualization fixture" },
      requiredServiceIds: ["editorial-strategy", "content-creation"],
      appliedToServiceIds: ["content-creation"],
      discountBasisPoints: 1_000,
    },
  ],
  rounding: {
    status: "configured",
    incrementXof: 5_000,
    lower: "down",
    upper: "up",
  },
  tax: {
    status: "configured",
    treatment: "excluded",
    rateBasisPoints: 1_000,
    label: { fr: "Taxe fixture", en: "Tax fixture" },
  },
} as const satisfies PricingCatalog;

const completeProfile = {
  organizationScale: "startup-small",
  clientLocation: "benin",
  projectStage: "launch",
  marketScope: "local",
  languageScope: "one",
  timeline: "one-two-months",
  validationProcess: "one",
} as const;

test("production pricing publishes a complete, versioned XOF calibration", () => {
  const result = calculateEstimateCore({
    catalog: productionPricingCatalog,
    request: { serviceIds: ["editorial-strategy"], answers: {}, profile: completeProfile, currency: "XOF" },
    rateSnapshot: officialExchangeRateSnapshot,
  });

  assert.equal(productionPricingCatalog.status, "active");
  assert.equal(productionPricingCatalog.modelVersion, "2026-07-15-benin-calibration");
  assert.deepEqual(validatePricingCatalog(productionPricingCatalog), []);
  assert.equal(result.status, "estimated");
  assert.deepEqual(result.totalXof, { lower: 150_000, upper: 260_000 });
});

test("one representative production scenario per service stays inside the approved calibration bands", () => {
  const scenarios = [
    {
      serviceId: "editorial-strategy",
      answers: {
        "editorial.currentState": "informal",
        "editorial.brandCount": "one",
        "editorial.audienceCount": "two-three",
        "editorial.existingCorpusSize": "up-to-ten",
        "editorial.benchmarkScope": "focused",
        "editorial.deliverables": ["content-pillars", "editorial-charter", "presentation"],
        "editorial.discoveryMethod": ["documents", "questionnaire"],
      },
      expected: { lower: 245_000, upper: 425_000 },
    },
    {
      serviceId: "digital-communication",
      answers: {
        "communication.engagementType": "ongoing",
        "communication.accountCount": "two-three",
        "communication.durationMonths": "three",
        "communication.postsPerMonth": "regular",
        "communication.contentResponsibility": "mixed",
        "communication.tasks": ["planning", "scheduling", "publishing", "reporting-recommendations"],
        "communication.communityManagement": "standard",
        "communication.paidMedia": "none",
      },
      expected: { lower: 440_000, upper: 825_000 },
    },
    {
      serviceId: "content-creation",
      answers: {
        "content.formats": ["short-post", "carousel", "static-visual"],
        "content.totalVolume": "eleven-twenty",
        "content.sourceMaterial": "partial",
        "content.visualTemplates": "adapt",
        "content.deliveryRhythm": "monthly",
        "content.usageRights": ["organic"],
        "content.onSiteProduction": "none",
      },
      expected: { lower: 320_000, upper: 670_000 },
    },
    {
      serviceId: "audit-advice",
      answers: {
        "audit.assetCount": "four-six",
        "audit.brandCount": "one",
        "audit.depth": "implementation",
        "audit.benchmarkScope": "focused",
        "audit.dataAccess": ["public", "analytics"],
      },
      expected: { lower: 490_000, upper: 955_000 },
    },
    {
      serviceId: "visual-identity",
      answers: {
        "identity.projectType": "complete-identity",
        "identity.visualState": ["none"],
        "identity.namingState": "validated",
        "identity.positioningState": "needs-framing",
        "identity.brandCount": "one",
        "identity.coreDeliverables": ["logo", "logo-variants", "colors", "typography", "graphic-elements", "art-direction", "social-kit", "guide-compact"],
        "identity.supportCount": "one-two",
        "identity.priorityUses": ["social", "web", "commercial-docs", "print"],
      },
      expected: { lower: 435_000, upper: 805_000 },
    },
  ] as const;

  for (const scenario of scenarios) {
    const result = calculateEstimateCore({
      catalog: productionPricingCatalog,
      request: {
        serviceIds: [scenario.serviceId],
        answers: scenario.answers,
        profile: completeProfile,
        currency: "XOF",
      },
      rateSnapshot: officialExchangeRateSnapshot,
    });
    assert.equal(result.status, "estimated", scenario.serviceId);
    assert.deepEqual(result.totalXof, scenario.expected, scenario.serviceId);
  }
});

test("the CLOGIS reference reflects fair value, not the exceptional negotiated discount", () => {
  const result = calculateEstimateCore({
    catalog: productionPricingCatalog,
    request: {
      serviceIds: ["visual-identity"],
      profile: completeProfile,
      currency: "XOF",
      answers: {
        "identity.projectType": "complete-identity",
        "identity.visualState": ["none"],
        "identity.namingState": "validated",
        "identity.positioningState": "needs-framing",
        "identity.brandCount": "one",
        "identity.coreDeliverables": ["logo", "logo-variants", "colors", "typography", "graphic-elements", "art-direction", "social-kit", "guide-compact"],
        "identity.supportCount": "one-two",
        "identity.priorityUses": ["social", "web", "commercial-docs", "print"],
      },
    },
    rateSnapshot: officialExchangeRateSnapshot,
  });

  assert.deepEqual(result.totalXof, { lower: 435_000, upper: 805_000 });
  assert.ok(result.totalXof.lower > 200_000);
});

test("an empty project never produces a zero-value estimate", () => {
  const result = calculateEstimateCore({
    catalog: testOnlyCatalog,
    request: { serviceIds: [], answers: {}, profile: completeProfile, currency: "XOF" },
    rateSnapshot: officialExchangeRateSnapshot,
  });

  assert.equal(result.status, "manual-review");
  assert.equal(result.totalXof, null);
  assert.deepEqual(result.manualReviewReasons, [{ code: "no-service-selected" }]);
});

test("reference scenario applies options, volume, complexity, mutualization, tax and rounding deterministically", () => {
  const request = {
    serviceIds: ["editorial-strategy", "content-creation"] as const,
    answers: {
      "editorial.channels": ["blog"],
      "editorial.brandCount": "two-three",
      "editorial.currentState": "revision",
    },
    profile: completeProfile,
    currency: "XOF" as const,
  };

  const first = calculateEstimateCore({
    catalog: testOnlyCatalog,
    request,
    rateSnapshot: officialExchangeRateSnapshot,
  });
  const second = calculateEstimateCore({
    catalog: testOnlyCatalog,
    request,
    rateSnapshot: officialExchangeRateSnapshot,
  });

  assert.deepEqual(first, second);
  assert.equal(first.status, "estimated");
  assert.deepEqual(first.services.map((service) => service.rangeXof), [
    { lower: 150_000, upper: 255_000 },
    { lower: 80_000, upper: 120_000 },
  ]);
  assert.deepEqual(first.subtotalXof, { lower: 220_000, upper: 365_000 });
  assert.deepEqual(first.taxXof, { lower: 20_000, upper: 40_000 });
  assert.deepEqual(first.totalXof, { lower: 240_000, upper: 405_000 });
  assert.equal(first.mutualizations.length, 1);
  assert.deepEqual(first.mutualizations[0].effectXof, { lower: -8_000, upper: -12_000 });
});

test("manual-review rule suppresses only the unsupported service estimate", () => {
  const result = calculateEstimateCore({
    catalog: testOnlyCatalog,
    request: {
      serviceIds: ["editorial-strategy", "content-creation"],
      answers: { "editorial.currentState": "multiple-to-merge" },
      profile: completeProfile,
      currency: "EUR",
    },
    rateSnapshot: officialExchangeRateSnapshot,
  });

  assert.equal(result.status, "manual-review");
  assert.equal(result.totalXof, null);
  assert.equal(result.services[0].status, "manual-review");
  assert.equal(result.services[0].rangeXof, null);
  assert.equal(result.services[1].status, "estimated");
  assert.deepEqual(result.services[1].rangeXof, { lower: 80_000, upper: 120_000 });
});

test("official frozen rates convert the canonical XOF amount and retain source metadata", () => {
  const eur = convertXofRange({ lower: 655_957, upper: 655_957 }, "EUR", officialExchangeRateSnapshot);
  const usd = convertXofRange({ lower: 574_190, upper: 574_190 }, "USD", officialExchangeRateSnapshot);

  assert.deepEqual({ lower: eur.lower, upper: eur.upper }, { lower: 1_000, upper: 1_000 });
  assert.deepEqual({ lower: usd.lower, upper: usd.upper }, { lower: 1_000, upper: 1_000 });
  assert.equal(eur.rateDate, "1999-01-01");
  assert.equal(usd.rateDate, "2026-07-13");
  assert.equal(usd.snapshotId, "bceao-2026-07-13-retrieved-2026-07-15");
});

test("range rounding keeps a conservative lower and upper bound", () => {
  assert.deepEqual(
    roundXofRange(
      { lower: 102_001, upper: 147_999 },
      { status: "configured", incrementXof: 5_000, lower: "down", upper: "up" },
    ),
    { lower: 100_000, upper: 150_000 },
  );
});

test("catalog validation rejects pricing rules detached from the questionnaire", () => {
  const invalid = structuredClone(testOnlyCatalog) as unknown as PricingCatalog;
  const editorial = invalid.services["editorial-strategy"];
  if (editorial.status !== "configured") throw new Error("invalid fixture");
  editorial.rules = [
    {
      ...editorial.rules[0],
      input: { scope: "service-question", key: "editorial.unknownQuestion" },
    },
  ];

  assert.deepEqual(validatePricingCatalog(invalid), [
    "editorial-strategy.test-editorial-blog-option: unknown question editorial.unknownQuestion",
  ]);
});

test("a versioned rule can use an eligible shared-profile dimension", () => {
  const catalog = structuredClone(testOnlyCatalog) as unknown as PricingCatalog;
  const editorial = catalog.services["editorial-strategy"];
  if (editorial.status !== "configured") throw new Error("invalid fixture");
  editorial.rules = [{
    id: "test-international-complexity",
    input: { scope: "shared-profile", key: "marketScope" },
    dimension: "complexity",
    label: { fr: "Fixture international", en: "International fixture" },
    when: { operator: "equals", value: "international" },
    operation: "add-range",
    rangeXof: { lower: 10_000, upper: 20_000 },
  }];

  assert.deepEqual(validatePricingCatalog(catalog), []);
  const result = calculateEstimateCore({
    catalog,
    request: {
      serviceIds: ["editorial-strategy"],
      answers: {},
      profile: { ...completeProfile, marketScope: "international" },
      currency: "XOF",
    },
    rateSnapshot: officialExchangeRateSnapshot,
  });
  assert.deepEqual(result.totalXof, { lower: 120_000, upper: 190_000 });
  assert.deepEqual(result.services[0].appliedAdjustments[0].input, {
    scope: "shared-profile",
    key: "marketScope",
  });
});

test("brief-only profile data cannot drive pricing and is not required for an estimate", () => {
  const invalid = structuredClone(testOnlyCatalog) as unknown as PricingCatalog;
  const editorial = invalid.services["editorial-strategy"];
  if (editorial.status !== "configured") throw new Error("invalid fixture");
  editorial.rules = [{
    id: "test-forbidden-organization-type",
    input: { scope: "shared-profile", key: "organizationType" },
    dimension: "complexity",
    label: { fr: "Fixture interdite", en: "Forbidden fixture" },
    when: { operator: "equals", value: "business" },
    operation: "add-range",
    rangeXof: { lower: 1, upper: 1 },
  }];

  assert.deepEqual(validatePricingCatalog(invalid), [
    "editorial-strategy.test-forbidden-organization-type: brief-prefill-only profile field cannot drive pricing",
    "editorial-strategy.test-forbidden-organization-type: dimension complexity is not declared by shared profile organizationType",
  ]);

  const reasons = getEstimatePreflightReasons({
    serviceIds: [],
    answers: {},
    profile: {},
    currency: "XOF",
  });
  assert.equal(reasons.some((reason) => reason.profileKey === "organizationType"), false);
  assert.equal(reasons.filter((reason) => reason.code === "incomplete-profile").length, 7);
});

test("public calculation scope exposes only visible normalized inputs and explicit exclusions", () => {
  const scopes = getCalculationScopeByService({
    serviceIds: ["editorial-strategy"],
    answers: {
      "editorial.currentState": "none",
      "editorial.channels": ["blog"],
      "editorial.deliverables": ["content-pillars"],
      "editorial.benchmarkScope": "none",
    },
    profile: completeProfile,
    currency: "XOF",
  }, testOnlyCatalog);
  const scope = scopes["editorial-strategy"];
  assert.ok(scope);
  assert.equal(scope.baseScope.source, "catalog-base-range");
  assert.equal(scope.baseScope.pricingStatus, "configured");
  assert.equal(Object.isFrozen(scope), true);
  assert.equal(Object.isFrozen(scope.inclusions), true);

  const channels = scope.inclusions.find((entry) => entry.input.key === "editorial.channels");
  assert.deepEqual(channels?.value, ["blog"]);
  assert.deepEqual(channels?.appliedRuleIds, ["test-editorial-blog-option"]);
  assert.equal(scope.volumes.some((entry) => entry.input.key === "editorial.channels"), true);
  assert.equal(scope.options.some((entry) => entry.input.key === "editorial.deliverables"), true);
  assert.equal(scope.inclusions.some((entry) => entry.input.key === "editorial.currentState"), true);
  assert.equal(scope.exclusions.some((entry) =>
    entry.input.key === "editorial.benchmarkScope" && entry.reason === "explicit-exclusion"
  ), true);
  assert.equal(scope.inclusions.some((entry) => entry.input.key === "editorial.interviewCount"), false);
});
