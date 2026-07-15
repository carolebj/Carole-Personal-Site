import {
  buildClientBriefPrefill,
  getClientBriefTemplate,
  isClientBriefFieldValueValid,
  type ClientBriefTemplate,
  type ClientBriefValue,
} from "../../../shared/client-brief-contract.js";
import {
  ESTIMATOR_DRAFT_STORAGE_KEY,
  normalizeEstimatorDraft,
} from "../estimator/draft";
import {
  ESTIMATE_RESULT_SESSION_KEY,
  buildEstimateInputSignature,
  type EstimateSessionMetadata,
} from "../estimator/estimateUiState";

export type PrefillState = Record<string, { source: string; confirmed: boolean; modified: boolean }>;
export type ClientBriefAsset = { path: string; name: string; mimeType: string; size: number };

export type ClientBriefDraft = {
  version: 1;
  templateVersion: number;
  serviceKey: string;
  contextKey: string;
  sessionToken: string;
  sectionIndex: number;
  answers: Record<string, ClientBriefValue>;
  prefill: PrefillState;
  deferred: string[];
  assets: ClientBriefAsset[];
  outcome?: "exported" | "submitted";
  updatedAt: string;
};

export type EstimateContext = EstimateSessionMetadata & { inputSignature?: string };

const contextKey = (context?: EstimateContext | null) => context?.estimateId ?? "standalone";
const storageKey = (serviceKey: string, context?: EstimateContext | null) => `carole.client-brief:${contextKey(context)}:${serviceKey}:v1`;
const sharedProfileKey = (context?: EstimateContext | null) => `carole.client-brief:${contextKey(context)}:shared-profile:v1`;

function readJson(storage: Storage | undefined, key: string): unknown {
  if (!storage) return null;
  try { return JSON.parse(storage.getItem(key) ?? "null"); } catch { return null; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeStoredDraft(value: unknown, template: ClientBriefTemplate, expectedContextKey: string): ClientBriefDraft | null {
  if (!isRecord(value) || value.version !== 1 || value.serviceKey !== template.serviceKey || value.templateVersion !== template.version || value.contextKey !== expectedContextKey) return null;
  if (!isRecord(value.answers) || !isRecord(value.prefill) || typeof value.sessionToken !== "string" || value.sessionToken.length < 16) return null;
  const fields = new Map(template.sections.flatMap((section) => section.fields.map((field) => [field.key, field] as const)));
  const allowed = new Set(fields.keys());
  const answers = Object.fromEntries(Object.entries(value.answers).filter(([key, entry]) =>
    allowed.has(key) && isClientBriefFieldValueValid(fields.get(key)!, entry),
  )) as Record<string, ClientBriefValue>;
  const prefill = Object.fromEntries(Object.entries(value.prefill).filter(([key, entry]) =>
    allowed.has(key) && isRecord(entry) && typeof entry.source === "string" && typeof entry.confirmed === "boolean" && typeof entry.modified === "boolean",
  )) as PrefillState;
  const deferred = Array.isArray(value.deferred) ? value.deferred.filter((key): key is string => typeof key === "string" && allowed.has(key)) : [];
  const assets = Array.isArray(value.assets) ? value.assets.filter((asset): asset is ClientBriefAsset => isRecord(asset) && typeof asset.path === "string" && typeof asset.name === "string" && typeof asset.mimeType === "string" && Number.isInteger(asset.size)) : [];
  return {
    version: 1,
    templateVersion: template.version,
    serviceKey: template.serviceKey,
    contextKey: expectedContextKey,
    sessionToken: value.sessionToken,
    sectionIndex: Number.isInteger(value.sectionIndex) ? Math.max(0, Math.min(Number(value.sectionIndex), template.sections.length)) : 0,
    answers,
    prefill,
    deferred,
    assets,
    outcome: value.outcome === "exported" || value.outcome === "submitted" ? value.outcome : undefined,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
}

export function loadClientBriefDraft(template: ClientBriefTemplate, context?: EstimateContext | null): ClientBriefDraft {
  const local = typeof window === "undefined" ? undefined : window.localStorage;
  const expectedContextKey = contextKey(context);
  const stored = normalizeStoredDraft(readJson(local, storageKey(template.serviceKey, context)), template, expectedContextKey);
  if (stored) {
    // A standalone Brief never inherits an estimator provenance badge. Older
    // drafts could contain one because the estimator localStorage was read even
    // when the user opened the Brief directly from a service page.
    return expectedContextKey === "standalone" ? { ...stored, prefill: {} } : stored;
  }

  const estimatorValue = normalizeEstimatorDraft(readJson(local, ESTIMATOR_DRAFT_STORAGE_KEY));
  const currentInputSignature = estimatorValue ? buildEstimateInputSignature({
    serviceIds: estimatorValue.serviceIds,
    currency: estimatorValue.currency,
    answers: estimatorValue.serviceAnswers,
    profile: estimatorValue.profile,
  }) : null;
  const canPrefill = Boolean(
    context
    && context.serviceIds.includes(template.serviceKey as never)
    && estimatorValue?.serviceIds.includes(template.serviceKey as never)
    && context.inputSignature
    && context.inputSignature === currentInputSignature,
  );
  const prefilled = canPrefill ? buildClientBriefPrefill(template, estimatorValue) : { answers: {}, provenance: {} };
  const shared = readJson(local, sharedProfileKey(context));
  const sharedFields = new Set(template.sections[0]?.fields.map((field) => field.key) ?? []);
  const sharedAnswers = (isRecord(shared) ? Object.fromEntries(Object.entries(shared).filter(([key, entry]) => sharedFields.has(key) && (typeof entry === "string" || (Array.isArray(entry) && entry.every((item) => typeof item === "string"))))) : {}) as Record<string, ClientBriefValue>;
  return {
    version: 1,
    templateVersion: template.version,
    serviceKey: template.serviceKey,
    contextKey: expectedContextKey,
    sessionToken: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sectionIndex: 0,
    answers: { ...prefilled.answers, ...sharedAnswers },
    // Shared profile answers are continuity data, not estimator prefill. They
    // must never trigger the "reused from your estimate" notice.
    prefill: prefilled.provenance,
    deferred: [],
    assets: [],
    updatedAt: new Date().toISOString(),
  };
}

export function saveClientBriefDraft(draft: ClientBriefDraft): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(`carole.client-brief:${draft.contextKey}:${draft.serviceKey}:v1`, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
    const template = getClientBriefTemplate(draft.serviceKey);
    const sharedKeys = new Set(template?.sections[0]?.fields.map((field) => field.key) ?? []);
    const shared = Object.fromEntries(Object.entries(draft.answers).filter(([key, value]) => sharedKeys.has(key) && isClientBriefFieldValueValid(template!.sections[0].fields.find((field) => field.key === key)!, value)));
    window.localStorage.setItem(`carole.client-brief:${draft.contextKey}:shared-profile:v1`, JSON.stringify(shared));
    return true;
  } catch { return false; }
}

export function readEstimateContext(): EstimateContext | null {
  if (typeof window === "undefined") return null;
  const value = readJson(window.sessionStorage, ESTIMATE_RESULT_SESSION_KEY);
  if (!isRecord(value) || typeof value.estimateId !== "string" || typeof value.estimateToken !== "string" || typeof value.expiresAt !== "string" || !Array.isArray(value.serviceIds) || !value.serviceIds.every((item) => typeof item === "string")) return null;
  if (Date.parse(value.expiresAt) <= Date.now()) return null;
  return {
    estimateId: value.estimateId,
    estimateToken: value.estimateToken,
    expiresAt: value.expiresAt,
    serviceIds: value.serviceIds as EstimateSessionMetadata["serviceIds"],
    inputSignature: typeof value.inputSignature === "string" ? value.inputSignature : undefined,
  };
}

export function clearClientBriefDraft(serviceKey: string, context?: EstimateContext | null): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(storageKey(serviceKey, context)); } catch { /* ignored */ }
}
