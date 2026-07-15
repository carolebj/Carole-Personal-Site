import type { EstimatorCurrency, SharedProjectProfile } from "./draft.ts";
import {
  serviceQuestionnaires,
  type EstimatorServiceId,
  type QuestionnaireAnswers,
} from "./serviceQuestionnaires.ts";

export const ESTIMATE_GENERATION_SESSION_KEY = "carole.project-estimator.generation.v1";
export const ESTIMATE_RESULT_SESSION_KEY = "carole.project-estimator.result.v1";

type SessionStorageLike = Pick<Storage, "getItem" | "setItem">;

export type EstimateGeneration = {
  inputSignature: string;
  idempotencyKey: string;
};

export type EstimateSessionMetadata = {
  estimateId: string;
  estimateToken: string;
  expiresAt: string;
  serviceIds: readonly EstimatorServiceId[];
};

export type EstimateFailureState =
  | "calibration"
  | "rate-limited"
  | "invalid-input"
  | "save-failed"
  | "local-preview"
  | "connection"
  | "unavailable";

export function classifyEstimateFailure(
  errorCode: unknown,
  context: { isDevelopment?: boolean; isOnline?: boolean } = {},
): EstimateFailureState {
  if (errorCode === "pricing_model_unavailable") return "calibration";
  if (errorCode === "rate_limit_exceeded") return "rate-limited";
  if (errorCode === "estimate_persistence_failed") return "save-failed";
  if (errorCode === "request_timeout") return "connection";
  if (errorCode === "invalid_response") return context.isDevelopment ? "local-preview" : "connection";
  if (typeof errorCode === "string" && (
    errorCode.startsWith("invalid_") ||
    errorCode === "unexpected_fields" ||
    errorCode === "payload_too_large"
  )) {
    return "invalid-input";
  }
  if (context.isOnline === false || errorCode === "Failed to fetch" || errorCode === "NetworkError") return "connection";
  return "unavailable";
}

export function filterAnswersForSelectedServices(
  serviceIds: readonly EstimatorServiceId[],
  answers: QuestionnaireAnswers,
): QuestionnaireAnswers {
  const allowedKeys = new Set<string>(
    serviceIds.flatMap((serviceId) =>
      serviceQuestionnaires[serviceId].questions.map((question) => question.key),
    ),
  );

  return Object.fromEntries(
    Object.entries(answers).filter(
      ([key, value]) => allowedKeys.has(key) && value !== undefined,
    ),
  );
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize).sort((left, right) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right)),
    );
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

export function buildEstimateInputSignature(input: {
  serviceIds: readonly EstimatorServiceId[];
  currency: EstimatorCurrency;
  answers: QuestionnaireAnswers;
  profile: SharedProjectProfile;
}): string {
  return JSON.stringify(canonicalize({
    serviceIds: [...new Set(input.serviceIds)],
    currency: input.currency,
    answers: filterAnswersForSelectedServices(input.serviceIds, input.answers),
    profile: input.profile,
  }));
}

function isValidStoredGeneration(value: unknown): value is EstimateGeneration {
  if (!value || typeof value !== "object") return false;
  const generation = value as Partial<EstimateGeneration>;
  return (
    typeof generation.inputSignature === "string" &&
    typeof generation.idempotencyKey === "string" &&
    generation.idempotencyKey.length >= 16 &&
    generation.idempotencyKey.length <= 128
  );
}

export function resolveEstimateGeneration(
  storage: SessionStorageLike | undefined,
  inputSignature: string,
  createKey: () => string,
): EstimateGeneration {
  if (storage) {
    try {
      const stored = JSON.parse(storage.getItem(ESTIMATE_GENERATION_SESSION_KEY) ?? "null");
      if (isValidStoredGeneration(stored) && stored.inputSignature === inputSignature) {
        return stored;
      }
    } catch {
      // A blocked or corrupted session store must not prevent estimation.
    }
  }

  const generation = { inputSignature, idempotencyKey: createKey() };
  if (storage) {
    try {
      storage.setItem(ESTIMATE_GENERATION_SESSION_KEY, JSON.stringify(generation));
    } catch {
      // The in-memory generation remains usable when sessionStorage is blocked.
    }
  }
  return generation;
}

export function saveEstimateSessionMetadata(
  storage: SessionStorageLike | undefined,
  inputSignature: string,
  metadata: EstimateSessionMetadata,
): void {
  if (!storage) return;
  try {
    storage.setItem(ESTIMATE_RESULT_SESSION_KEY, JSON.stringify({
      inputSignature,
      ...metadata,
    }));
  } catch {
    // The estimate remains visible even if the browser blocks sessionStorage.
  }
}
