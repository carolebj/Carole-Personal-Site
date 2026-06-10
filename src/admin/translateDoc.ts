// Document-level FR -> EN translation logic.
//
// Walks the schema fields of a document, finds every localized value that has
// French content, and translates the selected ones via the protected endpoint
// (requestTranslation). Token economy: only filled fields are translated, the
// editor can target a single field, and the UI confirms before any call.

import type { AnyDoc } from "./store";
import type { FieldDef, FieldType } from "./schema";
import { requestTranslation } from "./translate";

type Localized = { fr?: string; en?: string };

export type TranslateTarget = { kind: "all" } | { kind: "field"; fieldName: string };

export type TranslatableGroup = { fieldName: string; label: string; count: number };

function formatFor(type: FieldType): "plainText" | "richText" {
  return type === "localizedString" ? "plainText" : "richText";
}

function hasFr(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const fr = (value as Localized).fr;
  return typeof fr === "string" && fr.trim().length > 0;
}

// Pure count of translatable units for a field (no mutation).
function countFieldUnits(field: FieldDef, value: unknown): number {
  switch (field.type) {
    case "localizedString":
    case "localizedText":
    case "localizedRichText":
      return hasFr(value) ? 1 : 0;
    case "localizedList":
      return (Array.isArray(value) ? value : []).filter(hasFr).length;
    case "group": {
      const sub = (value as Record<string, unknown>) ?? {};
      return (field.fields ?? []).reduce((n, f) => n + countFieldUnits(f, sub[f.name]), 0);
    }
    case "image": {
      const img = value as { alt?: unknown } | null;
      return img && hasFr(img.alt) ? 1 : 0;
    }
    default:
      return 0;
  }
}

/** Top-level fields that currently hold translatable French content. */
export function listTranslatable(draft: AnyDoc, fields: FieldDef[]): TranslatableGroup[] {
  const doc = draft as Record<string, unknown>;
  return fields
    .map((f) => ({ fieldName: f.name, label: f.label, count: countFieldUnits(f, doc[f.name]) }))
    .filter((g) => g.count > 0);
}

/** Total translatable units for a given target. */
export function countTranslatable(
  draft: AnyDoc,
  fields: FieldDef[],
  target: TranslateTarget,
): number {
  const doc = draft as Record<string, unknown>;
  const selected = target.kind === "all" ? fields : fields.filter((f) => f.name === target.fieldName);
  return selected.reduce((n, f) => n + countFieldUnits(f, doc[f.name]), 0);
}

type ResultSink = (ok: boolean) => void;

// Translates a field in place on the cloned container.
async function translateField(
  field: FieldDef,
  container: Record<string, unknown>,
  onResult: ResultSink,
): Promise<void> {
  const value = container[field.name];

  switch (field.type) {
    case "localizedString":
    case "localizedText":
    case "localizedRichText": {
      if (!hasFr(value)) return;
      const loc = value as Localized;
      try {
        const en = await requestTranslation(loc.fr!.trim(), formatFor(field.type));
        container[field.name] = { ...loc, en };
        onResult(true);
      } catch {
        onResult(false);
      }
      return;
    }
    case "localizedList": {
      const list = (Array.isArray(value) ? (value as Localized[]) : []).slice();
      for (let i = 0; i < list.length; i++) {
        if (!hasFr(list[i])) continue;
        try {
          const en = await requestTranslation(list[i].fr!.trim(), "richText");
          list[i] = { ...list[i], en };
          onResult(true);
        } catch {
          onResult(false);
        }
      }
      container[field.name] = list;
      return;
    }
    case "group": {
      const sub = { ...((value as Record<string, unknown>) ?? {}) };
      for (const f of field.fields ?? []) {
        await translateField(f, sub, onResult);
      }
      container[field.name] = sub;
      return;
    }
    case "image": {
      const img = value as { url?: string; alt?: Localized } | null;
      if (!img || !hasFr(img.alt)) return;
      try {
        const en = await requestTranslation(img.alt!.fr!.trim(), "plainText");
        container[field.name] = { ...img, alt: { ...img.alt!, en } };
        onResult(true);
      } catch {
        onResult(false);
      }
      return;
    }
    default:
      return;
  }
}

export type TranslateOutcome = { draft: AnyDoc; ok: number; failed: number; total: number };

export async function translateDocument(
  draft: AnyDoc,
  fields: FieldDef[],
  target: TranslateTarget,
  onProgress?: (done: number, total: number) => void,
): Promise<TranslateOutcome> {
  const clone = structuredClone(draft) as Record<string, unknown>;
  const selected = target.kind === "all" ? fields : fields.filter((f) => f.name === target.fieldName);
  const total = selected.reduce((n, f) => n + countFieldUnits(f, clone[f.name]), 0);

  let ok = 0;
  let failed = 0;
  let done = 0;
  const onResult: ResultSink = (good) => {
    if (good) ok += 1;
    else failed += 1;
    done += 1;
    onProgress?.(done, total);
  };

  for (const field of selected) {
    await translateField(field, clone, onResult);
  }

  return { draft: clone as AnyDoc, ok, failed, total };
}
