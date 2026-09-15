const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export const DESIGN_BRIEF_MAX_BODY_BYTES = 96_000;
export const DESIGN_BRIEF_MAX_ASSETS = 8;
export const DESIGN_BRIEF_MAX_ASSET_BYTES = 5_242_880;
export const DESIGN_BRIEF_ASSET_MIME_TYPES = Object.freeze([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const textFields = Object.freeze({
  clarity: 240,
  projectType: 240,
  guidanceNeed: 4_000,
  briefDate: 160,
  clientName: 320,
  contactPerson: 320,
  contactEmail: 500,
  businessStage: 240,
  activity: 4_000,
  difference: 4_000,
  audience: 4_000,
  hasName: 240,
  brandName: 2_000,
  namingInputs: 4_000,
  vision: 4_000,
  competitors: 4_000,
  success: 4_000,
  constraints: 4_000,
  inspirationLinks: 8_000,
});

const listFields = Object.freeze({
  positioning: 16,
  visualState: 12,
  deliverables: 16,
  usage: 12,
  logoStyles: 2,
});

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validText(value, maximum) {
  return typeof value === "string" && value.length <= maximum && !CONTROL_CHARACTER_PATTERN.test(value);
}

function normalizeStringList(value, maximumItems) {
  if (!Array.isArray(value) || value.length > maximumItems) return null;
  if (value.some((item) => !validText(item, 240))) return null;
  if (new Set(value).size !== value.length) return null;
  return [...value];
}

function normalizeAnswers(value) {
  if (!isRecord(value)) return null;
  const normalized = {};
  for (const [key, entry] of Object.entries(value)) {
    if (Object.hasOwn(textFields, key)) {
      if (!validText(entry, textFields[key])) return null;
      normalized[key] = entry;
      continue;
    }
    if (Object.hasOwn(listFields, key)) {
      const items = normalizeStringList(entry, listFields[key]);
      if (!items) return null;
      normalized[key] = items;
      continue;
    }
    return null;
  }
  return normalized;
}

function normalizeColors(value) {
  if (!Array.isArray(value) || value.length > 5) return null;
  if (value.some((color) => typeof color !== "string" || !HEX_COLOR_PATTERN.test(color))) return null;
  if (new Set(value.map((color) => color.toLowerCase())).size !== value.length) return null;
  return [...value];
}

function normalizeAsset(value, submissionId) {
  if (!isRecord(value)) return null;
  const { path, name, mimeType, size, receipt, expiresAt } = value;
  if (!validText(name, 180) || !name.trim()) return null;
  if (!DESIGN_BRIEF_ASSET_MIME_TYPES.includes(mimeType)) return null;
  if (!Number.isInteger(size) || size < 1 || size > DESIGN_BRIEF_MAX_ASSET_BYTES) return null;
  if (typeof path !== "string" || !path.startsWith(`${submissionId}/`)) return null;
  if (typeof receipt !== "string" || !/^[0-9a-f]{64}$/i.test(receipt)) return null;
  if (!Number.isSafeInteger(expiresAt) || expiresAt < 1) return null;
  const fileName = path.slice(submissionId.length + 1);
  if (!/^[0-9a-f-]{36}\.(png|jpg|webp|gif|pdf)$/i.test(fileName) || path.includes("..")) return null;
  return { path, name, mimeType, size, receipt: receipt.toLowerCase(), expiresAt };
}

function normalizeAssets(value, submissionId) {
  if (!Array.isArray(value) || value.length > DESIGN_BRIEF_MAX_ASSETS) return null;
  const assets = value.map((asset) => normalizeAsset(asset, submissionId));
  if (assets.some((asset) => !asset)) return null;
  if (new Set(assets.map((asset) => asset.path)).size !== assets.length) return null;
  return assets;
}

export function isDesignBriefSubmissionId(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function validateDesignBriefPayload(body) {
  if (!isRecord(body)) return { ok: false, status: 422, error: "invalid_payload" };
  if (typeof body.website !== "undefined" && (!validText(body.website, 200) || body.website.trim())) {
    return { ok: false, status: 422, error: "invalid_submission" };
  }
  if (!isDesignBriefSubmissionId(body.submissionId)) {
    return { ok: false, status: 422, error: "invalid_submission_id" };
  }

  if (body.action === "prepare-upload") {
    const file = isRecord(body.file)
      ? normalizeAsset({
          path: `${body.submissionId}/00000000-0000-4000-8000-000000000000.${extensionForMime(body.file.mimeType)}`,
          name: body.file.name,
          mimeType: body.file.mimeType,
          size: body.file.size,
          receipt: "0".repeat(64),
          expiresAt: 1,
        }, body.submissionId)
      : null;
    if (!file) return { ok: false, status: 422, error: "invalid_asset" };
    return {
      ok: true,
      value: {
        action: body.action,
        submissionId: body.submissionId,
        website: "",
        file: { name: file.name, mimeType: file.mimeType, size: file.size },
      },
    };
  }

  if (body.action !== "submit") return { ok: false, status: 422, error: "invalid_action" };
  const answers = normalizeAnswers(body.answers);
  const colors = normalizeColors(body.colors);
  const assets = normalizeAssets(body.assets, body.submissionId);
  if (!answers || !colors) return { ok: false, status: 422, error: "invalid_answers" };
  if (!assets) return { ok: false, status: 422, error: "invalid_asset" };
  return {
    ok: true,
    value: {
      action: body.action,
      submissionId: body.submissionId,
      website: "",
      answers,
      colors,
      assets,
    },
  };
}

export function extensionForMime(mimeType) {
  return ({
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
  })[mimeType] ?? "";
}

export function designBriefInspirationLinks(answers) {
  const value = typeof answers?.inspirationLinks === "string" ? answers.inspirationLinks : "";
  const links = [];
  for (const token of value.split(/\s+/).filter(Boolean)) {
    try {
      const parsed = new URL(token);
      if ((parsed.protocol === "http:" || parsed.protocol === "https:") && token.length <= 2_048) {
        links.push(parsed.toString());
      }
    } catch {
      // The legacy client intentionally ignored non-URL tokens in this field.
    }
    if (links.length === 20) break;
  }
  return links;
}
