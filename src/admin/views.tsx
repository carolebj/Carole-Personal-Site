import { useEffect, useMemo, useState } from "react";
import {
  PlusIcon,
  ArrowLeftIcon,
  TrashIcon,
  CheckIcon,
  PencilSquareIcon,
  EyeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { cn } from "../app/components/ui/utils";
import type { AnyDoc } from "./store";
import { contentTypes, type ContentType } from "./schema";
import { TypeIcon } from "./iconMap";
import { FieldRenderer } from "./fields";
import { TranslateMenu } from "./TranslateMenu";
import BlogPreview from "./BlogPreview";

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function readableValue(value: unknown, fallback = "(sans titre)"): string {
  if (value && typeof value === "object") {
    const loc = value as { fr?: string; en?: string };
    return loc.fr || loc.en || fallback;
  }
  if (typeof value === "string") {
    return value || fallback;
  }
  return fallback;
}

export function docTitle(type: ContentType, doc: AnyDoc) {
  return readableValue(getByPath(doc, type.titleField));
}

function docSubtitle(type: ContentType, doc: AnyDoc) {
  if (!type.subtitleField) return "";
  return readableValue(getByPath(doc, type.subtitleField), "");
}

function asArray(value: AnyDoc | AnyDoc[] | undefined): AnyDoc[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function docsEqual(a: AnyDoc, b: AnyDoc) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// --- Dashboard home ----------------------------------------------------------

export function DashboardHome({
  email,
  content,
  onOpen,
}: {
  email: string;
  content: Record<string, AnyDoc | AnyDoc[]>;
  onOpen: (type: ContentType) => void;
}) {
  const firstName = email.split("@")[0];
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="font-serif text-3xl text-text-primary">Bonjour {firstName}</h1>
      <p className="mt-2 text-sm text-text-muted">
        Gère ici tout le contenu du site. Choisis une rubrique pour commencer.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contentTypes.map((type) => {
          const count = type.kind === "collection" ? asArray(content[type.name]).length : null;
          return (
            <button
              key={type.name}
              onClick={() => onOpen(type)}
              className="group flex flex-col items-start gap-3 rounded-xl border border-border-subtle bg-surface-panel p-5 text-left shadow-[var(--shadow-panel)] transition-colors hover:border-border-accent"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-surface-accent-muted text-text-accent">
                <TypeIcon icon={type.icon} className="size-5" />
              </span>
              <div>
                <h2 className="font-medium text-text-primary">{type.label}</h2>
                <p className="mt-1 text-xs text-text-muted">{type.description}</p>
              </div>
              {count !== null ? (
                <span className="mt-auto text-xs font-medium text-text-accent">
                  {count} élément{count > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="mt-auto text-xs font-medium text-text-accent">À configurer</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Collection list ---------------------------------------------------------

export function CollectionList({
  type,
  docs,
  onEdit,
  onCreate,
  onDelete,
}: {
  type: ContentType;
  docs: AnyDoc[];
  onEdit: (doc: AnyDoc) => void;
  onCreate: () => void;
  onDelete: (doc: AnyDoc) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-text-primary">{type.label}</h1>
          <p className="mt-1 text-sm text-text-muted">{type.description}</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-action-strong px-3.5 py-2 text-sm font-medium text-text-on-strong hover:bg-action-strong-hover"
        >
          <PlusIcon className="size-4" /> Nouveau
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border-subtle bg-surface-panel">
        {docs.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-text-muted">
            Aucun élément pour l'instant. Clique sur « Nouveau » pour en créer un.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-start gap-3 px-5 py-3.5">
                <button onClick={() => onEdit(doc)} className="flex flex-1 flex-col items-start text-left">
                  <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    {docTitle(type, doc)}
                    {doc.status === "draft" ? (
                      <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-page-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                        Brouillon
                      </span>
                    ) : null}
                  </span>
                  {docSubtitle(type, doc) ? (
                    <span className="text-xs text-text-muted">{docSubtitle(type, doc)}</span>
                  ) : null}
                </button>
                <button
                  onClick={() => onEdit(doc)}
                  className="mt-0.5 rounded p-1.5 text-text-muted hover:bg-surface-page-muted hover:text-text-primary"
                  title="Modifier"
                >
                  <PencilSquareIcon className="size-4" />
                </button>
                <button
                  onClick={() => onDelete(doc)}
                  className="mt-0.5 rounded p-1.5 text-text-muted hover:bg-surface-page-muted hover:text-destructive"
                  title="Supprimer"
                >
                  <TrashIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- Document editor ---------------------------------------------------------

export function DocumentEditor({
  type,
  doc,
  onBack,
  onSave,
  notify,
}: {
  type: ContentType;
  doc: AnyDoc;
  onBack: () => void;
  onSave: (doc: AnyDoc) => Promise<void>;
  notify: (kind: "success" | "error", message: string) => void;
}) {
  const [draft, setDraft] = useState<AnyDoc>(doc);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const canPreview = type.name === "blogPost";
  const isBlog = type.name === "blogPost";
  const isPublished = draft.status !== "draft";
  const isDirty = useMemo(() => !docsEqual(draft, doc), [draft, doc]);
  const canSave = isDirty && saveState !== "saving";

  useEffect(() => {
    setDraft(doc);
    setSaveState("idle");
  }, [doc]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const setField = (name: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
    setSaveState("idle");
  };

  const handleBack = () => {
    if (isDirty) {
      const leave = window.confirm(
        "Des modifications n'ont pas été enregistrées. Quitter sans sauvegarder ?",
      );
      if (!leave) return;
    }
    onBack();
  };

  const save = async () => {
    if (!canSave) return;
    setSaveState("saving");
    try {
      await onSave(draft);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  };

  // Publishing also persists any pending edits, so the live post is never out
  // of sync with what the editor sees.
  const setPublishStatus = async (nextStatus: "draft" | "published") => {
    if (saveState === "saving") return;
    const nextDoc: AnyDoc = { ...draft, status: nextStatus };
    if (nextStatus === "published" && !nextDoc.publishedAt) {
      nextDoc.publishedAt = new Date().toISOString().slice(0, 10);
    }
    setDraft(nextDoc);
    setSaveState("saving");
    try {
      await onSave(nextDoc);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  };

  return (
    <div className={cn("mx-auto w-full px-6 py-8", mode === "preview" ? "max-w-5xl" : "max-w-3xl")}>
      <div className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between gap-4 border-b border-border-subtle bg-surface-page/90 px-6 py-3 backdrop-blur">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
        >
          <ArrowLeftIcon className="size-4" /> {type.kind === "collection" ? type.label : "Accueil"}
        </button>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {isBlog ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                  isPublished
                    ? "bg-surface-accent-muted text-text-accent"
                    : "border border-border-subtle bg-surface-page-muted text-text-muted",
                )}
                title={isPublished ? "Visible sur le site" : "Non visible sur le site"}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {isPublished ? "Publié" : "Brouillon"}
              </span>
              <button
                type="button"
                onClick={() => setPublishStatus(isPublished ? "draft" : "published")}
                disabled={saveState === "saving"}
                className={cn(
                  "inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                  isPublished
                    ? "border border-border-subtle text-text-muted hover:bg-surface-page-muted hover:text-text-primary"
                    : "bg-action-strong text-text-on-strong hover:bg-action-strong-hover",
                )}
              >
                {isPublished ? "Repasser en brouillon" : "Publier"}
              </button>
            </div>
          ) : null}
          {isDirty ? (
            <span className="hidden text-xs text-text-accent sm:inline" role="status" aria-live="polite">
              Modifications non enregistrées
            </span>
          ) : saveState === "saved" ? (
            <span className="hidden text-xs text-text-muted sm:inline" role="status" aria-live="polite">
              Tout est à jour
            </span>
          ) : null}
          {canPreview ? (
            <div className="flex items-center rounded-md border border-border-subtle p-0.5">
              <button
                onClick={() => setMode("edit")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                  mode === "edit" ? "bg-surface-accent-muted text-text-accent" : "text-text-muted hover:text-text-primary",
                )}
              >
                <PencilSquareIcon className="size-4" /> Éditer
              </button>
              <button
                onClick={() => setMode("preview")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                  mode === "preview" ? "bg-surface-accent-muted text-text-accent" : "text-text-muted hover:text-text-primary",
                )}
              >
                <EyeIcon className="size-4" /> Aperçu
              </button>
            </div>
          ) : null}
          {mode === "edit" ? (
            <TranslateMenu
              draft={draft}
              fields={type.fields}
              onApply={(next) => {
                setDraft(next);
                setSaveState("idle");
              }}
              notify={notify}
            />
          ) : null}
          <button
            onClick={save}
            disabled={!canSave}
            aria-disabled={!canSave}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors",
              canSave
                ? "bg-action-accent hover:bg-action-accent-hover"
                : "cursor-not-allowed bg-action-accent/40",
            )}
          >
            {saveState === "saving" ? (
              <ArrowPathIcon className="size-4 animate-spin" />
            ) : saveState === "saved" ? (
              <CheckIcon className="size-4" />
            ) : null}
            {saveState === "saving"
              ? "Enregistrement…"
              : saveState === "saved"
                ? "Enregistré"
                : "Enregistrer"}
          </button>
        </div>
      </div>

      {mode === "preview" && canPreview ? (
        <div className="overflow-hidden rounded-xl border border-border-subtle">
          <BlogPreview doc={draft} />
        </div>
      ) : (
        <>
          <h1 className="font-serif text-2xl text-text-primary">
            {docTitle(type, draft) === "(sans titre)" ? type.labelSingular : docTitle(type, draft)}
          </h1>

          <div className="mt-7 flex flex-col gap-6">
            {type.fields.map((field) => (
              <FieldRenderer
                key={field.name}
                field={field}
                value={draft[field.name]}
                onChange={(next) => setField(field.name, next)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
