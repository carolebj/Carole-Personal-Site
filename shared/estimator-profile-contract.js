export const PROJECT_PROFILE_CONTRACT = Object.freeze({
  organizationType: Object.freeze({
    values: Object.freeze(["business", "entrepreneur", "nonprofit", "institution"]),
    purpose: "brief-prefill-only",
    requiredForEstimate: false,
    pricingDimensions: Object.freeze([]),
    briefMapping: Object.freeze({ brief: "global", field: "organizationType" }),
  }),
  organizationScale: Object.freeze({
    values: Object.freeze(["solo-micro", "startup-small", "established", "large-institution"]),
    purpose: "pricing-and-prefill",
    requiredForEstimate: true,
    pricingDimensions: Object.freeze(["validation", "complexity"]),
    briefMapping: Object.freeze({ brief: "global", field: "organizationScale" }),
  }),
  clientLocation: Object.freeze({
    values: Object.freeze(["benin", "uemoa", "africa", "international"]),
    purpose: "pricing-and-prefill",
    requiredForEstimate: true,
    pricingDimensions: Object.freeze(["volume", "complexity"]),
    briefMapping: Object.freeze({ brief: "global", field: "clientLocation" }),
  }),
  projectStage: Object.freeze({
    values: Object.freeze(["idea", "launch", "active", "repositioning"]),
    purpose: "pricing-and-prefill",
    requiredForEstimate: true,
    pricingDimensions: Object.freeze(["complexity"]),
    briefMapping: Object.freeze({ brief: "global", field: "projectStage" }),
  }),
  investmentRange: Object.freeze({
    values: Object.freeze(["under-250k", "250k-500k", "500k-1m", "1m-3m", "3m-plus", "unknown"]),
    purpose: "brief-prefill-only",
    requiredForEstimate: false,
    pricingDimensions: Object.freeze([]),
    briefMapping: Object.freeze({ brief: "global", field: "investmentRange" }),
  }),
  marketScope: Object.freeze({
    values: Object.freeze(["local", "national", "regional", "international"]),
    purpose: "pricing-and-prefill",
    requiredForEstimate: true,
    pricingDimensions: Object.freeze(["volume", "complexity"]),
    briefMapping: Object.freeze({ brief: "global", field: "marketScope" }),
  }),
  languageScope: Object.freeze({
    values: Object.freeze(["one", "two", "three-plus", "unknown"]),
    purpose: "pricing-and-prefill",
    requiredForEstimate: true,
    pricingDimensions: Object.freeze(["volume", "complexity"]),
    briefMapping: Object.freeze({ brief: "global", field: "languageScope" }),
  }),
  timeline: Object.freeze({
    values: Object.freeze(["urgent", "one-two-months", "three-plus-months", "flexible"]),
    purpose: "pricing-and-prefill",
    requiredForEstimate: true,
    pricingDimensions: Object.freeze(["urgency", "duration"]),
    briefMapping: Object.freeze({ brief: "global", field: "timeline" }),
  }),
  validationProcess: Object.freeze({
    values: Object.freeze(["one", "two-three", "four-plus", "unknown"]),
    purpose: "pricing-and-prefill",
    requiredForEstimate: true,
    pricingDimensions: Object.freeze(["validation", "complexity"]),
    briefMapping: Object.freeze({ brief: "global", field: "validationProcess" }),
  }),
});

export const PROJECT_PROFILE_KEYS = Object.freeze(Object.keys(PROJECT_PROFILE_CONTRACT));
