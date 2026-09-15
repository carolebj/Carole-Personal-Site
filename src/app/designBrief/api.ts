export const DESIGN_BRIEF_MAX_FILES = 8;
export const DESIGN_BRIEF_MAX_FILE_BYTES = 5_242_880;
export const DESIGN_BRIEF_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export type DesignBriefUploadedAsset = {
  path: string;
  name: string;
  mimeType: string;
  size: number;
  receipt: string;
  expiresAt: number;
};

type PreparedUpload = { path: string; token: string; receipt: string; expiresAt: number; expiresInSeconds: number };
type SubmitResult = { ok: true; submissionId: string; duplicate?: boolean };

export class DesignBriefApiError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export function designBriefUploadForRetry(uploaded: DesignBriefUploadedAsset | undefined) {
  return uploaded ?? null;
}

export function invalidateExpiredDesignBriefUploads<T extends { uploaded?: DesignBriefUploadedAsset }>(items: T[], now = Date.now()) {
  return items.map((item) => item.uploaded && item.uploaded.expiresAt <= now
    ? { ...item, uploaded: undefined }
    : item);
}

async function postDesignBrief<T>(body: unknown, fetchImpl: typeof fetch = fetch): Promise<T> {
  const response = await fetchImpl("/api/design-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null) as Record<string, unknown> | null
    : null;
  if (!response.ok || !payload) {
    throw new DesignBriefApiError(typeof payload?.error === "string" ? payload.error : "request_failed");
  }
  return payload as T;
}

export function prepareDesignBriefUpload(input: {
  submissionId: string;
  file: { name: string; mimeType: string; size: number };
  website: string;
}, fetchImpl?: typeof fetch) {
  return postDesignBrief<PreparedUpload>({ action: "prepare-upload", ...input }, fetchImpl);
}

export function submitDesignBrief(input: {
  submissionId: string;
  answers: Record<string, string | string[]>;
  colors: string[];
  assets: DesignBriefUploadedAsset[];
  website: string;
}, fetchImpl?: typeof fetch) {
  return postDesignBrief<SubmitResult>({ action: "submit", ...input }, fetchImpl);
}
