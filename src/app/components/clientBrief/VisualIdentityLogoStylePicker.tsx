/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import { CheckIcon } from "@heroicons/react/24/outline";
import type { ClientBriefField, ClientBriefValue } from "../../../../shared/client-brief-contract.js";
import { VisualIdentityLogoIllustration } from "./VisualIdentityLogoIllustrations";
import { VisualIdentityQuestionFrame, type ClientBriefLocale } from "./VisualIdentityQuestionFrame";

type LogoStyleMeta = {
  title: { fr: string; en: string };
  description: { fr: string; en: string };
  examples: { fr: string; en: string };
};

const logoStyleMeta: Record<string, LogoStyleMeta> = {
  wordmark: {
    title: { fr: "Le nom comme signature", en: "The name as a signature" },
    description: { fr: "Le nom est dessiné avec une typographie reconnaissable.", en: "The name is drawn with recognisable lettering." },
    examples: { fr: "À regarder : Google, Coca-Cola, Disney", en: "Look at: Google, Coca-Cola, Disney" },
  },
  pictorial: {
    title: { fr: "Un symbole figuratif", en: "A pictorial symbol" },
    description: { fr: "Une forme inspirée d’un objet, d’un animal ou d’un élément réel.", en: "A shape inspired by an object, animal or real-world element." },
    examples: { fr: "À regarder : Apple, Shell, WWF", en: "Look at: Apple, Shell, WWF" },
  },
  symbol: {
    title: { fr: "Un symbole figuratif", en: "A pictorial symbol" },
    description: { fr: "Une image simple permet de reconnaître la marque sans lire son nom.", en: "A simple image identifies the brand without reading its name." },
    examples: { fr: "À regarder : Apple, Shell, WWF", en: "Look at: Apple, Shell, WWF" },
  },
  abstract: {
    title: { fr: "Une forme abstraite", en: "An abstract shape" },
    description: { fr: "Une forme originale évoque une idée sans représenter un objet précis.", en: "An original shape suggests an idea without depicting a specific object." },
    examples: { fr: "À regarder : Nike, Pepsi, Spotify", en: "Look at: Nike, Pepsi, Spotify" },
  },
  lettermark: {
    title: { fr: "Les initiales", en: "Initials" },
    description: { fr: "Plusieurs lettres raccourcissent un nom long ou difficile à mémoriser.", en: "Several letters shorten a long or hard-to-remember name." },
    examples: { fr: "À regarder : IBM, NASA, HBO", en: "Look at: IBM, NASA, HBO" },
  },
  letterform: {
    title: { fr: "Une lettre forte", en: "One strong letter" },
    description: { fr: "Une seule lettre devient le signe principal de la marque.", en: "A single letter becomes the brand’s main symbol." },
    examples: { fr: "À regarder : Netflix, McDonald’s, Pinterest", en: "Look at: Netflix, McDonald’s, Pinterest" },
  },
  monogram: {
    title: { fr: "Un monogramme", en: "A monogram" },
    description: { fr: "Deux ou plusieurs initiales sont entrelacées dans un dessin unique.", en: "Two or more initials are interlaced into one distinctive design." },
    examples: { fr: "À regarder : Chanel, Louis Vuitton, YSL", en: "Look at: Chanel, Louis Vuitton, YSL" },
  },
  mascot: {
    title: { fr: "Un personnage", en: "A character" },
    description: { fr: "Une mascotte donne un visage et une personnalité à la marque.", en: "A mascot gives the brand a face and personality." },
    examples: { fr: "À regarder : Michelin, KFC, Duolingo", en: "Look at: Michelin, KFC, Duolingo" },
  },
  combination: {
    title: { fr: "Nom et symbole ensemble", en: "Name and symbol together" },
    description: { fr: "Le nom et le symbole peuvent fonctionner ensemble ou séparément.", en: "The name and symbol can work together or separately." },
    examples: { fr: "À regarder : Lacoste, Burger King, Puma", en: "Look at: Lacoste, Burger King, Puma" },
  },
  emblem: {
    title: { fr: "Un sceau ou un badge", en: "A seal or badge" },
    description: { fr: "Le nom est intégré dans une forme fermée, comme un cachet.", en: "The name sits inside a closed shape, like a seal." },
    examples: { fr: "À regarder : Starbucks, Harley-Davidson, BMW", en: "Look at: Starbucks, Harley-Davidson, BMW" },
  },
  open: {
    title: { fr: "Je préfère être guidé·e", en: "I would rather be guided" },
    description: { fr: "Carole recommandera la famille la plus pertinente après avoir compris vos usages.", en: "Carole will recommend the most relevant family after understanding your use cases." },
    examples: { fr: "Un bon choix si vous hésitez encore.", en: "A good choice if you are still unsure." },
  },
};

type VisualIdentityLogoStylePickerProps = {
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

export function VisualIdentityLogoStylePicker({
  field,
  value,
  locale,
  error,
  prefill,
  deferred,
  onChange,
  onConfirm,
  onDefer,
}: VisualIdentityLogoStylePickerProps) {
  const selected = Array.isArray(value) ? value : [];
  const maximum = field.maxSelections ?? 2;
  const options = field.options ?? [];
  const styleOptions = options.filter((option) => option.value !== "open");
  const guidanceOption = options.find((option) => option.value === "open");

  const toggle = (optionValue: string) => {
    if (selected.includes(optionValue)) {
      onChange(selected.filter((entry) => entry !== optionValue));
      return;
    }
    if (selected.length >= maximum) return;
    onChange([...selected, optionValue]);
  };

  const renderOption = (option: NonNullable<ClientBriefField["options"]>[number], compact = false) => {
    const active = selected.includes(option.value);
    const disabled = !active && selected.length >= maximum;
    const meta = logoStyleMeta[option.value] ?? {
      title: option.label,
      description: option.label,
      examples: { fr: "", en: "" },
    };

    return (
      <button
        key={option.value}
        type="button"
        aria-pressed={active}
        disabled={disabled}
        onClick={() => toggle(option.value)}
        className={`group min-w-0 border p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent disabled:cursor-not-allowed disabled:opacity-45 ${
          compact ? "grid items-center gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]" : "flex min-h-[18rem] flex-col"
        } ${active ? "border-border-accent bg-surface-accent-muted" : "border-border-subtle bg-surface-panel hover:border-border-accent"}`}
      >
        <span className={`flex items-center justify-center bg-surface-page-muted ${compact ? "h-24" : "h-28"}`}>
          <VisualIdentityLogoIllustration type={option.value} locale={locale} />
        </span>
        <span className={compact ? "min-w-0" : "mt-5 flex min-w-0 flex-1 flex-col"}>
          <span className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[4px] border ${
                active ? "border-action-strong bg-action-strong text-text-on-strong" : "border-border-accent bg-surface-panel"
              }`}
            >
              {active ? <CheckIcon className="size-4" /> : null}
            </span>
            <span className="text-[14px] font-medium leading-5 text-text-primary">{meta.title[locale]}</span>
          </span>
          <span className="mt-3 block text-[12px] leading-5 text-text-secondary">{meta.description[locale]}</span>
          <span className="mt-auto block pt-4 text-[11px] leading-5 text-text-muted">{meta.examples[locale]}</span>
        </span>
      </button>
    );
  };

  return (
    <VisualIdentityQuestionFrame
      field={field}
      locale={locale}
      helper={{
        fr: "Regardez surtout la logique de chaque famille, pas les marques citées. Choisissez jusqu’à deux directions qui vous ressemblent.",
        en: "Focus on the logic of each family, not the cited brands. Choose up to two directions that feel right for you.",
      }}
      why={{
        fr: "Ces choix donnent un point de départ à la discussion. Ils n’imposent pas la forme finale du logo.",
        en: "These choices give the discussion a starting point. They do not dictate the final logo shape.",
      }}
      selectionHint={{
        fr: `${selected.length} sur ${maximum} sélectionné${selected.length > 1 ? "s" : ""}`,
        en: `${selected.length} of ${maximum} selected`,
      }}
      error={error}
      prefill={prefill}
      deferred={deferred}
      onConfirm={onConfirm}
      onDefer={onDefer}
    >
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {styleOptions.map((option) => renderOption(option))}
      </div>
      {guidanceOption ? <div className="mt-3">{renderOption(guidanceOption, true)}</div> : null}
      <p className="mt-4 text-[11px] leading-5 text-text-muted">
        {locale === "fr"
          ? "Marques présentées uniquement comme repères visuels, sans affiliation ni partenariat."
          : "Brands are shown only as visual references, with no affiliation or partnership implied."}
      </p>
      {selected.length >= maximum ? (
        <p aria-live="polite" className="mt-3 text-[12px] leading-5 text-text-muted">
          {locale === "fr"
            ? "Vous avez atteint deux choix. Retirez-en un pour essayer une autre direction."
            : "You have reached two choices. Remove one to try another direction."}
        </p>
      ) : null}
    </VisualIdentityQuestionFrame>
  );
}
