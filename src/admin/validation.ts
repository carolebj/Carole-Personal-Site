import type { AnyDoc } from "./store";
import type { ContentType, FieldDef } from "./schema";

export type ValidationIssue = {
  path: string;
  label: string;
  message: string;
  severity: "error" | "warning";
  locale?: "fr" | "en";
};

type Localized = { fr?: string; en?: string };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateFormat(field: FieldDef, value: unknown, path: string): ValidationIssue[] {
  const validation =
    field.validation ??
    (field.type === "slug" || field.type === "url" || field.type === "email" || field.type === "date"
      ? field.type
      : undefined);
  if (!hasText(value) || !validation) return [];
  const text = String(value).trim();
  let valid = true;
  if (validation === "slug") valid = SLUG_RE.test(text);
  if (validation === "email") valid = EMAIL_RE.test(text);
  if (validation === "url") {
    try {
      const parsed = new URL(text);
      valid = parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      valid = false;
    }
  }
  if (validation === "date") valid = /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`));
  return valid
    ? []
    : [{ path, label: field.label, message: `${field.label} n'a pas un format valide.`, severity: "error" }];
}

function validateField(
  field: FieldDef,
  value: unknown,
  path: string,
  locales: ContentType["publishLocales"],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (field.type === "group") {
    const group = (value as Record<string, unknown>) ?? {};
    for (const child of field.fields ?? []) {
      issues.push(...validateField(child, group[child.name], `${path}.${child.name}`, locales));
    }
    return issues;
  }

  if (field.required) {
    if (field.type.startsWith("localized")) {
      if (field.type === "localizedList") {
        const list = Array.isArray(value) ? (value as Localized[]) : [];
        if (!list.some((item) => hasText(item?.fr))) {
          issues.push({ path, label: field.label, message: `${field.label} est requis en français.`, severity: "error", locale: "fr" });
        }
        if (!list.some((item) => hasText(item?.en))) {
          issues.push({
            path,
            label: field.label,
            message: locales === "bilingual"
              ? `${field.label} est requis en anglais.`
              : `${field.label} reste à compléter en anglais.`,
            severity: locales === "bilingual" ? "error" : "warning",
            locale: "en",
          });
        }
      } else {
        const localized = (value as Localized) ?? {};
        if (!hasText(localized.fr)) {
          issues.push({ path, label: field.label, message: `${field.label} est requis en français.`, severity: "error", locale: "fr" });
        }
        if (!hasText(localized.en)) {
          issues.push({
            path,
            label: field.label,
            message: locales === "bilingual"
              ? `${field.label} est requis en anglais.`
              : `${field.label} reste à compléter en anglais.`,
            severity: locales === "bilingual" ? "error" : "warning",
            locale: "en",
          });
        }
      }
    } else if (field.type === "image") {
      if (!hasText((value as { url?: string } | null)?.url)) {
        issues.push({ path, label: field.label, message: `${field.label} est requis.`, severity: "error" });
      }
    } else if (field.type === "tags") {
      if (!Array.isArray(value) || value.length === 0) {
        issues.push({ path, label: field.label, message: `${field.label} est requis.`, severity: "error" });
      }
    } else if (!hasText(value) && value !== true) {
      issues.push({ path, label: field.label, message: `${field.label} est requis.`, severity: "error" });
    }
  }

  if (field.type === "image" && value) {
    const image = value as { url?: string; alt?: Localized };
    const imageUrlValid =
      hasText(image.url) &&
      (String(image.url).startsWith("/") ||
        String(image.url).startsWith("blob:") ||
        /^https?:\/\//.test(String(image.url)));
    if (!imageUrlValid) {
      issues.push({ path, label: field.label, message: `${field.label} ne contient pas d'image valide.`, severity: "error" });
    }
    if (!hasText(image.alt?.fr)) {
      issues.push({
        path: `${path}.alt`,
        label: `${field.label} — texte alternatif`,
        message: `Le texte alternatif français de ${field.label.toLowerCase()} est manquant.`,
        severity: "warning",
        locale: "fr",
      });
    }
    if (locales === "bilingual" && !hasText(image.alt?.en)) {
      issues.push({
        path: `${path}.alt`,
        label: `${field.label} — texte alternatif`,
        message: `Le texte alternatif anglais de ${field.label.toLowerCase()} est manquant.`,
        severity: "warning",
        locale: "en",
      });
    }
  }

  issues.push(...validateFormat(field, value, path));
  return issues;
}

export function validateDocument(type: ContentType, doc: AnyDoc): ValidationIssue[] {
  return type.fields.flatMap((field) =>
    validateField(field, doc[field.name], field.name, type.publishLocales),
  );
}

export function documentCompleteness(type: ContentType, doc: AnyDoc) {
  const issues = validateDocument(type, doc);
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;
  return { complete: errors === 0, errors, warnings, issues };
}
