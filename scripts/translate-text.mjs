const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

const extractOutputText = (payload) => {
  if (typeof payload.output_text === "string") {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload.output) ? payload.output : [];

  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];

    for (const part of content) {
      if (part.type === "output_text" && typeof part.text === "string") {
        return part.text.trim();
      }
    }
  }

  return "";
};

export async function translateToEnglish({ text, format }) {
  if (process.env.CLOUDFLARE_TRANSLATE_WORKER_URL) {
    return translateWithCloudflareWorker({ text, format });
  }

  if (process.env.ALLOW_DIRECT_OPENAI_TRANSLATION !== "true") {
    const error = new Error(
      "La traduction directe OpenAI est désactivée. Configurez CLOUDFLARE_TRANSLATE_WORKER_URL et TRANSLATE_WORKER_TOKEN pour utiliser le Worker sécurisé."
    );
    error.statusCode = 501;
    throw error;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY n'est pas configurée. Le bouton Traduire est prêt, mais l'API doit être ajoutée côté environnement.");
    error.statusCode = 501;
    throw error;
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini",
      instructions:
        "Translate French personal-site CMS content into natural, polished English. Preserve meaning, tone, names, formatting cues, and do not add commentary.",
      input: `Format: ${format ?? "plainText"}\n\nFrench content:\n${text}`,
      max_output_tokens: 1200,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? "La traduction OpenAI a échoué.");
    error.statusCode = response.status;
    throw error;
  }

  const translation = extractOutputText(payload);

  if (!translation) {
    const error = new Error("La traduction OpenAI n'a pas retourné de texte exploitable.");
    error.statusCode = 502;
    throw error;
  }

  return translation;
}

async function translateWithCloudflareWorker({ text, format }) {
  const workerUrl = process.env.CLOUDFLARE_TRANSLATE_WORKER_URL;
  const token = process.env.TRANSLATE_WORKER_TOKEN;

  if (!workerUrl || !token) {
    const error = new Error("Le Worker Cloudflare de traduction n'est pas complètement configuré.");
    error.statusCode = 501;
    throw error;
  }

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, format }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error ?? "Le Worker Cloudflare a refusé la traduction.");
    error.statusCode = response.status;
    throw error;
  }

  return payload.translation;
}
