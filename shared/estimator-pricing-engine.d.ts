import type {
  ConvertedRange,
  EstimateCurrency,
  EstimateRequest,
  EstimateResult,
  ExchangeRateSnapshot,
  ManualReviewReason,
  PricingCatalog,
  PricingPredicate,
  PricingRule,
  RoundingPolicy,
  ServiceCalculationScope,
  XofRange,
} from "../src/app/estimator/pricingTypes";
import type {
  QuestionnaireAnswer,
  QuestionnaireAnswers,
  SerializableQuestionContract,
} from "../src/app/estimator/serviceQuestionnaires";
import type {
  ProjectProfileContractField,
  ProjectProfileKey,
} from "./estimator-profile-contract.js";

export function evaluatePricingPredicate(
  answer: QuestionnaireAnswer | undefined,
  predicate: PricingPredicate,
): boolean;

export function roundXofRange(
  range: XofRange,
  policy: Extract<RoundingPolicy, { status: "configured" }>,
): XofRange;

export function convertXofRange(
  range: XofRange,
  currency: EstimateCurrency,
  snapshot: ExchangeRateSnapshot,
): ConvertedRange;

export function buildServiceCalculationScope(input: {
  questions: readonly SerializableQuestionContract[];
  answers: QuestionnaireAnswers;
  profile: Partial<Record<ProjectProfileKey, string>>;
  profileContract: Readonly<Record<ProjectProfileKey, ProjectProfileContractField>>;
  rules: readonly PricingRule[];
  pricingStatus: "configured" | "awaiting-business-values";
}): ServiceCalculationScope;

export function calculateEstimateCore(input: {
  catalog: PricingCatalog;
  request: EstimateRequest;
  rateSnapshot: ExchangeRateSnapshot;
  preflightReasons?: readonly ManualReviewReason[];
  calculationScopeByService?: Partial<Record<string, ServiceCalculationScope>>;
}): EstimateResult;
