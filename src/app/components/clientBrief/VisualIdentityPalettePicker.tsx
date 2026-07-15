/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */
import { EyeDropperIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import type { ClientBriefField, ClientBriefValue } from "../../../../shared/client-brief-contract.js";
import { VisualIdentityQuestionFrame, type ClientBriefLocale } from "./VisualIdentityQuestionFrame";

type EyeDropperConstructor = new () => { open: () => Promise<{ sRGBHex: string }> };

type VisualIdentityPalettePickerProps = {
  field: ClientBriefField;
  value?: ClientBriefValue;
  locale: ClientBriefLocale;
  error?: string;
  prefill?: { source: string; confirmed: boolean; modified: boolean };
  deferred?: boolean;
  onChange: (value: ClientBriefValue) => void;
  onConfirm?: () => void;
  onDefer?: () => void;
};

type ColorEntryProps = {
  color: string;
  index: number;
  locale: ClientBriefLocale;
  onChange: (color: string) => void;
  onRemove: () => void;
};

const HEX_COLOR = /^#[0-9A-F]{6}$/i;

function ColorEntry({ color, index, locale, onChange, onRemove }: ColorEntryProps) {
  const [hex, setHex] = useState(color.toUpperCase());
  const [invalid, setInvalid] = useState(false);
  const EyeDropper = typeof window === "undefined"
    ? undefined
    : (window as typeof window & { EyeDropper?: EyeDropperConstructor }).EyeDropper;

  useEffect(() => {
    setHex(color.toUpperCase());
    setInvalid(false);
  }, [color]);

  const commitHex = () => {
    const normalized = hex.toUpperCase();
    if (!HEX_COLOR.test(normalized)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onChange(normalized);
  };

  const pickFromScreen = async () => {
    if (!EyeDropper) return;
    try {
      const result = await new EyeDropper().open();
      onChange(result.sRGBHex.toUpperCase());
    } catch {
      // Closing the browser picker is a normal cancellation, not an error state.
    }
  };

  return (
    <div className="min-w-0 border border-border-subtle bg-surface-panel p-3">
      <div className="flex min-w-0 items-center gap-3">
        <label className="relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border-subtle">
          <span className="sr-only">
            {locale === "fr" ? `Modifier la couleur ${index + 1}` : `Edit colour ${index + 1}`}
          </span>
          <span className="absolute inset-0" style={{ backgroundColor: color }} aria-hidden="true" />
          <input
            type="color"
            value={color}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>

        <label className="min-w-0 flex-1 text-[11px] font-medium text-text-muted">
          {locale === "fr" ? "Code couleur" : "Colour code"}
          <input
            value={hex}
            maxLength={7}
            inputMode="text"
            spellCheck={false}
            aria-invalid={invalid}
            onChange={(event) => setHex(event.target.value.toUpperCase())}
            onBlur={commitHex}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitHex();
              }
            }}
            className={`mt-1 h-11 w-full min-w-0 border bg-surface-panel px-3 text-[13px] font-medium uppercase text-text-primary outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent ${invalid ? "border-red-600" : "border-border-subtle"}`}
          />
        </label>

        <button
          type="button"
          onClick={onRemove}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-page-muted hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent"
          aria-label={locale === "fr" ? `Retirer la couleur ${index + 1}` : `Remove colour ${index + 1}`}
        >
          <TrashIcon className="size-5" aria-hidden="true" />
        </button>
      </div>

      {invalid ? (
        <p role="alert" className="mt-2 text-[11px] leading-5 text-red-700 dark:text-red-300">
          {locale === "fr" ? "Utilisez un code comme #854D63." : "Use a code such as #854D63."}
        </p>
      ) : null}

      {EyeDropper ? (
        <button
          type="button"
          onClick={() => void pickFromScreen()}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-[12px] font-medium text-text-accent hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent"
        >
          <EyeDropperIcon className="size-4" aria-hidden="true" />
          {locale === "fr" ? "Prélever une couleur à l’écran" : "Pick a colour from the screen"}
        </button>
      ) : null}
    </div>
  );
}
export function VisualIdentityPalettePicker({
  field,
  value,
  locale,
  error,
  prefill,
  deferred,
  onChange,
  onConfirm,
  onDefer,
}: VisualIdentityPalettePickerProps) {
  const colors = Array.isArray(value) ? value : [];
  const maximum = field.maxSelections ?? 5;

  const changeColor = (index: number, color: string) => {
    const next = [...colors];
    next[index] = color;
    onChange(next);
  };

  return (
    <VisualIdentityQuestionFrame
      field={field}
      locale={locale}
      helper={{
        fr: "Ajoutez jusqu’à cinq couleurs déjà utilisées ou simplement pressenties. Vous pourrez saisir un code, ouvrir le sélecteur ou utiliser la pipette.",
        en: "Add up to five colours you already use or simply have in mind. Enter a code, open the picker or use the eyedropper.",
      }}
      why={field.why ?? {
        fr: "La palette aide à comprendre vos repères, mais Carole vérifiera ensuite l’harmonie, le contraste et l’accessibilité.",
        en: "The palette clarifies your cues, but Carole will still check harmony, contrast and accessibility.",
      }}
      selectionHint={{
        fr: `${colors.length} couleur${colors.length > 1 ? "s" : ""} sur ${maximum}`,
        en: `${colors.length} of ${maximum} colours`,
      }}
      error={error}
      prefill={prefill}
      deferred={deferred}
      onConfirm={onConfirm}
      onDefer={onDefer}
    >
      {colors.length ? (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {colors.map((color, index) => (
            <ColorEntry
              key={`${index}-${color}`}
              color={color}
              index={index}
              locale={locale}
              onChange={(nextColor) => changeColor(index, nextColor)}
              onRemove={() => onChange(colors.filter((_, entryIndex) => entryIndex !== index))}
            />
          ))}
        </div>
      ) : (
        <p className="max-w-[42rem] text-[13px] leading-6 text-text-muted">
          {locale === "fr"
            ? "Vous n’avez pas encore de couleur en tête ? Laissez cette zone vide ou marquez-la à compléter plus tard."
            : "No colour in mind yet? Leave this area empty or mark it to complete later."}
        </p>
      )}

      {colors.length < maximum ? (
        <button
          type="button"
          onClick={() => onChange([...colors, "#854D63"])}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-border-accent px-4 text-[12px] font-medium text-text-accent hover:bg-surface-accent-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent active:translate-y-px motion-reduce:transform-none"
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          {colors.length ? (locale === "fr" ? "Ajouter une couleur" : "Add a colour") : (locale === "fr" ? "Ajouter ma première couleur" : "Add my first colour")}
        </button>
      ) : null}
    </VisualIdentityQuestionFrame>
  );
}
