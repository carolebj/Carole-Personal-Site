const encoder = new TextEncoder();

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const forbidden = () => json({ error: "Unauthorized." }, 401);

const getBearerToken = (request) => {
  const authorization = request.headers.get("Authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice("Bearer ".length).trim();
};

const timingSafeEqual = (left, right) => {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);

  if (leftBytes.byteLength !== rightBytes.byteLength) {
    return false;
  }

  return crypto.subtle.timingSafeEqual(leftBytes, rightBytes);
};

const requireAuthorizedRequest = async (request, env) => {
  if (!env.TRANSLATE_WORKER_TOKEN) {
    console.warn(JSON.stringify({ event: "missing_worker_token" }));
    return false;
  }

  return timingSafeEqual(getBearerToken(request), env.TRANSLATE_WORKER_TOKEN);
};

const parseJsonBody = async (request) => {
  const contentType = request.headers.get("Content-Type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("Content-Type must be application/json.");
  }

  return request.json();
};

const getGatewayUrl = (env) => {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.AI_GATEWAY_SLUG) {
    throw new Error("Cloudflare AI Gateway is not configured.");
  }

  const provider = env.AI_GATEWAY_PROVIDER || "openai";

  return `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.AI_GATEWAY_SLUG}/${provider}/responses`;
};

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

const getGatewayErrorMessage = (payload) => {
  if (typeof payload?.error?.message === "string") {
    return payload.error.message;
  }

  if (typeof payload?.error === "string") {
    return payload.error;
  }

  if (typeof payload?.message === "string") {
    return payload.message;
  }

  return "Cloudflare AI Gateway translation failed.";
};

const translateToEnglish = async ({ text, format }, env) => {
  if (!env.OPENAI_API_KEY && !env.CLOUDFLARE_AI_GATEWAY_TOKEN) {
    throw new Error("No AI provider authentication is configured.");
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (env.CLOUDFLARE_AI_GATEWAY_TOKEN) {
    headers["cf-aig-authorization"] = `Bearer ${env.CLOUDFLARE_AI_GATEWAY_TOKEN}`;
  } else {
    headers.Authorization = `Bearer ${env.OPENAI_API_KEY}`;
  }

  const gatewayResponse = await fetch(getGatewayUrl(env), {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: env.OPENAI_TRANSLATION_MODEL || "gpt-4o-mini",
      instructions:
        "Translate French portfolio CMS content into natural, polished English. Preserve meaning, tone, names, formatting cues, and do not add commentary.",
      input: `Format: ${format || "plainText"}\n\nFrench content:\n${text}`,
      max_output_tokens: 1200,
    }),
  });

  const payload = await gatewayResponse.json();

  if (!gatewayResponse.ok) {
    const message = getGatewayErrorMessage(payload);
    const error = new Error(`AI Gateway returned ${gatewayResponse.status}: ${message}`);
    error.statusCode = gatewayResponse.status;
    throw error;
  }

  const translation = extractOutputText(payload);

  if (!translation) {
    const error = new Error("The translation service returned no usable text.");
    error.statusCode = 502;
    throw error;
  }

  return translation;
};

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405);
    }

    if (!(await requireAuthorizedRequest(request, env))) {
      return forbidden();
    }

    try {
      const body = await parseJsonBody(request);
      const text = typeof body?.text === "string" ? body.text.trim() : "";
      const maxChars = Number.parseInt(env.MAX_TRANSLATION_CHARS || "6000", 10);

      if (!text) {
        return json({ error: "No French text was provided." }, 400);
      }

      if (text.length > maxChars) {
        return json({ error: `Text is too long. Maximum: ${maxChars} characters.` }, 413);
      }

      const translation = await translateToEnglish({ text, format: body?.format }, env);

      return json({ translation });
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "translation_error",
          message: error instanceof Error ? error.message : "Unknown error",
        })
      );

      return json(
        { error: error instanceof Error ? error.message : "Translation failed." },
        error?.statusCode || 500
      );
    }
  },
};
