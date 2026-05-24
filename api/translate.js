import { translateToEnglish } from "../scripts/translate-text.mjs";

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Méthode non autorisée." });
    return;
  }

  try {
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
