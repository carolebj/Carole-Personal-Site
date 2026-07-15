/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import {
  DocumentCheckIcon,
  DocumentArrowUpIcon,
  LinkIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import type { ClientBriefField, ClientBriefValue } from "../../../../shared/client-brief-contract.js";
import type { ClientBriefAsset } from "../../clientBrief/draft";
import { VisualIdentityQuestionFrame, type ClientBriefLocale } from "./VisualIdentityQuestionFrame";

type LocalPreview = {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
};

type VisualIdentityInspirationFieldProps = {
  field: ClientBriefField;
  value?: ClientBriefValue;
  locale: ClientBriefLocale;
  error?: string;
  prefill?: { source: string; confirmed: boolean; modified: boolean };
  deferred?: boolean;
  assets: ClientBriefAsset[];
  assetBusy: boolean;
  assetError: string;
  onChange: (value: ClientBriefValue) => void;
  onConfirm?: () => void;
  onDefer?: () => void;
  onFiles: (files: FileList | null) => Promise<void>;
  onRemoveAsset: (path: string) => void;
};

const ACCEPTED_FILES = "image/png,image/jpeg,image/webp,image/gif,application/pdf";

export function VisualIdentityInspirationField({
  field,
  value,
  locale,
  error,
  prefill,
  deferred,
  assets,
  assetBusy,
  assetError,
  onChange,
  onConfirm,
  onDefer,
  onFiles,
  onRemoveAsset,
}: VisualIdentityInspirationFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<LocalPreview[]>([]);
  const [previews, setPreviews] = useState<LocalPreview[]>([]);
  const fieldId = `brief-${field.key}`;

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => () => {
    previewsRef.current.forEach((preview) => {
      if (preview.url) URL.revokeObjectURL(preview.url);
    });
  }, []);

  const selectFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const available = Math.max(0, 8 - assets.length);
    const selected = [...files].slice(0, available);
    const additions = selected.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID?.() ?? Date.now()}`,
      name: file.name,
      mimeType: file.type,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setPreviews((current) => [...current, ...additions]);
    await onFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removePreview = (id: string) => {
    setPreviews((current) => current.filter((preview) => {
      if (preview.id !== id) return true;
      if (preview.url) URL.revokeObjectURL(preview.url);
      return false;
    }));
  };

  return (
    <VisualIdentityQuestionFrame
      field={field}
      locale={locale}
      helper={{
        fr: "Partagez ce qui vous attire, même sans connaître le terme graphique : sites, comptes, captures, photos, logos ou ambiances. Dites surtout ce que vous aimez dans chaque référence.",
        en: "Share what appeals to you, even if you do not know the design term: websites, accounts, screenshots, photos, logos or moods. Most importantly, say what you like in each reference.",
      }}
      why={field.why ?? {
        fr: "Les références servent à comprendre votre sensibilité, pas à copier un travail existant.",
        en: "References help clarify your taste; they are not material to copy.",
      }}
      selectionHint={{
        fr: `${assets.length} fichier${assets.length > 1 ? "s" : ""} sur 8`,
        en: `${assets.length} of 8 files`,
      }}
      error={error}
      prefill={prefill}
      deferred={deferred}
      onConfirm={onConfirm}
      onDefer={onDefer}
    >
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <label htmlFor={fieldId} className="min-w-0">
          <span className="flex items-center gap-2 text-[12px] font-medium text-text-primary">
            <LinkIcon className="size-4 text-text-accent" aria-hidden="true" />
            {locale === "fr" ? "Liens et notes d’inspiration" : "Inspiration links and notes"}
          </span>
          <textarea
            id={fieldId}
            rows={7}
            maxLength={field.maxLength}
            value={typeof value === "string" ? value : ""}
            aria-invalid={Boolean(error)}
            placeholder={locale === "fr"
              ? "Ex. https://… — J’aime la simplicité et les couleurs calmes.\nEx. @compte — La marque paraît chaleureuse et proche."
              : "E.g. https://… — I like the simplicity and calm colours.\nE.g. @account — The brand feels warm and approachable."}
            onChange={(event) => onChange(event.target.value)}
            className="mt-3 w-full resize-y border border-border-subtle bg-surface-panel px-4 py-3 text-[14px] leading-6 text-text-primary outline-none placeholder:text-text-muted focus-visible:border-border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent"
          />
          <span className="mt-2 block text-[11px] leading-5 text-text-muted">
            {locale === "fr" ? "Un lien par ligne est idéal. Ajoutez quelques mots sur ce qui vous parle." : "One link per line works best. Add a few words about what appeals to you."}
          </span>
        </label>

        <div className="min-w-0 border border-border-subtle bg-surface-page-muted p-4">
          <PhotoIcon className="size-6 text-text-accent" aria-hidden="true" />
          <p className="mt-3 text-[13px] font-medium leading-5 text-text-primary">
            {locale === "fr" ? "Ajouter vos propres références" : "Add your own references"}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-text-muted">
            {locale === "fr" ? "Images ou PDF, 5 Mo maximum par fichier. Jusqu’à 8 fichiers." : "Images or PDFs, up to 5 MB each. Maximum 8 files."}
          </p>
          <label className={`mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border-accent px-4 text-[12px] font-medium text-text-accent focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-text-accent ${assetBusy || assets.length >= 8 ? "cursor-not-allowed opacity-50" : "hover:bg-surface-accent-muted"}`}>
            <DocumentArrowUpIcon className="size-4" aria-hidden="true" />
            {assetBusy ? (locale === "fr" ? "Envoi sécurisé…" : "Secure upload…") : (locale === "fr" ? "Choisir des fichiers" : "Choose files")}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FILES}
              multiple
              disabled={assetBusy || assets.length >= 8}
              onChange={(event) => void selectFiles(event.target.files)}
              className="sr-only"
            />
          </label>
          {assetError ? <p role="alert" className="mt-3 text-[11px] leading-5 text-red-700 dark:text-red-300">{assetError}</p> : null}
        </div>
      </div>

      {previews.length || assets.length ? (
        <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {previews.map((preview) => {
            const uploaded = assets.find((asset) => asset.name === preview.name);
            return (
              <article key={preview.id} className="group min-w-0 border border-border-subtle bg-surface-panel p-3">
                <div className="relative flex h-32 items-center justify-center overflow-hidden bg-surface-page-muted">
                  {preview.url ? <img src={preview.url} alt="" className="size-full object-cover" /> : <DocumentCheckIcon className="size-9 text-text-accent" aria-hidden="true" />}
                  <button
                    type="button"
                    onClick={() => {
                      if (uploaded) onRemoveAsset(uploaded.path);
                      removePreview(preview.id);
                    }}
                    className="absolute right-2 top-2 flex size-10 items-center justify-center rounded-full bg-surface-panel/95 text-text-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent"
                    aria-label={locale === "fr" ? `Retirer ${preview.name}` : `Remove ${preview.name}`}
                  >
                    <XMarkIcon className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-3 truncate text-[11px] font-medium text-text-primary">{preview.name}</p>
                <p className="mt-1 text-[10px] text-text-muted">
                  {uploaded ? (locale === "fr" ? "Ajouté au brief" : "Added to brief") : (assetBusy ? (locale === "fr" ? "Envoi en cours" : "Uploading") : (locale === "fr" ? "Aperçu local" : "Local preview"))}
                </p>
              </article>
            );
          })}
          {assets.filter((asset) => !previews.some((preview) => preview.name === asset.name)).map((asset) => (
            <article key={asset.path} className="flex min-w-0 items-center gap-3 border border-border-subtle bg-surface-panel p-3">
              <span className="flex size-12 shrink-0 items-center justify-center bg-surface-page-muted">
                <DocumentCheckIcon className="size-5 text-text-accent" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-text-primary">{asset.name}</span>
              <button type="button" onClick={() => onRemoveAsset(asset.path)} className="flex size-10 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-page-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent" aria-label={locale === "fr" ? `Retirer ${asset.name}` : `Remove ${asset.name}`}>
                <XMarkIcon className="size-4" aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </VisualIdentityQuestionFrame>
  );
}
