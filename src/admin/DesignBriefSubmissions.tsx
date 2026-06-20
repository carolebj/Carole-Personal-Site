import { useEffect, useMemo, useState } from "react";
import { ArchiveBoxIcon, CheckCircleIcon, DocumentTextIcon, LinkIcon } from "@heroicons/react/24/outline";
import { getSupabase } from "../lib/supabase";
import type { DesignBriefSubmission } from "./data";

type BriefStatus = DesignBriefSubmission["status"];
type BriefFilter = "all" | BriefStatus;

const statusLabels: Record<BriefStatus, string> = {
  new: "En attente",
  reviewed: "Vu",
  processed: "Traité",
  archived: "Archivé",
};

const answerLabels: Record<string, string> = {
  clarity: "Niveau de clarté",
  projectType: "Besoin identifié",
  guidanceNeed: "Résultat attendu",
  briefDate: "Date du brief",
  clientName: "Organisation ou projet",
  contactPerson: "Personne référente",
  contactEmail: "Contact de suivi",
  businessStage: "Stade de l'activité",
  activity: "Description de l'activité",
  difference: "Différence / avantage",
  audience: "Public cible",
  hasName: "Nom de marque défini",
  brandName: "Nom ou pistes de nom",
  namingInputs: "Pistes de naming",
  vision: "Vision / mission",
  positioning: "Attributs à ressentir",
  tone: "Ton de marque",
  competitors: "Marques concurrentes ou inspirations",
  logoExisting: "Éléments graphiques existants",
  inspirationLinks: "Liens d'inspiration",
  inspirationFileNames: "Fichiers joints",
  deliverables: "Livrables souhaités",
  usageContexts: "Contextes d'utilisation",
  successCriteria: "Critères de réussite",
  constraints: "Délais, budget et contraintes",
};

function answerText(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function attachmentNames(submission: DesignBriefSubmission) {
  const value = submission.answers.inspirationFileNames;
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function statusClass(status: BriefStatus) {
  if (status === "new") return "bg-[#fff8f1] text-[#8a4b18]";
  if (status === "reviewed") return "bg-surface-accent-muted text-text-accent";
  if (status === "processed") return "bg-[#eef8f1] text-[#25613a]";
  return "bg-surface-page-muted text-text-muted";
}

export default function DesignBriefSubmissions({
  submissions,
  onRefresh,
  onUpdateStatus,
}: {
  submissions: DesignBriefSubmission[];
  onRefresh: () => void;
  onUpdateStatus: (id: string, status: BriefStatus) => void;
}) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<BriefFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredSubmissions = useMemo(
    () => submissions.filter((submission) => filter === "all" || submission.status === filter),
    [filter, submissions],
  );

  const selectedSubmission = useMemo(
    () => filteredSubmissions.find((submission) => submission.id === selectedId) ?? filteredSubmissions[0] ?? null,
    [filteredSubmissions, selectedId],
  );

  useEffect(() => {
    if (selectedSubmission && selectedSubmission.id !== selectedId) setSelectedId(selectedSubmission.id);
  }, [selectedId, selectedSubmission]);

  useEffect(() => {
    const sb = getSupabase();
    const paths = Array.from(new Set(submissions.flatMap((submission) => submission.assetPaths)));
    if (!sb || paths.length === 0) {
      setSignedUrls({});
      return;
    }

    let cancelled = false;
    void sb.storage
      .from("brief-assets")
      .createSignedUrls(paths, 60 * 60)
      .then(({ data }) => {
        if (cancelled) return;
        setSignedUrls(
          Object.fromEntries(
            (data ?? [])
              .filter((item) => Boolean(item.path && item.signedUrl))
              .map((item) => [item.path, item.signedUrl]),
          ),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [submissions]);

  const counts = {
    all: submissions.length,
    new: submissions.filter((item) => item.status === "new").length,
    reviewed: submissions.filter((item) => item.status === "reviewed").length,
    processed: submissions.filter((item) => item.status === "processed").length,
    archived: submissions.filter((item) => item.status === "archived").length,
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-accent">Demandes client</p>
          <h1 className="mt-2 font-serif text-3xl text-text-primary">Briefs design soumis</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Chaque soumission reste stockée séparément. Vous décidez ensuite de la marquer comme vue, traitée ou archivée.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="h-10 rounded-md border border-border-accent px-4 text-sm font-medium text-text-accent hover:bg-surface-accent-muted"
        >
          Actualiser
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ["all", "Tous", counts.all],
          ["new", "En attente", counts.new],
          ["reviewed", "Vus", counts.reviewed],
          ["processed", "Traités", counts.processed],
          ["archived", "Archivés", counts.archived],
        ].map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value as BriefFilter)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              filter === value
                ? "border-[#854d63] bg-[#854d63] text-white"
                : "border-border-accent text-text-secondary hover:bg-surface-accent-muted hover:text-text-accent"
            }`}
          >
            {label} · {count}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border-subtle bg-surface-panel p-3">
          {filteredSubmissions.length === 0 ? (
            <div className="p-5 text-center text-sm text-text-muted">Aucun brief dans cette catégorie.</div>
          ) : null}

          <div className="grid gap-2">
            {filteredSubmissions.map((submission) => (
              <button
                key={submission.id}
                type="button"
                onClick={() => setSelectedId(submission.id)}
                className={`rounded-lg border p-4 text-left transition ${
                  selectedSubmission?.id === submission.id
                    ? "border-[#854d63] bg-surface-accent-muted"
                    : "border-border-subtle hover:border-border-accent hover:bg-surface-page-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-text-primary">
                      {submission.clientName || "Client non renseigné"}
                    </span>
                    <span className="mt-1 block truncate text-xs text-text-muted">
                      {submission.projectType || "Type non renseigné"}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClass(submission.status)}`}>
                    {statusLabels[submission.status]}
                  </span>
                </div>
                <span className="mt-3 block text-xs text-text-secondary">{formatDate(submission.createdAt)}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-h-[420px] rounded-xl border border-border-subtle bg-surface-panel p-5 shadow-[var(--shadow-panel)]">
          {!selectedSubmission ? (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">
              Sélectionnez un brief pour voir ses détails.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-3xl text-text-primary">
                      {selectedSubmission.clientName || "Client non renseigné"}
                    </h2>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClass(selectedSubmission.status)}`}>
                      {statusLabels[selectedSubmission.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-muted">
                    {selectedSubmission.projectType || "Type non renseigné"} · {formatDate(selectedSubmission.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {selectedSubmission.contactName || "Contact non renseigné"}
                    {selectedSubmission.contactEmail ? ` · ${selectedSubmission.contactEmail}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSubmission.status === "new" ? (
                    <button type="button" onClick={() => onUpdateStatus(selectedSubmission.id, "reviewed")} className="inline-flex h-10 items-center gap-2 rounded-md bg-action-strong px-4 text-sm font-medium text-text-on-strong hover:bg-action-strong-hover">
                      <CheckCircleIcon className="size-4" />
                      Marquer vu
                    </button>
                  ) : null}
                  {selectedSubmission.status !== "processed" && selectedSubmission.status !== "archived" ? (
                    <button type="button" onClick={() => onUpdateStatus(selectedSubmission.id, "processed")} className="inline-flex h-10 items-center gap-2 rounded-md border border-border-accent px-4 text-sm font-medium text-text-accent hover:bg-surface-accent-muted">
                      <CheckCircleIcon className="size-4" />
                      Marquer traité
                    </button>
                  ) : null}
                  {selectedSubmission.status !== "archived" ? (
                    <button type="button" onClick={() => onUpdateStatus(selectedSubmission.id, "archived")} className="inline-flex h-10 items-center gap-2 rounded-md border border-border-subtle px-4 text-sm font-medium text-text-muted hover:bg-surface-page-muted">
                      <ArchiveBoxIcon className="size-4" />
                      Archiver
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <dl className="grid content-start gap-3 rounded-lg border border-border-subtle bg-surface-page-muted p-4">
                  {Object.entries(selectedSubmission.answers).map(([key, value]) => {
                    const text = answerText(value);
                    if (!text) return null;
                    return (
                      <div key={key} className="grid gap-1 text-sm sm:grid-cols-[200px_1fr]">
                        <dt className="font-semibold text-text-muted">{answerLabels[key] ?? key}</dt>
                        <dd className="whitespace-pre-wrap text-text-secondary">{text}</dd>
                      </div>
                    );
                  })}
                </dl>

                <div className="grid content-start gap-3">
                  <div className="rounded-lg border border-border-subtle p-4">
                    <h3 className="text-sm font-semibold text-text-primary">Styles de logo</h3>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {selectedSubmission.logoStyles.length ? selectedSubmission.logoStyles.join(", ") : "Non renseigné"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border-subtle p-4">
                    <h3 className="text-sm font-semibold text-text-primary">Couleurs</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedSubmission.colorPalette.map((color) => (
                        <span key={color} className="inline-flex items-center gap-2 text-xs text-text-secondary">
                          <span className="size-5 rounded-full border border-border-subtle" style={{ background: color }} />
                          {color}
                        </span>
                      ))}
                      {selectedSubmission.colorPalette.length === 0 ? <span className="text-sm text-text-muted">Non renseigné</span> : null}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border-subtle p-4">
                    <h3 className="text-sm font-semibold text-text-primary">Inspirations et pièces jointes</h3>
                    <div className="mt-3 grid gap-2 text-sm">
                      {selectedSubmission.inspirationLinks.map((link) => (
                        <a key={link} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-text-accent hover:underline">
                          <LinkIcon className="size-4" />
                          {link}
                        </a>
                      ))}
                      {selectedSubmission.assetPaths.map((path, index) => {
                        const label = attachmentNames(selectedSubmission)[index] ?? path.split("/").pop() ?? path;
                        const signedUrl = signedUrls[path];
                        return signedUrl ? (
                          <a key={path} href={signedUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-text-accent hover:underline">
                            <DocumentTextIcon className="size-4" />
                            {label}
                          </a>
                        ) : (
                          <p key={path} className="flex items-center gap-2 text-text-secondary">
                            <DocumentTextIcon className="size-4 text-text-accent" />
                            {label}
                          </p>
                        );
                      })}
                      {selectedSubmission.inspirationLinks.length === 0 && selectedSubmission.assetPaths.length === 0 ? (
                        <p className="text-text-muted">Aucune inspiration jointe.</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
