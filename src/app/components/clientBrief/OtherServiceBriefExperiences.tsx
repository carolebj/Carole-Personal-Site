/* Hallmark · genre: editorial · macrostructure: Narrative Workflow · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import type { ReactNode } from "react";
import type {
  ClientBriefServiceKey,
  ClientBriefValue,
} from "../../../../shared/client-brief-contract.js";
import { GuidedTickSlider } from "../forms/GuidedSlider";

export type ClientBriefExperienceLocale = "fr" | "en";

export type OtherServiceBriefExperiencesProps = {
  serviceId: ClientBriefServiceKey;
  locale: ClientBriefExperienceLocale;
  answers: Record<string, ClientBriefValue>;
  onAnswer: (key: string, value: ClientBriefValue) => void;
};

type LocalizedText = { fr: string; en: string };
type Choice = {
  value: string;
  label: LocalizedText;
  description?: LocalizedText;
  visual?: ReactNode;
};

const text = (fr: string, en: string): LocalizedText => ({ fr, en });
const localized = (value: LocalizedText, locale: ClientBriefExperienceLocale) => value[locale];
const answerString = (answers: Record<string, ClientBriefValue>, key: string) => {
  const value = answers[key];
  return typeof value === "string" ? value : "";
};
const answerList = (answers: Record<string, ClientBriefValue>, key: string) => {
  const value = answers[key];
  return Array.isArray(value) ? value : [];
};

function toggleList(current: string[], value: string) {
  return current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value];
}

function optionFromReadableValue(value: string, choices: readonly Choice[]) {
  return choices.find((choice) => value.includes(choice.label.fr) || value.includes(choice.label.en))?.value ?? "";
}

function listFromReadableValue(value: string, choices: readonly Choice[]) {
  return choices
    .filter((choice) => value.includes(choice.label.fr) || value.includes(choice.label.en))
    .map((choice) => choice.value);
}

function extractNotes(value: string, labels: readonly string[], structuredChoices: readonly Choice[] = []) {
  for (const label of labels) {
    const index = value.indexOf(label);
    if (index >= 0) return value.slice(index + label.length).trim();
  }
  const hasStructuredChoice = structuredChoices.some(
    (choice) => value.includes(choice.label.fr) || value.includes(choice.label.en),
  );
  return hasStructuredChoice ? "" : value.trim();
}

function QuestionIntro({
  id,
  eyebrow,
  title,
  helper,
  why: _why,
  locale,
}: {
  id: string;
  eyebrow: LocalizedText;
  title: LocalizedText;
  helper: LocalizedText;
  why: LocalizedText;
  locale: ClientBriefExperienceLocale;
}) {
  return (
    <header>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-accent">
        {localized(eyebrow, locale)}
      </p>
      <h3 id={id} className="mt-2 max-w-[46rem] font-serif text-[clamp(1.65rem,4vw,2.4rem)] leading-[1.08] text-text-primary">
        {localized(title, locale)}
      </h3>
      <p className="mt-3 max-w-[44rem] text-[13px] leading-6 text-text-secondary">
        {localized(helper, locale)}
      </p>
    </header>
  );
}

function ExperienceSection({
  labelledBy,
  children,
}: {
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="min-w-0 border-y border-border-subtle py-8 sm:py-10"
    >
      {children}
    </section>
  );
}

function ChoiceGroup({
  legend,
  hint,
  choices,
  value,
  multiple,
  locale,
  onChange,
  columns = "sm:grid-cols-2",
}: {
  legend: LocalizedText;
  hint: LocalizedText;
  choices: readonly Choice[];
  value: string | string[];
  multiple: boolean;
  locale: ClientBriefExperienceLocale;
  onChange: (value: string | string[]) => void;
  columns?: string;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const groupHintId = `choice-hint-${legend.fr.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <fieldset aria-describedby={groupHintId} className="min-w-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <legend className="text-[14px] font-medium leading-6 text-text-primary">
          {localized(legend, locale)}
        </legend>
        <p id={groupHintId} className="flex shrink-0 items-center gap-2 text-[11px] text-text-muted">
          <span
            aria-hidden="true"
            className={`block size-3 border border-border-accent ${multiple ? "rounded-[2px]" : "rounded-full"}`}
          />
          {multiple
            ? locale === "fr" ? "Plusieurs choix possibles" : "Select all that apply"
            : locale === "fr" ? "Un seul choix" : "Choose one"}
          <span className="sr-only">. {localized(hint, locale)}</span>
        </p>
      </div>
      <p className="mt-2 max-w-[42rem] text-[12px] leading-5 text-text-secondary">
        {localized(hint, locale)}
      </p>
      <div className={`mt-4 grid min-w-0 gap-3 ${columns}`}>
        {choices.map((choice) => {
          const active = selected.includes(choice.value);
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(multiple ? toggleList(selected, choice.value) : choice.value)}
              className={`group min-h-24 min-w-0 border p-4 text-left transition-[border-color,background-color,transform] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent active:translate-y-px motion-reduce:transform-none motion-reduce:transition-none ${
                active
                  ? "border-border-accent bg-surface-accent-muted"
                  : "border-border-subtle bg-surface-panel hover:border-border-accent"
              }`}
            >
              <span className="flex items-start gap-3">
                {choice.visual ? (
                  <span className="flex size-12 shrink-0 items-center justify-center bg-surface-page-muted text-text-accent transition-transform duration-200 ease-out motion-safe:group-hover:-translate-y-0.5 motion-reduce:transition-none">
                    {choice.visual}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center border ${
                        multiple ? "rounded-[3px]" : "rounded-full"
                      } ${active ? "border-action-strong bg-action-strong text-text-on-strong" : "border-border-accent bg-surface-panel"}`}
                    >
                      {active ? <span className={multiple ? "h-2 w-1 rotate-45 border-b-2 border-r-2 border-current" : "size-1.5 rounded-full bg-current"} /> : null}
                    </span>
                    <span className="text-[13px] font-medium leading-5 text-text-primary">
                      {localized(choice.label, locale)}
                    </span>
                  </span>
                  {choice.description ? (
                    <span className="mt-2 block text-[11px] leading-5 text-text-secondary">
                      {localized(choice.description, locale)}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function GuidedTextArea({
  id,
  label,
  helper,
  placeholder,
  value,
  locale,
  onChange,
  maxLength = 1800,
}: {
  id: string;
  label: LocalizedText;
  helper: LocalizedText;
  placeholder: LocalizedText;
  value: string;
  locale: ClientBriefExperienceLocale;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  const helperId = `${id}-helper`;
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="block text-[14px] font-medium leading-6 text-text-primary">
        {localized(label, locale)}
      </span>
      <span id={helperId} className="mt-2 block max-w-[42rem] text-[12px] leading-5 text-text-secondary">
        {localized(helper, locale)}
      </span>
      <textarea
        id={id}
        aria-describedby={helperId}
        rows={5}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={localized(placeholder, locale)}
        className="mt-4 min-h-32 w-full resize-y border border-border-subtle bg-surface-panel px-4 py-3 text-[14px] leading-6 text-text-primary outline-none placeholder:text-text-muted focus-visible:border-border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent"
      />
      <span className="mt-2 block text-right text-[10px] text-text-muted" aria-live="polite">
        {value.length}/{maxLength}
      </span>
    </label>
  );
}

function ChannelVisual({ label }: { label: string }) {
  return (
    <span aria-hidden="true" className="font-serif text-[17px] font-semibold tracking-[-0.04em]">
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}

const editorialChannels: Choice[] = [
  { value: "linkedin", label: text("LinkedIn", "LinkedIn"), description: text("Partager une expertise et créer de la confiance dans un cadre professionnel.", "Share expertise and build trust in a professional setting."), visual: <ChannelVisual label="LinkedIn" /> },
  { value: "instagram", label: text("Instagram", "Instagram"), description: text("Rendre votre univers visible, mémorable et facile à suivre.", "Make your world visible, memorable and easy to follow."), visual: <ChannelVisual label="Instagram" /> },
  { value: "facebook", label: text("Facebook", "Facebook"), description: text("Informer une communauté déjà constituée et entretenir le lien.", "Keep an established community informed and connected."), visual: <ChannelVisual label="Facebook" /> },
  { value: "tiktok", label: text("TikTok", "TikTok"), description: text("Expliquer ou montrer vite, avec une parole directe et incarnée.", "Explain or demonstrate quickly through a direct, human voice."), visual: <ChannelVisual label="TikTok" /> },
  { value: "youtube", label: text("YouTube", "YouTube"), description: text("Approfondir un sujet et construire une ressource qui dure.", "Explore a topic in depth and build a lasting resource."), visual: <ChannelVisual label="YouTube" /> },
  { value: "blog", label: text("Blog", "Blog"), description: text("Répondre aux questions du public et être trouvé dans la durée.", "Answer audience questions and remain discoverable over time."), visual: <ChannelVisual label="Blog" /> },
  { value: "newsletter", label: text("Newsletter", "Newsletter"), description: text("Créer un rendez-vous régulier avec les personnes déjà intéressées.", "Create a recurring touchpoint with people who are already interested."), visual: <ChannelVisual label="Newsletter" /> },
  { value: "other-specialized", label: text("Un autre espace", "Another space"), description: text("Podcast, média partenaire, communauté privée ou canal métier.", "Podcast, partner media, private community or specialist channel."), visual: <ChannelVisual label="Autre" /> },
];

export function EditorialStrategyBriefExperience({ locale, answers, onAnswer }: Omit<OtherServiceBriefExperiencesProps, "serviceId">) {
  const titleId = "editorial-brief-experience-title";
  return (
    <ExperienceSection labelledBy={titleId}>
      <QuestionIntro
        id={titleId}
        eyebrow={text("Public et parcours", "Audience and journey")}
        title={text("Aidez-nous à voir le monde depuis la place de votre public.", "Help us see the world from your audience’s point of view.")}
        helper={text("Parlez d’une personne réelle ou d’un groupe que vous connaissez. Décrivez son quotidien, ce qui lui manque et ce qui pourrait la faire avancer.", "Think of a real person or group you know. Describe their day-to-day reality, what is missing and what could help them move forward.")}
        why={text("Une stratégie éditoriale utile ne part pas d’un nombre de publications. Elle part d’un besoin du public, puis choisit les bons endroits et les bons messages pour y répondre.", "A useful editorial strategy does not start with a posting target. It starts with an audience need, then chooses the right places and messages to address it.")}
        locale={locale}
      />
      <div className="mt-7">
        <GuidedTextArea
          id="editorial-audience-needs"
          label={text("Faites le portrait de votre public prioritaire", "Describe your priority audience")}
          helper={text("Vous pouvez raconter une situation : ce que cette personne cherche, ce qui la freine, ce qu’elle a déjà essayé et ce qui lui donnerait confiance.", "You can describe a situation: what this person is looking for, what holds them back, what they have tried and what would build trust.")}
          placeholder={text("Ex. Une dirigeante d’une petite entreprise qui manque de temps, publie sans fil conducteur et veut mieux expliquer la valeur de son offre…", "E.g. A small-business owner who is short on time, posts without a clear thread and wants to explain the value of her offer more clearly…")}
          value={answerString(answers, "audienceNeeds")}
          locale={locale}
          onChange={(value) => onAnswer("audienceNeeds", value)}
          maxLength={2200}
        />
      </div>
      <div className="mt-9">
        <ChoiceGroup
          legend={text("Où ce public vous rencontre-t-il déjà ?", "Where does this audience already encounter you?")}
          hint={text("Choisissez les espaces qui existent vraiment aujourd’hui. Carole pourra ensuite recommander ceux à privilégier.", "Choose the spaces that genuinely exist today. Carole can then recommend which ones to prioritise.")}
          choices={editorialChannels}
          value={answerList(answers, "channels")}
          multiple
          locale={locale}
          onChange={(value) => onAnswer("channels", value as string[])}
        />
      </div>
    </ExperienceSection>
  );
}

const digitalChannels: Choice[] = [
  ...editorialChannels.filter((choice) => ["instagram", "facebook", "linkedin", "tiktok", "youtube", "newsletter"].includes(choice.value)),
  { value: "website", label: text("Site web", "Website"), description: text("Mettre à jour une page, une actualité ou une offre.", "Update a page, news item or offer."), visual: <ChannelVisual label="Web" /> },
  { value: "other", label: text("Autre canal", "Another channel"), description: text("Précisez-le ensuite dans les notes.", "Describe it in the notes below."), visual: <ChannelVisual label="Autre" /> },
];

const cadenceChoices: Choice[] = [
  { value: "light", label: text("Quelques prises de parole par mois", "A few posts each month"), description: text("Pour rester présent sans alimenter plusieurs rendez-vous chaque semaine.", "Stay present without sustaining several weekly touchpoints.") },
  { value: "steady", label: text("Deux à trois prises de parole par semaine", "Two to three posts each week"), description: text("Un rythme régulier, avec du temps pour préparer et valider.", "A steady pace with time to prepare and approve content.") },
  { value: "active", label: text("Quatre prises de parole ou plus par semaine", "Four or more posts each week"), description: text("Pour une actualité dense, une campagne ou plusieurs canaux actifs.", "For busy news cycles, campaigns or several active channels.") },
  { value: "to-frame", label: text("Je préfère être guidé·e", "I would rather be guided"), description: text("Carole proposera un rythme réaliste selon vos moyens et vos objectifs.", "Carole will suggest a realistic pace based on your means and goals.") },
];

const responsibilityChoices: Choice[] = [
  { value: "client-material", label: text("Nous fournissons la matière, Carole la transforme", "We provide source material; Carole shapes it"), description: text("Vous transmettez informations, photos ou idées ; Carole prépare la communication.", "You provide information, photos or ideas; Carole prepares the communication.") },
  { value: "shared", label: text("Nous construisons les contenus ensemble", "We build the content together"), description: text("Les sujets et validations sont partagés selon un calendrier clair.", "Topics and approvals are shared through a clear schedule.") },
  { value: "delegated", label: text("Carole prend en charge l’essentiel", "Carole handles most of the work"), description: text("Votre équipe reste disponible pour informer et valider.", "Your team remains available to provide information and approve work.") },
  { value: "to-frame", label: text("Les rôles ne sont pas encore décidés", "Roles are not decided yet"), description: text("Le brief signalera ce point à cadrer avant de commencer.", "The brief will flag this point for clarification before work begins.") },
];

function buildOperationalTasks(locale: ClientBriefExperienceLocale, cadence: string, responsibility: string, notes: string) {
  const cadenceLabel = cadenceChoices.find((choice) => choice.value === cadence)?.label[locale];
  const responsibilityLabel = responsibilityChoices.find((choice) => choice.value === responsibility)?.label[locale];
  return [
    cadenceLabel ? `${locale === "fr" ? "Rythme souhaité" : "Preferred pace"} : ${cadenceLabel}` : "",
    responsibilityLabel ? `${locale === "fr" ? "Responsabilité des contenus" : "Content ownership"} : ${responsibilityLabel}` : "",
    notes.trim() ? `${locale === "fr" ? "Précisions" : "Notes"} : ${notes.trim()}` : "",
  ].filter(Boolean).join("\n");
}

export function DigitalCommunicationBriefExperience({ locale, answers, onAnswer }: Omit<OtherServiceBriefExperiencesProps, "serviceId">) {
  const titleId = "digital-brief-experience-title";
  const operationalTasks = answerString(answers, "operationalTasks");
  const cadence = optionFromReadableValue(operationalTasks, cadenceChoices);
  const responsibility = optionFromReadableValue(operationalTasks, responsibilityChoices);
  const notes = extractNotes(
    operationalTasks,
    ["Précisions : ", "Notes: ", "Notes : "],
    [...cadenceChoices, ...responsibilityChoices],
  );
  const updateOperations = (nextCadence = cadence, nextResponsibility = responsibility, nextNotes = notes) => {
    onAnswer("operationalTasks", buildOperationalTasks(locale, nextCadence, nextResponsibility, nextNotes));
  };

  return (
    <ExperienceSection labelledBy={titleId}>
      <QuestionIntro
        id={titleId}
        eyebrow={text("Organisation au quotidien", "Day-to-day operations")}
        title={text("Dessinez un rythme que votre équipe pourra réellement tenir.", "Shape a pace your team can realistically sustain.")}
        helper={text("Choisissez les espaces concernés, puis dites-nous à quel rythme vous souhaitez prendre la parole et qui peut fournir les informations nécessaires.", "Choose the relevant spaces, then tell us how often you want to communicate and who can provide the necessary information.")}
        why={text("Un calendrier ambitieux sans matière, sans responsable ou sans temps de validation finit vite par se bloquer. Ces repères permettent de proposer une organisation viable.", "An ambitious calendar without source material, an owner or approval time quickly stalls. These cues help create a workable organisation.")}
        locale={locale}
      />
      <div className="mt-8">
        <ChoiceGroup
          legend={text("Quels espaces faut-il animer ?", "Which spaces need to be managed?")}
          hint={text("Cochez tous les canaux qui font réellement partie du projet.", "Select every channel that is genuinely part of the project.")}
          choices={digitalChannels}
          value={answerList(answers, "channels")}
          multiple
          locale={locale}
          onChange={(value) => onAnswer("channels", value as string[])}
        />
      </div>
      <div className="mt-9 grid gap-8 xl:grid-cols-2">
        <ChoiceGroup
          legend={text("Quel rythme imaginez-vous ?", "What pace do you have in mind?")}
          hint={text("Ce choix est un point de départ, pas une obligation définitive.", "This is a starting point, not a final commitment.")}
          choices={cadenceChoices}
          value={cadence}
          multiple={false}
          locale={locale}
          onChange={(value) => updateOperations(value as string)}
          columns=""
        />
        <ChoiceGroup
          legend={text("Comment les responsabilités seront-elles partagées ?", "How will content responsibilities be shared?")}
          hint={text("Choisissez l’organisation la plus proche de votre réalité actuelle.", "Choose the setup closest to your current reality.")}
          choices={responsibilityChoices}
          value={responsibility}
          multiple={false}
          locale={locale}
          onChange={(value) => updateOperations(cadence, value as string)}
          columns=""
        />
      </div>
      <div className="mt-8">
        <GuidedTextArea
          id="digital-operation-notes"
          label={text("Y a-t-il une contrainte à connaître ?", "Is there a constraint we should know about?")}
          helper={text("Par exemple : une validation chaque vendredi, une personne souvent indisponible, un événement récurrent ou un canal à relancer.", "For example: Friday approvals, an often-unavailable contributor, a recurring event or a channel that needs restarting.")}
          placeholder={text("Ajoutez ici ce qui pourrait influencer le calendrier ou les responsabilités…", "Add anything that could affect the calendar or responsibilities…")}
          value={notes}
          locale={locale}
          onChange={(value) => updateOperations(cadence, responsibility, value)}
          maxLength={1000}
        />
      </div>
    </ExperienceSection>
  );
}

function FormatIllustration({ kind }: { kind: string }) {
  if (kind === "short-video" || kind === "short-video-script") {
    return <svg viewBox="0 0 48 48" className="size-9" fill="none" aria-hidden="true"><rect x="10" y="5" width="28" height="38" rx="4" stroke="currentColor" strokeWidth="2" /><path d="m21 17 10 7-10 7V17Z" fill="currentColor" /></svg>;
  }
  if (kind === "carousel") {
    return <svg viewBox="0 0 48 48" className="size-9" fill="none" aria-hidden="true"><rect x="8" y="11" width="25" height="28" stroke="currentColor" strokeWidth="2" /><path d="M16 7h24v28" stroke="currentColor" strokeWidth="2" /><circle cx="16" cy="19" r="3" fill="currentColor" /><path d="m12 33 7-8 5 5 5-7 4 5" stroke="currentColor" strokeWidth="2" /></svg>;
  }
  if (kind === "static-visual") {
    return <svg viewBox="0 0 48 48" className="size-9" fill="none" aria-hidden="true"><rect x="6" y="8" width="36" height="32" stroke="currentColor" strokeWidth="2" /><circle cx="17" cy="19" r="4" fill="currentColor" /><path d="m10 36 10-11 7 7 6-8 9 12" stroke="currentColor" strokeWidth="2" /></svg>;
  }
  if (kind === "article" || kind === "long-post") {
    return <svg viewBox="0 0 48 48" className="size-9" fill="none" aria-hidden="true"><path d="M10 6h22l6 6v30H10V6Z" stroke="currentColor" strokeWidth="2" /><path d="M16 18h16M16 24h16M16 30h12" stroke="currentColor" strokeWidth="2" /></svg>;
  }
  if (kind === "custom-format") {
    return <svg viewBox="0 0 48 48" className="size-9" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" /><path d="M24 16v16M16 24h16" stroke="currentColor" strokeWidth="2" /></svg>;
  }
  return <svg viewBox="0 0 48 48" className="size-9" fill="none" aria-hidden="true"><rect x="7" y="9" width="34" height="30" stroke="currentColor" strokeWidth="2" /><path d="M14 17h20M14 23h15M14 29h18" stroke="currentColor" strokeWidth="2" /></svg>;
}

const contentFormats: Choice[] = [
  { value: "short-post", label: text("Publication courte", "Short post"), description: text("Une idée claire, rapidement lisible.", "One clear idea, quickly understood."), visual: <FormatIllustration kind="short-post" /> },
  { value: "long-post", label: text("Publication développée", "In-depth post"), description: text("Un récit, une analyse ou une prise de position.", "A story, analysis or point of view."), visual: <FormatIllustration kind="long-post" /> },
  { value: "article", label: text("Article", "Article"), description: text("Un contenu structuré qui reste utile dans le temps.", "A structured piece that remains useful over time."), visual: <FormatIllustration kind="article" /> },
  { value: "carousel", label: text("Suite de visuels à faire défiler", "Swipeable visual sequence"), description: text("Plusieurs écrans pour expliquer une idée étape par étape.", "Several frames that explain an idea step by step."), visual: <FormatIllustration kind="carousel" /> },
  { value: "static-visual", label: text("Visuel unique", "Single visual"), description: text("Une image, une affiche ou une information clé.", "An image, poster or key piece of information."), visual: <FormatIllustration kind="static-visual" /> },
  { value: "short-video", label: text("Vidéo courte", "Short video"), description: text("Une vidéo prête à être publiée sur les réseaux.", "A ready-to-publish social video."), visual: <FormatIllustration kind="short-video" /> },
  { value: "short-video-script", label: text("Texte ou scénario pour vidéo", "Video script"), description: text("Le déroulé et les mots, sans réaliser le tournage.", "The sequence and words, without producing the shoot."), visual: <FormatIllustration kind="short-video-script" /> },
  { value: "custom-format", label: text("Autre format", "Another format"), description: text("Podcast, fiche, présentation ou besoin particulier.", "Podcast, one-pager, presentation or a specific need."), visual: <FormatIllustration kind="custom-format" /> },
];

const volumeChoices: Choice[] = [
  { value: "starter", label: text("1 à 3 contenus", "1 to 3 pieces"), description: text("Pour un besoin précis ou un premier test.", "For a focused need or an initial test.") },
  { value: "small-series", label: text("4 à 8 contenus", "4 to 8 pieces"), description: text("Une petite série cohérente autour d’un sujet ou d’un lancement.", "A small coherent series around a topic or launch.") },
  { value: "campaign", label: text("9 à 20 contenus", "9 to 20 pieces"), description: text("Une campagne ou plusieurs semaines de prise de parole.", "A campaign or several weeks of communication.") },
  { value: "ongoing", label: text("Plus de 20 contenus", "More than 20 pieces"), description: text("Un dispositif récurrent à organiser dans le temps.", "An ongoing programme that needs structuring over time.") },
  { value: "to-frame", label: text("Je ne sais pas encore", "I am not sure yet"), description: text("Carole pourra proposer un volume après avoir compris l’objectif.", "Carole can suggest a volume after understanding the objective.") },
];

function buildProductionPlan(locale: ClientBriefExperienceLocale, volume: string, notes: string) {
  const volumeLabel = volumeChoices.find((choice) => choice.value === volume)?.label[locale];
  return [
    volumeLabel ? `${locale === "fr" ? "Volume envisagé" : "Expected volume"} : ${volumeLabel}` : "",
    notes.trim() ? `${locale === "fr" ? "Organisation ou contraintes" : "Organisation or constraints"} : ${notes.trim()}` : "",
  ].filter(Boolean).join("\n");
}

export function ContentCreationBriefExperience({ locale, answers, onAnswer }: Omit<OtherServiceBriefExperiencesProps, "serviceId">) {
  const titleId = "content-brief-experience-title";
  const productionPlan = answerString(answers, "productionPlan");
  const volume = optionFromReadableValue(productionPlan, volumeChoices);
  const notes = extractNotes(
    productionPlan,
    ["Organisation ou contraintes : ", "Organisation or constraints: ", "Organisation or constraints : "],
    volumeChoices,
  );

  return (
    <ExperienceSection labelledBy={titleId}>
      <QuestionIntro
        id={titleId}
        eyebrow={text("Formats et volume", "Formats and volume")}
        title={text("Composez votre panier de contenus sans parler technique.", "Build your content mix without technical jargon.")}
        helper={text("Choisissez ce que votre public devra voir, lire ou écouter. Vous pourrez ensuite préciser le sujet, la durée ou les dimensions si vous les connaissez.", "Choose what your audience should see, read or hear. You can then add topics, duration or dimensions if you know them.")}
        why={text("Le format et le volume influencent le temps d’écriture, de création, de tournage et de déclinaison. Des paliers évitent de vous demander un chiffre exact trop tôt.", "Format and volume affect writing, design, filming and adaptation time. Ranges avoid asking for an exact number too early.")}
        locale={locale}
      />
      <div className="mt-8">
        <ChoiceGroup
          legend={text("Quels types de contenus imaginez-vous ?", "Which kinds of content do you have in mind?")}
          hint={text("Vous pouvez en choisir plusieurs. Les exemples servent à vous orienter, pas à limiter le projet.", "You can choose several. The examples are guidance, not project limits.")}
          choices={contentFormats}
          value={answerList(answers, "contentFormats")}
          multiple
          locale={locale}
          onChange={(value) => onAnswer("contentFormats", value as string[])}
          columns="sm:grid-cols-2 lg:grid-cols-4"
        />
      </div>
      <div className="mt-9 grid gap-9 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="min-w-0 border-y border-border-subtle bg-surface-page-muted px-4 py-6 sm:px-6">
          <h4 className="text-[14px] font-medium leading-6 text-text-primary">
            {locale === "fr" ? "Quel volume vous semble proche du besoin ?" : "Which volume feels closest to the need?"}
          </h4>
          <p className="mt-2 max-w-[38rem] text-[12px] leading-5 text-text-secondary">
            {locale === "fr"
              ? "Faites glisser le repère vers la borne la plus proche. Ce choix reste un point de départ à préciser ensemble."
              : "Move the marker to the closest range. This remains a starting point to refine together."}
          </p>
          <div className="mt-6">
            <GuidedTickSlider
              options={volumeChoices.map((choice) => ({
                value: choice.value,
                label: localized(choice.label, locale),
                shortLabel: localized(choice.label, locale),
              }))}
              value={volume}
              label={locale === "fr" ? "Choisir une borne de volume" : "Choose a volume range"}
              onValueChange={(nextValue) => onAnswer("productionPlan", buildProductionPlan(locale, nextValue, notes))}
            />
          </div>
        </div>
        <GuidedTextArea
          id="content-production-notes"
          label={text("Une précision utile ?", "Anything useful to add?")}
          helper={text("Mentionnez une date, un événement, des personnes à filmer ou une matière déjà prête.", "Mention a date, event, people to film or source material that is already ready.")}
          placeholder={text("Ex. Les photos produits existent déjà ; trois témoignages clients seront disponibles en septembre…", "E.g. Product photos already exist; three customer testimonials will be available in September…")}
          value={notes}
          locale={locale}
          onChange={(value) => onAnswer("productionPlan", buildProductionPlan(locale, volume, value))}
          maxLength={1200}
        />
      </div>
    </ExperienceSection>
  );
}

const symptomChoices: Choice[] = [
  { value: "unclear-message", label: text("Notre message manque de clarté", "Our message is unclear"), description: text("Les personnes ne comprennent pas vite ce que nous faisons ou pour qui.", "People do not quickly understand what we do or who it is for.") },
  { value: "inconsistent", label: text("Notre communication paraît dispersée", "Our communication feels inconsistent"), description: text("Le ton, les visuels ou les sujets changent beaucoup d’un espace à l’autre.", "Tone, visuals or topics vary too much from one space to another.") },
  { value: "low-response", label: text("Les contenus suscitent peu de réactions", "Content gets little response"), description: text("Les personnes voient, mais commentent, cliquent ou contactent peu.", "People see the content but rarely comment, click or get in touch.") },
  { value: "hard-to-organise", label: text("La production est difficile à organiser", "Content production is hard to organise"), description: text("Les idées, validations ou responsabilités se perdent en cours de route.", "Ideas, approvals or responsibilities get lost along the way.") },
  { value: "outdated", label: text("Nos supports ne reflètent plus notre réalité", "Our materials no longer reflect us"), description: text("L’offre, l’équipe ou le positionnement a évolué.", "The offer, team or positioning has changed.") },
  { value: "unsure", label: text("Je ressens un problème sans savoir le nommer", "I can sense a problem but cannot name it"), description: text("Décrivez simplement ce que vous observez dans la zone suivante.", "Simply describe what you observe in the next field.") },
];

const evidenceChoices: Choice[] = [
  { value: "published-content", label: text("Des contenus déjà publiés", "Published content"), description: text("Pages, publications, newsletters, vidéos ou campagnes passées.", "Pages, posts, newsletters, videos or previous campaigns.") },
  { value: "performance-data", label: text("Des chiffres de performance", "Performance data"), description: text("Statistiques des réseaux, du site, des campagnes ou des ventes.", "Social, website, campaign or sales figures.") },
  { value: "audience-feedback", label: text("Des retours du public ou des clients", "Audience or customer feedback"), description: text("Messages, avis, enquêtes, questions fréquentes ou entretiens.", "Messages, reviews, surveys, common questions or interviews.") },
  { value: "internal-documents", label: text("Des documents internes", "Internal documents"), description: text("Stratégie, charte, compte-rendu, calendrier ou présentation.", "Strategy, guidelines, meeting notes, calendar or presentation.") },
  { value: "team-access", label: text("Des personnes à interroger", "People we can interview"), description: text("Équipe, direction, partenaire, vendeur ou personne au contact du public.", "Team, leadership, partner, salesperson or customer-facing colleague.") },
  { value: "none-yet", label: text("Rien de tout cela pour le moment", "None of these yet"), description: text("Ce n’est pas bloquant : l’audit précisera ce qu’il faut réunir.", "This is not a blocker: the audit will clarify what needs to be gathered.") },
];

const accessChoices: Choice[] = [
  { value: "ready", label: text("Les accès sont prêts", "Access is ready"), description: text("Les personnes responsables savent comment donner un accès sécurisé.", "The relevant people know how to grant secure access.") },
  { value: "partial", label: text("Une partie seulement est accessible", "Only some access is available"), description: text("Certains comptes, fichiers ou périodes manquent encore.", "Some accounts, files or time periods are still missing.") },
  { value: "organising", label: text("Nous devons encore organiser les accès", "We still need to organise access"), description: text("Le brief permettra d’identifier les propriétaires et les prochaines étapes.", "The brief will help identify owners and next steps.") },
  { value: "to-frame", label: text("Je ne sais pas qui détient les accès", "I do not know who owns the access"), description: text("Signalez-le simplement ; ne partagez aucun mot de passe ici.", "Simply flag it; never share passwords here.") },
];

function buildObservedProblem(locale: ClientBriefExperienceLocale, symptoms: string[], details: string) {
  const labels = symptoms.map((value) => symptomChoices.find((choice) => choice.value === value)?.label[locale]).filter(Boolean);
  return [
    labels.length ? `${locale === "fr" ? "Signaux observés" : "Observed signals"} : ${labels.join(", ")}` : "",
    details.trim() ? `${locale === "fr" ? "Contexte" : "Context"} : ${details.trim()}` : "",
  ].filter(Boolean).join("\n");
}

function buildDataAccess(locale: ClientBriefExperienceLocale, evidence: string[], access: string, notes: string) {
  const evidenceLabels = evidence.map((value) => evidenceChoices.find((choice) => choice.value === value)?.label[locale]).filter(Boolean);
  const accessLabel = accessChoices.find((choice) => choice.value === access)?.label[locale];
  return [
    evidenceLabels.length ? `${locale === "fr" ? "Éléments disponibles" : "Available material"} : ${evidenceLabels.join(", ")}` : "",
    accessLabel ? `${locale === "fr" ? "État des accès" : "Access status"} : ${accessLabel}` : "",
    notes.trim() ? `${locale === "fr" ? "Précisions" : "Notes"} : ${notes.trim()}` : "",
  ].filter(Boolean).join("\n");
}

export function AuditAdviceBriefExperience({ locale, answers, onAnswer }: Omit<OtherServiceBriefExperiencesProps, "serviceId">) {
  const titleId = "audit-brief-experience-title";
  const observedProblem = answerString(answers, "observedProblem");
  const selectedSymptoms = listFromReadableValue(observedProblem, symptomChoices);
  const problemDetails = extractNotes(
    observedProblem,
    ["Contexte : ", "Context: ", "Context : "],
    symptomChoices,
  );
  const dataAccess = answerString(answers, "dataAccess");
  const selectedEvidence = listFromReadableValue(dataAccess, evidenceChoices);
  const access = optionFromReadableValue(dataAccess, accessChoices);
  const accessNotes = extractNotes(
    dataAccess,
    ["Précisions : ", "Notes: ", "Notes : "],
    [...evidenceChoices, ...accessChoices],
  );

  return (
    <ExperienceSection labelledBy={titleId}>
      <QuestionIntro
        id={titleId}
        eyebrow={text("Observer avant de conclure", "Observe before concluding")}
        title={text("Montrez-nous les signes du problème, pas le diagnostic.", "Show us the signs of the problem, not the diagnosis.")}
        helper={text("Vous n’avez pas besoin de savoir quel audit réaliser. Dites simplement ce qui vous surprend, vous ralentit ou ne produit plus le résultat attendu.", "You do not need to know which audit to run. Simply describe what surprises you, slows you down or no longer produces the expected result.")}
        why={text("Carole pourra distinguer les symptômes de leurs causes, définir ce qui doit être observé et signaler les informations encore manquantes.", "Carole can separate symptoms from their causes, define what needs to be observed and flag any missing information.")}
        locale={locale}
      />
      <div className="mt-8">
        <ChoiceGroup
          legend={text("Que remarquez-vous aujourd’hui ?", "What are you noticing today?")}
          hint={text("Cochez tous les signes qui vous parlent. Vous pourrez les nuancer juste après.", "Select every sign that feels relevant. You can add context just below.")}
          choices={symptomChoices}
          value={selectedSymptoms}
          multiple
          locale={locale}
          onChange={(value) => onAnswer("observedProblem", buildObservedProblem(locale, value as string[], problemDetails))}
          columns="sm:grid-cols-2 lg:grid-cols-3"
        />
      </div>
      <div className="mt-8">
        <GuidedTextArea
          id="audit-problem-context"
          label={text("Racontez un exemple concret", "Share a concrete example")}
          helper={text("Depuis quand le remarquez-vous ? Dans quel contexte ? Qu’est-ce que cela empêche de faire ?", "When did you start noticing it? In what context? What is it preventing you from doing?")}
          placeholder={text("Ex. Depuis notre changement d’offre, les prospects demandent souvent si nous faisons encore…", "E.g. Since changing our offer, prospects often ask whether we still…")}
          value={problemDetails}
          locale={locale}
          onChange={(value) => onAnswer("observedProblem", buildObservedProblem(locale, selectedSymptoms, value))}
          maxLength={1800}
        />
      </div>
      <div className="mt-10 border-t border-border-subtle pt-9">
        <ChoiceGroup
          legend={text("Quels éléments existent déjà pour comprendre la situation ?", "What already exists to help understand the situation?")}
          hint={text("Cochez les éléments disponibles, même s’ils sont imparfaits ou incomplets.", "Select what is available, even if it is imperfect or incomplete.")}
          choices={evidenceChoices}
          value={selectedEvidence}
          multiple
          locale={locale}
          onChange={(value) => onAnswer("dataAccess", buildDataAccess(locale, value as string[], access, accessNotes))}
          columns="sm:grid-cols-2 lg:grid-cols-3"
        />
      </div>
      <div className="mt-9 grid gap-8 lg:grid-cols-2">
        <ChoiceGroup
          legend={text("Où en sont les accès ?", "What is the access situation?")}
          hint={text("Il s’agit uniquement de l’état des accès. Ne saisissez jamais de mot de passe dans ce brief.", "This is only about access status. Never enter a password in this brief.")}
          choices={accessChoices}
          value={access}
          multiple={false}
          locale={locale}
          onChange={(value) => onAnswer("dataAccess", buildDataAccess(locale, selectedEvidence, value as string, accessNotes))}
          columns=""
        />
        <GuidedTextArea
          id="audit-access-notes"
          label={text("Précisez ce qui manque ou qui peut aider", "Clarify what is missing or could help")}
          helper={text("Vous pouvez nommer un fichier, une période, un propriétaire de compte ou une personne à contacter — sans donnée sensible.", "You can name a file, time period, account owner or contact person — without sensitive information.")}
          placeholder={text("Ex. Les statistiques Instagram sont disponibles sur 90 jours ; l’accès au site appartient au prestataire…", "E.g. Instagram statistics are available for 90 days; website access is held by the provider…")}
          value={accessNotes}
          locale={locale}
          onChange={(value) => onAnswer("dataAccess", buildDataAccess(locale, selectedEvidence, access, value))}
          maxLength={1800}
        />
      </div>
    </ExperienceSection>
  );
}

export function OtherServiceBriefExperiences(props: OtherServiceBriefExperiencesProps) {
  const sharedProps = { locale: props.locale, answers: props.answers, onAnswer: props.onAnswer };
  if (props.serviceId === "editorial-strategy") return <EditorialStrategyBriefExperience {...sharedProps} />;
  if (props.serviceId === "digital-communication") return <DigitalCommunicationBriefExperience {...sharedProps} />;
  if (props.serviceId === "content-creation") return <ContentCreationBriefExperience {...sharedProps} />;
  if (props.serviceId === "audit-advice") return <AuditAdviceBriefExperience {...sharedProps} />;
  return null;
}
