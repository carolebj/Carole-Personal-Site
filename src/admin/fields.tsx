import { useRef, useState } from "react";
import {
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { cn } from "../app/components/ui/utils";
import type { FieldDef } from "./schema";
import { uploadImage } from "./data";
import type { ValidationIssue } from "./validation";

type Localized = { fr?: string; en?: string };

const inputClass =
  "w-full rounded-md border border-border-subtle bg-surface-panel-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted/60 focus:border-action-accent focus:ring-2 focus:ring-[color:var(--focus-ring)]";

const labelClass = "text-xs font-medium uppercase tracking-wide text-text-muted";

function FieldShell({
  id,
  labelFor = id,
  label,
  help,
  issues = [],
  children,
}: {
  id: string;
  labelFor?: string;
  label: string;
  help?: string;
  issues?: ValidationIssue[];
  children: React.ReactNode;
}) {
  const issueId = issues.length ? `${id}-issues` : undefined;
  return (
    <div className="flex flex-col gap-2" id={`field-${id}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <label className={labelClass} htmlFor={labelFor}>{label}</label>
        {help ? <span className="text-xs text-text-muted/80 sm:text-right">{help}</span> : null}
      </div>
      <div>{children}</div>
      {issues.length ? (
        <ul id={issueId} className="space-y-1 text-xs">
          {issues.map((issue) => (
            <li
              key={`${issue.path}-${issue.message}`}
              className={issue.severity === "error" ? "text-destructive" : "text-amber-700 dark:text-amber-300"}
            >
              {issue.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function LangBadge({ children }: { children: string }) {
  return (
    <span className="rounded-sm bg-surface-accent-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-accent">
      {children}
    </span>
  );
}

function LocalizedInput({
  value,
  onChange,
  multiline,
  id,
  label,
  required,
  englishRequired,
  recommended,
  describedBy,
  invalidFr,
  invalidEn,
}: {
  value: Localized;
  onChange: (next: Localized) => void;
  multiline?: boolean;
  id: string;
  label: string;
  required?: boolean;
  englishRequired?: boolean;
  recommended?: boolean;
  describedBy?: string;
  invalidFr?: boolean;
  invalidEn?: boolean;
}) {
  const fr = value?.fr ?? "";
  const en = value?.en ?? "";

  const copyFr = () => onChange({ fr, en: fr });

  const Field = multiline ? "textarea" : "input";

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <LangBadge>FR</LangBadge>
          <span className="text-[11px] text-text-muted">
            {required ? "Requis" : recommended ? "Recommandé" : "Optionnel"}
          </span>
        </div>
        <Field
          id={`${id}-fr`}
          name={`${id}-fr`}
          aria-label={`${label} — français`}
          aria-describedby={describedBy}
          aria-invalid={invalidFr || undefined}
          aria-required={required || undefined}
          className={cn(inputClass, multiline && "min-h-[88px] resize-y")}
          value={fr}
          onChange={(e) => onChange({ fr: e.target.value, en })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LangBadge>EN</LangBadge>
            <span className="text-[11px] text-text-muted">
              {required ? (englishRequired ? "Requis" : "Recommandé") : recommended ? "Recommandé" : "Optionnel"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={copyFr}
              className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-text-muted hover:bg-surface-page-muted hover:text-text-primary"
              title="Copier le texte FR"
            >
              <DocumentDuplicateIcon className="size-3.5" /> Copier FR
            </button>
          </div>
        </div>
        <Field
          id={`${id}-en`}
          name={`${id}-en`}
          aria-label={`${label} — anglais`}
          aria-describedby={describedBy}
          aria-invalid={invalidEn || undefined}
          aria-required={(required && englishRequired) || undefined}
          className={cn(inputClass, multiline && "min-h-[88px] resize-y")}
          value={en}
          onChange={(e) => onChange({ fr, en: e.target.value })}
        />
      </div>
    </div>
  );
}

function LocalizedListInput({
  value,
  onChange,
  id,
  label,
  required,
  englishRequired,
  describedBy,
  invalidFr,
  invalidEn,
}: {
  value: Localized[];
  onChange: (next: Localized[]) => void;
  id: string;
  label: string;
  required?: boolean;
  englishRequired?: boolean;
  describedBy?: string;
  invalidFr?: boolean;
  invalidEn?: boolean;
}) {
  const items = Array.isArray(value) ? value : [];
  const update = (i: number, next: Localized) =>
    onChange(items.map((item, idx) => (idx === i ? next : item)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { fr: "", en: "" }]);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-md border border-border-subtle/70 bg-surface-panel-muted/60 p-2"
        >
          <div className="flex-1">
            <LocalizedInput
              id={`${id}-${i}`}
              label={`${label} ${i + 1}`}
              value={item}
              onChange={(next) => update(i, next)}
              required={required}
              englishRequired={englishRequired}
              describedBy={describedBy}
              invalidFr={invalidFr}
              invalidEn={invalidEn}
            />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-7 shrink-0 self-start rounded p-1.5 text-text-muted hover:bg-surface-page-muted hover:text-destructive sm:self-center sm:mt-0"
            title="Supprimer"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-border-accent px-3 py-1.5 text-xs font-medium text-text-accent hover:bg-surface-accent-muted"
      >
        <PlusIcon className="size-4" /> Ajouter une ligne
      </button>
    </div>
  );
}

function ImageInput({
  value,
  onChange,
  id,
  describedBy,
  invalid,
}: {
  value: { url?: string; alt?: Localized } | null;
  onChange: (next: { url?: string; alt?: Localized } | null) => void;
  id: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const url = value?.url;

  const pick = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const result = await uploadImage(file);
      if (result) {
        onChange({ url: result.url, alt: value?.alt ?? { fr: "", en: "" } });
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Téléversement impossible.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-subtle bg-surface-panel-muted">
          {uploading ? (
            <ArrowPathIcon className="size-6 animate-spin text-text-muted/60" />
          ) : url ? (
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <PhotoIcon className="size-7 text-text-muted/60" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            name={`${id}-upload`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex w-fit items-center gap-1.5 rounded-md bg-action-strong px-3 py-1.5 text-xs font-medium text-text-on-strong hover:bg-action-strong-hover disabled:opacity-60"
          >
            <PhotoIcon className="size-4" />{" "}
            {uploading ? "Téléversement…" : url ? "Remplacer" : "Téléverser une image"}
          </button>
          {url ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex w-fit items-center gap-1 text-xs text-text-muted hover:text-destructive"
            >
              <XMarkIcon className="size-3.5" /> Retirer
            </button>
          ) : null}
        </div>
      </div>
      {uploadError ? <p className="text-xs text-destructive" role="alert">{uploadError}</p> : null}
      {url ? (
        <div>
          <span className="mb-1 block text-xs text-text-muted">Texte alternatif (accessibilité)</span>
          <LocalizedInput
            id={`${id}-alt`}
            label="Texte alternatif"
            value={value?.alt ?? { fr: "", en: "" }}
            onChange={(alt) => onChange({ url, alt })}
            recommended
            describedBy={describedBy}
            invalidFr={invalid}
            invalidEn={invalid}
          />
        </div>
      ) : null}
    </div>
  );
}

export function FieldRenderer({
  field,
  value,
  onChange,
  path,
  issues = [],
  publishLocales = "fr",
}: {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
  path?: string;
  issues?: ValidationIssue[];
  publishLocales?: "bilingual" | "fr";
}) {
  const fieldPath = path ?? field.name;
  const fieldId = `cms-${fieldPath.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const ownIssues = issues.filter((issue) =>
    issue.path === fieldPath || (field.type === "image" && issue.path.startsWith(`${fieldPath}.`)),
  );
  const issueId = ownIssues.length ? `${fieldId}-issues` : undefined;
  const invalid = ownIssues.some((issue) => issue.severity === "error");
  const invalidWithoutLocale = ownIssues.some((issue) => issue.severity === "error" && !issue.locale);
  const invalidFr = invalidWithoutLocale || ownIssues.some((issue) => issue.severity === "error" && issue.locale === "fr");
  const invalidEn = invalidWithoutLocale || ownIssues.some((issue) => issue.severity === "error" && issue.locale === "en");
  switch (field.type) {
    case "localizedString":
      return (
        <FieldShell id={fieldId} labelFor={`${fieldId}-fr`} label={field.label} help={field.help} issues={ownIssues}>
          <LocalizedInput
            id={fieldId}
            label={field.label}
            value={(value as Localized) ?? {}}
            onChange={onChange}
            required={field.required}
            englishRequired={field.required && publishLocales === "bilingual"}
            describedBy={issueId}
            invalidFr={invalidFr}
            invalidEn={invalidEn}
          />
        </FieldShell>
      );
    case "localizedText":
    case "localizedRichText":
      return (
        <FieldShell id={fieldId} labelFor={`${fieldId}-fr`} label={field.label} help={field.help} issues={ownIssues}>
          <LocalizedInput
            id={fieldId}
            label={field.label}
            value={(value as Localized) ?? {}}
            onChange={onChange}
            multiline
            required={field.required}
            englishRequired={field.required && publishLocales === "bilingual"}
            describedBy={issueId}
            invalidFr={invalidFr}
            invalidEn={invalidEn}
          />
        </FieldShell>
      );
    case "localizedList":
      return (
        <FieldShell id={fieldId} label={field.label} help={field.help} issues={ownIssues}>
          <LocalizedListInput
            id={fieldId}
            label={field.label}
            value={(value as Localized[]) ?? []}
            onChange={onChange}
            required={field.required}
            englishRequired={field.required && publishLocales === "bilingual"}
            describedBy={issueId}
            invalidFr={invalidFr}
            invalidEn={invalidEn}
          />
        </FieldShell>
      );
    case "image":
      return (
        <FieldShell id={fieldId} label={field.label} help={field.help} issues={ownIssues}>
          <ImageInput
            id={fieldId}
            value={(value as { url?: string; alt?: Localized } | null) ?? null}
            onChange={onChange}
            describedBy={issueId}
            invalid={invalid}
          />
        </FieldShell>
      );
    case "boolean": {
      const checked = Boolean(value);
      return (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={field.label}
          onClick={() => onChange(!checked)}
          className="flex w-fit cursor-pointer items-center gap-3"
        >
          <span
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
              checked ? "bg-action-accent" : "bg-border-subtle",
            )}
          >
            <span
              className={cn(
                "inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                checked ? "translate-x-[22px]" : "translate-x-0.5",
              )}
            />
          </span>
          <span className="text-sm text-text-primary">{field.label}</span>
        </button>
      );
    }
    case "select":
      return (
        <FieldShell id={fieldId} label={field.label} help={field.help} issues={ownIssues}>
          <select
            id={fieldId}
            name={fieldId}
            className={inputClass}
            aria-describedby={issueId}
            aria-invalid={invalid || undefined}
            aria-required={field.required || undefined}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">—</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FieldShell>
      );
    case "tags": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (val: string) =>
        onChange(
          selected.includes(val)
            ? selected.filter((v) => v !== val)
            : [...selected, val],
        );
      return (
        <FieldShell id={fieldId} label={field.label} help={field.help} issues={ownIssues}>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const active = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-action-accent bg-surface-accent-muted text-text-accent"
                      : "border-border-subtle bg-surface-panel-muted text-text-secondary hover:border-border-accent hover:text-text-primary",
                  )}
                >
                  {active ? <span aria-hidden>✓</span> : null}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </FieldShell>
      );
    }
    case "group":
      return (
        <fieldset className="rounded-lg border border-border-subtle bg-surface-panel-muted/40 p-4">
          <legend className="px-1 text-sm font-semibold text-text-primary">{field.label}</legend>
          <div className="mt-3 flex flex-col gap-5">
            {field.fields?.map((sub) => (
              <FieldRenderer
                key={sub.name}
                field={sub}
                value={(value as Record<string, unknown>)?.[sub.name]}
                path={`${fieldPath}.${sub.name}`}
                issues={issues}
                publishLocales={publishLocales}
                onChange={(next) =>
                  onChange({ ...((value as Record<string, unknown>) ?? {}), [sub.name]: next })
                }
              />
            ))}
          </div>
        </fieldset>
      );
    default:
      return (
        <FieldShell id={fieldId} label={field.label} help={field.help} issues={ownIssues}>
          <input
            id={fieldId}
            name={fieldId}
            className={inputClass}
            type={field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
            aria-describedby={issueId}
            aria-invalid={invalid || undefined}
            aria-required={field.required || undefined}
            placeholder={field.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </FieldShell>
      );
  }
}
