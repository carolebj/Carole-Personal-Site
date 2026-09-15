import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  DESIGN_BRIEF_MAX_ASSETS,
  DESIGN_BRIEF_MAX_BODY_BYTES,
  designBriefInspirationLinks,
  extensionForMime,
  validateDesignBriefPayload,
} from "../shared/design-brief-contract.js";

const RATE_LIMIT_WINDOW_SECONDS = 600;
const UPLOAD_RATE_LIMIT_WINDOW_SECONDS = 3_600;
const SUBMISSION_SELECT = "id,client_name,contact_name,contact_email,project_type,answers,logo_styles,color_palette,inspiration_links,asset_paths";

function json(response, status, body) {
  return response.status(status).setHeader("Cache-Control", "no-store").json(body);
}

function requestHeader(request, name) {
  return request.headers?.[name] || request.headers?.[name.toLowerCase()] || request.headers?.[name.toUpperCase()] || "";
}

function getBodyByteLength(body) {
  try {
    return Buffer.byteLength(typeof body === "string" ? body : JSON.stringify(body ?? null), "utf8");
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function clientAddress(request) {
  const forwarded = requestHeader(request, "x-vercel-forwarded-for") ||
    requestHeader(request, "x-forwarded-for") ||
    requestHeader(request, "x-real-ip") ||
    request.socket?.remoteAddress ||
    "unknown";
  return String(forwarded).split(",")[0].trim().slice(0, 200) || "unknown";
}

export function isSameOriginDesignBriefRequest(request) {
  const origin = String(requestHeader(request, "origin"));
  const host = String(requestHeader(request, "x-forwarded-host") || requestHeader(request, "host"))
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.host.toLowerCase() === host;
  } catch {
    return false;
  }
}

async function consumeRateLimit({ fetchImpl, supabaseUrl, serviceRoleKey, hashPepper, purpose, value, limit, windowSeconds }) {
  const scopeHash = createHmac("sha256", hashPepper)
    .update(`design-brief:${purpose}\0${value}`)
    .digest("hex");
  const result = await fetchImpl(new URL("/rest/v1/rpc/consume_estimator_rate_limit", supabaseUrl), {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_scope_hash: scopeHash,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!result.ok) return null;
  const allowed = await result.json().catch(() => null);
  return typeof allowed === "boolean" ? allowed : null;
}

function cleanColumn(value, maximum) {
  return typeof value === "string" ? value.trim().slice(0, maximum) || null : null;
}

export function buildDesignBriefSubmissionRow(payload) {
  const fileNames = payload.assets.map((asset) => asset.name);
  const answers = {
    ...payload.answers,
    ...(fileNames.length ? { inspirationFileNames: fileNames } : {}),
  };
  return {
    id: payload.submissionId,
    client_name: cleanColumn(payload.answers.clientName, 320),
    contact_name: cleanColumn(payload.answers.contactPerson, 320),
    contact_email: cleanColumn(payload.answers.contactEmail, 500),
    project_type: cleanColumn(payload.answers.projectType, 240) || cleanColumn(payload.answers.guidanceNeed, 4_000),
    answers,
    logo_styles: Array.isArray(payload.answers.logoStyles) ? payload.answers.logoStyles : [],
    color_palette: payload.colors,
    inspiration_links: designBriefInspirationLinks(payload.answers),
    asset_paths: payload.assets.map((asset) => asset.path),
  };
}

export function createDesignBriefAssetReceipt(hashPepper, asset) {
  return createHmac("sha256", hashPepper)
    .update(["design-brief-asset", asset.submissionId, asset.path, asset.name, asset.mimeType, String(asset.size), String(asset.expiresAt)].join("\0"))
    .digest("hex");
}

function assetReceiptsAreCurrent(payload, now) {
  return payload.assets.every((asset) => asset.expiresAt > now);
}

function assetReceiptsAreValid(payload, hashPepper) {
  return payload.assets.every((asset) => {
    const expected = createDesignBriefAssetReceipt(hashPepper, { ...asset, submissionId: payload.submissionId });
    const received = Buffer.from(asset.receipt, "hex");
    return received.length === 32 && timingSafeEqual(received, Buffer.from(expected, "hex"));
  });
}

function matchesFileSignature(mimeType, bytes) {
  const startsWith = (...expected) => expected.every((byte, index) => bytes[index] === byte);
  if (mimeType === "image/png") return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (mimeType === "image/jpeg") return startsWith(0xff, 0xd8, 0xff);
  if (mimeType === "image/gif") return startsWith(0x47, 0x49, 0x46, 0x38) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61;
  if (mimeType === "application/pdf") return startsWith(0x25, 0x50, 0x44, 0x46, 0x2d);
  if (mimeType === "image/webp") {
    return startsWith(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  return false;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

export function designBriefRowsMatch(existing, expected) {
  return SUBMISSION_SELECT.split(",")
    .filter((key) => key !== "id")
    .every((key) => canonicalJson(existing?.[key]) === canonicalJson(expected[key]));
}

async function findSubmission(supabase, submissionId) {
  const { data, error } = await supabase
    .from("design_brief_submissions")
    .select(SUBMISSION_SELECT)
    .eq("id", submissionId)
    .maybeSingle();
  if (error) throw new Error("submission_lookup_failed");
  return data;
}

async function verifyUploadedAssets(supabase, payload) {
  const bucket = supabase.storage.from("brief-assets");
  for (const asset of payload.assets) {
    const { data: file, error: downloadError } = await bucket.download(asset.path);
    if (
      downloadError ||
      !file ||
      Number(file.size) !== asset.size ||
      file.type !== asset.mimeType ||
      typeof file.slice !== "function"
    ) return false;
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!matchesFileSignature(asset.mimeType, bytes)) return false;
  }
  return true;
}

async function applyLimits({ action, payload, request, fetchImpl, supabaseUrl, serviceRoleKey, hashPepper }) {
  const address = clientAddress(request);
  const definitions = action === "prepare-upload"
    ? [
        ["upload-ip", address, 24, UPLOAD_RATE_LIMIT_WINDOW_SECONDS],
        ["upload-submission", payload.submissionId, 12, UPLOAD_RATE_LIMIT_WINDOW_SECONDS],
      ]
    : [
        ["submit-ip", address, 5, RATE_LIMIT_WINDOW_SECONDS],
        ["submit-id", payload.submissionId, 3, UPLOAD_RATE_LIMIT_WINDOW_SECONDS],
      ];
  const results = await Promise.all(definitions.map(([purpose, value, limit, windowSeconds]) => consumeRateLimit({
    fetchImpl,
    supabaseUrl,
    serviceRoleKey,
    hashPepper,
    purpose,
    value,
    limit,
    windowSeconds,
  })));
  if (results.some((result) => result === null)) return null;
  return results.every(Boolean);
}

export async function handleDesignBrief(request, response, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const createClientImpl = dependencies.createClientImpl ?? createClient;
  const now = dependencies.now ?? Date.now;
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "method_not_allowed" });
  }
  if (!String(requestHeader(request, "content-type")).includes("application/json")) {
    return json(response, 415, { error: "unsupported_media_type" });
  }
  const declaredLength = Number(requestHeader(request, "content-length") || 0);
  if (declaredLength > DESIGN_BRIEF_MAX_BODY_BYTES || getBodyByteLength(request.body) > DESIGN_BRIEF_MAX_BODY_BYTES) {
    return json(response, 413, { error: "payload_too_large" });
  }
  if (!isSameOriginDesignBriefRequest(request)) return json(response, 403, { error: "invalid_origin" });
  const parsed = validateDesignBriefPayload(request.body);
  if (!parsed.ok) return json(response, parsed.status, { error: parsed.error });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hashPepper = process.env.ESTIMATOR_HASH_PEPPER;
  if (!supabaseUrl || !serviceRoleKey || !hashPepper || hashPepper.length < 32) {
    return json(response, 503, { error: "design_brief_service_unavailable" });
  }
  const supabase = createClientImpl(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    if (parsed.value.action === "prepare-upload") {
      const allowed = await applyLimits({
        action: parsed.value.action,
        payload: parsed.value,
        request,
        fetchImpl,
        supabaseUrl,
        serviceRoleKey,
        hashPepper,
      });
      if (allowed === null) return json(response, 503, { error: "design_brief_service_unavailable" });
      if (!allowed) {
        response.setHeader("Retry-After", String(UPLOAD_RATE_LIMIT_WINDOW_SECONDS));
        return json(response, 429, { error: "rate_limit_exceeded" });
      }
      const extension = extensionForMime(parsed.value.file.mimeType);
      const path = `${parsed.value.submissionId}/${randomUUID()}.${extension}`;
      const expiresInSeconds = 7_200;
      const expiresAt = now() + expiresInSeconds * 1_000;
      const { data, error } = await supabase.storage.from("brief-assets").createSignedUploadUrl(path, { upsert: false });
      if (error || !data?.token || data.path !== path) {
        return json(response, 503, { error: "design_brief_service_unavailable" });
      }
      const receipt = createDesignBriefAssetReceipt(hashPepper, {
        submissionId: parsed.value.submissionId,
        path,
        name: parsed.value.file.name,
        mimeType: parsed.value.file.mimeType,
        size: parsed.value.file.size,
        expiresAt,
      });
      return json(response, 201, { path, token: data.token, receipt, expiresAt, expiresInSeconds });
    }

    if (!assetReceiptsAreValid(parsed.value, hashPepper)) {
      return json(response, 422, { error: "invalid_asset" });
    }
    const row = buildDesignBriefSubmissionRow(parsed.value);
    const existing = await findSubmission(supabase, parsed.value.submissionId);
    if (existing) {
      return designBriefRowsMatch(existing, row)
        ? json(response, 200, { ok: true, submissionId: row.id, duplicate: true })
        : json(response, 409, { error: "submission_conflict" });
    }
    if (!assetReceiptsAreCurrent(parsed.value, now())) {
      return json(response, 422, { error: "expired_asset" });
    }

    const allowed = await applyLimits({
      action: parsed.value.action,
      payload: parsed.value,
      request,
      fetchImpl,
      supabaseUrl,
      serviceRoleKey,
      hashPepper,
    });
    if (allowed === null) return json(response, 503, { error: "design_brief_service_unavailable" });
    if (!allowed) {
      response.setHeader("Retry-After", String(RATE_LIMIT_WINDOW_SECONDS));
      return json(response, 429, { error: "rate_limit_exceeded" });
    }
    if (!(await verifyUploadedAssets(supabase, parsed.value))) {
      return json(response, 422, { error: "asset_verification_failed" });
    }
    const { error } = await supabase.from("design_brief_submissions").insert(row);
    if (error) {
      if (error.code === "23505") {
        const concurrent = await findSubmission(supabase, parsed.value.submissionId);
        return concurrent && designBriefRowsMatch(concurrent, row)
          ? json(response, 200, { ok: true, submissionId: row.id, duplicate: true })
          : json(response, 409, { error: "submission_conflict" });
      }
      throw new Error("submission_insert_failed");
    }
    return json(response, 201, { ok: true, submissionId: row.id });
  } catch {
    return json(response, 503, { error: "design_brief_service_unavailable" });
  }
}

export default async function handler(request, response) {
  return handleDesignBrief(request, response);
}
