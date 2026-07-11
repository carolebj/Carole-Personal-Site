import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  Bars3Icon,
  CheckIcon,
  ClockIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  StarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { cn } from "../app/components/ui/utils";
import type { AnyDoc } from "./store";
import type { ContentType } from "./schema";
import { FieldRenderer } from "./fields";
import { TranslateMenu } from "./TranslateMenu";
import AdminPreview from "./AdminPreview";
import { documentCompleteness, validateDocument } from "./validation";
import type { Revision } from "./data";
import { moveDocument } from "./order";
import { useDialogFocus } from "./useDialogFocus";
import { documentsEqual } from "./editorial";

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function readableValue(value: unknown, fallback = "(sans titre)"): string {
  if (value && typeof value === "object") {
    const localized = value as { fr?: string; en?: string };
    return localized.fr || localized.en || fallback;
  }
  return typeof value === "string" && value ? value : fallback;
}

export function docTitle(type: ContentType, doc: AnyDoc) {
  return readableValue(getByPath(doc, type.titleField));
}

function docSubtitle(type: ContentType, doc: AnyDoc) {
  return type.subtitleField ? readableValue(getByPath(doc, type.subtitleField), "") : "";
}

function revisionChangeSummary(type: ContentType, revision: Revision, previous?: Revision) {
  if (!previous) return "Version initiale";
  const labels = new Map(type.fields.map((field) => [field.name, field.label]));
  const keys = new Set([...Object.keys(revision.data), ...Object.keys(previous.data)]);
  const changed = Array.from(keys)
    .filter((key) => JSON.stringify(revision.data[key]) !== JSON.stringify(previous.data[key]))
    .map((key) => labels.get(key) ?? key);
  if (revision.slug !== previous.slug) changed.unshift("Identifiant URL");
  if (revision.position !== previous.position) changed.push("Ordre");
  return changed.length ? `Modifié : ${changed.slice(0, 3).join(", ")}${changed.length > 3 ? "…" : ""}` : "Métadonnées mises à jour";
}

function fieldAnchor(path: string) {
  return `field-cms-${path.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function scrollToIssue(path: string) {
  const direct = document.getElementById(fieldAnchor(path));
  const parentPath = path.endsWith(".alt") ? path.slice(0, -4) : "";
  const target = direct || (parentPath ? document.getElementById(fieldAnchor(parentPath)) : null);
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  target?.querySelector<HTMLElement>("input, textarea, select, button")?.focus({ preventScroll: true });
}

function editorialLabel(doc: AnyDoc) {
  if (doc.status === "published") return "Publié";
  if (doc.publishedAtMeta) return "Modifications à publier";
  return "Brouillon";
}

function StatusBadge({ doc }: { doc: AnyDoc }) {
  const label = editorialLabel(doc);
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        doc.status === "published"
          ? "border-border-accent bg-surface-accent-muted text-text-accent"
          : doc.publishedAtMeta
            ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-600/40 dark:bg-amber-900/20 dark:text-amber-200"
            : "border-border-subtle bg-surface-page-muted text-text-muted",
      )}
    >
      {label}
    </span>
  );
}

export function CollectionList({
  type,
  docs,
  onEdit,
  onCreate,
  onTrash,
  onReorder,
  onFeature,
  notify,
}: {
  type: ContentType;
  docs: AnyDoc[];
  onEdit: (doc: AnyDoc) => void;
  onCreate: () => void;
  onTrash: (doc: AnyDoc) => void;
  onReorder: (docs: AnyDoc[]) => Promise<void>;
  onFeature?: (doc: AnyDoc) => Promise<void>;
  notify: (kind: "success" | "error", message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [completeness, setCompleteness] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sort, setSort] = useState("position");
  const [ordered, setOrdered] = useState(docs);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [featuringId, setFeaturingId] = useState<string | null>(null);

  useEffect(() => setOrdered(docs), [docs]);

  const orderChanged = useMemo(
    () => ordered.map((doc) => doc.id).join("|") !== docs.map((doc) => doc.id).join("|"),
    [docs, ordered],
  );
  const canOrder =
    !query &&
    status === "all" &&
    completeness === "all" &&
    dateRange === "all" &&
    sort === "position";

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = ordered.filter((doc) => {
      const label = editorialLabel(doc);
      const matchesQuery =
        !normalized ||
        `${docTitle(type, doc)} ${docSubtitle(type, doc)}`.toLowerCase().includes(normalized);
      const matchesStatus =
        status === "all" ||
        (status === "published" && doc.status === "published") ||
        (status === "pending" && doc.status === "draft" && Boolean(doc.publishedAtMeta)) ||
        (status === "draft" && doc.status === "draft" && !doc.publishedAtMeta);
      const quality = documentCompleteness(type, doc);
      const languageIncomplete = quality.issues.some((issue) => Boolean(issue.locale));
      const matchesCompleteness =
        completeness === "all" ||
        (completeness === "complete" && quality.errors === 0 && quality.warnings === 0) ||
        (completeness === "language" && languageIncomplete) ||
        (completeness === "blocking" && quality.errors > 0);
      const updatedAt = doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
      const age = Date.now() - updatedAt;
      const matchesDate =
        dateRange === "all" ||
        (dateRange === "7d" && age <= 7 * 86400000) ||
        (dateRange === "30d" && age <= 30 * 86400000) ||
        (dateRange === "older" && age > 30 * 86400000);
      return matchesQuery && matchesStatus && matchesCompleteness && matchesDate && Boolean(label);
    });
    if (sort === "title") return [...filtered].sort((a, b) => docTitle(type, a).localeCompare(docTitle(type, b)));
    if (sort === "updated") {
      return [...filtered].sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
    }
    return filtered;
  }, [completeness, dateRange, ordered, query, sort, status, type]);

  const move = (docId: string, direction: -1 | 1) => {
    setOrdered((current) => moveDocument(current, docId, direction));
  };

  const dropBefore = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const source = ordered.find((doc) => doc.id === draggedId);
    if (!source) return;
    const next = ordered.filter((doc) => doc.id !== draggedId);
    const targetIndex = next.findIndex((doc) => doc.id === targetId);
    next.splice(targetIndex, 0, source);
    setOrdered(next);
    setDraggedId(null);
  };

  const saveOrder = async () => {
    setOrdering(true);
    try {
      await onReorder(ordered);
      notify("success", "Ordre enregistré et appliqué au site publié.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Ordre impossible à enregistrer.");
      setOrdered(docs);
    } finally {
      setOrdering(false);
    }
  };

  const feature = async (doc: AnyDoc) => {
    if (!onFeature || doc.featured || !doc.publishedAtMeta) return;
    setFeaturingId(doc.id);
    try {
      await onFeature(doc);
      notify("success", "L'offre en vogue a été mise à jour sur le site.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Mise en vogue impossible.");
    } finally {
      setFeaturingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-text-primary">{type.label}</h1>
          <p className="mt-1 text-sm text-text-muted">{type.description}</p>
        </div>
        <div className="flex gap-2">
          {orderChanged ? (
            <button
              onClick={saveOrder}
              disabled={ordering}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-accent px-3.5 py-2 text-sm font-medium text-text-accent hover:bg-surface-accent-muted disabled:opacity-60"
            >
              {ordering ? <ArrowPathIcon className="size-4 animate-spin" /> : <Bars3Icon className="size-4" />}
              Enregistrer l'ordre
            </button>
          ) : null}
          <button
            onClick={onCreate}
            className="rounded-md bg-action-strong px-3.5 py-2 text-sm font-medium text-text-on-strong hover:bg-action-strong-hover"
          >
            Nouveau
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-border-subtle bg-surface-panel p-3 sm:grid-cols-2 xl:grid-cols-[1fr_auto_auto_auto_auto]">
        <label className="relative sm:col-span-2 xl:col-span-1">
          <span className="sr-only">Rechercher</span>
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <input
            name="cms-search"
            autoComplete="off"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-md border border-border-subtle bg-surface-panel-muted py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
          />
        </label>
        <select name="cms-status-filter" aria-label="Filtrer par statut" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-border-subtle bg-surface-panel-muted px-3 py-2 text-sm">
          <option value="all">Tous les statuts</option>
          <option value="published">Publiés</option>
          <option value="pending">À republier</option>
          <option value="draft">Brouillons</option>
        </select>
        <select name="cms-completeness-filter" aria-label="Filtrer par complétude" value={completeness} onChange={(event) => setCompleteness(event.target.value)} className="rounded-md border border-border-subtle bg-surface-panel-muted px-3 py-2 text-sm">
          <option value="all">Toute complétude</option>
          <option value="complete">Complets FR/EN</option>
          <option value="language">Langue incomplète</option>
          <option value="blocking">À corriger</option>
        </select>
        <select name="cms-date-filter" aria-label="Filtrer par date" value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="rounded-md border border-border-subtle bg-surface-panel-muted px-3 py-2 text-sm">
          <option value="all">Toutes les dates</option>
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="older">Plus de 30 jours</option>
        </select>
        <select name="cms-sort" aria-label="Trier les contenus" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-md border border-border-subtle bg-surface-panel-muted px-3 py-2 text-sm">
          <option value="position">Ordre du site</option>
          <option value="updated">Dernière modification</option>
          <option value="title">Titre</option>
        </select>
      </div>

      {!canOrder ? (
        <p className="mt-2 text-xs text-text-muted">Réinitialise les filtres et le tri pour réorganiser les éléments.</p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle bg-surface-panel">
        {visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-text-muted">Aucun élément ne correspond.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {visible.map((doc, index) => {
              const quality = documentCompleteness(type, doc);
              return (
                <li
                  key={doc.id}
                  draggable={canOrder}
                  onDragStart={() => setDraggedId(doc.id)}
                  onDragOver={(event) => canOrder && event.preventDefault()}
                  onDrop={() => canOrder && dropBefore(doc.id)}
                  className={cn("flex items-start gap-3 px-4 py-3.5 sm:px-5", draggedId === doc.id && "opacity-40")}
                >
                  <span className={cn("mt-1 text-text-muted", canOrder ? "cursor-grab" : "opacity-30")} title="Glisser pour réordonner">
                    <Bars3Icon className="size-4" />
                  </span>
                  <button onClick={() => onEdit(doc)} className="min-w-0 flex-1 text-left">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-text-primary">
                      {docTitle(type, doc)}
                      <StatusBadge doc={doc} />
                      {type.name === "service" && doc.featured ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border-accent bg-surface-accent-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-accent">
                          <StarIcon className="size-3 fill-current" /> En vogue
                        </span>
                      ) : null}
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px]",
                        quality.errors
                          ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200"
                          : quality.warnings
                            ? "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200",
                      )}>
                        {quality.errors ? `${quality.errors} à corriger` : quality.warnings ? "EN incomplet" : "Complet"}
                      </span>
                    </span>
                    {docSubtitle(type, doc) ? <span className="mt-0.5 block text-xs text-text-muted">{docSubtitle(type, doc)}</span> : null}
                    {doc.updatedAt ? <span className="mt-1 block text-[11px] text-text-muted/70">Modifié le {new Date(doc.updatedAt).toLocaleString("fr-FR")}</span> : null}
                  </button>
                  {type.name === "service" && onFeature ? (
                    <button
                      type="button"
                      onClick={() => void feature(doc)}
                      disabled={Boolean(doc.featured) || !doc.publishedAtMeta || featuringId !== null}
                      className={cn(
                        "flex size-10 items-center justify-center rounded transition",
                        doc.featured
                          ? "bg-surface-accent-muted text-text-accent"
                          : "text-text-muted hover:bg-surface-page-muted hover:text-text-accent",
                        (!doc.publishedAtMeta || featuringId !== null) && "disabled:cursor-not-allowed disabled:opacity-35",
                      )}
                      aria-label={`Mettre ${docTitle(type, doc)} en vogue`}
                      title={doc.publishedAtMeta ? "Mettre cette offre en vogue" : "Publier l'offre avant de la mettre en vogue"}
                    >
                      <StarIcon className={cn("size-4", Boolean(doc.featured) && "fill-current", featuringId === doc.id && "animate-pulse")} />
                    </button>
                  ) : null}
                  {canOrder ? (
                    <div className="flex">
                      <button type="button" onClick={() => move(doc.id, -1)} disabled={index === 0} aria-label="Monter" className="flex size-10 items-center justify-center rounded text-text-muted hover:bg-surface-page-muted disabled:opacity-25"><ArrowUpIcon className="size-4" /></button>
                      <button type="button" onClick={() => move(doc.id, 1)} disabled={index === visible.length - 1} aria-label="Descendre" className="flex size-10 items-center justify-center rounded text-text-muted hover:bg-surface-page-muted disabled:opacity-25"><ArrowDownIcon className="size-4" /></button>
                    </div>
                  ) : null}
                  <button onClick={() => onEdit(doc)} className="flex size-10 items-center justify-center rounded text-text-muted hover:bg-surface-page-muted" aria-label={`Modifier ${docTitle(type, doc)}`}><PencilSquareIcon className="size-4" /></button>
                  <button onClick={() => onTrash(doc)} className="flex size-10 items-center justify-center rounded text-text-muted hover:bg-surface-page-muted hover:text-destructive" aria-label={`Mettre ${docTitle(type, doc)} à la corbeille`}><TrashIcon className="size-4" /></button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function TrashView({
  items,
  onRestore,
  onDelete,
}: {
  items: Array<{ type: ContentType; doc: AnyDoc }>;
  onRestore: (type: ContentType, doc: AnyDoc) => void;
  onDelete: (type: ContentType, doc: AnyDoc) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-serif text-2xl text-text-primary">Corbeille</h1>
      <p className="mt-1 text-sm text-text-muted">Les éléments sont restaurables pendant 30 jours.</p>
      <div className="mt-6 overflow-hidden rounded-xl border border-border-subtle bg-surface-panel">
        {items.length === 0 ? <p className="p-10 text-center text-sm text-text-muted">La corbeille est vide.</p> : (
          <ul className="divide-y divide-border-subtle">
            {items.map(({ type, doc }) => {
              const expiry = doc.deletedAt ? new Date(new Date(doc.deletedAt).getTime() + 30 * 86400000) : null;
              return (
                <li key={`${type.name}-${doc.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{docTitle(type, doc)}</p>
                    <p className="text-xs text-text-muted">{type.labelSingular}{expiry ? ` · suppression après le ${expiry.toLocaleDateString("fr-FR")}` : ""}</p>
                  </div>
                  <button onClick={() => onRestore(type, doc)} className="rounded-md border border-border-accent px-3 py-1.5 text-xs font-medium text-text-accent hover:bg-surface-accent-muted">Restaurer</button>
                  <button onClick={() => onDelete(type, doc)} className="rounded-md px-3 py-1.5 text-xs font-medium text-destructive hover:bg-red-50 dark:hover:bg-red-950/20">Supprimer définitivement</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function DocumentEditor({
  type,
  doc,
  onBack,
  onSave,
  onPublish,
  onUnpublish,
  onTrash,
  onDirtyChange,
  loadRevisions,
  onRestoreRevision,
  notify,
}: {
  type: ContentType;
  doc: AnyDoc;
  onBack: () => void;
  onSave: (doc: AnyDoc) => Promise<AnyDoc>;
  onPublish: (doc: AnyDoc) => Promise<AnyDoc>;
  onUnpublish: (doc: AnyDoc) => Promise<AnyDoc>;
  onTrash: (doc: AnyDoc) => void;
  onDirtyChange: (dirty: boolean) => void;
  loadRevisions: () => Promise<Revision[]>;
  onRestoreRevision: (revision: Revision) => Promise<AnyDoc>;
  notify: (kind: "success" | "error", message: string) => void;
}) {
  const [draft, setDraft] = useState(doc);
  const [baseline, setBaseline] = useState(doc);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const issues = useMemo(() => validateDocument(type, draft), [draft, type]);
  const blockingIssues = issues.filter((issue) => issue.severity === "error");
  const isDirty = useMemo(() => !documentsEqual(draft, baseline), [draft, baseline]);
  const isLive = Boolean(draft.publishedAtMeta);
  const isSynced = draft.status === "published" && isLive;
  const actionBusy = saveState === "saving";
  const historyDialogRef = useDialogFocus(historyOpen, () => setHistoryOpen(false));

  useEffect(() => {
    setDraft(doc);
    setBaseline(doc);
    setSaveState("idle");
  }, [doc]);

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isDirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  const save = useCallback(async () => {
    if (!isDirty || saveState === "saving") return draft;
    setSaveState("saving");
    try {
      const saved = await onSave(draft);
      setDraft(saved);
      setBaseline(saved);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1800);
      return saved;
    } catch {
      setSaveState("error");
      return null;
    }
  }, [draft, isDirty, onSave, saveState]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  const publish = async () => {
    if (blockingIssues.length) {
      notify("error", `${blockingIssues.length} champ(s) requis doivent être corrigés avant publication.`);
      scrollToIssue(blockingIssues[0].path);
      return;
    }
    setSaveState("saving");
    try {
      const saved = isDirty ? await onSave(draft) : draft;
      const published = await onPublish(saved);
      setDraft(published);
      setBaseline(published);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  const unpublish = async () => {
    if (!window.confirm("Retirer ce contenu du site public ? La copie de travail sera conservée.")) return;
    setSaveState("saving");
    try {
      const next = await onUnpublish(draft);
      setDraft(next);
      setBaseline(next);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      setRevisions(await loadRevisions());
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Historique indisponible.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const restore = async (revision: Revision) => {
    if (!window.confirm("Restaurer cette version comme nouveau brouillon ?")) return;
    try {
      const restored = await onRestoreRevision(revision);
      setDraft(restored);
      setBaseline(restored);
      setHistoryOpen(false);
      notify("success", "Version restaurée en brouillon.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Restauration impossible.");
    }
  };

  return (
    <div className={cn("mx-auto w-full px-5 py-6 sm:px-6 sm:py-8", mode === "preview" ? "max-w-6xl" : "max-w-4xl")}>
      <div className="sticky top-0 z-20 -mx-5 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface-page/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary">
          <ArrowLeftIcon className="size-4" /> {type.kind === "collection" ? type.label : "Accueil"}
        </button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusBadge doc={draft} />
          {isDirty ? <span className="hidden text-xs text-text-accent sm:inline">Non enregistré</span> : null}
          <div className="flex rounded-md border border-border-subtle p-0.5">
            <button onClick={() => setMode("edit")} className={cn("rounded px-2.5 py-1.5 text-xs", mode === "edit" ? "bg-surface-accent-muted text-text-accent" : "text-text-muted")}><PencilSquareIcon className="mr-1 inline size-4" />Éditer</button>
            <button onClick={() => setMode("preview")} className={cn("rounded px-2.5 py-1.5 text-xs", mode === "preview" ? "bg-surface-accent-muted text-text-accent" : "text-text-muted")}><EyeIcon className="mr-1 inline size-4" />Aperçu</button>
          </div>
          <button onClick={openHistory} disabled={actionBusy} className="inline-flex items-center gap-1 rounded-md border border-border-subtle px-2.5 py-1.5 text-xs text-text-secondary hover:bg-surface-page-muted disabled:opacity-50"><ClockIcon className="size-4" />Historique</button>
          {mode === "edit" ? <TranslateMenu draft={draft} fields={type.fields} onApply={(next) => setDraft(next)} notify={notify} /> : null}
          <button onClick={() => void save()} disabled={!isDirty || actionBusy} aria-busy={actionBusy} className="inline-flex items-center gap-1.5 rounded-md bg-action-accent px-3.5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">
            {saveState === "saving" ? <ArrowPathIcon className="size-4 animate-spin" /> : saveState === "saved" ? <CheckIcon className="size-4" /> : null}
            {saveState === "saving" ? "Enregistrement…" : saveState === "saved" ? "Enregistré" : saveState === "error" ? "Réessayer" : "Enregistrer"}
          </button>
          <button onClick={publish} disabled={actionBusy} className="rounded-md bg-action-strong px-3.5 py-2 text-sm font-medium text-text-on-strong disabled:opacity-50">
            {isSynced ? "Mettre à jour" : isLive ? "Publier les modifications" : "Publier"}
          </button>
          {isLive ? <button onClick={unpublish} disabled={actionBusy} className="rounded-md border border-border-subtle px-3 py-2 text-xs text-text-muted hover:text-destructive disabled:opacity-50">Dépublier</button> : null}
        </div>
      </div>

      {blockingIssues.length ? (
        <div role="alert" aria-live="polite" className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/20 dark:text-red-100">
          <p className="font-semibold">{blockingIssues.length} correction(s) requise(s) avant publication</p>
          <ul className="mt-2 space-y-1">
            {blockingIssues.map((issue) => (
              <li key={`${issue.path}-${issue.message}`}>
                <button onClick={() => scrollToIssue(issue.path)} className="text-left underline">{issue.message}</button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mode === "preview" ? (
        <>
          <div className="mb-3 flex justify-end rounded-md">
            {(["fr", "en"] as const).map((lang) => <button key={lang} onClick={() => setLocale(lang)} className={cn("rounded-md px-3 py-1.5 text-xs font-semibold", locale === lang ? "bg-action-strong text-text-on-strong" : "text-text-muted")}>{lang.toUpperCase()}</button>)}
          </div>
          <div className="overflow-hidden rounded-xl border border-border-subtle"><AdminPreview type={type} doc={draft} locale={locale} /></div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl text-text-primary">{docTitle(type, draft) === "(sans titre)" ? type.labelSingular : docTitle(type, draft)}</h1>
              <p className="mt-1 text-xs text-text-muted">{isLive ? "Une version est visible sur le site." : "Ce contenu n'est pas visible sur le site."}</p>
            </div>
            {type.kind === "collection" ? <button onClick={() => onTrash(draft)} disabled={actionBusy} className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-destructive disabled:opacity-50"><TrashIcon className="size-4" />Corbeille</button> : null}
          </div>
          <div className="mt-7 flex flex-col gap-6">
            {type.fields.map((field) => (
              <FieldRenderer key={field.name} field={field} value={draft[field.name]} issues={issues} publishLocales={type.publishLocales} onChange={(value) => {
                setDraft((current) => ({ ...current, [field.name]: value }));
                setSaveState("idle");
              }} />
            ))}
          </div>
        </>
      )}

      {historyOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end overscroll-contain bg-black/35" role="dialog" aria-modal="true" aria-label="Historique des versions">
          <div ref={historyDialogRef} tabIndex={-1} className="h-full w-full max-w-md overflow-y-auto bg-surface-panel p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-text-primary">Historique</h2>
              <button onClick={() => setHistoryOpen(false)} className="rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-surface-page-muted">Fermer</button>
            </div>
            {historyLoading ? <p className="mt-8 text-sm text-text-muted">Chargement…</p> : revisions.length === 0 ? <p className="mt-8 text-sm text-text-muted">Aucune version enregistrée.</p> : (
              <ul className="mt-5 space-y-3">
                {revisions.map((revision, index) => (
                  <li key={revision.revisionId} className="rounded-lg border border-border-subtle p-4">
                    <p className="text-sm font-medium text-text-primary">{new Date(revision.createdAt).toLocaleString("fr-FR")}</p>
                    <p className="mt-1 text-xs text-text-muted">{revision.createdBy || "Éditeur"} · {revision.status}</p>
                    <p className="mt-2 line-clamp-2 text-xs text-text-secondary">{readableValue(getByPath(revision.data, type.titleField), type.labelSingular)}</p>
                    <p className="mt-1 text-xs text-text-muted">{revisionChangeSummary(type, revision, revisions[index + 1])}</p>
                    <button onClick={() => restore(revision)} className="mt-3 rounded-md border border-border-accent px-3 py-1.5 text-xs font-medium text-text-accent hover:bg-surface-accent-muted">Restaurer cette version</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
