import type { AnyDoc } from "./store";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

export function documentsEqual(left: AnyDoc, right: AnyDoc): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

export function saveAsDraft(doc: AnyDoc, now = new Date().toISOString()): AnyDoc {
  return { ...doc, status: "draft", updatedAt: now, deletedAt: undefined };
}

export function markPublished(doc: AnyDoc, now = new Date().toISOString()): AnyDoc {
  return {
    ...doc,
    status: "published",
    updatedAt: now,
    publishedAtMeta: now,
    deletedAt: undefined,
  };
}

export function markUnpublished(doc: AnyDoc, now = new Date().toISOString()): AnyDoc {
  return { ...doc, status: "draft", updatedAt: now, publishedAtMeta: undefined };
}

export function markTrashed(doc: AnyDoc, now = new Date().toISOString()): AnyDoc {
  return {
    ...doc,
    status: "trashed",
    updatedAt: now,
    publishedAtMeta: undefined,
    deletedAt: now,
  };
}

export function restoreFromTrash(doc: AnyDoc, now = new Date().toISOString()): AnyDoc {
  return { ...doc, status: "draft", updatedAt: now, deletedAt: undefined };
}
