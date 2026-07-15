/* Hallmark · pre-emit critique: P5 H4 E5 S5 R5 V4 */
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import type { ClientBriefField } from "../../../../shared/client-brief-contract.js";

export type ClientBriefLocale = "fr" | "en";

type PrefillState = { source: string; confirmed: boolean; modified: boolean };

type VisualIdentityQuestionFrameProps = {
  field: ClientBriefField;
  locale: ClientBriefLocale;
  helper: { fr: string; en: string };
  why?: { fr: string; en: string };
  selectionHint?: { fr: string; en: string };
  error?: string;
  prefill?: PrefillState;
  deferred?: boolean;
  onConfirm?: () => void;
  onDefer?: () => void;
  children: ReactNode;
};

const localized = (value: { fr: string; en: string }, locale: ClientBriefLocale) => value[locale];

export function VisualIdentityQuestionFrame({
  field,
  locale,
  helper,
  why: _why,
  selectionHint,
  error,
  prefill,
  deferred,
  onConfirm: _onConfirm,
  onDefer,
  children,
}: VisualIdentityQuestionFrameProps) {
  const errorId = `brief-${field.key}-error`;

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className={`min-w-0 border-y py-7 transition-colors sm:py-8 ${deferred ? "border-[#d7b168]/45 bg-[#f6f2ea]/70 px-4 dark:bg-[#3b3326]/70" : "border-border-subtle"}`}
    >
      <legend className="w-full px-0">
        <span className="block max-w-[46rem] text-[16px] font-medium leading-7 text-text-primary">
          {localized(field.label, locale)}
          {field.required ? (
            <span className="ms-1 text-text-accent" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
      </legend>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-[42rem] text-[13px] leading-6 text-text-secondary">
          {localized(helper, locale)}
        </p>
        {selectionHint ? (
          <p className="shrink-0 text-[11px] font-medium text-text-muted">
            {localized(selectionHint, locale)}
          </p>
        ) : null}
      </div>

      {deferred ? <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#d7b168]/40 bg-[#fff9ea] px-4 py-3 text-[12px] text-[#76521d] dark:bg-[#44361c]"><span><strong>{locale === "fr" ? "À remplir plus tard" : "Complete later"}</strong><br />{locale === "fr" ? "Cette réponse est en pause et restera visible dans le récapitulatif." : "This answer is paused and will remain visible in the review."}</span><button type="button" onClick={onDefer} className="shrink-0 rounded-full border border-current/25 px-3 py-2 font-semibold">{locale === "fr" ? "Répondre maintenant" : "Answer now"}</button></div> : null}

      <div className={`mt-5 min-w-0 ${deferred ? "pointer-events-none select-none opacity-45" : ""}`} aria-disabled={deferred || undefined}>{children}</div>

      {prefill && !prefill.modified ? (
        <div className="mt-5 flex min-h-11 items-start gap-3 border border-[#5f9f80]/35 bg-[#eff9f4] px-4 py-3 text-[12px] leading-5 text-[#357257] dark:bg-[#183a2a]">
          <CheckCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-medium">
              {locale === "fr" ? "Réponse reprise de votre estimation" : "Answer carried over from your estimate"}
            </strong>
            <br />
            {locale === "fr"
              ? "Vérifiez-la ou modifiez-la directement. Cette indication disparaît dès la première modification."
              : "Review it or edit it directly. This note disappears after the first change."}
          </span>
        </div>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="mt-3 text-[12px] leading-5 text-red-700 dark:text-red-300">
          {locale === "fr"
              ? "Choisissez une réponse avant de continuer, ou indiquez que vous souhaitez y revenir."
              : "Choose an answer before continuing, or mark it to revisit later."}
        </p>
      ) : null}

      {onDefer && !deferred ? (
        <button
          type="button"
          onClick={onDefer}
          aria-pressed={deferred}
          className={`mt-4 min-h-11 rounded-full px-1 text-[12px] font-medium underline decoration-dotted underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent ${
            "text-text-muted hover:text-text-primary"
          }`}
        >
          {locale === "fr"
            ? "Je peux retrouver cette information, mais je ne l’ai pas maintenant"
            : "I can find this information, but I do not have it now"}
        </button>
      ) : null}
    </fieldset>
  );
}
