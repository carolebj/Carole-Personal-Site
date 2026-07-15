import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import PDFDocument from "pdfkit";
import { createClient } from "@supabase/supabase-js";
import {
  getClientBriefTemplate,
  isClientBriefFieldVisible,
  validateClientBriefAnswers,
} from "../shared/client-brief-contract.js";

const MAX_BODY_BYTES = 256_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_EMAIL = "caroletonoukouen@gmail.com";
const CHALLENGE_MINUTES = 10;
const EXPORT_DAYS = 15;
const ASSET_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]);

function json(response, status, body) { return response.status(status).setHeader("Cache-Control", "no-store").json(body); }
function clean(value, maximum = 320) {
  return typeof value === "string"
    ? value.trim().replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").slice(0, maximum)
    : "";
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function hmac(secret, purpose, value) { return createHmac("sha256", secret).update(`${purpose}\0${value}`).digest("hex"); }
function safeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}
function isRecord(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function requestHeader(request, name) { return request.headers?.[name] || request.headers?.[name.toLowerCase()] || ""; }
function clientAddress(request) { return String(requestHeader(request, "x-vercel-forwarded-for") || requestHeader(request, "x-forwarded-for") || request.socket?.remoteAddress || "unknown").split(",")[0].trim().slice(0, 200); }

export function validateClientBriefPayload(body) {
  if (!isRecord(body)) return { ok: false, status: 422, error: "invalid_payload" };
  if (clean(body.website, 200)) return { ok: false, status: 422, error: "invalid_payload" };
  const action = clean(body.action, 40);
  if (!["request-export", "confirm-export", "submit", "prepare-asset"].includes(action)) return { ok: false, status: 422, error: "invalid_action" };
  const template = getClientBriefTemplate(clean(body.serviceKey, 80));
  if (!template) return { ok: false, status: 404, error: "invalid_service" };
  const locale = body.locale === "en" ? "en" : body.locale === "fr" ? "fr" : null;
  const sessionToken = clean(body.sessionToken, 200);
  if (!locale || !/^[A-Za-z0-9._:-]{16,200}$/.test(sessionToken)) return { ok: false, status: 422, error: "invalid_session" };

  if (action === "confirm-export") {
    const challengeId = clean(body.challengeId, 80);
    const code = clean(body.code, 6);
    if (!/^[0-9a-f-]{36}$/.test(challengeId) || !/^\d{6}$/.test(code)) return { ok: false, status: 422, error: "invalid_code" };
    return { ok: true, value: { action, template, locale, sessionToken, challengeId, code } };
  }

  const estimate = isRecord(body.estimate) && typeof body.estimate.id === "string" && typeof body.estimate.token === "string"
    ? { id: clean(body.estimate.id, 80), token: clean(body.estimate.token, 200) }
    : null;
  if (action === "prepare-asset") {
    const file = isRecord(body.file) ? { name: clean(body.file.name, 180), mimeType: clean(body.file.mimeType, 100), size: Number(body.file.size) } : null;
    if (!file?.name || !ASSET_MIME_TYPES.has(file.mimeType) || !Number.isInteger(file.size) || file.size < 1 || file.size > 5_242_880) return { ok: false, status: 422, error: "invalid_asset" };
    return { ok: true, value: { action, template, locale, sessionToken, estimate, file } };
  }

  const validation = validateClientBriefAnswers(template, body.answers);
  if (!validation.valid) return { ok: false, status: 422, error: "incomplete_brief", details: Object.keys(validation.errors) };
  const answers = Object.fromEntries(template.sections.flatMap((section) => section.fields).filter((field) => isClientBriefFieldVisible(field, body.answers) && Object.hasOwn(body.answers, field.key)).map((field) => [field.key, body.answers[field.key]]));
  const fields = new Map(template.sections.flatMap((section) => section.fields.map((field) => [field.key, field])));
  const prefill = isRecord(body.prefill) ? Object.fromEntries(Object.entries(body.prefill).filter(([fieldKey, entry]) => {
    const field = fields.get(fieldKey);
    const expectedSource = entry.source === field?.prefill || entry.source === `shared.${fieldKey}`;
    return field && isRecord(entry) && expectedSource && typeof entry.confirmed === "boolean" && typeof entry.modified === "boolean" && Object.hasOwn(answers, fieldKey);
  })) : {};
  if (isRecord(body.prefill) && Object.keys(prefill).length !== Object.keys(body.prefill).length) return { ok: false, status: 422, error: "invalid_prefill" };
  if (Object.values(prefill).some((entry) => !entry.confirmed)) return { ok: false, status: 422, error: "unconfirmed_prefill" };
  const email = clean(body.email, 320).toLowerCase();
  const name = clean(body.name, 160);
  if (!EMAIL_PATTERN.test(email)) return { ok: false, status: 422, error: "invalid_email" };
  if (action === "submit" && !name) return { ok: false, status: 422, error: "invalid_fields" };
  const assets = Array.isArray(body.assets) ? body.assets.slice(0, 8).map((entry) => isRecord(entry) ? { path: clean(entry.path, 500), name: clean(entry.name, 180), mimeType: clean(entry.mimeType, 100), size: Number(entry.size) } : null) : [];
  if (assets.some((entry) => !entry?.path || !entry.name || !ASSET_MIME_TYPES.has(entry.mimeType) || !Number.isInteger(entry.size) || entry.size < 1 || entry.size > 5_242_880) || (Array.isArray(body.assets) && body.assets.length > 8)) return { ok: false, status: 422, error: "invalid_asset" };
  const idempotencyKey = clean(body.idempotencyKey, 128);
  if (action === "submit" && !/^[A-Za-z0-9._:-]{16,128}$/.test(idempotencyKey)) return { ok: false, status: 422, error: "invalid_idempotency_key" };
  return { ok: true, value: { action, template, locale, sessionToken, answers, prefill, assets, email, name, commercialConsent: action === "request-export" && body.commercialConsent === true, estimate, idempotencyKey } };
}

function headers(serviceRoleKey, extra = {}) {
  return { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json", ...extra };
}

function createDataClient(supabaseUrl, serviceRoleKey, fetchImpl = fetch) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  async function rest(path, options = {}) {
    const response = await fetchImpl(new URL(`/rest/v1/${path}`, supabaseUrl), {
      ...options,
      headers: headers(serviceRoleKey, options.headers),
      signal: AbortSignal.timeout(10_000),
    });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(`supabase:${response.status}:${path}`);
    return body;
  }
  return {
    rest,
    async uploadPdf(path, buffer) {
      const response = await fetchImpl(new URL(`/storage/v1/object/brief-exports/${path}`, supabaseUrl), {
        method: "POST",
        headers: headers(serviceRoleKey, { "Content-Type": "application/pdf", "x-upsert": "false" }),
        body: buffer,
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`storage_upload:${response.status}`);
    },
    async signedUrl(path) {
      const response = await fetchImpl(new URL(`/storage/v1/object/sign/brief-exports/${path}`, supabaseUrl), {
        method: "POST", headers: headers(serviceRoleKey), body: JSON.stringify({ expiresIn: EXPORT_DAYS * 86400 }), signal: AbortSignal.timeout(10_000),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.signedURL) throw new Error("signed_url_failed");
      return new URL(body.signedURL, supabaseUrl).toString();
    },
    async deleteObject(bucket, path) {
      const response = await fetchImpl(new URL(`/storage/v1/object/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`, supabaseUrl), {
        method: "DELETE", headers: headers(serviceRoleKey), signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok && response.status !== 404) throw new Error(`storage_delete:${response.status}`);
    },
    async createSignedAssetUpload(path) {
      const { data, error } = await supabase.storage.from("brief-assets").createSignedUploadUrl(path, { upsert: false });
      if (error || !data?.token) throw new Error("asset_upload_unavailable");
      return { path: data.path, token: data.token };
    },
    async listAssets(instanceId) {
      const { data, error } = await supabase.storage.from("brief-assets").list(instanceId, { limit: 100 });
      if (error) throw new Error("asset_list_unavailable");
      return data ?? [];
    },
  };
}

async function validateEstimate(data, estimate, serviceKey) {
  if (!estimate || !/^[0-9a-f-]{36}$/.test(estimate.id)) return null;
  const rows = await data.rest(`project_estimates?id=eq.${encodeURIComponent(estimate.id)}&select=id,session_token_hash,expires_at,services&limit=1`);
  const row = rows?.[0];
  if (!row || Date.parse(row.expires_at) <= Date.now() || !safeEqual(row.session_token_hash, sha256(estimate.token)) || !Array.isArray(row.services) || !row.services.includes(serviceKey)) return null;
  return row.id;
}

async function persistInstanceAnswers(data, instance, payload) {
  if (!payload.answers) return;
  await data.rest(`brief_instances?id=eq.${instance.instanceId}`, { method: "PATCH", body: JSON.stringify({ answers: payload.answers, status: "ready", finalized_at: new Date().toISOString() }) });
  const sharedKeys = new Set(payload.template.sections[0]?.fields.map((field) => field.key) ?? []);
  const sharedProfile = Object.fromEntries(Object.entries(payload.answers).filter(([key]) => sharedKeys.has(key)));
  await data.rest(`brief_packages?id=eq.${instance.packageId}`, { method: "PATCH", body: JSON.stringify({ shared_profile: sharedProfile }) });
  const prefillRows = Object.entries(payload.prefill ?? {}).map(([fieldKey, entry]) => ({ instance_id: instance.instanceId, source_estimate_id: entry.source.startsWith("shared.") ? null : instance.estimateId, field_key: fieldKey, source_kind: entry.source.startsWith("profile.") || entry.source.startsWith("shared.") ? "shared_profile" : "estimate", source_field_key: entry.source, prefill_value: payload.answers[fieldKey] ?? null, was_modified: entry.modified, confirmed_at: entry.confirmed ? new Date().toISOString() : null }));
  if (prefillRows.length) await data.rest("brief_prefill_values?on_conflict=instance_id,field_key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(prefillRows) });
}

async function ensureInstance(data, payload) {
  const templates = await data.rest(`brief_templates?service_key=eq.${encodeURIComponent(payload.template.serviceKey)}&status=eq.active&select=id&limit=1`);
  const templateId = templates?.[0]?.id;
  if (!templateId) throw new Error("template_unavailable");
  const versions = await data.rest(`brief_template_versions?template_id=eq.${templateId}&locale=eq.${payload.locale}&status=eq.published&select=id,version&order=version.desc&limit=1`);
  const version = versions?.[0];
  if (!version) throw new Error("template_unavailable");
  const sessionHash = sha256(payload.sessionToken);
  const estimateId = await validateEstimate(data, payload.estimate, payload.template.serviceKey);
  let packages = estimateId
    ? await data.rest(`brief_packages?estimate_id=eq.${estimateId}&select=id&limit=1`)
    : await data.rest(`brief_packages?session_token_hash=eq.${sessionHash}&select=id&order=created_at.desc&limit=1`);
  if (!packages?.[0]) {
    try {
      packages = await data.rest("brief_packages", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ estimate_id: estimateId, session_token_hash: sessionHash, status: "active" }) });
    } catch (error) {
      if (!estimateId) throw error;
      packages = await data.rest(`brief_packages?estimate_id=eq.${estimateId}&select=id&limit=1`);
    }
  }
  const packageId = packages?.[0]?.id;
  if (!packageId) throw new Error("package_unavailable");
  let instances = await data.rest(`brief_instances?package_id=eq.${packageId}&template_id=eq.${templateId}&template_version_id=eq.${version.id}&locale=eq.${payload.locale}&select=id&limit=1`);
  if (!instances?.[0]) instances = await data.rest("brief_instances", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ package_id: packageId, template_id: templateId, template_version_id: version.id, locale: payload.locale, status: "draft", answers: {} }) });
  const instanceId = instances?.[0]?.id;
  if (!instanceId) throw new Error("instance_unavailable");
  const instance = { packageId, instanceId, estimateId, sessionHash };
  await persistInstanceAnswers(data, instance, payload);
  return instance;
}

async function syncAssets(data, instanceId, assets = []) {
  const expectedPrefix = `${instanceId}/`;
  if (assets.some((asset) => !asset.path.startsWith(expectedPrefix) || asset.path.includes(".."))) throw new Error("invalid_asset_path");
  const existingRows = await data.rest(`brief_assets?instance_id=eq.${instanceId}&deleted_at=is.null&select=id,storage_bucket,storage_path`);
  const selectedPaths = new Set(assets.map((asset) => asset.path));
  for (const existing of existingRows ?? []) {
    if (selectedPaths.has(existing.storage_path)) continue;
    await data.deleteObject(existing.storage_bucket, existing.storage_path).catch(() => null);
    await data.rest(`brief_assets?id=eq.${existing.id}`, { method: "PATCH", body: JSON.stringify({ deleted_at: new Date().toISOString() }) });
  }
  if (!assets.length) return [];
  const stored = new Set((await data.listAssets(instanceId)).map((entry) => entry.name));
  if (assets.some((asset) => !stored.has(asset.path.slice(expectedPrefix.length)))) throw new Error("asset_upload_incomplete");
  const rows = assets.map((asset) => ({ instance_id: instanceId, storage_bucket: "brief-assets", storage_path: asset.path, original_filename: asset.name, mime_type: asset.mimeType, size_bytes: asset.size }));
  await data.rest("brief_assets?on_conflict=storage_bucket,storage_path", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) });
  return rows;
}

async function prepareAsset({ data, payload, secret, request }) {
  const allowed = await consumeLimit(data, secret, "asset-ip", clientAddress(request), 20, 3600);
  if (allowed !== true) return { status: allowed === false ? 429 : 503, body: { error: allowed === false ? "rate_limited" : "brief_service_unavailable" } };
  const instance = await ensureInstance(data, { ...payload, answers: undefined, prefill: undefined });
  const extensions = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "application/pdf": "pdf" };
  const path = `${instance.instanceId}/${randomUUID()}.${extensions[payload.file.mimeType]}`;
  const signed = await data.createSignedAssetUpload(path);
  await data.rest("brief_assets", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ instance_id: instance.instanceId, storage_bucket: "brief-assets", storage_path: path, original_filename: payload.file.name, mime_type: payload.file.mimeType, size_bytes: payload.file.size }) });
  return { status: 201, body: { ...signed, expiresInSeconds: 7200 } };
}

async function upsertContact(data, email, verified) {
  const id = await data.rest("rpc/upsert_estimator_contact", { method: "POST", body: JSON.stringify({ p_email: email }) });
  if (verified) await data.rest(`estimator_contacts?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ verification_status: "verified", verified_at: new Date().toISOString(), last_operational_activity_at: new Date().toISOString() }) });
  return id;
}

async function recordConsent(data, contactId, payload, source) {
  if (!payload.commercialConsent) return;
  await data.rest("estimator_consent_events", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ contact_id: contactId, purpose: "commercial_email", action: "granted", notice_version: "client-brief-v1", source, proof: { explicit_checkbox: true, locale: payload.locale } }) });
}

function renderValue(field, value, locale) {
  const values = Array.isArray(value) ? value : [value];
  return values.map((entry) => field.options?.find((option) => option.value === entry)?.label?.[locale] ?? String(entry)).join(", ");
}

export async function renderClientBriefPdf({ template, answers, locale, reference, estimateReference, assets = [], createdAt = new Date() }) {
  const document = new PDFDocument({ size: "A4", margins: { top: 54, right: 54, bottom: 58, left: 54 }, info: { Title: template.title[locale], Author: "Carole Tonoukouen", Subject: "Client Brief" } });
  const chunks = [];
  document.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve, reject) => { document.on("end", () => resolve(Buffer.concat(chunks))); document.on("error", reject); });
  const plum = "#4b1738"; const rose = "#9b526d"; const text = "#241d21"; const muted = "#6f6870";
  document.rect(0, 0, 595, 12).fill(plum);
  document.fillColor(rose).font("Helvetica-Bold").fontSize(9).text(locale === "fr" ? "BRIEF CLIENT" : "CLIENT BRIEF", { characterSpacing: 2 });
  document.moveDown(0.7).fillColor(plum).font("Helvetica-Bold").fontSize(25).text(template.title[locale]);
  document.moveDown(0.5).fillColor(muted).font("Helvetica").fontSize(9).text(`${locale === "fr" ? "Version" : "Version"} ${template.version} · ${new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { dateStyle: "long" }).format(createdAt)} · ${reference}`);
  if (estimateReference) document.moveDown(0.3).text(`${locale === "fr" ? "Estimation source" : "Source estimate"} · ${estimateReference}`);
  document.moveDown(1.4).fillColor(text).fontSize(10).text(template.intro[locale], { lineGap: 3 });
  for (const section of template.sections) {
    if (document.y > 700) document.addPage();
    document.moveDown(1.5).fillColor(rose).font("Helvetica-Bold").fontSize(12).text(section.title[locale]);
    document.moveDown(0.4).fillColor(muted).font("Helvetica").fontSize(8.5).text(section.description[locale], { lineGap: 2 });
    for (const field of section.fields.filter((entry) => isClientBriefFieldVisible(entry, answers))) {
      const value = answers[field.key];
      if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) continue;
      if (document.y > 720) document.addPage();
      document.moveDown(0.8).fillColor(text).font("Helvetica-Bold").fontSize(9).text(field.label[locale]);
      document.moveDown(0.25).fillColor(text).font("Helvetica").fontSize(9.5).text(renderValue(field, value, locale), { lineGap: 3 });
    }
  }
  if (assets.length) {
    document.moveDown(1.5).fillColor(rose).font("Helvetica-Bold").fontSize(12).text(locale === "fr" ? "Pièces jointes de référence" : "Reference attachments");
    for (const asset of assets) document.moveDown(0.4).fillColor(text).font("Helvetica").fontSize(9.5).text(`• ${asset.name}`);
  }
  document.moveDown(1.5).fillColor(muted).font("Helvetica-Oblique").fontSize(8).text(locale === "fr" ? "Ce document constitue une base de cadrage. Il ne vaut ni devis, ni engagement contractuel." : "This document is a framing basis. It is neither a quote nor a contractual commitment.");
  document.end();
  return done;
}

async function sendEmail({ apiKey, from, to, subject, html, text }) {
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject, html, text }), signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error("delivery_failed");
}

async function consumeLimit(data, secret, purpose, value, limit, windowSeconds) {
  const scope = hmac(secret, `brief-rate:${purpose}`, value);
  return data.rest("rpc/consume_estimator_rate_limit", { method: "POST", body: JSON.stringify({ p_scope_hash: scope, p_limit: limit, p_window_seconds: windowSeconds }) });
}

async function requestExport({ data, payload, secret, apiKey, from, request }) {
  const [ipAllowed, emailAllowed] = await Promise.all([
    consumeLimit(data, secret, "export-ip", clientAddress(request), 12, 3600),
    consumeLimit(data, secret, "export-email", payload.email, 6, 3600),
  ]);
  if (ipAllowed !== true || emailAllowed !== true) return { status: ipAllowed === false || emailAllowed === false ? 429 : 503, body: { error: ipAllowed === false || emailAllowed === false ? "rate_limited" : "brief_service_unavailable" } };
  const instance = await ensureInstance(data, { ...payload, answers: undefined, prefill: undefined });
  const id = randomUUID(); const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await data.rest("brief_email_challenges", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id, instance_id: instance.instanceId, email_normalized: payload.email, email_sha256: sha256(payload.email), session_token_hash: instance.sessionHash, code_hash: hmac(secret, "brief-email-code", `${id}\0${code}`), contact_name: payload.name || null, commercial_consent: payload.commercialConsent, brief_payload: { answers: payload.answers, prefill: payload.prefill, assets: payload.assets }, expires_at: new Date(Date.now() + CHALLENGE_MINUTES * 60_000).toISOString() }) });
  await sendEmail({ apiKey, from, to: payload.email, subject: payload.locale === "fr" ? "Votre code pour télécharger le Brief client" : "Your Client Brief download code", html: `<div style="font-family:Arial,sans-serif;padding:32px;color:#241d21"><p>${payload.locale === "fr" ? "Votre code de vérification est :" : "Your verification code is:"}</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#4b1738">${code}</p><p>${payload.locale === "fr" ? "Il expire dans 10 minutes. Si vous n’avez pas demandé ce document, ignorez cet e-mail." : "It expires in 10 minutes. If you did not request this document, ignore this email."}</p></div>`, text: `${payload.locale === "fr" ? "Code de vérification" : "Verification code"}: ${code}` });
  return { status: 201, body: { challengeId: id, expiresInSeconds: CHALLENGE_MINUTES * 60 } };
}

async function confirmExport({ data, payload, secret }) {
  const expectedSession = sha256(payload.sessionToken);
  const expectedCode = hmac(secret, "brief-email-code", `${payload.challengeId}\0${payload.code}`);
  const claimed = await data.rest("rpc/consume_client_brief_email_challenge", { method: "POST", body: JSON.stringify({ p_challenge_id: payload.challengeId, p_session_token_hash: expectedSession, p_code_hash: expectedCode }) });
  const challenge = claimed?.[0];
  if (!challenge) return { status: 422, body: { error: "invalid_code" } };
  const instances = await data.rest(`brief_instances?id=eq.${challenge.instance_id}&select=id,answers,package_id,template_id,locale&limit=1`);
  const instance = instances?.[0];
  if (!instance) throw new Error("instance_unavailable");
  const briefPayload = isRecord(challenge.brief_payload) ? challenge.brief_payload : {};
  const answersValidation = validateClientBriefAnswers(payload.template, briefPayload.answers);
  if (!answersValidation.valid) throw new Error("invalid_challenge_payload");
  const packageRows = await data.rest(`brief_packages?id=eq.${instance.package_id}&select=estimate_id&limit=1`);
  const sourceEstimateId = packageRows?.[0]?.estimate_id ?? null;
  await persistInstanceAnswers(data, { instanceId: instance.id, packageId: instance.package_id, estimateId: sourceEstimateId }, { ...payload, answers: briefPayload.answers, prefill: isRecord(briefPayload.prefill) ? briefPayload.prefill : {} });
  const assetRows = await syncAssets(data, instance.id, Array.isArray(briefPayload.assets) ? briefPayload.assets : []);
  const contactId = await upsertContact(data, challenge.email_normalized, true);
  const consentPayload = { commercialConsent: challenge.commercial_consent, locale: instance.locale };
  await recordConsent(data, contactId, consentPayload, "client-brief-export");
  await data.rest(`brief_packages?id=eq.${instance.package_id}`, { method: "PATCH", body: JSON.stringify({ contact_id: contactId }) });
  const exportRows = await data.rest("brief_exports", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ instance_id: instance.id, contact_id: contactId, challenge_id: payload.challengeId, status: "generating", email_verified_at: new Date().toISOString() }) });
  const exportId = exportRows?.[0]?.id;
  const template = payload.template;
  const path = `${instance.id}/${exportId}.pdf`;
  try {
    const pdf = await renderClientBriefPdf({ template, answers: briefPayload.answers, locale: instance.locale, reference: exportId, estimateReference: sourceEstimateId, assets: assetRows.map((asset) => ({ name: asset.original_filename })) });
    await data.uploadPdf(path, pdf);
    const readyAt = new Date(); const expiresAt = new Date(readyAt.getTime() + EXPORT_DAYS * 86400_000);
    await data.rest(`brief_exports?id=eq.${exportId}`, { method: "PATCH", body: JSON.stringify({ status: "ready", storage_bucket: "brief-exports", storage_path: path, content_sha256: sha256(pdf), ready_at: readyAt.toISOString(), expires_at: expiresAt.toISOString() }) });
    await data.rest(`brief_instances?id=eq.${instance.id}`, { method: "PATCH", body: JSON.stringify({ status: "exported" }) });
    return { status: 200, body: { downloadUrl: await data.signedUrl(path), expiresAt: expiresAt.toISOString() } };
  } catch (error) {
    await data.rest(`brief_exports?id=eq.${exportId}`, { method: "PATCH", body: JSON.stringify({ status: "failed" }) }).catch(() => null);
    await data.deleteObject?.("brief-exports", path).catch(() => null);
    throw error;
  }
}

async function submitBrief({ data, payload, apiKey, from, secret, request }) {
  const [ipAllowed, emailAllowed] = await Promise.all([
    consumeLimit(data, secret, "submit-ip", clientAddress(request), 10, 3600),
    consumeLimit(data, secret, "submit-email", payload.email, 3, 3600),
  ]);
  if (ipAllowed !== true || emailAllowed !== true) return { status: ipAllowed === false || emailAllowed === false ? 429 : 503, body: { error: ipAllowed === false || emailAllowed === false ? "rate_limited" : "brief_service_unavailable" } };
  const instance = await ensureInstance(data, payload);
  const assetRows = await syncAssets(data, instance.instanceId, payload.assets);
  const contactId = await upsertContact(data, payload.email, false);
  await data.rest(`brief_packages?id=eq.${instance.packageId}`, { method: "PATCH", body: JSON.stringify({ contact_id: contactId }) });
  const idempotencyHash = hmac(secret, "brief-submit-idempotency", payload.idempotencyKey);
  let rows = await data.rest("brief_submissions?on_conflict=idempotency_key_hash", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify({ instance_id: instance.instanceId, contact_id: contactId, idempotency_key_hash: idempotencyHash, payload: { service_key: payload.template.serviceKey, template_version: payload.template.version, locale: payload.locale, name: payload.name, email: payload.email, answers: payload.answers, prefill: payload.prefill, estimate_id: instance.estimateId, asset_paths: assetRows.map((asset) => asset.storage_path), asset_names: assetRows.map((asset) => asset.original_filename) } }) });
  if (!rows?.[0]) rows = await data.rest(`brief_submissions?idempotency_key_hash=eq.${idempotencyHash}&select=id,notification_sent_at&limit=1`);
  await data.rest(`brief_instances?id=eq.${instance.instanceId}`, { method: "PATCH", body: JSON.stringify({ status: "submitted" }) });
  const submissionId = rows?.[0]?.id;
  const staleClaim = encodeURIComponent(new Date(Date.now() - 10 * 60_000).toISOString());
  const claimed = rows?.[0]?.notification_sent_at ? [] : await data.rest(`brief_submissions?id=eq.${submissionId}&notification_sent_at=is.null&or=(notification_claimed_at.is.null,notification_claimed_at.lt.${staleClaim})`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ notification_claimed_at: new Date().toISOString(), notification_error: null }) });
  if (!claimed?.[0]) return { status: 200, body: { submissionId } };
  const safeService = escapeHtml(payload.template.shortTitle.fr);
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeReference = escapeHtml(submissionId);
  try {
    await sendEmail({ apiKey, from, to: CONTACT_EMAIL, subject: `[Brief client] ${payload.template.shortTitle.fr} — ${payload.name}`, html: `<div style="font-family:Arial,sans-serif;padding:28px;color:#241d21"><h1 style="color:#4b1738">Nouveau Brief client</h1><p><strong>Service :</strong> ${safeService}</p><p><strong>Contact :</strong> ${safeName} — ${safeEmail}</p><p><strong>Référence :</strong> ${safeReference}</p><p>Le contenu complet est disponible dans l’espace privé « Briefs clients » du site.</p></div>`, text: `Nouveau Brief client\nService: ${payload.template.shortTitle.fr}\nContact: ${payload.name} — ${payload.email}\nRéférence: ${submissionId}` });
    await data.rest(`brief_submissions?id=eq.${submissionId}`, { method: "PATCH", body: JSON.stringify({ notification_sent_at: new Date().toISOString() }) });
  } catch (error) {
    await data.rest(`brief_submissions?id=eq.${submissionId}`, { method: "PATCH", body: JSON.stringify({ notification_claimed_at: null, notification_error: "delivery_failed" }) }).catch(() => null);
    throw error;
  }
  return { status: 201, body: { submissionId } };
}

export default async function handler(request, response) {
  if (request.method !== "POST") { response.setHeader("Allow", "POST"); return json(response, 405, { error: "method_not_allowed" }); }
  if (!String(requestHeader(request, "content-type")).includes("application/json")) return json(response, 415, { error: "unsupported_media_type" });
  if (Number(requestHeader(request, "content-length") || 0) > MAX_BODY_BYTES) return json(response, 413, { error: "payload_too_large" });
  const payload = validateClientBriefPayload(request.body);
  if (!payload.ok) return json(response, payload.status, { error: payload.error, details: payload.details });
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.BRIEF_VERIFICATION_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BRIEF_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL;
  if (!supabaseUrl || !serviceRoleKey || !secret || secret.length < 32 || !apiKey || !from) return json(response, 503, { error: "brief_service_unavailable" });
  const data = createDataClient(supabaseUrl, serviceRoleKey);
  try {
    const result = payload.value.action === "request-export"
      ? await requestExport({ data, payload: payload.value, secret, apiKey, from, request })
      : payload.value.action === "confirm-export"
        ? await confirmExport({ data, payload: payload.value, secret })
        : payload.value.action === "prepare-asset"
          ? await prepareAsset({ data, payload: payload.value, secret, request })
          : await submitBrief({ data, payload: payload.value, apiKey, from, secret, request });
    return json(response, result.status, result.body);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return json(response, code === "delivery_failed" ? 502 : 503, { error: code === "delivery_failed" ? "delivery_failed" : code === "template_unavailable" ? "brief_templates_unavailable" : "brief_service_unavailable" });
  }
}
