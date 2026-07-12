import { renderContactEmail } from "./contact-email.js";

const CONTACT_EMAIL = "caroletonoukouen@gmail.com";
const MAX_BODY_BYTES = 12_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(response, status, body) {
  response.status(status).setHeader("Cache-Control", "no-store").json(body);
}

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
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
  if (declaredLength > MAX_BODY_BYTES) {
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
  if (!apiKey || !from) {
    return json(response, 503, { error: "contact_service_unavailable" });
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
