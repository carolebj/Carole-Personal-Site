import {
  estimatorServiceIds,
  getQuestionnaireProgress,
  isNumberQuestionAnswerValid,
  isQuestionVisible,
  serviceQuestionnaires,
  type EstimatorServiceId,
  type QuestionnaireAnswer,
  type QuestionnaireAnswers,
  type ServiceQuestion,
} from "./serviceQuestionnaires.ts";
import {
  PROJECT_PROFILE_CONTRACT,
  PROJECT_PROFILE_KEYS,
  type ProjectProfileKey,
} from "../../../shared/estimator-profile-contract.js";

export type EstimatorCurrency = "XOF" | "EUR" | "USD";

export type SharedProjectProfile = Partial<Record<ProjectProfileKey, string>>;

export type EstimatorDraft = {
  version: 2;
  step: number;
  furthestStep: number;
  currency: EstimatorCurrency;
  orientation?: string;
  priority?: string;
  guidanceChallenge?: string;
  guidanceStartingPoint?: string;
  budgetStatus?: "defined" | "undefined";
  budgetMinXof?: number;
  budgetMaxXof?: number;
  demoScenario?: string;
  serviceIds: EstimatorServiceId[];
  activeServiceId?: EstimatorServiceId;
  profile: SharedProjectProfile;
  serviceAnswers: QuestionnaireAnswers;
};

export const ESTIMATOR_DRAFT_STORAGE_KEY = "carole-project-estimator:v2";
export const LEGACY_ESTIMATOR_DRAFT_STORAGE_KEY = "carole-project-estimator:v1";

export const DEFAULT_ESTIMATOR_DRAFT: EstimatorDraft = {
  version: 2,
  step: 1,
  furthestStep: 1,
  currency: "XOF",
  serviceIds: [],
  profile: {},
  serviceAnswers: {},
};

const currencies: EstimatorCurrency[] = ["XOF", "EUR", "USD"];
const orientations = ["known-services", "guided"] as const;
const priorities = ["clarify-message", "publish-consistently", "prepare-launch", "increase-visibility"] as const;
const guidanceChallenges = ["direction", "visibility", "production", "identity", "diagnosis"] as const;
const guidanceStartingPoints = ["starting", "inconsistent", "existing-improve", "urgent-launch", "unsure"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidStep(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 6;
}

function normalizeServices(value: unknown): EstimatorServiceId[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<EstimatorServiceId[]>((services, entry) => {
    if (
      typeof entry === "string"
      && estimatorServiceIds.includes(entry as EstimatorServiceId)
      && !services.includes(entry as EstimatorServiceId)
    ) {
      services.push(entry as EstimatorServiceId);
    }
    return services;
  }, []);
}

function normalizeProfile(value: unknown): SharedProjectProfile {
  if (!isRecord(value)) return {};
  const profile: SharedProjectProfile = {};
  for (const key of PROJECT_PROFILE_KEYS) {
    const candidate = value[key];
    if (typeof candidate === "string" && PROJECT_PROFILE_CONTRACT[key].values.includes(candidate)) {
      profile[key as ProjectProfileKey] = candidate;
    }
  }
  return profile;
}

function normalizeChoice<T extends string>(value: unknown, choices: readonly T[]): T | undefined {
  return typeof value === "string" && choices.includes(value as T) ? value as T : undefined;
}

function normalizeQuestionAnswer(question: ServiceQuestion, value: unknown): QuestionnaireAnswer | undefined {
  if (question.type === "choice") {
    const allowed = new Set(question.options?.map((option) => option.value) ?? []);
    return typeof value === "string" && allowed.has(value) ? value : undefined;
  }

  if (question.type === "multi") {
    if (!Array.isArray(value)) return undefined;
    const allowed = new Set(question.options?.map((option) => option.value) ?? []);
    const normalized = value.reduce<string[]>((entries, entry) => {
      if (typeof entry === "string" && allowed.has(entry) && !entries.includes(entry)) entries.push(entry);
      return entries;
    }, []);
    if (normalized.includes("none")) return ["none"];
    return normalized.length > 0 ? normalized : undefined;
  }

  return isNumberQuestionAnswerValid(question, value) ? value : undefined;
}

function normalizeServiceAnswers(value: unknown, serviceIds: readonly EstimatorServiceId[]): QuestionnaireAnswers {
  if (!isRecord(value) || serviceIds.length === 0) return {};
  const questions = serviceIds.flatMap((serviceId) => serviceQuestionnaires[serviceId].questions as readonly ServiceQuestion[]);
  const questionByKey = new Map(questions.map((question) => [question.key, question]));
  const answers = Object.entries(value).reduce<QuestionnaireAnswers>((normalized, [key, answer]) => {
    const question = questionByKey.get(key);
    if (!question) return normalized;
    const normalizedAnswer = normalizeQuestionAnswer(question, answer);
    if (normalizedAnswer !== undefined) normalized[key] = normalizedAnswer;
    return normalized;
  }, {});

  // A former answer becomes obsolete when a dependency changes. Iterate to a
  // fixed point so future multi-level dependencies are purged safely as well.
  let removedHiddenAnswer: boolean;
  do {
    removedHiddenAnswer = false;
    for (const question of questions) {
      if (answers[question.key] !== undefined && !isQuestionVisible(question, answers)) {
        delete answers[question.key];
        removedHiddenAnswer = true;
      }
    }
  } while (removedHiddenAnswer);

  return answers;
}

export function isSharedProfileComplete(profile: SharedProjectProfile): boolean {
  return PROJECT_PROFILE_KEYS.every((key) =>
    !PROJECT_PROFILE_CONTRACT[key].requiredForEstimate || Boolean(profile[key]),
  );
}

export function isEstimatorStepComplete(draft: EstimatorDraft, step: number): boolean {
  if (step === 1) return Boolean(draft.orientation);
  if (step === 2) {
    return draft.serviceIds.length === 1 && (
      draft.orientation !== "guided"
      || Boolean(draft.priority && draft.guidanceChallenge && draft.guidanceStartingPoint)
    );
  }
  if (step === 3) return isSharedProfileComplete(draft.profile);
  if (step === 4) {
    if (draft.serviceIds.length === 0) return false;
    const progress = getQuestionnaireProgress(draft.serviceIds, draft.serviceAnswers);
    return progress.total > 0 && progress.completed === progress.total;
  }
  return true;
}

export function getMaximumAccessibleEstimatorStep(draft: EstimatorDraft): number {
  for (let step = 1; step <= 4; step += 1) {
    if (!isEstimatorStepComplete(draft, step)) return step;
  }
  return 6;
}

export function normalizeEstimatorDraft(value: unknown): EstimatorDraft | null {
  if (!isRecord(value) || value.version !== 2 || !isValidStep(value.step)) return null;
  const normalizedServiceIds = normalizeServices(value.serviceIds);
  const serviceIds = normalizedServiceIds.length === 1 ? normalizedServiceIds : [];
  const requiresServiceReselection = normalizedServiceIds.length > 1;
  const candidate: EstimatorDraft = {
    ...DEFAULT_ESTIMATOR_DRAFT,
    version: 2,
    step: requiresServiceReselection ? 2 : value.step,
    furthestStep: requiresServiceReselection ? 2 : isValidStep(value.furthestStep) ? value.furthestStep : value.step,
    currency: currencies.includes(value.currency as EstimatorCurrency) ? value.currency as EstimatorCurrency : "XOF",
    orientation: normalizeChoice(value.orientation, orientations),
    priority: normalizeChoice(value.priority, priorities),
    guidanceChallenge: normalizeChoice(value.guidanceChallenge, guidanceChallenges),
    guidanceStartingPoint: normalizeChoice(value.guidanceStartingPoint, guidanceStartingPoints),
    budgetStatus: normalizeChoice(value.budgetStatus, ["defined", "undefined"] as const),
    budgetMinXof: typeof value.budgetMinXof === "number" && Number.isFinite(value.budgetMinXof) ? value.budgetMinXof : undefined,
    budgetMaxXof: typeof value.budgetMaxXof === "number" && Number.isFinite(value.budgetMaxXof) ? value.budgetMaxXof : undefined,
    demoScenario: typeof value.demoScenario === "string" ? value.demoScenario : undefined,
    serviceIds,
    activeServiceId: serviceIds.includes(value.activeServiceId as EstimatorServiceId)
      ? value.activeServiceId as EstimatorServiceId
      : serviceIds[0],
    profile: normalizeProfile(value.profile),
    serviceAnswers: normalizeServiceAnswers(value.serviceAnswers, serviceIds),
  };
  const accessibleStep = getMaximumAccessibleEstimatorStep(candidate);
  const furthestStep = Math.min(candidate.furthestStep, accessibleStep);
  return { ...candidate, step: Math.min(candidate.step, furthestStep), furthestStep };
}

export function migrateLegacyEstimatorDraft(value: unknown): EstimatorDraft | null {
  if (!isRecord(value) || value.version !== 1) return null;
  const normalizedServiceIds = normalizeServices(value.serviceIds);
  const serviceIds = normalizedServiceIds.length === 1 ? normalizedServiceIds : [];
  const legacyAnswers = isRecord(value.answers) ? value.answers : {};
  const currency = currencies.includes(value.currency as EstimatorCurrency) ? value.currency as EstimatorCurrency : "XOF";
  const orientation = normalizeChoice(legacyAnswers.orientation, orientations);
  const priority = normalizeChoice(legacyAnswers.step2, priorities);
  const migratedStep = normalizedServiceIds.length > 1
    ? 2
    : !orientation
    ? 1
    : serviceIds.length > 0 && (orientation !== "guided" || priority)
      ? 3
      : 2;

  return {
    ...DEFAULT_ESTIMATOR_DRAFT,
    currency,
    orientation,
    priority,
    serviceIds,
    activeServiceId: serviceIds[0],
    // The former generic scope answers are not mapped to unrelated semantic
    // fields. The user confirms the new shared profile once after migration.
    profile: {},
    serviceAnswers: {},
    step: migratedStep,
    furthestStep: migratedStep,
  };
}
