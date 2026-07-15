const MAX_BATCHES = 10;
const BATCH_SIZE = 500;

function authorizationHeader(request) {
  return request.headers?.authorization || request.headers?.Authorization || "";
}

export function isAuthorizedRetentionCron(request, secret = process.env.CRON_SECRET) {
  return Boolean(secret) && authorizationHeader(request) === `Bearer ${secret}`;
}

function rpcUrl(baseUrl, functionName) {
  return new URL(`/rest/v1/rpc/${functionName}`, baseUrl).toString();
}

async function purgeInBatches({ baseUrl, serviceRoleKey, functionName, fetchImpl = fetch }) {
  let deleted = 0;
  let batches = 0;

  while (batches < MAX_BATCHES) {
    const response = await fetchImpl(rpcUrl(baseUrl, functionName), {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_limit: BATCH_SIZE }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) throw new Error(`${functionName} failed`);
    const count = Number(await response.json());
    if (!Number.isInteger(count) || count < 0 || count > BATCH_SIZE) {
      throw new Error(`${functionName} returned an invalid count`);
    }

    deleted += count;
    batches += 1;
    if (count < BATCH_SIZE) break;
  }

  return { deleted, batches };
}

async function cleanupQueuedStorage({ baseUrl, serviceRoleKey, fetchImpl = fetch }) {
  const queueUrl = new URL("/rest/v1/estimator_deletion_logs", baseUrl);
  queueUrl.searchParams.set("entity_type", "eq.brief_export");
  queueUrl.searchParams.set("storage_cleanup_required", "eq.true");
  queueUrl.searchParams.set("storage_cleaned_at", "is.null");
  queueUrl.searchParams.set("select", "id,storage_bucket,storage_path");
  queueUrl.searchParams.set("order", "id.asc");
  queueUrl.searchParams.set("limit", String(BATCH_SIZE));
  const queueResponse = await fetchImpl(queueUrl, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    signal: AbortSignal.timeout(8_000),
  });
  if (!queueResponse.ok) throw new Error("storage cleanup queue failed");
  const queued = await queueResponse.json();
  if (!Array.isArray(queued)) throw new Error("storage cleanup queue returned invalid data");

  let cleaned = 0;
  let failed = 0;
  for (const item of queued) {
    if (!item?.id || !item.storage_bucket || !item.storage_path) continue;
    try {
      const objectUrl = new URL(`/storage/v1/object/${encodeURIComponent(item.storage_bucket)}/${item.storage_path.split("/").map(encodeURIComponent).join("/")}`, baseUrl);
      const objectResponse = await fetchImpl(objectUrl, {
        method: "DELETE",
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!objectResponse.ok && objectResponse.status !== 404) throw new Error(`storage_delete_${objectResponse.status}`);
      const logResponse = await fetchImpl(new URL(`/rest/v1/estimator_deletion_logs?id=eq.${item.id}`, baseUrl), {
        method: "PATCH",
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ storage_cleaned_at: new Date().toISOString(), storage_cleanup_error: null }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!logResponse.ok) throw new Error("cleanup_log_update_failed");
      cleaned += 1;
    } catch (error) {
      failed += 1;
      await fetchImpl(new URL(`/rest/v1/estimator_deletion_logs?id=eq.${item.id}`, baseUrl), {
        method: "PATCH",
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ storage_cleanup_error: error instanceof Error ? error.message.slice(0, 200) : "cleanup_failed" }),
        signal: AbortSignal.timeout(8_000),
      }).catch(() => null);
    }
  }
  return { cleaned, failed, queued: queued.length };
}

export async function runEstimatorRetention({
  supabaseUrl,
  serviceRoleKey,
  fetchImpl = fetch,
}) {
  const estimates = await purgeInBatches({
    baseUrl: supabaseUrl,
    serviceRoleKey,
    functionName: "purge_expired_project_estimates",
    fetchImpl,
  });
  const exports = await purgeInBatches({
    baseUrl: supabaseUrl,
    serviceRoleKey,
    functionName: "purge_expired_brief_exports",
    fetchImpl,
  });
  const abandonedBriefs = await purgeInBatches({
    baseUrl: supabaseUrl,
    serviceRoleKey,
    functionName: "purge_abandoned_brief_packages",
    fetchImpl,
  });
  const storage = await cleanupQueuedStorage({ baseUrl: supabaseUrl, serviceRoleKey, fetchImpl });
  const challenges = await purgeInBatches({
    baseUrl: supabaseUrl,
    serviceRoleKey,
    functionName: "purge_expired_brief_email_challenges",
    fetchImpl,
  });
  const rateLimits = await purgeInBatches({
    baseUrl: supabaseUrl,
    serviceRoleKey,
    functionName: "purge_estimator_rate_limits",
    fetchImpl,
  });

  return { estimates, exports, abandonedBriefs, storage, challenges, rateLimits };
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.CRON_SECRET || !supabaseUrl || !serviceRoleKey) {
    return response.status(500).json({ ok: false, error: "retention_configuration_incomplete" });
  }
  if (!isAuthorizedRetentionCron(request)) {
    return response.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const result = await runEstimatorRetention({ supabaseUrl, serviceRoleKey });
    return response.status(200).json({
      ok: true,
      checkedAt: new Date().toISOString(),
      ...result,
    });
  } catch {
    return response.status(503).json({ ok: false, error: "retention_failed" });
  }
}
