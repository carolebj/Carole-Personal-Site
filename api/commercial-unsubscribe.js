import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function normalizeEmail(value) { return typeof value === "string" ? value.trim().toLowerCase() : ""; }
function signature(email, secret) { return createHmac("sha256", secret).update(`commercial-unsubscribe\0${email}`).digest("base64url"); }

export function createCommercialUnsubscribeToken(email, secret) {
  const normalized = normalizeEmail(email);
  if (!normalized || !secret) throw new TypeError("email and secret are required");
  return `${Buffer.from(normalized).toString("base64url")}.${signature(normalized, secret)}`;
}

export function verifyCommercialUnsubscribeToken(token, secret) {
  if (typeof token !== "string" || token.length > 700 || !secret) return null;
  const [encoded, provided, extra] = token.split(".");
  if (!encoded || !provided || extra) return null;
  let email;
  try { email = normalizeEmail(Buffer.from(encoded, "base64url").toString("utf8")); } catch { return null; }
  const expected = signature(email, secret);
  if (expected.length !== provided.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function page(title, message) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head><body style="margin:0;background:#fbf8f5;color:#241d21;font-family:Arial,sans-serif"><main style="max-width:620px;margin:12vh auto;padding:32px"><p style="color:#9b526d;font-size:12px;font-weight:700;letter-spacing:2px">CAROLE TONOUKOUEN</p><h1 style="font-family:Georgia,serif;font-size:42px;color:#4b1738">${title}</h1><p style="font-size:17px;line-height:1.7">${message}</p><a href="/" style="display:inline-block;margin-top:22px;color:#4b1738">Retour au site</a></main></body></html>`;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") { response.setHeader("Allow", "GET"); return response.status(405).send(page("Lien invalide", "Cette action n’est pas disponible.")); }
  const secret = process.env.BRIEF_VERIFICATION_SECRET;
  const url = new URL(request.url, "https://www.carolebj.com");
  const email = verifyCommercialUnsubscribeToken(url.searchParams.get("token"), secret);
  if (!email) return response.status(400).setHeader("Content-Type", "text/html; charset=utf-8").send(page("Lien invalide", "Ce lien de désinscription est invalide ou incomplet."));
  const supabaseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) return response.status(503).setHeader("Content-Type", "text/html; charset=utf-8").send(page("Service indisponible", "La désinscription n’a pas pu être enregistrée. Réessayez plus tard."));
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  try {
    const contactsResponse = await fetch(new URL(`/rest/v1/estimator_contacts?email_normalized=eq.${encodeURIComponent(email)}&select=id&limit=1`, supabaseUrl), { headers, signal: AbortSignal.timeout(8_000) });
    if (!contactsResponse.ok) throw new Error("contact_lookup_failed");
    const contacts = await contactsResponse.json();
    const contactId = contacts?.[0]?.id;
    const suppressionResponse = await fetch(new URL("/rest/v1/estimator_contact_suppressions?on_conflict=email_sha256", supabaseUrl), { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ email_sha256: createHash("sha256").update(email).digest("hex"), reason: "withdrawn", source: "commercial-unsubscribe-link" }), signal: AbortSignal.timeout(8_000) });
    if (!suppressionResponse.ok) throw new Error("suppression_failed");
    if (contactId) await fetch(new URL("/rest/v1/estimator_consent_events", supabaseUrl), { method: "POST", headers, body: JSON.stringify({ contact_id: contactId, purpose: "commercial_email", action: "withdrawn", source: "commercial-unsubscribe-link", proof: { signed_link: true } }), signal: AbortSignal.timeout(8_000) });
    return response.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(page("Désinscription confirmée", "Cette adresse ne recevra plus de communications commerciales de Carole. Les messages strictement nécessaires à un projet en cours restent séparés."));
  } catch {
    return response.status(503).setHeader("Content-Type", "text/html; charset=utf-8").send(page("Service indisponible", "La désinscription n’a pas pu être enregistrée. Réessayez plus tard."));
  }
}
