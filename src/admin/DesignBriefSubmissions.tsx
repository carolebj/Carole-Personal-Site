import { CheckCircleIcon, DocumentTextIcon, LinkIcon } from "@heroicons/react/24/outline";
import type { DesignBriefSubmission } from "./data";

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

export default function DesignBriefSubmissions({
  submissions,
  onRefresh,
  onMarkReviewed,
}: {
  submissions: DesignBriefSubmission[];
  onRefresh: () => void;
  onMarkReviewed: (id: string) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-accent">Demandes client</p>
          <h1 className="mt-2 font-serif text-3xl text-text-primary">Briefs design soumis</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Les briefs envoyés depuis la page publique arrivent ici. Les fichiers sont stockés dans le bucket privé Supabase `brief-assets`.
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

      <div className="mt-8 grid gap-4">
        {submissions.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-surface-panel p-8 text-center text-sm text-text-muted">
            Aucun brief soumis pour le moment.
          </div>
        ) : null}

        {submissions.map((submission) => (
          <article
            key={submission.id}
            className="rounded-xl border border-border-subtle bg-surface-panel p-5 shadow-[var(--shadow-panel)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-2xl text-text-primary">
                    {submission.clientName || "Client non renseigné"}
                  </h2>
                  <span className="rounded-full bg-surface-accent-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-accent">
                    {submission.status === "new" ? "Nouveau" : submission.status === "reviewed" ? "Vu" : "Archivé"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-muted">
                  {submission.projectType || "Type non renseigné"} · {formatDate(submission.createdAt)}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {submission.contactName || "Contact non renseigné"}
                  {submission.contactEmail ? ` · ${submission.contactEmail}` : ""}
                </p>
              </div>
              {submission.status === "new" ? (
                <button
                  type="button"
                  onClick={() => onMarkReviewed(submission.id)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-action-strong px-4 text-sm font-medium text-text-on-strong hover:bg-action-strong-hover"
                >
                  <CheckCircleIcon className="size-4" />
                  Marquer comme vu
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <dl className="grid gap-3 rounded-lg border border-border-subtle bg-surface-page-muted p-4">
                {Object.entries(submission.answers).map(([key, value]) => {
                  const text = answerText(value);
                  if (!text) return null;
                  return (
                    <div key={key} className="grid gap-1 text-sm sm:grid-cols-[180px_1fr]">
                      <dt className="font-semibold text-text-muted">{key}</dt>
                      <dd className="whitespace-pre-wrap text-text-secondary">{text}</dd>
                    </div>
                  );
                })}
              </dl>

              <div className="grid content-start gap-3">
                <div className="rounded-lg border border-border-subtle p-4">
                  <h3 className="text-sm font-semibold text-text-primary">Styles de logo</h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {submission.logoStyles.length ? submission.logoStyles.join(", ") : "Non renseigné"}
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle p-4">
                  <h3 className="text-sm font-semibold text-text-primary">Couleurs</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {submission.colorPalette.map((color) => (
                      <span key={color} className="inline-flex items-center gap-2 text-xs text-text-secondary">
                        <span className="size-5 rounded-full border border-border-subtle" style={{ background: color }} />
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border-subtle p-4">
                  <h3 className="text-sm font-semibold text-text-primary">Inspirations</h3>
                  <div className="mt-3 grid gap-2 text-sm">
                    {submission.inspirationLinks.map((link) => (
                      <a key={link} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-text-accent hover:underline">
                        <LinkIcon className="size-4" />
                        {link}
                      </a>
                    ))}
                    {submission.assetPaths.map((path) => (
                      <p key={path} className="flex items-center gap-2 text-text-secondary">
                        <DocumentTextIcon className="size-4 text-text-accent" />
                        {path}
                      </p>
                    ))}
                    {submission.inspirationLinks.length === 0 && submission.assetPaths.length === 0 ? (
                      <p className="text-text-muted">Aucune inspiration jointe.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
