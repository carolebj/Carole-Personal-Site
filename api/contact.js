import { renderContactEmail } from "./contact-email.js";
import { createHmac } from "node:crypto";

const CONTACT_EMAIL = "caroletonoukouen@gmail.com";
const MAX_BODY_BYTES = 12_000;
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 600;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(response, status, body) {
  response.status(status).setHeader("Cache-Control", "no-store").json(body);
}

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
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

async function consumeRateLimit({ request, supabaseUrl, serviceRoleKey, hashPepper }) {
  const scopeHash = createHmac("sha256", hashPepper)
    .update(`contact-rate-limit\0${clientAddress(request)}`)
    .digest("hex");
  const rateLimitResponse = await fetch(new URL("/rest/v1/rpc/consume_estimator_rate_limit", supabaseUrl), {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_scope_hash: scopeHash,
      p_limit: RATE_LIMIT_REQUESTS,
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!rateLimitResponse.ok) return null;
  const allowed = await rateLimitResponse.json();
  return typeof allowed === "boolean" ? allowed : null;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "method_not_allowed" });
  }

  if (!request.headers["content-type"]?.includes("application/json")) {
    return json(response, 415, { error: "unsupported_media_type" });
  }

  const declaredLength = Number(request.headers["content-length"] || 0);
  if (declaredLength > MAX_BODY_BYTES || getBodyByteLength(request.body) > MAX_BODY_BYTES) {
    return json(response, 413, { error: "payload_too_large" });
  }

  const name = clean(request.body?.name, 120);
  const email = clean(request.body?.email, 254);
  const subject = clean(request.body?.subject, 160) || "Demande depuis le site de Carole";
  const message = clean(request.body?.message, 5_000);
  const website = clean(request.body?.website, 200);

  if (website) {
    return json(response, 400, { error: "invalid_submission" });
  }

  if (!name || !EMAIL_PATTERN.test(email) || !message) {
    return json(response, 400, { error: "invalid_fields" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hashPepper = process.env.ESTIMATOR_HASH_PEPPER;
  if (!apiKey || !from || !supabaseUrl || !serviceRoleKey || !hashPepper || hashPepper.length < 32) {
    return json(response, 503, { error: "contact_service_unavailable" });
  }

  let rateLimitAllowed;
  try {
    rateLimitAllowed = await consumeRateLimit({ request, supabaseUrl, serviceRoleKey, hashPepper });
  } catch {
    return json(response, 503, { error: "contact_service_unavailable" });
  }
  if (rateLimitAllowed === null) return json(response, 503, { error: "contact_service_unavailable" });
  if (!rateLimitAllowed) {
    response.setHeader("Retry-After", String(RATE_LIMIT_WINDOW_SECONDS));
    return json(response, 429, { error: "rate_limit_exceeded" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [CONTACT_EMAIL],
        reply_to: email,
        subject: `[Carole Site] ${subject}`,
        html: renderContactEmail({ name, email, subject, message }),
        text: [`Nom : ${name}`, `Email : ${email}`, `Sujet : ${subject}`, "", message].join("\n"),
        headers: {
          "X-Priority": "1",
          Importance: "high",
        },
      }),
      signal: controller.signal,
    });

    if (!resendResponse.ok) {
      return json(response, 502, { error: "delivery_failed" });
    }

    return json(response, 200, { ok: true });
  } catch {
    return json(response, 502, { error: "delivery_failed" });
  } finally {
    clearTimeout(timeout);
  }
}
