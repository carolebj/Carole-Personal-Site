import type {
  EstimatorServiceId,
  PricingDimension,
  QuestionnaireAnswer,
  QuestionnaireAnswers,
  SerializableQuestionnaireContract,
} from "./serviceQuestionnaires.ts";
import type { ProjectProfileKey } from "../../../shared/estimator-profile-contract.js";

export type EstimateCurrency = "XOF" | "EUR" | "USD";

export type XofRange = {
  lower: number;
  upper: number;
};

export type LocalizedPricingLabel = {
  fr: string;
  en: string;
};

export type PricingPredicate =
  | { operator: "equals"; value: string | number }
  | { operator: "includes"; value: string }
  | { operator: "one-of"; value: readonly (string | number)[] }
  | { operator: "number-at-least"; value: number }
  | { operator: "number-above"; value: number };

export type PricingInputReference =
  | { scope: "service-question"; key: string }
  | { scope: "shared-profile"; key: ProjectProfileKey };

type PricingRuleBase = {
  id: string;
  input: PricingInputReference;
  dimension: PricingDimension;
  label: LocalizedPricingLabel;
  when: PricingPredicate;
};

export type PricingRule =
  | (PricingRuleBase & {
      operation: "add-range";
      rangeXof: XofRange;
    })
  | (PricingRuleBase & {
      operation: "per-unit-range";
      includedUnits: number;
      unitRangeXof: XofRange;
    })
  | (PricingRuleBase & {
      operation: "multiply-bps";
      lowerBasisPoints: number;
      upperBasisPoints: number;
    })
  | (PricingRuleBase & {
      operation: "manual-review";
      reasonCode: string;
    });

export type ConfiguredServicePricing = {
  status: "configured";
  baseRangeXof: XofRange;
  rules: readonly PricingRule[];
};

export type PendingServicePricing = {
  status: "awaiting-business-values";
  missingFields: readonly string[];
};

export type ServicePricingDefinition = ConfiguredServicePricing | PendingServicePricing;

export type MutualizationRule = {
  id: string;
  label: LocalizedPricingLabel;
  requiredServiceIds: readonly EstimatorServiceId[];
  appliedToServiceIds: readonly EstimatorServiceId[];
  discountBasisPoints: number;
};

export type RoundingPolicy =
  | {
      status: "configured";
      incrementXof: number;
      lower: "down" | "nearest" | "up";
      upper: "down" | "nearest" | "up";
    }
  | {
      status: "awaiting-business-values";
      missingFields: readonly string[];
    };

export type TaxPolicy =
  | {
      status: "configured";
      treatment: "included" | "excluded" | "not-applicable";
      rateBasisPoints: number;
      label: LocalizedPricingLabel;
    }
  | {
      status: "awaiting-business-values";
      missingFields: readonly string[];
    };

export type PricingCatalog = {
  modelVersion: string;
  status: "draft" | "active";
  effectiveFrom: string | null;
  services: Record<EstimatorServiceId, ServicePricingDefinition>;
  mutualizationRules: readonly MutualizationRule[];
  rounding: RoundingPolicy;
  tax: TaxPolicy;
  questionnaireContract?: SerializableQuestionnaireContract;
};

export type ExchangeRateSnapshot = {
  snapshotId: string;
  retrievedAt: string;
  rates: Record<
    EstimateCurrency,
    {
      xofPerUnit: number;
      rateDate: string;
      sourceName: string;
      sourceUrl: string;
      displayDecimals: number;
    }
  >;
};

export type EstimateRequest = {
  serviceIds: readonly EstimatorServiceId[];
  answers: QuestionnaireAnswers;
  profile: Partial<Record<ProjectProfileKey, string>>;
  currency: EstimateCurrency;
};

export type AppliedAdjustment = {
  id: string;
  input?: PricingRuleBase["input"];
  dimension: PricingDimension;
  label: LocalizedPricingLabel;
  effectXof: XofRange;
};

export type CalculationScopeEntry = {
  input: PricingInputReference;
  value: QuestionnaireAnswer;
  dimensions: readonly PricingDimension[];
  appliedRuleIds: readonly string[];
};

export type CalculationScopeExclusion = {
  input: PricingInputReference;
  reason: "explicit-exclusion" | "not-provided" | "brief-prefill-only";
  value?: QuestionnaireAnswer;
};

export type ServiceCalculationScope = {
  baseScope: {
    source: "catalog-base-range";
    pricingStatus: ServicePricingDefinition["status"];
    entries: readonly CalculationScopeEntry[];
  };
  inclusions: readonly CalculationScopeEntry[];
  volumes: readonly CalculationScopeEntry[];
  options: readonly CalculationScopeEntry[];
  exclusions: readonly CalculationScopeExclusion[];
};

export type ManualReviewReason = {
  code:
    | "no-service-selected"
    | "catalog-not-active"
    | "pricing-not-configured"
    | "rounding-not-configured"
    | "tax-not-configured"
    | "incomplete-profile"
    | "incomplete-answer"
    | "questionnaire-manual-review"
    | "pricing-rule-manual-review";
  serviceId?: EstimatorServiceId;
  questionKey?: string;
  profileKey?: ProjectProfileKey;
  details?: readonly string[];
};

export type ServiceEstimate = {
  serviceId: EstimatorServiceId;
  status: "estimated" | "manual-review";
  rangeXof: XofRange | null;
  appliedAdjustments: readonly AppliedAdjustment[];
  calculationScope: ServiceCalculationScope;
  manualReviewReasons: readonly ManualReviewReason[];
};

export type ConvertedRange = {
  currency: EstimateCurrency;
  lower: number;
  upper: number;
  xofPerUnit: number;
  rateDate: string;
  sourceName: string;
  sourceUrl: string;
  snapshotId: string;
};

export type EstimateResult = {
  status: "estimated" | "manual-review";
  modelVersion: string;
  services: readonly ServiceEstimate[];
  subtotalXof: XofRange | null;
  mutualizations: readonly AppliedAdjustment[];
  taxXof: XofRange | null;
  totalXof: XofRange | null;
  displayRange: ConvertedRange | null;
  assumptions: readonly string[];
  manualReviewReasons: readonly ManualReviewReason[];
};
