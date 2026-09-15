export const DESIGN_BRIEF_ORPHAN_GRACE_MS = 30 * 24 * 60 * 60 * 1_000;

export function collectDesignBriefAssetReferences(rows) {
  const referenced = new Set();
  for (const row of rows ?? []) {
    if (!Array.isArray(row?.asset_paths)) continue;
    for (const path of row.asset_paths) {
      if (typeof path === "string" && path.trim()) referenced.add(path.trim());
    }
  }
  return referenced;
}

function addPath(target, path) {
  if (typeof path === "string" && path.trim()) target.add(path.trim());
}

export function collectClientBriefAssetReferences({ assets, submissions, challenges, deletionLogs } = {}) {
  const referenced = new Set();
  for (const asset of assets ?? []) {
    if (!asset?.storage_bucket || asset.storage_bucket === "brief-assets") addPath(referenced, asset?.storage_path);
  }
  for (const submission of submissions ?? []) {
    for (const path of submission?.payload?.asset_paths ?? []) addPath(referenced, path);
  }
  for (const challenge of challenges ?? []) {
    for (const asset of challenge?.brief_payload?.assets ?? []) addPath(referenced, asset?.path);
  }
  for (const log of deletionLogs ?? []) {
    if (log?.storage_bucket === "brief-assets") addPath(referenced, log.storage_path);
  }
  return referenced;
}

export function classifyDesignBriefAssets(objects, referenced, options = {}) {
  const now = options.now ?? Date.now();
  const graceMs = options.graceMs ?? DESIGN_BRIEF_ORPHAN_GRACE_MS;
  const result = {
    candidates: [],
    referenced: [],
    recent: [],
    unknownAge: [],
  };

  for (const object of objects ?? []) {
    if (!object || typeof object.path !== "string" || !object.path) continue;
    if (referenced.has(object.path)) {
      result.referenced.push(object);
      continue;
    }
    const createdAt = Date.parse(object.createdAt ?? "");
    if (!Number.isFinite(createdAt)) {
      result.unknownAge.push(object);
      continue;
    }
    if (createdAt > now - graceMs) {
      result.recent.push(object);
      continue;
    }
    result.candidates.push(object);
  }

  return result;
}
