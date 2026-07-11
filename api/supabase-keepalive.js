const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const HEALTHCHECK_TYPES = ["siteSettings", "service", "resource"];

function getAuthorizationHeader(request) {
  return request.headers?.authorization || request.headers?.Authorization || "";
}

export function isAuthorizedCronRequest(request, cronSecret = process.env.CRON_SECRET) {
  return Boolean(cronSecret) && getAuthorizationHeader(request) === `Bearer ${cronSecret}`;
}

export function buildHealthcheckUrls(baseUrl) {
  return HEALTHCHECK_TYPES.map((type) => {
    const url = new URL("/rest/v1/cms_public_documents", baseUrl);
    url.searchParams.set("select", "doc_id");
    url.searchParams.set("type", `eq.${type}`);
    url.searchParams.set("limit", "1");
    return url.toString();
  });
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET") {
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!process.env.CRON_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
    response.status(500).json({ ok: false, error: "Keepalive configuration is incomplete" });
    return;
  }

  if (!isAuthorizedCronRequest(request)) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const results = await Promise.all(
      buildHealthcheckUrls(SUPABASE_URL).map(async (url) => {
        const supabaseResponse = await fetch(url, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          signal: AbortSignal.timeout(8_000),
        });

        if (!supabaseResponse.ok) {
          throw new Error(`Supabase healthcheck failed with HTTP ${supabaseResponse.status}`);
        }

        const rows = await supabaseResponse.json();
        return Array.isArray(rows) ? rows.length : 0;
      }),
    );

    response.status(200).json({
      ok: true,
      checkedAt: new Date().toISOString(),
      checks: HEALTHCHECK_TYPES.length,
      rowsFound: results.reduce((total, count) => total + count, 0),
    });
  } catch (error) {
    response.status(503).json({
      ok: false,
      error: error instanceof Error ? error.message : "Supabase healthcheck failed",
    });
  }
}
