import { useEffect, useRef, useState } from "react";
import {
  LanguageIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { cn } from "../app/components/ui/utils";
import type { AnyDoc } from "./store";
import type { FieldDef } from "./schema";
import { isRemote } from "./data";
import {
  listTranslatable,
  countTranslatable,
  translateDocument,
  type TranslateTarget,
} from "./translateDoc";
import { useDialogFocus } from "./useDialogFocus";

type PendingTarget = { target: TranslateTarget; label: string; count: number };

export function TranslateMenu({
  draft,
  fields,
  onApply,
  notify,
}: {
  draft: AnyDoc;
  fields: FieldDef[];
  onApply: (next: AnyDoc) => void;
  notify: (kind: "success" | "error", message: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState<PendingTarget | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const confirmDialogRef = useDialogFocus(Boolean(pending), () => {
    if (!running) setPending(null);
  });

  const translatable = listTranslatable(draft, fields);
  const disabled = !isRemote || translatable.length === 0;

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKeyDown);
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const openConfirm = (target: TranslateTarget, label: string) => {
    const count = countTranslatable(draft, fields, target);
    if (count === 0) {
      notify("error", "Aucun champ rempli à traduire.");
      return;
    }
    setMenuOpen(false);
    setPending({ target, label, count });
  };

  const runTranslation = async () => {
    if (!pending) return;
    setRunning(true);
    setProgress({ done: 0, total: pending.count });
    try {
      const result = await translateDocument(draft, fields, pending.target, (done, total) =>
        setProgress({ done, total }),
      );
      onApply(result.draft);
      if (result.failed > 0) {
        notify(
          "error",
          `${result.ok} champ(s) traduit(s), ${result.failed} en échec. Vérifie ta connexion ou réessaie.`,
        );
      } else {
        notify("success", `${result.ok} champ(s) traduit(s) en anglais.`);
      }
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "La traduction a échoué.");
    } finally {
      setRunning(false);
      setProgress(null);
      setPending(null);
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        <div className="flex items-stretch overflow-hidden rounded-md border border-border-subtle">
          <button
            type="button"
            onClick={() => openConfirm({ kind: "all" }, "Tous les champs renseignés")}
            disabled={disabled}
            title={
              !isRemote
                ? "Indisponible en mode démo (Supabase non configuré)"
                : "Traduire tous les champs FR renseignés vers l'anglais"
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-accent hover:bg-surface-accent-muted disabled:cursor-not-allowed disabled:text-text-muted/50 disabled:hover:bg-transparent"
          >
            <LanguageIcon className="size-4" /> Traduire FR&nbsp;→&nbsp;EN
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={disabled}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="translation-menu"
            aria-label="Ouvrir la traduction ciblée"
            title="Traduction ciblée"
            className="inline-flex items-center border-l border-border-subtle px-1.5 text-text-accent hover:bg-surface-accent-muted disabled:cursor-not-allowed disabled:text-text-muted/50 disabled:hover:bg-transparent"
          >
            <ChevronDownIcon className={cn("size-3.5 transition-transform", menuOpen && "rotate-180")} />
          </button>
        </div>

        {menuOpen ? (
          <div
            ref={menuRef}
            id="translation-menu"
            role="menu"
            className="absolute right-0 z-30 mt-1 w-72 overflow-hidden rounded-lg border border-border-subtle bg-surface-panel shadow-[var(--shadow-panel)]"
          >
            <p className="border-b border-border-subtle px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Traduction ciblée
            </p>
            <ul className="max-h-72 overflow-y-auto py-1">
              {translatable.map((group) => (
                <li key={group.fieldName}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      openConfirm({ kind: "field", fieldName: group.fieldName }, group.label)
                    }
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-accent-muted"
                  >
                    <span className="truncate">{group.label}</span>
                    <span className="shrink-0 text-[11px] text-text-muted">
                      {group.count} champ{group.count > 1 ? "s" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {pending ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="translate-confirm-title"
        >
          <div ref={confirmDialogRef} tabIndex={-1} aria-busy={running} className="w-full max-w-md rounded-xl border border-border-subtle bg-surface-panel p-5 shadow-[var(--shadow-panel)]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-accent-muted text-text-accent">
                <ExclamationTriangleIcon className="size-4" />
              </span>
              <div className="flex-1">
                <h2 id="translate-confirm-title" className="text-sm font-semibold text-text-primary">
                  Confirmer la traduction
                </h2>
                <p className="mt-1.5 text-sm text-text-secondary">
                  Le texte sera traduit du français vers l'anglais via ChatGPT, ce qui{" "}
                  <strong className="font-medium text-text-primary">consomme des crédits IA</strong>.
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Cible : <span className="text-text-primary">{pending.label}</span> —{" "}
                  <span className="text-text-primary">{pending.count}</span> champ
                  {pending.count > 1 ? "s" : ""} concerné{pending.count > 1 ? "s" : ""}. Les
                  textes anglais existants seront remplacés.
                </p>
                {running && progress ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-text-muted">
                    <ArrowPathIcon className="size-3.5 animate-spin" />
                    Traduction… {progress.done}/{progress.total}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={running}
                className="rounded-md border border-border-subtle px-3.5 py-2 text-sm font-medium text-text-secondary hover:bg-surface-page-muted disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={runTranslation}
                disabled={running}
                className="inline-flex items-center gap-1.5 rounded-md bg-action-accent px-4 py-2 text-sm font-medium text-white hover:bg-action-accent-hover disabled:opacity-60"
              >
                {running ? <ArrowPathIcon className="size-4 animate-spin" /> : null}
                {running ? "Traduction…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
