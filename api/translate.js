import { createClient } from "@supabase/supabase-js";
import { translateToEnglish } from "../scripts/translate-text.mjs";

// Endpoint de traduction protégé.
// Avant d'appeler le service de traduction (Worker Cloudflare / OpenAI), on exige
// une session Supabase valide : le client doit envoyer son access token dans
// l'en-tête `Authorization: Bearer <token>`. Sans session valide -> 401.
// Cela évite qu'un tiers consomme du quota de traduction via cet endpoint public.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const ALLOWED_ORIGIN = process.env.TRANSLATE_ALLOWED_ORIGIN || "*";

function getBearerToken(request) {
  const header = request.headers?.authorization || request.headers?.Authorization || "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
}

async function getAuthenticatedUser(request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    const error = new Error(
      "Authentification indisponible : configuration Supabase manquante côté serveur."
    );
    error.statusCode = 500;
    throw error;
  }

  const token = getBearerToken(request);
  if (!token) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  return data.user;
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Méthode non autorisée." });
    return;
  }

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      response.status(401).json({ error: "Non autorisé : une session valide est requise." });
      return;
    }

    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      response.status(400).json({ error: "Aucun texte français à traduire." });
      return;
    }

    const translation = await translateToEnglish({ text, format: body?.format });
    response.status(200).json({ translation });
  } catch (error) {
    response.status(error.statusCode ?? 500).json({
      error: error instanceof Error ? error.message : "Erreur de traduction.",
    });
  }
}
