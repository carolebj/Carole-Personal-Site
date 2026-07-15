/* Hallmark · genre: editorial · macrostructure: Narrative Workflow · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  DocumentArrowUpIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  ArrowPathRoundedSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  getClientBriefTemplateBySlug,
  isClientBriefFieldVisible,
  validateClientBriefAnswers,
  type ClientBriefField,
  type ClientBriefTemplate,
  type ClientBriefValue,
} from "../../../shared/client-brief-contract.js";
import {
  loadClientBriefDraft,
  readEstimateContext,
  saveClientBriefDraft,
  type ClientBriefDraft,
  type ClientBriefAsset,
} from "../clientBrief/draft";
import { PAGE_MAIN } from "../components/layout/publicPage";
import { useSeoOverride } from "../seo/SeoOverrideContext";
import { getSupabase } from "../../lib/supabase";
import { DemoScenarioFab } from "../components/DemoScenarioFab";
import { VisualIdentityInspirationField } from "../components/clientBrief/VisualIdentityInspirationField";
import { VisualIdentityLogoStylePicker } from "../components/clientBrief/VisualIdentityLogoStylePicker";
import { VisualIdentityPalettePicker } from "../components/clientBrief/VisualIdentityPalettePicker";
import { OtherServiceBriefExperiences } from "../components/clientBrief/OtherServiceBriefExperiences";
import { GuidedTickSlider } from "../components/forms/GuidedSlider";
import { buildClientBriefDemoAnswers } from "../clientBrief/demoScenarios";

type Locale = "fr" | "en";
type ActionKind = "download" | "submit";
type ActionState = { kind: ActionKind; phase: "email" | "code" | "success"; email: string; name: string; consent: boolean; code: string; idempotencyKey: string; challengeId?: string; downloadUrl?: string };

const emptyAction = (kind: ActionKind): ActionState => ({ kind, phase: "email", email: "", name: "", consent: false, code: "", idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}` });

function localized(value: { fr: string; en: string }, locale: Locale) { return value[locale]; }

function sectionCompletion(template: ClientBriefTemplate, draft: ClientBriefDraft, index: number) {
  const fields = template.sections[index]?.fields.filter((field) => isClientBriefFieldVisible(field, draft.answers)) ?? [];
  const required = fields.filter((field) => field.required);
  const complete = required.filter((field) => {
    const value = draft.answers[field.key];
    const filled = typeof value === "string" ? value.trim().length > 0 : Array.isArray(value) && value.length > 0;
    return filled && !draft.deferred.includes(field.key);
  }).length;
  return { complete, total: required.length, valid: complete === required.length };
}

const SPECIALIZED_BRIEF_SECTIONS: Partial<Record<ClientBriefTemplate["serviceKey"], string>> = {
  "editorial-strategy": "audiences-evidence",
  "digital-communication": "channels-operations",
  "content-creation": "purpose-deliverables",
  "audit-advice": "problem-decision",
};

const SPECIALIZED_BRIEF_FIELDS: Partial<Record<ClientBriefTemplate["serviceKey"], ReadonlySet<string>>> = {
  "editorial-strategy": new Set(["audienceNeeds", "channels"]),
  "digital-communication": new Set(["channels", "operationalTasks"]),
  "content-creation": new Set(["contentFormats", "productionPlan"]),
  "audit-advice": new Set(["observedProblem", "dataAccess"]),
};

function fieldGuidance(field: ClientBriefField, locale: Locale) {
  return field.guidance
    ? localized(field.guidance, locale)
    : locale === "fr"
      ? "Décrivez simplement votre situation actuelle et ce que Carole doit comprendre avant de vous conseiller."
      : "Simply describe your current situation and what Carole needs to understand before advising you.";
}

function FieldInput({ field, value, locale, error, prefill, deferred, onChange, onDefer }: {
  field: ClientBriefField; value?: ClientBriefValue; locale: Locale; error?: string;
  prefill?: { source: string; confirmed: boolean; modified: boolean };
  deferred?: boolean; onChange: (value: ClientBriefValue) => void; onConfirm?: () => void; onDefer?: () => void;
}) {
  const id = `brief-${field.key}`;
  const guidanceId = `${id}-guidance`;
  const usesPillCloud = ["identityDeliverables", "priorityApplications", "rightsSources", "assetSources"].includes(field.key);
  const baseClass = `mt-3 w-full rounded-lg border bg-surface-panel px-4 py-3 text-[14px] text-text-primary outline-none transition focus:border-[#854d63] focus:ring-2 focus:ring-[#854d63]/15 ${error ? "border-red-500" : "border-border-subtle"}`;
  return <div className={`relative rounded-xl border p-5 transition-colors dark:border-white/10 ${deferred ? "border-[#d7b168]/45 bg-[#f6f2ea] dark:bg-[#3b3326]" : "border-border-subtle bg-surface-panel/65 dark:bg-white/5"}`}>
    {deferred ? <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-[#d7b168]/40 bg-[#fff9ea] px-4 py-3 text-[12px] text-[#76521d] dark:bg-[#44361c]"><span><strong>{locale === "fr" ? "À remplir plus tard" : "Complete later"}</strong><br />{locale === "fr" ? "Ce champ est mis en pause. Il devra être complété avant le téléchargement ou l’envoi." : "This field is paused. It must be completed before download or submission."}</span><button type="button" onClick={onDefer} className="shrink-0 rounded-full border border-current/25 px-3 py-2 font-semibold">{locale === "fr" ? "Répondre maintenant" : "Answer now"}</button></div> : null}
    <div className={deferred ? "pointer-events-none select-none opacity-45" : ""} aria-disabled={deferred || undefined}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <label id={`${id}-label`} htmlFor={id} className="max-w-[740px] text-[14px] font-medium leading-6 text-text-primary">{localized(field.label, locale)}{field.required ? <span className="ml-1 text-text-accent" aria-hidden="true">*</span> : null}</label>
      {["multi", "single"].includes(field.type) ? <span className="rounded-full bg-surface-page-muted px-3 py-1 text-[10px] font-semibold text-text-muted">{field.type === "multi" ? (locale === "fr" ? "Plusieurs choix possibles" : "Several choices possible") : (locale === "fr" ? "Un seul choix" : "One choice")}</span> : null}
    </div>
    <p id={guidanceId} className="mt-2 max-w-[700px] text-[12px] leading-5 text-text-secondary">{fieldGuidance(field, locale)}</p>
    {field.type === "textarea" ? <textarea id={id} value={typeof value === "string" ? value : ""} rows={5} maxLength={field.maxLength} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={(event) => onChange(event.target.value)} className={baseClass} /> : null}
    {["text", "date", "url"].includes(field.type) ? <input id={id} type={field.type === "url" ? "url" : field.type === "date" ? "date" : "text"} value={typeof value === "string" ? value : ""} maxLength={field.maxLength} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={(event) => onChange(event.target.value)} className={baseClass} /> : null}
    {field.type === "single" ? <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby={`${id}-label`}>{field.options?.map((option) => { const selected = value === option.value; return <button key={option.value} type="button" role="radio" aria-checked={selected} onClick={() => onChange(option.value)} className={`min-h-12 rounded-lg border px-4 py-3 text-left text-[13px] leading-5 transition ${selected ? "border-[#854d63] bg-[#fff5f8] text-text-primary dark:bg-[#854d63]/20" : "border-border-subtle bg-surface-panel text-text-secondary hover:border-[#854d63]/45"}`}>{localized(option.label, locale)}</button>; })}</div> : null}
    {field.type === "multi" ? <div className={`mt-4 ${usesPillCloud ? "flex flex-wrap gap-2" : "grid gap-3 sm:grid-cols-2"}`}>{field.options?.map((option) => { const entries = Array.isArray(value) ? value : []; const selected = entries.includes(option.value); return <button key={option.value} type="button" aria-pressed={selected} onClick={() => { const next = selected ? entries.filter((entry) => entry !== option.value) : field.maxSelections && entries.length >= field.maxSelections ? entries : [...entries, option.value]; onChange(next); }} className={`flex items-center gap-2 border text-left text-[13px] leading-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent ${usesPillCloud ? "min-h-10 rounded-full px-4 py-2" : "min-h-12 rounded-xl p-4"} ${selected ? "border-[#854d63] bg-[#fff5f8] dark:bg-[#854d63]/20" : "border-border-subtle bg-surface-panel hover:border-[#854d63]/45"}`}><span className={`flex size-5 shrink-0 items-center justify-center rounded-[5px] border ${selected ? "border-[#854d63] bg-[#854d63] text-white" : "border-border-subtle"}`}>{selected ? <CheckCircleIcon className="size-4" /> : null}</span>{localized(option.label, locale)}</button>; })}</div> : null}
    {field.type === "scale" && field.options?.length ? <div className="mt-6"><GuidedTickSlider options={field.options.map((option) => ({ value: option.value, label: localized(option.label, locale), shortLabel: localized(option.label, locale) }))} value={typeof value === "string" ? value : undefined} label={localized(field.label, locale)} onValueChange={onChange} /></div> : null}
    {prefill && !prefill.modified ? <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#5f9f80]/35 bg-[#eff9f4] p-3 text-[12px] leading-5 text-[#357257] dark:bg-[#183a2a]"><CheckCircleIcon className="mt-0.5 size-4 shrink-0" /><span><strong>{locale === "fr" ? "Prérempli depuis votre estimation" : "Prefilled from your estimate"}</strong><br />{locale === "fr" ? "Vérifiez la réponse ou modifiez-la directement. L’indication disparaîtra dès votre première modification." : "Review the answer or edit it directly. This note disappears after your first change."}</span></div> : null}
    {error ? <p id={`${id}-error`} role="alert" className="mt-2 text-[12px] text-red-600">{locale === "fr" ? "Complétez ce champ pour continuer." : "Complete this field to continue."}</p> : null}
    </div>
    {onDefer && !deferred ? <button type="button" onClick={onDefer} className="mt-3 text-[11px] font-medium text-text-muted underline decoration-dotted underline-offset-4 hover:text-text-accent">{locale === "fr" ? "Je peux retrouver cette information, mais je ne l’ai pas maintenant" : "I can find this information, but I do not have it now"}</button> : null}
  </div>;
}

function ActionDialog({ state, locale, busy, error, onChange, onClose, onSubmit }: { state: ActionState; locale: Locale; busy: boolean; error: string; onChange: (patch: Partial<ActionState>) => void; onClose: () => void; onSubmit: () => void }) {
  const isDownload = state.kind === "download";
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>("input, a, button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state.phase]);
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="brief-action-title" className="w-full max-w-[520px] rounded-2xl border border-border-subtle bg-surface-panel p-6 shadow-2xl sm:p-8">
    {state.phase === "success" ? <div className="text-center"><CheckCircleIcon className="mx-auto size-12 text-[#3f8c6b]" /><h2 id="brief-action-title" className="mt-4 font-serif text-3xl">{isDownload ? (locale === "fr" ? "Votre Brief client est prêt" : "Your Client Brief is ready") : (locale === "fr" ? "Brief transmis à Carole" : "Brief sent to Carole")}</h2><p className="mt-3 text-[13px] leading-6 text-text-secondary">{isDownload ? (locale === "fr" ? "Le lien privé reste disponible pendant 15 jours." : "The private link remains available for 15 days.") : (locale === "fr" ? "Carole dispose maintenant de cette base de cadrage et pourra revenir vers vous." : "Carole now has this framing document and can follow up with you.")}</p>{state.downloadUrl ? <a href={state.downloadUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-action-strong px-7 text-[13px] font-semibold text-text-on-strong"><ArrowDownTrayIcon className="size-4" />{locale === "fr" ? "Ouvrir le PDF" : "Open the PDF"}</a> : null}<button type="button" onClick={onClose} className="mt-4 block w-full text-[12px] font-medium text-text-accent">{locale === "fr" ? "Fermer" : "Close"}</button></div> : <>
      <div className="flex size-11 items-center justify-center rounded-full bg-[#fff0ec] text-text-accent">{isDownload ? <EnvelopeIcon className="size-5" /> : <PaperAirplaneIcon className="size-5" />}</div>
      <h2 id="brief-action-title" className="mt-5 font-serif text-3xl">{state.phase === "code" ? (locale === "fr" ? "Vérifiez votre e-mail" : "Check your email") : isDownload ? (locale === "fr" ? "Recevoir le PDF" : "Receive the PDF") : (locale === "fr" ? "Soumettre à Carole" : "Submit to Carole")}</h2>
      <p className="mt-3 text-[13px] leading-6 text-text-secondary">{state.phase === "code" ? (locale === "fr" ? `Saisissez le code à 6 chiffres envoyé à ${state.email}.` : `Enter the 6-digit code sent to ${state.email}.`) : isDownload ? (locale === "fr" ? "L’e-mail est obligatoire uniquement pour générer et télécharger le document. Il sera dédupliqué dans notre base." : "Email is required only to generate and download the document. It will be deduplicated in our database.") : (locale === "fr" ? "Cette action est distincte du téléchargement et autorise Carole à vous contacter au sujet de ce projet." : "This action is separate from download and allows Carole to contact you about this project.")}</p>
      {state.phase === "email" ? <div className="mt-6 grid gap-4">{!isDownload ? <label className="text-[12px] font-medium">{locale === "fr" ? "Votre nom" : "Your name"}<input value={state.name} onChange={(event) => onChange({ name: event.target.value })} className="mt-2 h-12 w-full rounded-lg border border-border-subtle bg-surface-panel px-4 outline-none focus:border-[#854d63]" /></label> : null}<label className="text-[12px] font-medium">E-mail<input type="email" value={state.email} onChange={(event) => onChange({ email: event.target.value })} className="mt-2 h-12 w-full rounded-lg border border-border-subtle bg-surface-panel px-4 outline-none focus:border-[#854d63]" /></label>{isDownload ? <label className="flex items-start gap-3 text-[11px] leading-5 text-text-secondary"><input type="checkbox" checked={state.consent} onChange={(event) => onChange({ consent: event.target.checked })} className="mt-1 accent-[#854d63]" /><span>{locale === "fr" ? "J’accepte de recevoir occasionnellement les offres et actualités de Carole. Facultatif, révocable à tout moment." : "I agree to occasionally receive Carole's offers and updates. Optional and withdrawable at any time."}</span></label> : null}</div> : <label className="mt-6 block text-[12px] font-medium">{locale === "fr" ? "Code de vérification" : "Verification code"}<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={state.code} onChange={(event) => onChange({ code: event.target.value.replace(/\D/g, "") })} className="mt-2 h-14 w-full rounded-lg border border-border-subtle bg-surface-panel px-4 text-center text-xl tracking-[0.5em] outline-none focus:border-[#854d63]" /></label>}
      {error ? <p role="alert" className="mt-4 text-[12px] text-red-600">{error}</p> : null}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="h-11 rounded-full border border-border-subtle px-6 text-[12px] font-semibold">{locale === "fr" ? "Annuler" : "Cancel"}</button><button type="button" disabled={busy} onClick={onSubmit} className="h-11 rounded-full bg-action-strong px-7 text-[12px] font-semibold text-text-on-strong disabled:opacity-50">{busy ? (locale === "fr" ? "Traitement…" : "Processing…") : state.phase === "code" ? (locale === "fr" ? "Vérifier et générer" : "Verify and generate") : isDownload ? (locale === "fr" ? "Envoyer le code" : "Send code") : (locale === "fr" ? "Soumettre le Brief" : "Submit Brief")}</button></div>
    </>}
  </div></div>;
}

function AssetUpload({ assets, locale, busy, error, onFiles, onRemove }: { assets: ClientBriefAsset[]; locale: Locale; busy: boolean; error: string; onFiles: (files: FileList | null) => void; onRemove: (path: string) => void }) {
  return <div className="mt-8 rounded-xl border border-border-subtle bg-surface-panel p-5"><div className="flex items-start gap-3"><DocumentArrowUpIcon className="mt-0.5 size-6 shrink-0 text-text-accent" /><div><h3 className="text-[14px] font-semibold">{locale === "fr" ? "Documents et inspirations utiles" : "Useful documents and references"}</h3><p className="mt-1 text-[11px] leading-5 text-text-muted">{locale === "fr" ? "Ajoutez uniquement les éléments nécessaires au cadrage : ancien document, charte, moodboard ou référence. Ne transmettez aucun mot de passe." : "Add only what is needed for framing: previous document, guide, moodboard or reference. Never share passwords."}</p></div></div><label className="mt-5 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#854d63]/35 bg-surface-page-muted px-4 py-4 text-center"><span className="text-[12px] font-semibold text-text-accent">{busy ? (locale === "fr" ? "Envoi sécurisé…" : "Secure upload…") : (locale === "fr" ? "Ajouter des fichiers" : "Add files")}</span><span className="mt-1 text-[10px] text-text-muted">PNG, JPG, WebP, GIF ou PDF · 5 Mo maximum · 8 fichiers</span><input type="file" multiple disabled={busy || assets.length >= 8} accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" className="sr-only" onChange={(event) => { onFiles(event.target.files); event.currentTarget.value = ""; }} /></label>{assets.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{assets.map((asset) => <div key={asset.path} className="flex items-center gap-3 rounded-lg border border-border-subtle p-3"><DocumentCheckIcon className="size-5 shrink-0 text-[#3f8c6b]" /><span className="min-w-0 flex-1 truncate text-[11px]">{asset.name}</span><button type="button" onClick={() => onRemove(asset.path)} aria-label={locale === "fr" ? "Retirer le fichier" : "Remove file"} className="rounded-full p-1 text-text-muted hover:text-text-accent"><XMarkIcon className="size-4" /></button></div>)}</div> : null}{error ? <p role="alert" className="mt-3 text-[11px] text-red-600">{error}</p> : null}</div>;
}

export default function ClientBrief() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const template = getClientBriefTemplateBySlug(slug);
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language.startsWith("en") ? "en" : "fr";
  const rawEstimateContext = useMemo(() => readEstimateContext(), []);
  const estimateContext = useMemo(() => template && searchParams.get("source") === "estimate" && rawEstimateContext?.serviceIds.includes(template.serviceKey as never) ? rawEstimateContext : null, [rawEstimateContext, searchParams, template]);
  const [draft, setDraft] = useState<ClientBriefDraft | null>(() => template ? loadClientBriefDraft(template, estimateContext) : null);
  const [saved, setSaved] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [action, setAction] = useState<ActionState | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [assetBusy, setAssetBusy] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const realDraftBeforeDemo = useRef<ClientBriefDraft | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useSeoOverride(useMemo(() => template ? { title: `${localized(template.title, locale)} | Carole Tonoukouen`, description: localized(template.intro, locale) } : null, [locale, template]));

  useEffect(() => {
    if (!draft) return;
    if (demoMode) {
      setSaved(true);
      return;
    }
    setSaved(false);
    const timeout = window.setTimeout(() => setSaved(saveClientBriefDraft(draft)), 350);
    return () => window.clearTimeout(timeout);
  }, [demoMode, draft]);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "smooth" }); }, [draft?.sectionIndex]);

  if (!template || !draft) return <Navigate to="/services" replace />;
  const reviewIndex = template.sections.length;
  const onReview = draft.sectionIndex === reviewIndex;
  const requiredFields = template.sections.flatMap((section) => section.fields).filter((field) => field.required && isClientBriefFieldVisible(field, draft.answers));
  const completedFields = requiredFields.filter((field) => { const value = draft.answers[field.key]; return !draft.deferred.includes(field.key) && (typeof value === "string" ? value.trim() : value?.length); });
  const progress = requiredFields.length ? Math.round((completedFields.length / requiredFields.length) * 100) : 0;
  const globalValidation = validateClientBriefAnswers(template, draft.answers);
  const requiredDeferred = requiredFields.filter((field) => draft.deferred.includes(field.key));
  const canFinalize = globalValidation.valid && requiredDeferred.length === 0;

  const updateAnswer = (fieldKey: string, value: ClientBriefValue) => setDraft((current) => {
    if (!current) return current;
    const answers = { ...current.answers, [fieldKey]: value };
    for (const field of template.sections.flatMap((section) => section.fields)) if (!isClientBriefFieldVisible(field, answers)) delete answers[field.key];
    const prefill = Object.fromEntries(Object.entries(current.prefill).filter(([key]) => key !== fieldKey && Object.prototype.hasOwnProperty.call(answers, key)));
    return { ...current, answers, deferred: current.deferred.filter((key) => key !== fieldKey && Object.prototype.hasOwnProperty.call(answers, key)), prefill };
  });
  const toggleDeferred = (fieldKey: string) => {
    setErrors((current) => { const next = { ...current }; delete next[fieldKey]; return next; });
    setDraft((current) => current ? { ...current, deferred: current.deferred.includes(fieldKey) ? current.deferred.filter((key) => key !== fieldKey) : [...current.deferred, fieldKey] } : current);
  };
  const goNext = () => {
    if (onReview) return;
    const visible = template.sections[draft.sectionIndex].fields.filter((field) => isClientBriefFieldVisible(field, draft.answers));
    const nextErrors: Record<string, string> = {};
    for (const field of visible) {
      const value = draft.answers[field.key];
      if (draft.deferred.includes(field.key)) continue;
      if (field.required && (!value || (Array.isArray(value) && value.length === 0))) nextErrors[field.key] = "required";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setDraft({ ...draft, sectionIndex: Math.min(reviewIndex, draft.sectionIndex + 1) });
  };
  const openAction = (kind: ActionKind) => {
    if (!canFinalize) { setDraft({ ...draft, sectionIndex: reviewIndex }); return; }
    setAction(emptyAction(kind)); setActionError("");
  };
  const runAction = async () => {
    if (!action) return;
    if (demoMode) {
      setAction({ ...action, phase: "success", downloadUrl: action.kind === "download" ? "#demo-pdf" : undefined });
      return;
    }
    setActionBusy(true); setActionError("");
    try {
      const requestBody = action.kind === "download" && action.phase === "code"
        ? { action: "confirm-export", serviceKey: template.serviceKey, locale, sessionToken: draft.sessionToken, challengeId: action.challengeId, code: action.code }
        : { action: action.kind === "download" ? "request-export" : "submit", serviceKey: template.serviceKey, locale, sessionToken: draft.sessionToken, answers: draft.answers, prefill: draft.prefill, assets: draft.assets, name: action.name, email: action.email, commercialConsent: action.kind === "download" && action.consent, idempotencyKey: action.idempotencyKey, estimate: estimateContext ? { id: estimateContext.estimateId, token: estimateContext.estimateToken } : undefined };
      const response = await fetch("/api/client-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "request_failed");
      if (action.kind === "download" && action.phase === "email") {
        setAction({ ...action, phase: "code", challengeId: body.challengeId });
      } else {
        setDraft((current) => current ? { ...current, outcome: action.kind === "download" ? "exported" : "submitted" } : current);
        setAction({ ...action, phase: "success", downloadUrl: body.downloadUrl });
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : "request_failed";
      setActionError(locale === "fr" ? ({ invalid_email: "Saisissez une adresse e-mail valide.", invalid_code: "Le code est invalide ou expiré.", delivery_failed: "Le code n’a pas pu être envoyé. Réessayez.", brief_service_unavailable: "Le service est temporairement indisponible.", invalid_fields: "Complétez votre nom et votre e-mail." }[code] ?? "Une erreur est survenue. Réessayez.") : "Something went wrong. Please try again.");
    } finally { setActionBusy(false); }
  };
  const uploadAssets = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = [...files].slice(0, Math.max(0, 8 - draft.assets.length));
    if (selected.some((file) => file.size > 5_242_880)) { setAssetError(locale === "fr" ? "Chaque fichier doit peser au maximum 5 Mo." : "Each file must be no larger than 5 MB."); return; }
    const sb = getSupabase();
    if (!sb) { setAssetError(locale === "fr" ? "Le stockage sécurisé n’est pas configuré dans cet environnement." : "Secure storage is not configured in this environment."); return; }
    setAssetBusy(true); setAssetError("");
    try {
      const uploaded: ClientBriefAsset[] = [];
      for (const file of selected) {
        const response = await fetch("/api/client-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "prepare-asset", serviceKey: template.serviceKey, locale, sessionToken: draft.sessionToken, file: { name: file.name, mimeType: file.type, size: file.size }, estimate: estimateContext ? { id: estimateContext.estimateId, token: estimateContext.estimateToken } : undefined }) });
        const prepared = await response.json();
        if (!response.ok || !prepared.path || !prepared.token) throw new Error("prepare_failed");
        const { error } = await sb.storage.from("brief-assets").uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: file.type });
        if (error) throw error;
        uploaded.push({ path: prepared.path, name: file.name, mimeType: file.type, size: file.size });
      }
      setDraft((current) => current ? { ...current, assets: [...current.assets, ...uploaded] } : current);
    } catch { setAssetError(locale === "fr" ? "Un fichier n’a pas pu être envoyé. Réessayez." : "A file could not be uploaded. Please try again."); }
    finally { setAssetBusy(false); }
  };
  const applyDemo = (scenario: string) => {
    if (!realDraftBeforeDemo.current) realDraftBeforeDemo.current = draft;
    const partial = scenario === "partial";
    const answers = buildClientBriefDemoAnswers(template, locale, partial);
    setDemoMode(true);
    setDraft({ ...draft, answers, prefill: {}, deferred: [], assets: [], sectionIndex: scenario === "review" ? template.sections.length : scenario === "creative" ? Math.max(0, template.sections.findIndex((section) => section.key === "creative-direction")) : 0, outcome: undefined });
  };
  const exitDemo = () => {
    setDraft(realDraftBeforeDemo.current ?? loadClientBriefDraft(template, estimateContext));
    realDraftBeforeDemo.current = null;
    setDemoMode(false);
    setAction(null);
  };

  return <main className={`${PAGE_MAIN} bg-surface-page pb-24 text-text-primary`}>
    <div className="border-b border-border-subtle bg-surface-panel/60"><div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8"><Link to={`/services/${locale === "en" ? template.serviceKey : template.slug}`} className="inline-flex items-center gap-2 text-[12px] font-semibold text-text-accent"><ArrowLeftIcon className="size-4" />{locale === "fr" ? "Retour au service" : "Back to service"}</Link><div className="flex items-center gap-3 text-[11px] text-text-muted"><CheckCircleIcon className={`size-4 ${saved ? "text-[#3f8c6b]" : "text-text-muted"}`} />{saved ? (locale === "fr" ? "Brouillon enregistré sur cet appareil" : "Draft saved on this device") : (locale === "fr" ? "Enregistrement…" : "Saving…")}</div></div></div>
    <div className="mx-auto grid w-full min-w-0 max-w-[1240px] xl:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="min-w-0 overflow-hidden border-b border-border-subtle px-5 py-7 sm:px-8 xl:sticky xl:top-[88px] xl:h-[calc(100dvh-88px)] xl:overflow-y-auto xl:border-b-0 xl:border-r xl:px-7 xl:py-10">
        <p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{locale === "fr" ? "BRIEF CLIENT" : "CLIENT BRIEF"}</p><h1 className="mt-3 font-serif text-[25px] leading-8">{localized(template.shortTitle, locale)}</h1>
        <div className="mt-6 flex items-end justify-between"><span className="font-serif text-3xl">{progress}%</span><span className="text-[11px] text-text-muted">{completedFields.length}/{requiredFields.length}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-subtle"><span className="block h-full rounded-full bg-[#854d63] transition-[width]" style={{ width: `${progress}%` }} /></div>
        <nav className="mt-7 w-full max-w-full overflow-x-auto xl:overflow-visible" aria-label={locale === "fr" ? "Étapes du Brief client" : "Client Brief steps"}><ol className="flex w-max min-w-max gap-2 xl:grid xl:w-auto xl:min-w-0">{template.sections.map((section, index) => { const completion = sectionCompletion(template, draft, index); const current = draft.sectionIndex === index; return <li key={section.key}><button type="button" onClick={() => setDraft({ ...draft, sectionIndex: index })} aria-current={current ? "step" : undefined} className={`flex h-full min-w-[180px] items-center gap-3 rounded-lg border px-3 py-3 text-left text-[12px] transition xl:min-w-0 xl:w-full ${current ? "border-[#854d63] bg-[#fff5f8] text-text-primary dark:bg-[#854d63]/20" : "border-transparent text-text-secondary hover:bg-surface-panel"}`}><span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[10px] ${completion.valid ? "border-[#4f9673] bg-[#4f9673] text-white" : current ? "border-[#854d63] bg-[#854d63] text-white" : "border-border-subtle"}`}>{completion.valid ? <CheckCircleIcon className="size-4" /> : index + 1}</span><span>{localized(section.title, locale)}</span></button></li>; })}<li><button type="button" onClick={() => setDraft({ ...draft, sectionIndex: reviewIndex })} className={`flex h-full min-w-[180px] items-center gap-3 rounded-lg border px-3 py-3 text-left text-[12px] transition xl:min-w-0 xl:w-full ${onReview ? "border-[#854d63] bg-[#fff5f8] dark:bg-[#854d63]/20" : "border-transparent text-text-secondary hover:bg-surface-panel"}`}><span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-subtle"><DocumentCheckIcon className="size-4" /></span>{locale === "fr" ? "Récapitulatif" : "Review"}</button></li></ol></nav>
      </aside>
      <section className="min-w-0 px-5 py-10 sm:px-8 lg:px-14 lg:py-14">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={onReview ? "review" : `section-${draft.sectionIndex}`}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, filter: "blur(3px)" }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
        {onReview ? <><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{locale === "fr" ? "VÉRIFICATION" : "REVIEW"}</p><h2 ref={headingRef} tabIndex={-1} className="mt-4 font-serif text-[clamp(2.4rem,5vw,4rem)] leading-[1.02] outline-none">{canFinalize ? (locale === "fr" ? "Votre Brief client est prêt." : "Your Client Brief is ready.") : (locale === "fr" ? "Quelques éléments restent à préciser." : "A few items still need attention.")}</h2><p className="mt-5 max-w-[720px] text-[15px] leading-7 text-text-secondary">{locale === "fr" ? "Ce document sert de première base de cadrage. Il peut être utilisé avec Carole ou avec tout autre prestataire et pourra être complété par une réunion." : "This document is a first framing basis. It can be used with Carole or any other provider and may be completed by a meeting."}</p>
          {!canFinalize ? <div className="mt-8 rounded-xl border border-[#d7b168]/45 bg-[#fff9ea] p-5 dark:bg-[#44361c]"><p className="text-[13px] font-semibold">{locale === "fr" ? `${requiredFields.length - completedFields.length} réponse(s) obligatoire(s) à compléter` : `${requiredFields.length - completedFields.length} required answer(s) to complete`}</p>{requiredDeferred.length ? <p className="mt-2 text-[12px] leading-5 text-text-secondary">{locale === "fr" ? `${requiredDeferred.length} réponse(s) ont été mises de côté. Ouvrez la section concernée puis choisissez « Répondre maintenant ».` : `${requiredDeferred.length} answer(s) were set aside. Open the relevant section, then choose “Answer now”.`}</p> : null}<div className="mt-4 flex flex-wrap gap-2">{template.sections.map((section, index) => !sectionCompletion(template, draft, index).valid ? <button key={section.key} type="button" onClick={() => setDraft({ ...draft, sectionIndex: index })} className="rounded-full border border-[#b58b3e]/35 px-4 py-2 text-[11px] font-semibold">{localized(section.title, locale)}</button> : null)}</div></div> : <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-border-subtle bg-surface-panel p-5"><DocumentCheckIcon className="size-6 text-text-accent" /><p className="mt-3 text-[13px] font-semibold">{locale === "fr" ? "Réponses validées" : "Answers validated"}</p></div><div className="rounded-xl border border-border-subtle bg-surface-panel p-5"><LockClosedIcon className="size-6 text-text-accent" /><p className="mt-3 text-[13px] font-semibold">{locale === "fr" ? "PDF privé 15 jours" : "Private PDF for 15 days"}</p></div><div className="rounded-xl border border-border-subtle bg-surface-panel p-5"><ArrowPathRoundedSquareIcon className="size-6 text-text-accent" /><p className="mt-3 text-[13px] font-semibold">{locale === "fr" ? "Réutilisable librement" : "Freely reusable"}</p></div></div>}
          <AssetUpload assets={draft.assets} locale={locale} busy={assetBusy} error={assetError} onFiles={uploadAssets} onRemove={(path) => setDraft({ ...draft, assets: draft.assets.filter((asset) => asset.path !== path) })} />
          <div className="mt-9 grid gap-4 sm:grid-cols-2"><button type="button" disabled={!canFinalize} onClick={() => openAction("download")} className="flex min-h-28 items-center gap-4 rounded-xl bg-action-strong p-5 text-left text-text-on-strong disabled:cursor-not-allowed disabled:opacity-40"><ArrowDownTrayIcon className="size-7 shrink-0" /><span><strong className="block text-[14px]">{locale === "fr" ? "Télécharger mon Brief client" : "Download my Client Brief"}</strong><span className="mt-1 block text-[11px] opacity-80">{locale === "fr" ? "E-mail vérifié requis à cette étape" : "Verified email required at this step"}</span></span></button><button type="button" disabled={!canFinalize} onClick={() => openAction("submit")} className="flex min-h-28 items-center gap-4 rounded-xl border border-[#854d63] bg-surface-panel p-5 text-left text-text-primary disabled:cursor-not-allowed disabled:opacity-40"><PaperAirplaneIcon className="size-7 shrink-0 text-text-accent" /><span><strong className="block text-[14px]">{locale === "fr" ? "Soumettre ce Brief à Carole" : "Submit this Brief to Carole"}</strong><span className="mt-1 block text-[11px] text-text-muted">{locale === "fr" ? "Action distincte du téléchargement" : "Separate from download"}</span></span></button></div>
          <p className="mt-7 flex gap-2 text-[11px] leading-5 text-text-muted"><InformationCircleIcon className="mt-0.5 size-4 shrink-0" />{locale === "fr" ? "Le PDF est un document de cadrage : il ne constitue ni un devis, ni un engagement contractuel." : "The PDF is a framing document: it is neither a quote nor a contractual commitment."}</p>
        </> : (() => {
          const section = template.sections[draft.sectionIndex];
          const removeAsset = (path: string) => setDraft({
            ...draft,
            assets: draft.assets.filter((asset) => asset.path !== path),
          });
          return <>
            <p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{locale === "fr" ? `SECTION ${draft.sectionIndex + 1} SUR ${template.sections.length}` : `SECTION ${draft.sectionIndex + 1} OF ${template.sections.length}`}</p>
            <h2 ref={headingRef} tabIndex={-1} className="mt-4 max-w-[800px] font-serif text-[clamp(2.4rem,5vw,4rem)] leading-[1.02] outline-none">{localized(section.title, locale)}</h2>
            <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-text-secondary">{localized(section.description, locale)}</p>
            {draft.sectionIndex === 0 && Object.values(draft.prefill).some((item) => !item.modified) ? <div className="mt-6 flex gap-3 rounded-xl border border-[#5f9f80]/30 bg-[#eff9f4] p-4 text-[12px] leading-5 text-[#357257] dark:bg-[#183a2a]"><InformationCircleIcon className="size-5 shrink-0" /><p>{locale === "fr" ? "Quelques réponses de cette estimation ont été reprises pour vous faire gagner du temps. Vous pouvez les conserver ou les modifier directement." : "A few answers from this estimate were reused to save you time. You can keep or edit them directly."}</p></div> : null}
            <div className="mt-8 grid gap-4">
              {SPECIALIZED_BRIEF_SECTIONS[template.serviceKey] === section.key ? <OtherServiceBriefExperiences serviceId={template.serviceKey} locale={locale} answers={draft.answers} onAnswer={updateAnswer} /> : null}
              {section.fields.filter((field) => isClientBriefFieldVisible(field, draft.answers) && !SPECIALIZED_BRIEF_FIELDS[template.serviceKey]?.has(field.key)).map((field) => {
                const commonProps = {
                  field,
                  value: draft.answers[field.key],
                  locale,
                  error: errors[field.key],
                  prefill: draft.prefill[field.key],
                  deferred: draft.deferred.includes(field.key),
                  onChange: (value: ClientBriefValue) => updateAnswer(field.key, value),
                  onDefer: () => toggleDeferred(field.key),
                };

                if (template.serviceKey === "visual-identity" && field.key === "logoStyles") {
                  return <VisualIdentityLogoStylePicker key={field.key} {...commonProps} />;
                }
                if (template.serviceKey === "visual-identity" && field.key === "colorPalette") {
                  return <VisualIdentityPalettePicker key={field.key} {...commonProps} />;
                }
                if (template.serviceKey === "visual-identity" && field.key === "inspirationLinks") {
                  return <VisualIdentityInspirationField
                    key={field.key}
                    {...commonProps}
                    assets={draft.assets}
                    assetBusy={assetBusy}
                    assetError={assetError}
                    onFiles={uploadAssets}
                    onRemoveAsset={removeAsset}
                  />;
                }
                return <FieldInput key={field.key} {...commonProps} />;
              })}
            </div>
          </>;
        })()}
          </motion.div>
        </AnimatePresence>
        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border-subtle pt-7 sm:flex-row sm:justify-between"><button type="button" disabled={draft.sectionIndex === 0} onClick={() => setDraft({ ...draft, sectionIndex: Math.max(0, draft.sectionIndex - 1) })} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border-subtle px-7 text-[13px] font-semibold disabled:opacity-35"><ArrowLeftIcon className="size-4" />{locale === "fr" ? "Retour" : "Back"}</button>{!onReview ? <button type="button" onClick={goNext} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-action-strong px-8 text-[13px] font-semibold text-text-on-strong">{draft.sectionIndex === template.sections.length - 1 ? (locale === "fr" ? "Vérifier le Brief" : "Review Brief") : (locale === "fr" ? "Continuer" : "Continue")}<ArrowRightIcon className="size-4" /></button> : null}</div>
      </section>
    </div>
    {action ? <ActionDialog state={action} locale={locale} busy={actionBusy} error={actionError} onChange={(patch) => setAction({ ...action, ...patch })} onClose={() => setAction(null)} onSubmit={runAction} /> : null}
    <DemoScenarioFab isEnglish={locale === "en"} onApply={applyDemo} onExit={demoMode ? exitDemo : undefined} scenarios={locale === "fr" ? [
      { id: "partial", title: "Brief partiellement rempli", description: "Voir les sections avec environ la moitié des réponses." },
      { id: "complete", title: "Brief complet", description: "Parcourir toutes les sections avec des données fictives." },
      { id: "review", title: "Récapitulatif prêt", description: "Aller directement à la vérification et tester les actions finales." },
      ...(template.serviceKey === "visual-identity" ? [{ id: "creative", title: "Direction créative", description: "Voir les styles de logo, la palette et les inspirations." }] : []),
    ] : [
      { id: "partial", title: "Partially completed brief", description: "See the sections with roughly half the answers." },
      { id: "complete", title: "Complete brief", description: "Browse all sections with fictional data." },
      { id: "review", title: "Ready for review", description: "Jump to review and test the final actions." },
      ...(template.serviceKey === "visual-identity" ? [{ id: "creative", title: "Creative direction", description: "See logo styles, colour palette and references." }] : []),
    ]} />
  </main>;
}
