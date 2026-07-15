// @ts-nocheck
import assert from "node:assert/strict";
import test from "node:test";
import {
  isAuthorizedRetentionCron,
  runEstimatorRetention,
} from "../api/estimator-retention.js";

test("retention cron accepts only the configured bearer secret", () => {
  assert.equal(
    isAuthorizedRetentionCron({ headers: { authorization: "Bearer expected" } }, "expected"),
    true,
  );
  assert.equal(
    isAuthorizedRetentionCron({ headers: { authorization: "Bearer wrong" } }, "expected"),
    false,
  );
  assert.equal(isAuthorizedRetentionCron({ headers: {} }, ""), false);
});

test("retention calls only protected purge RPCs and drains bounded batches", async () => {
  const calls = [];
  const counts = {
    purge_expired_project_estimates: [500, 3],
    purge_expired_brief_exports: [2],
    purge_abandoned_brief_packages: [1],
    purge_expired_brief_email_challenges: [5],
    purge_estimator_rate_limits: [4],
  };
  const fetchImpl = async (url, options) => {
    const parsed = new URL(String(url));
    if (parsed.pathname.endsWith("/estimator_deletion_logs") && (!options?.method || options.method === "GET")) {
      calls.push({ functionName: "storage_cleanup_queue", options });
      return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const functionName = parsed.pathname.split("/").pop();
    calls.push({ functionName, options });
    return new Response(JSON.stringify(counts[functionName].shift()), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await runEstimatorRetention({
    supabaseUrl: "https://project.supabase.co",
    serviceRoleKey: "service-role-test-key",
    fetchImpl,
  });

  assert.deepEqual(result, {
    estimates: { deleted: 503, batches: 2 },
    exports: { deleted: 2, batches: 1 },
    abandonedBriefs: { deleted: 1, batches: 1 },
    storage: { cleaned: 0, failed: 0, queued: 0 },
    challenges: { deleted: 5, batches: 1 },
    rateLimits: { deleted: 4, batches: 1 },
  });
  assert.equal(calls.length, 7);
  for (const call of calls.filter((entry) => entry.functionName !== "storage_cleanup_queue")) {
    assert.match(call.functionName, /^(purge_expired_(project_estimates|brief_exports|brief_email_challenges)|purge_abandoned_brief_packages|purge_estimator_rate_limits)$/);
    assert.equal(call.options.method, "POST");
    assert.equal(call.options.headers.Authorization, "Bearer service-role-test-key");
    assert.deepEqual(JSON.parse(call.options.body), { p_limit: 500 });
  }
});

test("retention deletes queued PDF objects before marking their audit log cleaned", async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    const parsed = new URL(String(url));
    requests.push({ parsed, options });
    if (parsed.pathname.includes("/rpc/")) return new Response("0", { status: 200, headers: { "Content-Type": "application/json" } });
    if (parsed.pathname.endsWith("/estimator_deletion_logs") && !options.method) return new Response(JSON.stringify([{ id: 9, storage_bucket: "brief-exports", storage_path: "instance/export.pdf" }]), { status: 200, headers: { "Content-Type": "application/json" } });
    return new Response(null, { status: 204 });
  };
  const result = await runEstimatorRetention({ supabaseUrl: "https://project.supabase.co", serviceRoleKey: "service-role-test-key", fetchImpl });
  assert.deepEqual(result.storage, { cleaned: 1, failed: 0, queued: 1 });
  assert.ok(requests.some(({ parsed, options }) => parsed.pathname === "/storage/v1/object/brief-exports/instance/export.pdf" && options.method === "DELETE"));
  assert.ok(requests.some(({ parsed, options }) => parsed.pathname === "/rest/v1/estimator_deletion_logs" && options.method === "PATCH" && parsed.searchParams.get("id") === "eq.9"));
});
