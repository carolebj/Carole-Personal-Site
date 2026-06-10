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

type Localized = { fr?: string; en?: string };

const inputClass =
  "w-full rounded-md border border-border-subtle bg-surface-panel-muted px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted/60 focus:border-action-accent focus:ring-2 focus:ring-[color:var(--focus-ring)]";

const labelClass = "text-xs font-medium uppercase tracking-wide text-text-muted";

function FieldShell({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className={labelClass}>{label}</label>
        {help ? <span className="text-xs text-text-muted/80">{help}</span> : null}
      </div>
      {children}
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
}: {
  value: Localized;
  onChange: (next: Localized) => void;
  multiline?: boolean;
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
          <span className="text-[11px] text-text-muted">Requis</span>
        </div>
        <Field
          className={cn(inputClass, multiline && "min-h-[88px] resize-y")}
          value={fr}
          onChange={(e) => onChange({ fr: e.target.value, en })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LangBadge>EN</LangBadge>
            <span className="text-[11px] text-text-muted">Optionnel</span>
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
}: {
  value: Localized[];
  onChange: (next: Localized[]) => void;
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
            <LocalizedInput value={item} onChange={(next) => update(i, next)} />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-1 rounded p-1.5 text-text-muted hover:bg-surface-page-muted hover:text-destructive"
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
}: {
  value: { url?: string; alt?: Localized } | null;
  onChange: (next: { url?: string; alt?: Localized } | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const url = value?.url;

  const pick = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file);
      if (result) {
        onChange({ url: result.url, alt: value?.alt ?? { fr: "", en: "" } });
      }
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
      {url ? (
        <div>
          <span className="mb-1 block text-xs text-text-muted">Texte alternatif (accessibilité)</span>
          <LocalizedInput
            value={value?.alt ?? { fr: "", en: "" }}
            onChange={(alt) => onChange({ url, alt })}
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
}: {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  switch (field.type) {
    case "localizedString":
      return (
        <FieldShell label={field.label} help={field.help}>
          <LocalizedInput value={(value as Localized) ?? {}} onChange={onChange} />
        </FieldShell>
      );
    case "localizedText":
    case "localizedRichText":
      return (
        <FieldShell label={field.label} help={field.help}>
          <LocalizedInput value={(value as Localized) ?? {}} onChange={onChange} multiline />
        </FieldShell>
      );
    case "localizedList":
      return (
        <FieldShell label={field.label} help={field.help}>
          <LocalizedListInput value={(value as Localized[]) ?? []} onChange={onChange} />
        </FieldShell>
      );
    case "image":
      return (
        <FieldShell label={field.label} help={field.help}>
          <ImageInput value={(value as { url?: string; alt?: Localized } | null) ?? null} onChange={onChange} />
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
        <FieldShell label={field.label} help={field.help}>
          <select
            className={inputClass}
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
        <FieldShell label={field.label} help={field.help}>
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
        <FieldShell label={field.label} help={field.help}>
          <input
            className={inputClass}
            type={field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
            placeholder={field.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </FieldShell>
      );
  }
}
