// Appel client vers l'endpoint protégé /api/translate.
// On joint l'access token de la session Supabase (en-tête Authorization), comme
// l'exige le serveur. La vraie traduction passe par le Worker Cloudflare / AI
// Gateway et n'est donc disponible qu'en déploiement (pas en `vite dev`).

import { getSupabase } from "../lib/supabase";

export type TranslationFormat = "plainText" | "richText";

export async function requestTranslation(
  text: string,
  format: TranslationFormat = "plainText",
): Promise<string> {
  const sb = getSupabase();
  if (!sb) {
    throw new Error(
      "Traduction indisponible en mode démo (Supabase non configuré).",
    );
  }

  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Session expirée. Reconnecte-toi pour traduire.");
  }

  let response: Response;
  try {
    response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, format }),
    });
  } catch {
    throw new Error("Service de traduction injoignable. Réessaie plus tard.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    // En local (`vite dev`), /api/translate n'existe pas et renvoie l'app HTML.
    throw new Error(
      "Traduction indisponible ici : l'endpoint /api/translate n'est servi qu'en déploiement.",
    );
  }

  const payload = (await response.json()) as { translation?: string; error?: string };
  if (!response.ok) {
    throw new Error(payload?.error ?? "La traduction a échoué.");
  }
  if (typeof payload.translation !== "string" || !payload.translation) {
    throw new Error("La traduction n'a retourné aucun texte exploitable.");
  }

  return payload.translation;
}
