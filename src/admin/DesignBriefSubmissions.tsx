import { useEffect, useMemo, useState } from "react";
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { cn } from "../app/components/ui/utils";
import { getSupabase } from "../lib/supabase";
import type { DesignBriefSubmission } from "./data";

type BriefStatus = DesignBriefSubmission["status"];
type BriefFilter = "all" | BriefStatus;
type PageView = "list" | "detail";

const statusLabels: Record<BriefStatus, string> = {
  new: "En attente",
  reviewed: "Vu",
  processed: "Traité",
  archived: "Archivé",
};

const answerLabels: Record<string, string> = {
  clarity: "Savez-vous déjà précisément ce que vous voulez ?",
  projectType: "Quel besoin décrit le mieux votre projet aujourd'hui ?",
  guidanceNeed: "Qu'est-ce que vous voulez réussir, même si le type de service n'est pas encore clair ?",
  briefDate: "Date du brief",
  clientName: "Nom de l'organisation ou du projet",
  contactPerson: "Nom et poste de la personne référente",
  contactEmail: "Email ou contact de suivi",
  businessStage: "Où en est votre activité ?",
  activity: "Description de l'entreprise, de l'activité ou du projet",
  difference: "Qu'est-ce qui vous différencie des autres ?",
  audience: "Public cible prioritaire",
  hasName: "Le nom de la marque est-il déjà défini ?",
  brandName: "Nom retenu, pistes actuelles ou contraintes de naming",
  namingInputs: "Si le nom n'est pas défini, quelles idées doivent guider sa recherche ?",
  vision: "Vision, mission ou ambition de la marque",
  positioning: "Quels attributs doivent être ressentis ?",
  visualState: "Quels éléments graphiques existent déjà ?",
  competitors: "Marques concurrentes, marques admirées ou marques à ne pas imiter",
  deliverables: "De quoi avez-vous besoin à la fin du projet ?",
  usage: "Où l'identité ou les créations devront-elles vivre en priorité ?",
  success: "À quoi saura-t-on que le design est réussi ?",
  constraints: "Délais, budget estimatif, validations ou contraintes importantes",
  inspirationLinks: "Liens d'inspiration",
  inspirationFileNames: "Fichiers joints",
  // Anciennes clés éventuelles (soumissions antérieures)
  usageContexts: "Où l'identité ou les créations devront-elles vivre en priorité ?",
  successCriteria: "À quoi saura-t-on que le design est réussi ?",
  logoExisting: "Quels éléments graphiques existent déjà ?",
  tone: "Ton de marque",
};

const answerOrder = Object.keys(answerLabels);

const hiddenAnswerKeys = new Set(["inspirationLinks", "inspirationFileNames", "logoStyles"]);

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

function displayName(submission: DesignBriefSubmission) {
  return submission.clientName || "Client non renseigné";
}

function StatusBadge({ status }: { status: BriefStatus }) {
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", statusClass(status))}>
      {statusLabels[status]}
    </span>
  );
}

function orderedAnswers(submission: DesignBriefSubmission) {
  const entries = Object.entries(submission.answers).filter(([key, value]) => {
    if (hiddenAnswerKeys.has(key)) return false;
    return Boolean(answerText(value));
  });

  const rank = new Map(answerOrder.map((key, index) => [key, index]));
  return entries.sort(([a], [b]) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999));
}

function BriefList({
  submissions,
  filter,
  counts,
  onFilter,
  onRefresh,
  onOpen,
}: {
  submissions: DesignBriefSubmission[];
  filter: BriefFilter;
  counts: Record<BriefFilter, number>;
  onFilter: (filter: BriefFilter) => void;
  onRefresh: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-accent">Demandes client</p>
          <h1 className="mt-2 font-serif text-3xl text-text-primary">Briefs clients soumis</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Consultez les soumissions une par une. Cliquez sur une ligne pour ouvrir le détail complet.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="h-10 shrink-0 rounded-md border border-border-accent px-4 text-sm font-medium text-text-accent hover:bg-surface-accent-muted"
        >
          Actualiser
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["all", "Tous", counts.all],
            ["new", "En attente", counts.new],
            ["reviewed", "Vus", counts.reviewed],
            ["processed", "Traités", counts.processed],
            ["archived", "Archivés", counts.archived],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            onClick={() => onFilter(value)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
              filter === value
                ? "border-[#854d63] bg-[#854d63] text-white"
                : "border-border-accent text-text-secondary hover:bg-surface-accent-muted hover:text-text-accent",
            )}
          >
            {label} · {count}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border-subtle bg-surface-panel">
        {submissions.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-text-muted">Aucun brief dans cette catégorie.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border-subtle bg-surface-page-muted/70 text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Organisation / projet</th>
                  <th className="px-5 py-3 font-semibold">Type de besoin</th>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Reçu le</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-3 py-3" aria-hidden="true" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="group transition hover:bg-surface-page-muted/60">
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => onOpen(submission.id)}
                        className="text-left font-medium text-text-primary group-hover:text-text-accent"
                      >
                        {displayName(submission)}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{submission.projectType || "—"}</td>
                    <td className="px-5 py-4">
                      <span className="block text-text-secondary">{submission.contactName || "—"}</span>
                      {submission.contactEmail ? (
                        <span className="mt-0.5 block text-xs text-text-muted">{submission.contactEmail}</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-text-secondary">{formatDate(submission.createdAt)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => onOpen(submission.id)}
                        className="flex size-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-accent-muted hover:text-text-accent"
                        aria-label={`Ouvrir le brief ${displayName(submission)}`}
                      >
                        <ChevronRightIcon className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function BriefDetail({
  submission,
  signedUrls,
  onBack,
  onUpdateStatus,
}: {
  submission: DesignBriefSubmission;
  signedUrls: Record<string, string>;
  onBack: () => void;
  onUpdateStatus: (id: string, status: BriefStatus) => void;
}) {
  const answers = orderedAnswers(submission);

  return (
    <>
      <div className="sticky top-0 z-10 -mx-5 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface-page/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary">
          <ArrowLeftIcon className="size-4" />
          Briefs clients
        </button>
        <div className="flex flex-wrap justify-end gap-2">
          {submission.status === "new" ? (
            <button
              type="button"
              onClick={() => onUpdateStatus(submission.id, "reviewed")}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-action-strong px-4 text-sm font-medium text-text-on-strong hover:bg-action-strong-hover"
            >
              <CheckCircleIcon className="size-4" />
              Marquer vu
            </button>
          ) : null}
          {submission.status !== "processed" && submission.status !== "archived" ? (
            <button
              type="button"
              onClick={() => onUpdateStatus(submission.id, "processed")}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-accent px-4 text-sm font-medium text-text-accent hover:bg-surface-accent-muted"
            >
              <CheckCircleIcon className="size-4" />
              Marquer traité
            </button>
          ) : null}
          {submission.status !== "archived" ? (
            <button
              type="button"
              onClick={() => onUpdateStatus(submission.id, "archived")}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-subtle px-4 text-sm font-medium text-text-muted hover:bg-surface-page-muted"
            >
              <ArchiveBoxIcon className="size-4" />
              Archiver
            </button>
          ) : null}
        </div>
      </div>

      <header className="border-b border-border-subtle pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl text-text-primary">{displayName(submission)}</h1>
          <StatusBadge status={submission.status} />
        </div>
        <p className="mt-3 text-sm text-text-muted">
          {submission.projectType || "Type non renseigné"} · Reçu le {formatDate(submission.createdAt)}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {submission.contactName || "Contact non renseigné"}
          {submission.contactEmail ? ` · ${submission.contactEmail}` : ""}
        </p>
      </header>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-accent">Réponses au questionnaire</h2>
          <dl className="mt-4 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-panel">
            {answers.length === 0 ? (
              <p className="px-5 py-8 text-sm text-text-muted">Aucune réponse textuelle enregistrée.</p>
            ) : (
              answers.map(([key, value]) => (
                <div key={key} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-6">
                  <dt className="text-sm font-medium text-text-muted">{answerLabels[key] ?? key}</dt>
                  <dd className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">{answerText(value)}</dd>
                </div>
              ))
            )}
          </dl>
        </section>

        <div className="grid content-start gap-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-accent">Identité visuelle</h2>
            <div className="mt-4 grid gap-4">
              <div className="rounded-xl border border-border-subtle bg-surface-panel p-5">
                <h3 className="text-sm font-semibold text-text-primary">Styles de logo</h3>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {submission.logoStyles.length ? submission.logoStyles.join(", ") : "Non renseigné"}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-panel p-5">
                <h3 className="text-sm font-semibold text-text-primary">Couleurs</h3>
                {submission.colorPalette.length === 0 ? (
                  <p className="mt-3 text-sm text-text-muted">Non renseigné</p>
                ) : (
                  <ul className="mt-4 flex flex-wrap gap-3">
                    {submission.colorPalette.map((color) => (
                      <li key={color} className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-page-muted px-3 py-1.5 text-xs text-text-secondary">
                        <span className="size-5 rounded-full border border-border-subtle" style={{ background: color }} />
                        {color}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-accent">Inspirations et pièces jointes</h2>
            <div className="mt-4 rounded-xl border border-border-subtle bg-surface-panel p-5">
              <div className="grid gap-3 text-sm">
                {submission.inspirationLinks.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-text-accent hover:underline">
                    <LinkIcon className="mt-0.5 size-4 shrink-0" />
                    <span className="break-all">{link}</span>
                  </a>
                ))}
                {submission.assetPaths.map((path, index) => {
                  const label = attachmentNames(submission)[index] ?? path.split("/").pop() ?? path;
                  const signedUrl = signedUrls[path];
                  return signedUrl ? (
                    <a key={path} href={signedUrl} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-text-accent hover:underline">
                      <DocumentTextIcon className="mt-0.5 size-4 shrink-0" />
                      <span className="break-all">{label}</span>
                    </a>
                  ) : (
                    <p key={path} className="flex items-start gap-2 text-text-secondary">
                      <DocumentTextIcon className="mt-0.5 size-4 shrink-0 text-text-accent" />
                      <span className="break-all">{label}</span>
                    </p>
                  );
                })}
                {submission.inspirationLinks.length === 0 && submission.assetPaths.length === 0 ? (
                  <p className="text-text-muted">Aucune inspiration jointe.</p>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
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
  const [pageView, setPageView] = useState<PageView>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredSubmissions = useMemo(
    () => submissions.filter((submission) => filter === "all" || submission.status === filter),
    [filter, submissions],
  );

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedId) ?? null,
    [selectedId, submissions],
  );

  useEffect(() => {
    if (pageView !== "detail" || !selectedSubmission) {
      setSignedUrls({});
      return;
    }

    const sb = getSupabase();
    const paths = selectedSubmission.assetPaths;
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
  }, [pageView, selectedSubmission]);

  const counts = {
    all: submissions.length,
    new: submissions.filter((item) => item.status === "new").length,
    reviewed: submissions.filter((item) => item.status === "reviewed").length,
    processed: submissions.filter((item) => item.status === "processed").length,
    archived: submissions.filter((item) => item.status === "archived").length,
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setPageView("detail");
  };

  const backToList = () => {
    setPageView("list");
    setSelectedId(null);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:py-10">
      {pageView === "list" ? (
        <BriefList
          submissions={filteredSubmissions}
          filter={filter}
          counts={counts}
          onFilter={setFilter}
          onRefresh={onRefresh}
          onOpen={openDetail}
        />
      ) : selectedSubmission ? (
        <BriefDetail
          submission={selectedSubmission}
          signedUrls={signedUrls}
          onBack={backToList}
          onUpdateStatus={onUpdateStatus}
        />
      ) : (
        <div className="py-16 text-center">
          <p className="text-sm text-text-muted">Ce brief n'est plus disponible.</p>
          <button type="button" onClick={backToList} className="mt-4 text-sm text-text-accent hover:underline">
            Retour à la liste
          </button>
        </div>
      )}
    </div>
  );
}
