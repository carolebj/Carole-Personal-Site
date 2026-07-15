/* Hallmark · genre: editorial · macrostructure: Narrative Workflow · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Bars3BottomRightIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  MapIcon,
  PencilIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  DEFAULT_ESTIMATOR_DRAFT,
  ESTIMATOR_DRAFT_STORAGE_KEY,
  LEGACY_ESTIMATOR_DRAFT_STORAGE_KEY,
  getMaximumAccessibleEstimatorStep,
  isEstimatorStepComplete,
  migrateLegacyEstimatorDraft,
  normalizeEstimatorDraft,
  type EstimatorCurrency,
  type EstimatorDraft,
  type SharedProjectProfile,
} from "../estimator/draft";
import {
  getManualReviewFlags,
  getQuestionnaireProgress,
  getServiceProgress,
  getVisibleQuestions,
  isNumberQuestionAnswerValid,
  MAX_ESTIMATOR_NUMBER_ANSWER,
  pruneHiddenServiceAnswers,
  serviceQuestionnaires,
  type EstimatorServiceId,
  type QuestionnaireAnswer,
  type QuestionnaireAnswers,
  type ServiceQuestion,
} from "../estimator/serviceQuestionnaires";
import {
  buildEstimateInputSignature,
  classifyEstimateFailure,
  filterAnswersForSelectedServices,
  resolveEstimateGeneration,
  saveEstimateSessionMetadata,
  type EstimateFailureState,
  type EstimateSessionMetadata,
} from "../estimator/estimateUiState";
import { lockBodyScroll } from "../estimator/bodyScrollLock";
import type {
  AppliedAdjustment,
  CalculationScopeEntry,
  CalculationScopeExclusion,
  EstimateResult,
  ManualReviewReason,
  ServiceEstimate,
  XofRange,
} from "../estimator/pricingTypes";
import { useSeoOverride } from "../seo/SeoOverrideContext";
import { PROJECT_PROFILE_CONTRACT } from "../../../shared/estimator-profile-contract.js";
import { buildClientBriefPrefill, getClientBriefTemplate, validateClientBriefAnswers } from "../../../shared/client-brief-contract.js";
import { DemoScenarioFab } from "../components/DemoScenarioFab";
import { EstimateCalculationStage } from "../components/estimator/EstimateCalculationStage";
import { GuidedRangeSlider } from "../components/forms/GuidedSlider";

type ServiceDefinition = {
  id: EstimatorServiceId;
  fr: string;
  en: string;
  Icon: typeof GlobeAltIcon;
};

const SERVICES: ServiceDefinition[] = [
  { id: "editorial-strategy", fr: "Stratégie éditoriale", en: "Editorial strategy", Icon: DocumentTextIcon },
  { id: "digital-communication", fr: "Communication digitale", en: "Digital communication", Icon: GlobeAltIcon },
  { id: "content-creation", fr: "Création de contenu", en: "Content creation", Icon: PencilIcon },
  { id: "audit-advice", fr: "Audit & conseil", en: "Audit & consulting", Icon: CheckCircleIcon },
  { id: "visual-identity", fr: "Identité visuelle", en: "Visual identity", Icon: Squares2X2Icon },
];

const SERVICE_BRIEF_SLUGS: Record<EstimatorServiceId, string> = {
  "editorial-strategy": "strategie-editoriale",
  "digital-communication": "communication-digitale",
  "content-creation": "creation-contenus",
  "audit-advice": "audit-consulting",
  "visual-identity": "identite-visuelle",
};

function questionDomId(questionKey: string) {
  return `estimator-question-${questionKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function profileDomId(profileKey: keyof SharedProjectProfile) {
  return `estimator-profile-${profileKey}`;
}

function getManualReviewFlagCopy(flag: ReturnType<typeof getManualReviewFlags>[number], isEnglish: boolean) {
  const questionnaire = serviceQuestionnaires[flag.serviceId];
  const question = questionnaire.questions.find((entry) => entry.key === flag.questionKey);
  const service = SERVICES.find((entry) => entry.id === flag.serviceId);
  const answerLabels = flag.selectedOptions.map((value) => {
    const option = question?.options?.find((entry) => entry.value === value);
    return option ? (isEnglish ? option.label.en : option.label.fr) : value;
  });
  return {
    service: service ? (isEnglish ? service.en : service.fr) : "",
    question: question ? (isEnglish ? question.label.en : question.label.fr) : flag.questionKey,
    answer: answerLabels.join(", "),
  };
}

function clientBriefStatus(serviceId: EstimatorServiceId, estimateId?: string) {
  if (typeof window === "undefined" || !estimateId) return "not-started" as const;
  try {
    const value = JSON.parse(window.localStorage.getItem(`carole.client-brief:${estimateId}:${serviceId}:v1`) ?? "null");
    if (!value?.answers) return "not-started" as const;
    if (value.outcome === "submitted") return "submitted" as const;
    if (value.outcome === "exported") return "exported" as const;
    const template = getClientBriefTemplate(serviceId);
    return template && validateClientBriefAnswers(template, value.answers).valid ? "ready" as const : "draft" as const;
  } catch { return "not-started" as const; }
}

const STEP_LABELS = {
  fr: ["Départ", "Orientation", "Contexte", "Votre besoin", "Vérification", "Estimation"],
  en: ["Start", "Orientation", "Context", "Your need", "Review", "Estimate"],
} as const;

const PRIORITIES = [
  { id: "clarify-message", fr: "Clarifier mon message", en: "Clarify my message" },
  { id: "publish-consistently", fr: "Gagner en régularité", en: "Publish consistently" },
  { id: "prepare-launch", fr: "Préparer un lancement", en: "Prepare a launch" },
  { id: "increase-visibility", fr: "Renforcer ma visibilité", en: "Increase visibility" },
] as const;

const SERVICE_RECOMMENDATIONS: Record<string, readonly EstimatorServiceId[]> = {
  "clarify-message": ["editorial-strategy", "audit-advice", "visual-identity"],
  "publish-consistently": ["digital-communication", "content-creation", "editorial-strategy"],
  "prepare-launch": ["editorial-strategy", "content-creation", "visual-identity"],
  "increase-visibility": ["digital-communication", "content-creation", "audit-advice"],
};

const GUIDANCE_CHALLENGES = [
  { id: "direction", fr: "Je manque de direction et de message clair", en: "I need clearer direction and messaging" },
  { id: "visibility", fr: "Je veux être plus visible et mieux animer mes canaux", en: "I want more visibility and stronger channel activity" },
  { id: "production", fr: "J’ai surtout besoin de contenus à publier", en: "I mainly need content to publish" },
  { id: "identity", fr: "Mon image ne traduit plus qui nous sommes", en: "My visual identity no longer reflects us" },
  { id: "diagnosis", fr: "Je sens un problème, mais je ne sais pas encore lequel", en: "Something is not working, but I cannot name it yet" },
] as const;

const GUIDANCE_STARTING_POINTS = [
  { id: "starting", fr: "Le projet démarre de zéro", en: "The project is starting from scratch" },
  { id: "inconsistent", fr: "Nous faisons déjà des choses, mais sans régularité", en: "We are active, but not consistently" },
  { id: "existing-improve", fr: "Une base existe et doit être améliorée", en: "We have a foundation that needs improvement" },
  { id: "urgent-launch", fr: "Un lancement approche", en: "A launch is approaching" },
  { id: "unsure", fr: "Je préfère être guidé·e", en: "I would rather be guided" },
] as const;

function getGuidedRecommendations(input: Pick<EstimatorDraft, "priority" | "guidanceChallenge" | "guidanceStartingPoint">) {
  const score = new Map<EstimatorServiceId, number>(SERVICES.map((service) => [service.id, 0]));
  const add = (serviceId: EstimatorServiceId, points: number) => score.set(serviceId, (score.get(serviceId) ?? 0) + points);
  for (const serviceId of SERVICE_RECOMMENDATIONS[input.priority ?? ""] ?? []) add(serviceId, 2);
  const challengeMap: Record<string, EstimatorServiceId> = {
    direction: "editorial-strategy",
    visibility: "digital-communication",
    production: "content-creation",
    identity: "visual-identity",
    diagnosis: "audit-advice",
  };
  if (input.guidanceChallenge) add(challengeMap[input.guidanceChallenge], 5);
  if (input.guidanceStartingPoint === "starting") {
    add("editorial-strategy", 2);
    add("visual-identity", 2);
  }
  if (input.guidanceStartingPoint === "inconsistent") add("digital-communication", 3);
  if (input.guidanceStartingPoint === "existing-improve") add("audit-advice", 3);
  if (input.guidanceStartingPoint === "urgent-launch") {
    add("content-creation", 2);
    add("digital-communication", 2);
  }
  if (input.guidanceStartingPoint === "unsure") add("audit-advice", 2);
  return [...score.entries()].sort((a, b) => b[1] - a[1]).map(([serviceId]) => serviceId);
}

type ProfileField = {
  key: keyof SharedProjectProfile;
  label: { fr: string; en: string };
  options: readonly { value: string; fr: string; en: string }[];
};

const PROFILE_FIELDS: readonly ProfileField[] = [
  {
    key: "organizationType",
    label: { fr: "Pour quel type de structure est ce projet ?", en: "What type of organisation is this project for?" },
    options: [
      { value: "business", fr: "Entreprise ou marque", en: "Business or brand" },
      { value: "entrepreneur", fr: "Entrepreneur·e ou indépendant·e", en: "Entrepreneur or freelancer" },
      { value: "nonprofit", fr: "Association ou ONG", en: "Non-profit or NGO" },
      { value: "institution", fr: "Institution ou organisme public", en: "Institution or public body" },
    ],
  },
  {
    key: "organizationScale",
    label: { fr: "Quelle est l’envergure actuelle de la structure ?", en: "What is the organisation's current scale?" },
    options: [
      { value: "solo-micro", fr: "Projet individuel ou microstructure", en: "Solo project or microbusiness" },
      { value: "startup-small", fr: "Start-up ou petite entreprise", en: "Startup or small business" },
      { value: "established", fr: "Entreprise établie", en: "Established company" },
      { value: "large-institution", fr: "Grande organisation ou institution", en: "Large organisation or institution" },
    ],
  },
  {
    key: "clientLocation",
    label: { fr: "Où se situe principalement la structure porteuse ?", en: "Where is the commissioning organisation mainly based?" },
    options: [
      { value: "benin", fr: "Bénin", en: "Benin" },
      { value: "uemoa", fr: "UEMOA, hors Bénin", en: "WAEMU, outside Benin" },
      { value: "africa", fr: "Afrique, hors UEMOA", en: "Africa, outside WAEMU" },
      { value: "international", fr: "Hors Afrique", en: "Outside Africa" },
    ],
  },
  {
    key: "projectStage",
    label: { fr: "À quel stade se trouve le projet ?", en: "What stage is the project at?" },
    options: [
      { value: "idea", fr: "Idée en construction", en: "Early idea" },
      { value: "launch", fr: "Lancement proche", en: "Launching soon" },
      { value: "active", fr: "Activité déjà lancée", en: "Already operating" },
      { value: "repositioning", fr: "Refonte ou repositionnement", en: "Rebrand or repositioning" },
    ],
  },
  {
    key: "investmentRange",
    label: { fr: "Quelle enveloppe avez-vous envisagée pour ce projet ?", en: "What investment range have you considered for this project?" },
    options: [
      { value: "under-250k", fr: "Moins de 250 000 FCFA", en: "Under XOF 250,000" },
      { value: "250k-500k", fr: "250 000 à 500 000 FCFA", en: "XOF 250,000 to 500,000" },
      { value: "500k-1m", fr: "500 000 à 1 000 000 FCFA", en: "XOF 500,000 to 1,000,000" },
      { value: "1m-3m", fr: "1 000 000 à 3 000 000 FCFA", en: "XOF 1,000,000 to 3,000,000" },
      { value: "3m-plus", fr: "Plus de 3 000 000 FCFA", en: "Over XOF 3,000,000" },
      { value: "unknown", fr: "À déterminer", en: "To be determined" },
    ],
  },
  {
    key: "marketScope",
    label: { fr: "Sur quel périmètre le projet doit-il agir ?", en: "What market scope should the project cover?" },
    options: [
      { value: "local", fr: "Un marché local", en: "One local market" },
      { value: "national", fr: "Un marché national", en: "One national market" },
      { value: "regional", fr: "Plusieurs pays de la région", en: "Several regional markets" },
      { value: "international", fr: "Un périmètre international", en: "An international scope" },
    ],
  },
  {
    key: "languageScope",
    label: { fr: "Combien de langues faut-il prendre en compte ?", en: "How many languages need to be supported?" },
    options: [
      { value: "one", fr: "Une langue", en: "One language" },
      { value: "two", fr: "Deux langues", en: "Two languages" },
      { value: "three-plus", fr: "Trois langues ou plus", en: "Three languages or more" },
      { value: "unknown", fr: "À déterminer", en: "To be determined" },
    ],
  },
  {
    key: "timeline",
    label: { fr: "Quand souhaitez-vous démarrer ?", en: "When would you like to begin?" },
    options: [
      { value: "urgent", fr: "Sous 2 semaines", en: "Within 2 weeks" },
      { value: "one-two-months", fr: "Dans 1 à 2 mois", en: "In 1 to 2 months" },
      { value: "three-plus-months", fr: "Dans 3 mois ou plus", en: "In 3 months or more" },
      { value: "flexible", fr: "Date encore flexible", en: "The date is flexible" },
    ],
  },
  {
    key: "validationProcess",
    label: { fr: "Combien de personnes valideront les livrables ?", en: "How many people will approve deliverables?" },
    options: [
      { value: "one", fr: "Une personne", en: "One person" },
      { value: "two-three", fr: "Deux à trois personnes", en: "Two to three people" },
      { value: "four-plus", fr: "Quatre personnes ou plus", en: "Four people or more" },
      { value: "unknown", fr: "Processus à définir", en: "Process to be defined" },
    ],
  },
];

const PROFILE_HELPERS: Record<keyof SharedProjectProfile, { fr: string; en: string }> = {
  organizationType: { fr: "Cela nous aide à formuler la suite avec des exemples proches de votre réalité.", en: "This helps us use examples that fit your situation." },
  organizationScale: { fr: "L’envergure influence le nombre d’interlocuteurs, le niveau de coordination et la profondeur du travail.", en: "Scale affects coordination, stakeholders and the depth of work." },
  clientLocation: { fr: "Les réalités du marché, les déplacements et le niveau de coordination varient selon la zone.", en: "Market context, travel and coordination vary by location." },
  projectStage: { fr: "Un démarrage, une activité existante et une refonte ne demandent pas le même travail préparatoire.", en: "A launch, an existing activity and a repositioning require different preparation." },
  investmentRange: { fr: "Cette information ne réduit pas artificiellement l’estimation : elle aide seulement à comparer votre idée au périmètre obtenu.", en: "This never lowers the estimate artificially; it only helps compare your budget with the resulting scope." },
  marketScope: { fr: "Plus le projet doit fonctionner sur des marchés différents, plus il faut prévoir d’adaptation et de vérification.", en: "More markets usually require more adaptation and validation." },
  languageScope: { fr: "Indiquez les langues réellement nécessaires aujourd’hui. Vous pourrez préciser lesquelles dans le Brief client.", en: "Choose the languages actually needed now; the Client Brief can capture the details later." },
  timeline: { fr: "Une date proche peut demander de réserver des ressources supplémentaires ou de resserrer le périmètre.", en: "A close deadline may require extra resources or a tighter scope." },
  validationProcess: { fr: "Comptez les personnes qui pourront demander des ajustements avant de valider le travail.", en: "Count the people who may request changes before approving the work." },
};

const BUDGET_STEPS = [100_000, 250_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000, 7_500_000, 10_000_000] as const;

function budgetBandFromRange(lower: number, upper: number): SharedProjectProfile["investmentRange"] {
  if (upper < 250_000) return "under-250k";
  if (lower >= 3_000_000) return "3m-plus";
  if (lower >= 1_000_000) return "1m-3m";
  if (lower >= 500_000) return "500k-1m";
  return "250k-500k";
}

const DEMO_PROFILE: SharedProjectProfile = {
  organizationType: "business",
  organizationScale: "startup-small",
  clientLocation: "benin",
  projectStage: "launch",
  investmentRange: "500k-1m",
  marketScope: "national",
  languageScope: "one",
  timeline: "one-two-months",
  validationProcess: "two-three",
};

function buildDemoAnswers(serviceId: EstimatorServiceId, partial = false): QuestionnaireAnswers {
  const answers: QuestionnaireAnswers = {};
  for (let pass = 0; pass < 3; pass += 1) {
    for (const question of getVisibleQuestions(serviceId, answers)) {
      if (answers[question.key] !== undefined) continue;
      if (question.type === "number") answers[question.key] = Number(question.displayBands?.[0]?.value ?? question.number?.min ?? 0);
      else if (question.type === "multi") {
        const value = question.options?.find((entry) => entry.value !== "none" && !question.manualReviewOptions?.includes(entry.value))?.value;
        if (value) answers[question.key] = [value];
      } else {
        const value = question.options?.find((entry) => !question.manualReviewOptions?.includes(entry.value))?.value ?? question.options?.[0]?.value;
        if (value) answers[question.key] = value;
      }
    }
  }
  if (partial) {
    const required = getVisibleQuestions(serviceId, answers).filter((question) => question.requiredForEstimate);
    for (const question of required.slice(Math.ceil(required.length / 2))) delete answers[question.key];
  }
  return answers;
}

function buildDemoResult(serviceId: EstimatorServiceId, currency: EstimatorCurrency): EstimateResult {
  const base: Record<EstimatorServiceId, XofRange> = {
    "editorial-strategy": { lower: 240_000, upper: 480_000 },
    "digital-communication": { lower: 280_000, upper: 650_000 },
    "content-creation": { lower: 180_000, upper: 420_000 },
    "audit-advice": { lower: 160_000, upper: 360_000 },
    "visual-identity": { lower: 300_000, upper: 800_000 },
  };
  const range = base[serviceId];
  const rate = currency === "EUR" ? 655.957 : currency === "USD" ? 610 : 1;
  return {
    status: "estimated",
    modelVersion: "demo-scenario-2026-07",
    services: [{ serviceId, status: "estimated", rangeXof: range, appliedAdjustments: [], calculationScope: { baseScope: { source: "catalog-base-range", pricingStatus: "configured", entries: [] }, inclusions: [], volumes: [], options: [], exclusions: [] }, manualReviewReasons: [] }],
    subtotalXof: range,
    mutualizations: [],
    taxXof: null,
    totalXof: range,
    displayRange: { currency, lower: range.lower / rate, upper: range.upper / rate, xofPerUnit: rate, rateDate: "2026-07-15", sourceName: "Données de démonstration", sourceUrl: "#", snapshotId: "demo" },
    assumptions: ["canonical-currency:XOF", "pricing-model:demo-scenario-2026-07"],
    manualReviewReasons: [],
  };
}

function loadDraft(): EstimatorDraft {
  if (typeof window === "undefined") return DEFAULT_ESTIMATOR_DRAFT;
  try {
    const currentValue = window.localStorage.getItem(ESTIMATOR_DRAFT_STORAGE_KEY);
    if (currentValue) {
      const normalized = normalizeEstimatorDraft(JSON.parse(currentValue));
      if (normalized) return normalized;
      window.localStorage.removeItem(ESTIMATOR_DRAFT_STORAGE_KEY);
    }
    const legacyValue = window.localStorage.getItem(LEGACY_ESTIMATOR_DRAFT_STORAGE_KEY);
    if (legacyValue) {
      const migrated = migrateLegacyEstimatorDraft(JSON.parse(legacyValue));
      if (migrated) return migrated;
    }
  } catch {
    return DEFAULT_ESTIMATOR_DRAFT;
  }
  return DEFAULT_ESTIMATOR_DRAFT;
}

function ChoiceButton({ selected, label, onClick, icon, multiple = false }: { selected: boolean; label: string; onClick: () => void; icon?: ReactNode; multiple?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group flex min-h-20 items-center justify-between rounded-lg border px-5 py-4 text-left text-[15px] leading-6 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854d63]/35 ${
        selected
          ? "border-[#854d63] bg-[#fff8fa] text-text-primary shadow-[0_12px_32px_rgba(133,77,99,0.08)] dark:border-[#f0adc4] dark:bg-[#332426]"
          : "border-border-subtle bg-surface-panel text-text-primary hover:border-[#854d63]/45 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-[#f0adc4]/50"
      }`}
    >
      <span className="flex items-center gap-4">
        {icon ? <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fde7e8] text-text-primary dark:bg-[#854d63]/30">{icon}</span> : null}
        <span>{label}</span>
      </span>
      <span className={`flex size-5 shrink-0 items-center justify-center border transition ${multiple ? "rounded-[5px]" : "rounded-full"} ${selected ? "border-[#854d63] bg-[#854d63] text-white dark:border-[#f0adc4] dark:bg-[#f0adc4] dark:text-[#1c1415]" : "border-[#dfd2ce] group-hover:border-[#854d63]/55 dark:border-white/25"}`} aria-hidden="true">
        {selected ? (multiple ? <CheckIcon className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />) : null}
      </span>
    </button>
  );
}

function StepProgress({ step, furthestStep, labels, isEnglish, compact = false, onNavigate }: { step: number; furthestStep: number; labels: readonly string[]; isEnglish: boolean; compact?: boolean; onNavigate: (step: number) => void }) {
  const activeStepRef = useRef<HTMLElement | null>(null);
  const compactScrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!compact) return;
    const activeStep = activeStepRef.current;
    const scrollContainer = compactScrollRef.current;
    if (!activeStep || !scrollContainer) return;
    const activeRect = activeStep.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    const activeLeft = activeRect.left - containerRect.left + scrollContainer.scrollLeft;
    scrollContainer.scrollTo({
      left: activeLeft - (scrollContainer.clientWidth - activeRect.width) / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [compact, step]);

  const list = labels.map((label, index) => {
    const number = index + 1;
    const isActive = number === step;
    const isVisited = number <= furthestStep;
    const canNavigate = isVisited && !isActive;
    const marker = <span className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold transition ${isActive ? "border-[#854d63] bg-[#854d63] text-white dark:border-[#f0adc4] dark:bg-[#f0adc4] dark:text-[#1c1415]" : isVisited ? "border-[#bfa9b1] bg-surface-panel text-text-accent" : "border-dashed border-border-accent bg-surface-page text-text-muted"}`}>{number}</span>;
    const content = <>{marker}<span className={`${compact ? "mt-2 max-w-24 text-center text-[11px] leading-4" : "pt-2 text-left text-[13px] leading-5"} ${isActive || isVisited ? "font-semibold text-text-accent" : "text-text-muted"}`}>{label}</span></>;
    return (
      <li key={label} className={`relative flex ${compact ? "justify-center px-2" : "min-h-[78px] items-start gap-4 last:min-h-0"}`}>
        {number < labels.length ? <span className={compact ? "absolute left-1/2 right-[-50%] top-[18px] h-px bg-border-subtle" : "absolute left-[17px] top-9 h-[calc(100%-20px)] w-px bg-border-subtle"} aria-hidden="true" /> : null}
        {canNavigate ? (
          <button type="button" onClick={() => onNavigate(number)} className={`group relative z-10 flex rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854d63]/35 ${compact ? "flex-col items-center" : "w-full items-start gap-4"}`}>{content}</button>
        ) : (
          <div ref={isActive ? (node) => { activeStepRef.current = node; } : undefined} aria-current={isActive ? "step" : undefined} className={`relative z-10 flex ${compact ? "flex-col items-center" : "w-full items-start gap-4"}`}>{content}</div>
        )}
      </li>
    );
  });

  const ariaLabel = isEnglish ? "Estimator progress" : "Progression de l'estimateur";
  if (compact) return <div ref={compactScrollRef} className="-mx-5 mt-6 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12"><ol className="grid min-w-[660px] grid-cols-6" aria-label={ariaLabel}>{list}</ol></div>;
  return <ol className="mt-8 grid gap-0" aria-label={ariaLabel}>{list}</ol>;
}

function ProjectEstimator() {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language.startsWith("en");
  const language = isEnglish ? "en" : "fr";
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState<EstimatorDraft>(loadDraft);
  const [draftSaved, setDraftSaved] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches);
  const [pendingQuestionKey, setPendingQuestionKey] = useState<string | null>(null);
  const [pendingProfileKey, setPendingProfileKey] = useState<keyof SharedProjectProfile | null>(null);
  const realDraftBeforeDemo = useRef<EstimatorDraft | null>(null);
  const previousStepRef = useRef(draft.step);
  const labels = STEP_LABELS[language];
  const selectedServices = SERVICES.filter((service) => draft.serviceIds.includes(service.id));
  const globalProgress = getQuestionnaireProgress(draft.serviceIds, draft.serviceAnswers);
  const currentLabel = labels[draft.step - 1];
  const seoMeta = useMemo(() => ({
    title: isEnglish ? "Estimate your project | Carole Tonoukouen" : "Estimer votre projet | Carole Tonoukouen",
    description: isEnglish ? "Get a clear, guided estimate for one service at a time." : "Obtenez une estimation claire et guidée, un service à la fois.",
  }), [isEnglish]);
  useSeoOverride(seoMeta);

  useEffect(() => {
    if (draft.demoScenario) {
      setDraftSaved(true);
      return;
    }
    try {
      window.localStorage.setItem(ESTIMATOR_DRAFT_STORAGE_KEY, JSON.stringify(draft));
      window.localStorage.removeItem(LEGACY_ESTIMATOR_DRAFT_STORAGE_KEY);
      setDraftSaved(true);
    } catch {
      setDraftSaved(false);
    }
  }, [draft]);

  useEffect(() => {
    if (previousStepRef.current === draft.step) return;
    previousStepRef.current = draft.step;
    window.scrollTo({ top: 0, behavior: "auto" });
    window.requestAnimationFrame(() => {
      const title = document.getElementById("estimator-step-title");
      if (!title) return;
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    });
  }, [draft.step]);

  useEffect(() => {
    if (draft.step !== 4 || !pendingQuestionKey) return;
    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(questionDomId(pendingQuestionKey));
      if (!element) return;
      element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      element.focus({ preventScroll: true });
      setPendingQuestionKey(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [draft.step, pendingQuestionKey, reduceMotion]);

  useEffect(() => {
    if (draft.step !== 3 || !pendingProfileKey) return;
    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(profileDomId(pendingProfileKey));
      if (!element) return;
      element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      element.focus({ preventScroll: true });
      setPendingProfileKey(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [draft.step, pendingProfileKey, reduceMotion]);

  const updateDraft = (patch: Partial<EstimatorDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const goToStep = (requestedStep: number) => {
    setDraft((current) => {
      const nextStep = Math.min(getMaximumAccessibleEstimatorStep(current), Math.max(1, requestedStep));
      return { ...current, step: nextStep, furthestStep: Math.max(current.furthestStep, nextStep) };
    });
  };
  const reviewQuestion = (questionKey: string) => {
    setPendingQuestionKey(questionKey);
    goToStep(4);
  };
  const reviewProfile = (profileKey: keyof SharedProjectProfile) => {
    setPendingProfileKey(profileKey);
    goToStep(3);
  };
  const selectService = (serviceId: EstimatorServiceId) => {
    setDraft((current) => {
      const serviceIds = [serviceId];
      const serviceAnswers = filterAnswersForSelectedServices(serviceIds, current.serviceAnswers);
      const candidate: EstimatorDraft = { ...current, serviceIds, serviceAnswers, activeServiceId: serviceId };
      const accessible = getMaximumAccessibleEstimatorStep(candidate);
      return { ...candidate, step: Math.min(candidate.step, accessible), furthestStep: Math.min(candidate.furthestStep, accessible) };
    });
  };
  const updateGuidance = (patch: Pick<Partial<EstimatorDraft>, "priority" | "guidanceChallenge" | "guidanceStartingPoint">) => {
    setDraft((current) => {
      const candidate = { ...current, ...patch };
      const [recommendedService] = getGuidedRecommendations(candidate);
      const serviceIds = recommendedService ? [recommendedService] : [];
      return {
        ...candidate,
        serviceIds,
        activeServiceId: recommendedService,
        serviceAnswers: filterAnswersForSelectedServices(serviceIds, current.serviceAnswers),
      };
    });
  };
  const updateServiceAnswer = (key: string, value: QuestionnaireAnswer | undefined) => {
    setDraft((current) => {
      const serviceAnswers = { ...current.serviceAnswers };
      if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) delete serviceAnswers[key];
      else serviceAnswers[key] = value;
      return { ...current, serviceAnswers: pruneHiddenServiceAnswers(current.serviceIds, serviceAnswers) };
    });
  };
  const applyDemoScenario = (scenario: string) => {
    if (!realDraftBeforeDemo.current) realDraftBeforeDemo.current = draft.demoScenario ? DEFAULT_ESTIMATOR_DRAFT : draft;
    const config: Record<string, { serviceId: EstimatorServiceId; step: number; orientation: "known-services" | "guided"; partial?: boolean }> = {
      "guided-identity": { serviceId: "visual-identity", step: 4, orientation: "guided" },
      "direct-content": { serviceId: "content-creation", step: 4, orientation: "known-services", partial: true },
      "review-identity": { serviceId: "visual-identity", step: 5, orientation: "known-services" },
      "estimate-editorial": { serviceId: "editorial-strategy", step: 6, orientation: "known-services" },
    };
    const selected = config[scenario];
    if (!selected) return;
    setDraft({
      ...DEFAULT_ESTIMATOR_DRAFT,
      orientation: selected.orientation,
      priority: selected.orientation === "guided" ? "prepare-launch" : undefined,
      guidanceChallenge: selected.orientation === "guided" ? "identity" : undefined,
      guidanceStartingPoint: selected.orientation === "guided" ? "starting" : undefined,
      serviceIds: [selected.serviceId],
      activeServiceId: selected.serviceId,
      profile: DEMO_PROFILE,
      budgetStatus: "defined",
      budgetMinXof: 500_000,
      budgetMaxXof: 1_000_000,
      serviceAnswers: buildDemoAnswers(selected.serviceId, selected.partial),
      step: selected.step,
      furthestStep: selected.step,
      demoScenario: scenario,
    });
  };
  const exitDemo = () => {
    setDraft(realDraftBeforeDemo.current ?? loadDraft());
    realDraftBeforeDemo.current = null;
  };
  const previewCurrentEstimate = () => {
    if (!realDraftBeforeDemo.current) realDraftBeforeDemo.current = draft;
    setDraft((current) => ({ ...current, demoScenario: "current-estimate" }));
  };
  const isStepComplete = isEstimatorStepComplete(draft, draft.step);

  return (
    <div className="bg-surface-page pt-16 text-text-primary">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isEnglish ? `Step ${draft.step} of 6: ${currentLabel}` : `Étape ${draft.step} sur 6 : ${currentLabel}`}
      </p>
      <div className="mx-auto grid min-h-[calc(100dvh-64px)] max-w-[1512px] xl:grid-cols-[292px_minmax(0,1fr)_372px]">
        <aside className="hidden border-r border-border-subtle px-10 py-14 xl:block">
          <p className="text-[11px] font-semibold uppercase tracking-[2.5px] text-text-accent">{isEnglish ? "PROJECT ESTIMATOR" : "ESTIMATEUR DE PROJET"}</p>
          <div className="mt-8 border-t border-border-subtle pt-8">
            <p className="text-[14px] font-semibold text-text-primary">{isEnglish ? `Step ${draft.step} of 6` : `Étape ${draft.step} sur 6`} · <span className="text-text-accent">{currentLabel}</span></p>
            <StepProgress step={draft.step} furthestStep={draft.furthestStep} labels={labels} isEnglish={isEnglish} onNavigate={goToStep} />
          </div>
        </aside>

        <motion.section aria-labelledby="estimator-step-title" key={draft.step} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }} className="min-w-0 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="mb-8 border-b border-border-subtle pb-6 xl:hidden">
            <div><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "PROJECT ESTIMATOR" : "ESTIMATEUR DE PROJET"}</p><p className="mt-2 text-[13px] font-semibold text-text-primary">{isEnglish ? `Step ${draft.step} of 6` : `Étape ${draft.step} sur 6`} · {currentLabel}</p></div>
            <StepProgress step={draft.step} furthestStep={draft.furthestStep} labels={labels} isEnglish={isEnglish} compact onNavigate={goToStep} />
          </div>

          {draft.step === 1 ? <ProjectStep isEnglish={isEnglish} currency={draft.currency} orientation={draft.orientation} onCurrency={(currency) => updateDraft({ currency })} onOrientation={(orientation) => setDraft((current) => current.orientation === orientation ? current : { ...current, orientation, priority: undefined, guidanceChallenge: undefined, guidanceStartingPoint: undefined, serviceIds: [], activeServiceId: undefined, serviceAnswers: {}, furthestStep: 1 })} /> : null}
          {draft.step === 2 ? <ServicesStep isEnglish={isEnglish} draft={draft} reduceMotion={Boolean(reduceMotion)} onSelect={selectService} onGuidance={updateGuidance} /> : null}
          {draft.step === 3 ? <ContextStep isEnglish={isEnglish} draft={draft} onChange={(key, value) => updateDraft({ profile: { ...draft.profile, [key]: value } })} onBudget={(patch) => setDraft((current) => ({ ...current, ...patch, profile: { ...current.profile, ...(patch.budgetStatus === "undefined" ? { investmentRange: "unknown" } : patch.budgetMinXof && patch.budgetMaxXof ? { investmentRange: budgetBandFromRange(patch.budgetMinXof, patch.budgetMaxXof) } : {}) } }))} /> : null}
          {draft.step === 4 ? <AdaptiveServicesStep isEnglish={isEnglish} serviceIds={draft.serviceIds} activeServiceId={draft.activeServiceId} answers={draft.serviceAnswers} onActivate={(activeServiceId) => updateDraft({ activeServiceId })} onAnswer={updateServiceAnswer} /> : null}
          {draft.step === 5 ? <ReviewStep isEnglish={isEnglish} draft={draft} onNavigate={goToStep} onReviewQuestion={reviewQuestion} onReviewProfile={reviewProfile} /> : null}
          {draft.step === 6 ? <SummaryStep isEnglish={isEnglish} draft={draft} selectedServices={selectedServices} onNavigate={goToStep} onReviewQuestion={reviewQuestion} onReviewProfile={reviewProfile} onUseDemo={previewCurrentEstimate} /> : null}

          <div className="mt-10 flex flex-col-reverse gap-4 border-t border-border-subtle pt-7 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => goToStep(draft.step - 1)} disabled={draft.step === 1} className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-border-subtle bg-surface-panel px-7 text-[14px] font-medium text-text-primary transition hover:border-[#854d63]/45 hover:text-text-accent disabled:cursor-not-allowed disabled:opacity-35"><ArrowLeftIcon className="size-4" />{isEnglish ? "Back" : "Retour"}</button>
            {draft.step < 6 ? <button type="button" onClick={() => goToStep(draft.step + 1)} disabled={!isStepComplete} className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-[#854d63] px-8 text-[14px] font-semibold text-white shadow-[0_16px_34px_rgba(133,77,99,0.18)] transition hover:-translate-y-0.5 hover:bg-[#6a364b] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 dark:bg-[#d79caf] dark:text-[#1c1415] dark:hover:bg-[#f0adc4]">{draft.step === 5 ? (isEnglish ? "View estimate" : "Voir l’estimation") : (isEnglish ? "Continue" : "Continuer")}<ArrowRightIcon className="size-4" /></button> : null}
          </div>
          {!isStepComplete && draft.step < 6 ? <p role="status" className="mt-4 text-center text-[12px] text-text-muted">{draft.step === 4 ? (isEnglish ? `${globalProgress.remaining} required question${globalProgress.remaining > 1 ? "s" : ""} remaining.` : `${globalProgress.remaining} question${globalProgress.remaining > 1 ? "s obligatoires restantes" : " obligatoire restante"}.`) : (isEnglish ? "Complete the required choices to continue." : "Complétez les choix obligatoires pour continuer.")}</p> : null}
          <p className="mt-6 flex items-center justify-center gap-2 text-[12px] text-text-muted"><InformationCircleIcon className="size-4" />{isEnglish ? "Indicative estimate, not a quote." : "Estimation indicative, pas un devis."}</p>
        </motion.section>

        <ProjectSidebar isEnglish={isEnglish} draft={draft} draftSaved={draftSaved} selectedServices={selectedServices} globalProgress={globalProgress} open={summaryOpen} onClose={() => setSummaryOpen(false)} onEditCurrency={() => goToStep(1)} onEditServices={() => goToStep(2)} />
        <button type="button" onClick={() => setSummaryOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center gap-3 rounded-full border border-border-accent bg-surface-panel px-3 py-2.5 pr-4 text-[12px] font-semibold text-text-primary shadow-panel transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:bg-surface-page-muted motion-reduce:transform-none xl:hidden" aria-expanded={summaryOpen} aria-controls="project-summary-drawer"><span className="flex size-8 items-center justify-center rounded-full bg-action-accent text-text-on-strong"><Bars3BottomRightIcon className="size-4" /></span><span>{isEnglish ? "Project summary" : "Récapitulatif"}</span><span className="font-serif text-[15px] text-text-accent">{globalProgress.percentage}%</span></button>
        <DemoScenarioFab position="above-summary" isEnglish={isEnglish} onApply={applyDemoScenario} onExit={draft.demoScenario ? exitDemo : undefined} scenarios={isEnglish ? [
          { id: "guided-identity", title: "Guided · Visual identity", description: "Open a complete guided visual-identity scope." },
          { id: "direct-content", title: "Direct · Partial content", description: "Test a questionnaire that is halfway complete." },
          { id: "review-identity", title: "Complete review", description: "Open the review stage with all answers filled." },
          { id: "estimate-editorial", title: "Final estimate", description: "Open a safe fictional final result without an API call." },
        ] : [
          { id: "guided-identity", title: "Guidé · Identité visuelle", description: "Ouvrir un périmètre guidé d’identité visuelle déjà rempli." },
          { id: "direct-content", title: "Direct · Contenu partiel", description: "Tester un questionnaire rempli à mi-parcours." },
          { id: "review-identity", title: "Vérification complète", description: "Ouvrir le récapitulatif avec toutes les réponses." },
          { id: "estimate-editorial", title: "Estimation finale", description: "Voir un résultat fictif sûr, sans appel à l’API." },
        ]} />
      </div>
    </div>
  );
}

function ProjectStep({ isEnglish, currency, orientation, onCurrency, onOrientation }: { isEnglish: boolean; currency: EstimatorCurrency; orientation?: string; onCurrency: (value: EstimatorCurrency) => void; onOrientation: (value: string) => void }) {
  const choices = [{ value: "known-services", fr: "Je connais le service à estimer", en: "I know which service to estimate" }, { value: "guided", fr: "Aidez-moi à identifier mon besoin", en: "Help me identify what I need" }];
  return <><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "PROJECT" : "PROJET"}</p><h1 id="estimator-step-title" className="mt-5 max-w-[760px] font-serif text-[clamp(2.4rem,4vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.025em]">{isEnglish ? "Let's set up your estimate." : "Configurons votre estimation."}</h1><p className="mt-5 max-w-[680px] text-[15px] leading-7 text-text-secondary">{isEnglish ? "Choose your display currency, then tell us how you would like to begin. XOF remains the calculation source of truth." : "Choisissez votre devise d’affichage, puis indiquez-nous comment vous souhaitez commencer. Le XOF reste la base de calcul."}</p>
    <section className="mt-10 border-t border-border-subtle pt-8" aria-labelledby="currency-heading"><FieldHeading id="currency-heading" label={isEnglish ? "DISPLAY CURRENCY" : "DEVISE D’AFFICHAGE"} /><p className="mt-2 text-[12px] leading-5 text-text-muted">{isEnglish ? "XOF is selected by default. EUR and USD only change how the result is displayed." : "Le XOF est sélectionné par défaut. EUR et USD changent uniquement l’affichage du résultat."}</p><div className="mt-5 inline-flex overflow-hidden rounded-full border border-border-subtle bg-surface-panel p-1" role="group" aria-label={isEnglish ? "Estimate currency" : "Devise de l’estimation"}>{(["XOF", "EUR", "USD"] as const).map((value) => <button key={value} type="button" aria-pressed={currency === value} onClick={() => onCurrency(value)} className={`h-10 rounded-full px-6 text-[12px] font-semibold tracking-[0.8px] transition ${currency === value ? "bg-[#854d63] text-white dark:bg-[#f0adc4] dark:text-[#1c1415]" : "text-text-secondary hover:bg-surface-page-muted"}`}>{value}</button>)}</div></section>
    <section className="mt-9 border-t border-border-subtle pt-8" aria-labelledby="orientation-heading"><FieldHeading id="orientation-heading" label={isEnglish ? "HOW WOULD YOU LIKE TO BEGIN?" : "COMMENT SOUHAITEZ-VOUS COMMENCER ?"} required isEnglish={isEnglish} /><p className="mt-2 text-[12px] leading-5 text-text-muted">{isEnglish ? "Choose a service directly, or answer three short questions so we can recommend the best starting point." : "Choisissez directement un service, ou répondez à trois questions courtes pour recevoir une recommandation."}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{choices.map((choice) => <ChoiceButton key={choice.value} label={isEnglish ? choice.en : choice.fr} selected={orientation === choice.value} onClick={() => onOrientation(choice.value)} />)}</div></section></>;
}

function ServicesStep({ isEnglish, draft, reduceMotion, onSelect, onGuidance }: { isEnglish: boolean; draft: EstimatorDraft; reduceMotion: boolean; onSelect: (id: EstimatorServiceId) => void; onGuidance: (patch: Pick<Partial<EstimatorDraft>, "priority" | "guidanceChallenge" | "guidanceStartingPoint">) => void }) {
  const isGuided = draft.orientation === "guided";
  const recommendations = getGuidedRecommendations(draft);
  const diagnosticComplete = Boolean(draft.priority && draft.guidanceChallenge && draft.guidanceStartingPoint);
  const primary = diagnosticComplete ? recommendations[0] : undefined;
  const secondary = diagnosticComplete ? recommendations.slice(1, 3) : [];
  const guidedProgress = [draft.priority, draft.guidanceChallenge, draft.guidanceStartingPoint].filter(Boolean).length;
  const [showAllServices, setShowAllServices] = useState(false);
  const serviceGrid = <div className="mt-6 grid gap-3 sm:grid-cols-2">{SERVICES.map((service) => { const Icon = service.Icon; const selected = draft.serviceIds[0] === service.id; return <button key={service.id} type="button" aria-pressed={selected} onClick={() => onSelect(service.id)} className={`relative flex min-h-24 items-center gap-4 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854d63]/35 ${selected ? "border-[#854d63] bg-[#fff8fa] shadow-[0_14px_38px_rgba(133,77,99,0.10)] dark:border-[#f0adc4] dark:bg-[#332426]" : "border-border-subtle bg-surface-panel hover:-translate-y-0.5 hover:border-[#854d63]/45 dark:border-white/10 dark:bg-white/5"}`}><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0ec] text-text-accent dark:bg-[#854d63]/25"><Icon className="size-5" /></span><span className="min-w-0 flex-1 text-[14px] font-medium">{isEnglish ? service.en : service.fr}</span><span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#854d63] bg-[#854d63] text-white" : "border-[#dfd2ce]"}`}>{selected ? <span className="size-1.5 rounded-full bg-current" /> : null}</span></button>; })}</div>;
  if (!isGuided) return <><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">SERVICE</p><h1 id="estimator-step-title" className="mt-5 font-serif text-[clamp(2.4rem,4vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.025em]">{isEnglish ? "Which service should we estimate?" : "Quel service souhaitez-vous estimer ?"}</h1><p className="mt-5 max-w-[680px] text-[15px] leading-7 text-text-secondary">{isEnglish ? "One estimate covers one service. You can start another estimate afterwards for a different service." : "Une estimation porte sur un seul service. Vous pourrez ensuite relancer un calcul séparé pour un autre besoin."}</p>{serviceGrid}</>;
  return <><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "GUIDED ORIENTATION" : "ORIENTATION GUIDÉE"}</p><h1 id="estimator-step-title" className="mt-5 font-serif text-[clamp(2.4rem,4vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.025em]">{isEnglish ? "Let’s find your best starting point." : "Trouvons votre meilleur point de départ."}</h1><p className="mt-5 max-w-[680px] text-[15px] leading-7 text-text-secondary">{isEnglish ? "Answer three simple questions. We will retain one service for this estimate and show any other relevant needs separately." : "Répondez à trois questions simples. Nous retiendrons un seul service pour cette estimation et signalerons séparément les autres besoins utiles."}</p>
    <div className="mt-8 flex items-center gap-4 border-y border-border-subtle py-4" aria-live="polite">
      <span className="font-serif text-3xl leading-none text-text-accent">{guidedProgress}/3</span>
      <div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-text-primary">{guidedProgress === 3 ? (isEnglish ? "Orientation complete" : "Orientation terminée") : (isEnglish ? "Three quick markers" : "Trois repères rapides")}</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-border-subtle" aria-hidden="true"><span className="block h-full origin-left bg-action-accent transition-transform motion-reduce:transition-none" style={{ transform: `scaleX(${guidedProgress / 3})` }} /></div></div>
    </div>
    <div className="mt-9 grid gap-9">
      <fieldset className="border-t border-border-subtle pt-7"><legend><FieldHeading label={isEnglish ? "WHAT WOULD YOU LIKE TO IMPROVE FIRST?" : "QU’AIMERIEZ-VOUS AMÉLIORER EN PREMIER ?"} required isEnglish={isEnglish} /></legend><p className="mt-2 text-[12px] leading-5 text-text-muted">{isEnglish ? "Choose the outcome that matters most right now, even if several feel relevant." : "Choisissez le résultat le plus important maintenant, même si plusieurs vous parlent."}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{PRIORITIES.map((choice) => <ChoiceButton key={choice.id} label={isEnglish ? choice.en : choice.fr} selected={draft.priority === choice.id} onClick={() => onGuidance({ priority: choice.id })} />)}</div></fieldset>
      {draft.priority ? <motion.fieldset initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }} className="border-t border-border-subtle pt-7"><legend><FieldHeading label={isEnglish ? "WHAT IS THE MAIN DIFFICULTY TODAY?" : "QUELLE EST LA DIFFICULTÉ PRINCIPALE AUJOURD’HUI ?"} required isEnglish={isEnglish} /></legend><p className="mt-2 text-[12px] leading-5 text-text-muted">{isEnglish ? "Describe what you observe; you do not need to diagnose the technical cause." : "Partez de ce que vous observez : vous n’avez pas à identifier vous-même la cause technique."}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{GUIDANCE_CHALLENGES.map((choice) => <ChoiceButton key={choice.id} label={isEnglish ? choice.en : choice.fr} selected={draft.guidanceChallenge === choice.id} onClick={() => onGuidance({ guidanceChallenge: choice.id })} />)}</div></motion.fieldset> : null}
      {draft.guidanceChallenge ? <motion.fieldset initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }} className="border-t border-border-subtle pt-7"><legend><FieldHeading label={isEnglish ? "WHERE ARE YOU STARTING FROM?" : "D’OÙ PARTEZ-VOUS ?"} required isEnglish={isEnglish} /></legend><p className="mt-2 text-[12px] leading-5 text-text-muted">{isEnglish ? "This helps us distinguish a launch, an improvement and a need for diagnosis." : "Cette réponse permet de distinguer un lancement, une amélioration et un besoin de diagnostic."}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{GUIDANCE_STARTING_POINTS.map((choice) => <ChoiceButton key={choice.id} label={isEnglish ? choice.en : choice.fr} selected={draft.guidanceStartingPoint === choice.id} onClick={() => onGuidance({ guidanceStartingPoint: choice.id })} />)}</div></motion.fieldset> : null}
    </div>
    {primary ? <section className="mt-9 overflow-hidden rounded-2xl border border-border-accent bg-surface-accent-muted p-5"><div className="flex items-start gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-action-strong text-text-on-strong"><MapIcon className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-text-accent">{isEnglish ? "RECOMMENDED FROM YOUR ANSWERS" : "RECOMMANDÉ SELON VOS RÉPONSES"}</p><h2 className="mt-2 font-serif text-2xl">{isEnglish ? SERVICES.find((service) => service.id === draft.serviceIds[0])?.en : SERVICES.find((service) => service.id === draft.serviceIds[0])?.fr}</h2><p className="mt-2 text-[12px] leading-5 text-text-secondary">{isEnglish ? "This is the service retained for this estimate. You remain free to replace it." : "C’est le service retenu pour cette estimation. Vous restez libre de le remplacer."}</p></div></div>{secondary.length ? <p className="mt-5 border-t border-border-accent pt-4 text-[12px] leading-5 text-text-secondary">{isEnglish ? "Other needs detected for separate estimates: " : "Autres besoins détectés, à estimer séparément : "}<strong>{secondary.map((id) => isEnglish ? SERVICES.find((service) => service.id === id)?.en : SERVICES.find((service) => service.id === id)?.fr).join(", ")}</strong>.</p> : null}<button type="button" onClick={() => setShowAllServices((value) => !value)} className="mt-5 inline-flex items-center gap-2 whitespace-nowrap text-[12px] font-semibold text-text-accent underline-offset-4 hover:underline" aria-expanded={showAllServices}>{isEnglish ? "Change the retained service" : "Modifier le service retenu"}<ChevronDownIcon className={`size-4 transition-transform ${showAllServices ? "rotate-180" : ""}`} /></button>{showAllServices ? serviceGrid : null}</section> : null}</>;
}

function ContextStep({ isEnglish, draft, onChange, onBudget }: { isEnglish: boolean; draft: EstimatorDraft; onChange: (key: keyof SharedProjectProfile, value: string) => void; onBudget: (patch: Pick<Partial<EstimatorDraft>, "budgetStatus" | "budgetMinXof" | "budgetMaxXof">) => void }) {
  const formatter = new Intl.NumberFormat(isEnglish ? "en-GB" : "fr-FR");
  return <><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "PROJECT CONTEXT" : "CONTEXTE DU PROJET"}</p><h1 id="estimator-step-title" className="mt-5 max-w-[760px] font-serif text-[clamp(2.4rem,4vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.025em]">{isEnglish ? "A few facts to make the estimate realistic." : "Quelques repères pour une estimation réaliste."}</h1><p className="mt-5 max-w-[680px] text-[15px] leading-7 text-text-secondary">{isEnglish ? "Answer with what you know today. “Not sure yet” is better than guessing." : "Répondez avec ce que vous savez aujourd’hui. Il vaut mieux choisir « à déterminer » que répondre au hasard."}</p><div className="mt-10 grid gap-9">{PROFILE_FIELDS.filter((field) => field.key !== "investmentRange").map((field) => { const required = PROJECT_PROFILE_CONTRACT[field.key].requiredForEstimate; const helper = PROFILE_HELPERS[field.key]; return <fieldset key={field.key} id={profileDomId(field.key)} tabIndex={-1} className="scroll-mt-24 rounded-xl border-t border-border-subtle pt-7 outline-none focus:ring-2 focus:ring-border-accent/30"><legend><FieldHeading label={isEnglish ? field.label.en : field.label.fr} required={required} isEnglish={isEnglish} /></legend><p className="mt-2 max-w-[700px] text-[12px] leading-5 text-text-muted">{isEnglish ? helper.en : helper.fr}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{field.options.map((option) => <ChoiceButton key={option.value} label={isEnglish ? option.en : option.fr} selected={draft.profile[field.key] === option.value} onClick={() => onChange(field.key, option.value)} />)}</div></fieldset>; })}
    <fieldset className="border-t border-border-subtle pt-7"><legend><FieldHeading label={isEnglish ? "DO YOU ALREADY HAVE A BUDGET RANGE IN MIND?" : "AVEZ-VOUS DÉJÀ UNE FOURCHETTE EN TÊTE ?"} isEnglish={isEnglish} /></legend><p className="mt-2 max-w-[700px] text-[12px] leading-5 text-text-muted">{isEnglish ? PROFILE_HELPERS.investmentRange.en : PROFILE_HELPERS.investmentRange.fr}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><ChoiceButton label={isEnglish ? "Yes, I have a range" : "Oui, j’ai une fourchette"} selected={draft.budgetStatus === "defined"} onClick={() => onBudget({ budgetStatus: "defined", budgetMinXof: draft.budgetMinXof ?? 250_000, budgetMaxXof: draft.budgetMaxXof ?? 1_000_000 })} /><ChoiceButton label={isEnglish ? "Not yet" : "Pas encore"} selected={draft.budgetStatus === "undefined"} onClick={() => onBudget({ budgetStatus: "undefined" })} /></div>{draft.budgetStatus === "defined" ? <div className="mt-6 rounded-2xl border border-border-accent bg-surface-accent-muted p-5"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[1.6px] text-text-accent">{isEnglish ? "YOUR RANGE" : "VOTRE FOURCHETTE"}</p><p className="mt-2 font-serif text-2xl">{formatter.format(draft.budgetMinXof ?? 250_000)} – {formatter.format(draft.budgetMaxXof ?? 1_000_000)} XOF</p></div><p className="text-[11px] text-text-muted">{isEnglish ? "Move the handles or enter both limits" : "Déplacez les poignées ou saisissez les deux limites"}</p></div><GuidedRangeSlider values={BUDGET_STEPS} value={[draft.budgetMinXof ?? 250_000, draft.budgetMaxXof ?? 1_000_000]} labels={{ minimum: isEnglish ? "Minimum" : "Minimum", maximum: isEnglish ? "Maximum" : "Maximum", range: isEnglish ? "Expected budget range" : "Fourchette envisagée" }} formatValue={(value) => formatter.format(value)} onValueChange={([budgetMinXof, budgetMaxXof]) => onBudget({ budgetStatus: "defined", budgetMinXof, budgetMaxXof })} /><p className="mt-4 min-h-[1lh] text-[11px] leading-5 text-text-muted">{isEnglish ? "These limits remain in XOF even if you display the final estimate in another currency." : "Ces limites restent enregistrées en XOF, même si vous affichez ensuite l’estimation dans une autre devise."}</p></div> : null}</fieldset>
  </div></>;
}

function AdaptiveServicesStep({ isEnglish, serviceIds, answers, onAnswer }: { isEnglish: boolean; serviceIds: EstimatorServiceId[]; activeServiceId?: EstimatorServiceId; answers: QuestionnaireAnswers; onActivate: (id: EstimatorServiceId) => void; onAnswer: (key: string, answer: QuestionnaireAnswer | undefined) => void }) {
  const serviceId = serviceIds[0];
  if (!serviceId) return null;
  const service = SERVICES.find((entry) => entry.id === serviceId)!;
  const questionnaire = serviceQuestionnaires[serviceId];
  const progress = getServiceProgress(serviceId, answers);
  const visibleQuestions = getVisibleQuestions(serviceId, answers);
  const Icon = service.Icon;
  return <><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "YOUR NEED" : "VOTRE BESOIN"}</p><h1 id="estimator-step-title" className="mt-5 max-w-[760px] font-serif text-[clamp(2.4rem,4vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.025em]">{isEnglish ? `Let’s scope ${service.en.toLowerCase()}.` : `Précisons le besoin en ${service.fr.toLowerCase()}.`}</h1><p className="mt-5 max-w-[680px] text-[15px] leading-7 text-text-secondary">{isEnglish ? "Only useful questions are shown. Choose “I’m not sure” whenever Carole should make the expert decision later." : "Seules les questions utiles sont affichées. Choisissez « je ne sais pas » lorsque la décision relève plutôt de l’expertise de Carole."}</p>
    <div className="mt-8 rounded-2xl border border-[#854d63]/20 bg-[#fff8fa] p-5 dark:bg-[#332426]"><div className="flex items-center gap-4"><span className="flex size-11 items-center justify-center rounded-xl bg-[#fff0ec] text-text-accent"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{isEnglish ? questionnaire.label.en : questionnaire.label.fr}</p><p className="mt-1 text-[11px] text-text-muted">{progress.remaining === 0 ? (isEnglish ? "All useful information is complete" : "Toutes les informations utiles sont complètes") : (isEnglish ? `${progress.remaining} answer${progress.remaining > 1 ? "s" : ""} left` : `${progress.remaining} réponse${progress.remaining > 1 ? "s" : ""} restante${progress.remaining > 1 ? "s" : ""}`)}</p></div><span className="font-serif text-2xl text-text-accent">{progress.percentage}%</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eadfe2]"><span className="block h-full rounded-full bg-[#854d63] transition-[width]" style={{ width: `${progress.percentage}%` }} /></div></div>
    <section id={`service-panel-${serviceId}`} className="mt-9 border-t border-border-subtle pt-8"><div className="grid gap-8">{visibleQuestions.map((question, index) => <div key={question.key} id={questionDomId(question.key)} tabIndex={-1} className="scroll-mt-24 rounded-xl outline-none transition-[box-shadow] focus:ring-2 focus:ring-border-accent/30"><QuestionField question={question} number={index + 1} answer={answers[question.key]} isEnglish={isEnglish} onAnswer={(answer) => onAnswer(question.key, answer)} /></div>)}</div></section></>;
}

function QuestionField({ question, number, answer, isEnglish, onAnswer }: { question: ServiceQuestion; number: number; answer: QuestionnaireAnswer | undefined; isEnglish: boolean; onAnswer: (answer: QuestionnaireAnswer | undefined) => void }) {
  const label = isEnglish ? question.label.en : question.label.fr;
  const helper = question.helper ? (isEnglish ? question.helper.en : question.helper.fr) : undefined;
  if (question.type === "number") {
    if (question.displayBands?.length) {
      return <fieldset className="rounded-xl border border-border-subtle bg-surface-panel p-5 dark:border-white/10 dark:bg-white/5"><legend className="px-1 text-[14px] font-semibold leading-6 text-text-primary"><span className="mr-2 text-text-accent">{number}.</span>{label}{question.requiredForEstimate ? <><span aria-hidden="true" className="ml-1 text-text-accent">*</span><span className="sr-only"> {isEnglish ? "Required" : "Obligatoire"}</span></> : null}</legend>{helper ? <p className="mt-2 text-[12px] leading-5 text-text-muted">{helper}</p> : null}<p className="mt-3 inline-flex rounded-full bg-surface-page-muted px-3 py-1 text-[10px] font-semibold text-text-muted">{isEnglish ? "Choose one range" : "Choisissez une fourchette"}</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{question.displayBands.map((band) => <ChoiceButton key={band.value} label={isEnglish ? band.label.en : band.label.fr} selected={answer === Number(band.value)} onClick={() => onAnswer(Number(band.value))} />)}</div></fieldset>;
    }
    const hasInvalidAnswer = answer !== undefined && !isNumberQuestionAnswerValid(question, answer);
    const errorId = `${question.key.replace(/[^a-zA-Z0-9_-]/g, "-")}-error`;
    return <fieldset className="rounded-xl border border-border-subtle bg-surface-panel p-5 dark:border-white/10 dark:bg-white/5"><legend className="px-1 text-[14px] font-semibold leading-6 text-text-primary"><span className="mr-2 text-text-accent">{number}.</span>{label}{question.requiredForEstimate ? <><span aria-hidden="true" className="ml-1 text-text-accent">*</span><span className="sr-only"> {isEnglish ? "Required" : "Obligatoire"}</span></> : null}</legend>{helper ? <p className="mt-2 text-[12px] leading-5 text-text-muted">{helper}</p> : null}<label className="mt-4 flex max-w-sm items-center gap-3"><span className="sr-only">{label}</span><input type="number" min={question.number?.min} max={MAX_ESTIMATOR_NUMBER_ANSWER} step={question.number?.step} value={typeof answer === "number" ? answer : ""} aria-invalid={hasInvalidAnswer} aria-describedby={hasInvalidAnswer ? errorId : undefined} onChange={(event) => onAnswer(event.currentTarget.value === "" ? undefined : Number(event.currentTarget.value))} className={`h-12 min-w-0 flex-1 rounded-lg border bg-surface-page px-4 text-[15px] text-text-primary outline-none transition focus:ring-2 ${hasInvalidAnswer ? "border-[#b24d55] focus:border-[#b24d55] focus:ring-[#b24d55]/20" : "border-border-subtle focus:border-[#854d63] focus:ring-[#854d63]/20"}`} /><span className="text-[12px] text-text-muted">{isEnglish ? question.number?.unit.en : question.number?.unit.fr}</span></label>{hasInvalidAnswer ? <p id={errorId} role="alert" className="mt-2 text-[11px] leading-5 text-[#a33e48]">{isEnglish ? `Enter a value from ${question.number?.min ?? 0} to ${MAX_ESTIMATOR_NUMBER_ANSWER.toLocaleString("en-GB")}, in increments of ${question.number?.step ?? 1}.` : `Saisissez une valeur de ${question.number?.min ?? 0} à ${MAX_ESTIMATOR_NUMBER_ANSWER.toLocaleString("fr-FR")}, par pas de ${question.number?.step ?? 1}.`}</p> : null}</fieldset>;
  }
  const selectedValues = Array.isArray(answer) ? answer : [];
  return <fieldset className="rounded-xl border border-border-subtle bg-surface-panel p-5 dark:border-white/10 dark:bg-white/5"><legend className="px-1 text-[14px] font-semibold leading-6 text-text-primary"><span className="mr-2 text-text-accent">{number}.</span>{label}{question.requiredForEstimate ? <><span aria-hidden="true" className="ml-1 text-text-accent">*</span><span className="sr-only"> {isEnglish ? "Required" : "Obligatoire"}</span></> : null}</legend>{helper ? <p className="mt-2 text-[12px] leading-5 text-text-muted">{helper}</p> : null}<p className="mt-3 inline-flex rounded-full bg-surface-page-muted px-3 py-1 text-[10px] font-semibold text-text-muted">{question.type === "multi" ? (isEnglish ? "Several choices possible" : "Plusieurs choix possibles") : (isEnglish ? "One choice" : "Un seul choix")}</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options?.map((option) => { const selected = question.type === "multi" ? selectedValues.includes(option.value) : answer === option.value; return <ChoiceButton key={option.value} label={isEnglish ? option.label.en : option.label.fr} selected={selected} multiple={question.type === "multi"} onClick={() => { if (question.type === "multi") { if (selected) onAnswer(selectedValues.filter((value) => value !== option.value)); else if (option.value === "none") onAnswer(["none"]); else onAnswer([...selectedValues.filter((value) => value !== "none"), option.value]); } else onAnswer(option.value); }} />; })}</div></fieldset>;
}

function ReviewStep({ isEnglish, draft, onNavigate, onReviewQuestion, onReviewProfile }: { isEnglish: boolean; draft: EstimatorDraft; onNavigate: (step: number) => void; onReviewQuestion: (questionKey: string) => void; onReviewProfile: (profileKey: keyof SharedProjectProfile) => void }) {
  const flags = getManualReviewFlags(draft.serviceIds, draft.serviceAnswers);
  const profileFlags = PROFILE_FIELDS.filter((field) => (field.key === "languageScope" || field.key === "validationProcess") && draft.profile[field.key] === "unknown");
  const totalFlags = flags.length + profileFlags.length;
  return <><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "REVIEW" : "VÉRIFICATION"}</p><h1 id="estimator-step-title" className="mt-5 max-w-[760px] font-serif text-[clamp(2.4rem,4vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.025em]">{isEnglish ? "Review your project before calculation." : "Vérifiez votre projet avant le calcul."}</h1><p className="mt-5 max-w-[680px] text-[15px] leading-7 text-text-secondary">{isEnglish ? "All required information is complete. You can revisit any section before displaying the estimate." : "Toutes les informations obligatoires sont complètes. Vous pouvez revenir sur chaque section avant d’afficher l’estimation."}</p>
    <ReviewSection title={isEnglish ? "Project context" : "Contexte du projet"} actionLabel={isEnglish ? "Edit" : "Modifier"} onEdit={() => onNavigate(3)}>{PROFILE_FIELDS.map((field) => { const option = field.options.find((entry) => entry.value === draft.profile[field.key]); return <div key={field.key} className="flex items-start justify-between gap-5 border-b border-border-subtle py-3 last:border-0"><span className="text-[12px] text-text-muted">{isEnglish ? field.label.en : field.label.fr}</span><span className="text-right text-[12px] font-medium text-text-primary">{option ? (isEnglish ? option.en : option.fr) : "—"}</span></div>; })}</ReviewSection>
    <ReviewSection title={isEnglish ? "Retained service" : "Service retenu"} actionLabel={isEnglish ? "Edit" : "Modifier"} onEdit={() => onNavigate(4)}>{draft.serviceIds.map((serviceId) => { const service = SERVICES.find((entry) => entry.id === serviceId)!; const progress = getServiceProgress(serviceId, draft.serviceAnswers); return <div key={serviceId} className="flex items-center justify-between gap-4 border-b border-border-subtle py-3 last:border-0"><span className="text-[13px] font-medium text-text-primary">{isEnglish ? service.en : service.fr}</span><span className="flex items-center gap-2 text-[11px] text-[#3f8c6b]"><CheckCircleIcon className="size-4" />{progress.completed}/{progress.total}</span></div>; })}</ReviewSection>
    {totalFlags > 0 ? <section className="mt-6 rounded-xl border border-border-accent bg-surface-accent-muted p-5" aria-labelledby="manual-review-heading"><div className="flex items-start gap-3"><InformationCircleIcon className="mt-0.5 size-5 shrink-0 text-text-accent" /><div><h2 id="manual-review-heading" className="text-[13px] font-semibold text-text-primary">{isEnglish ? `${totalFlags} answer${totalFlags > 1 ? "s need" : " needs"} a closer look` : `${totalFlags} réponse${totalFlags > 1 ? "s demandent" : " demande"} un cadrage complémentaire`}</h2><p className="mt-1 text-[12px] leading-5 text-text-secondary">{isEnglish ? "These answers are not wrong. They simply need a conversation before a reliable range can be calculated." : "Ces réponses ne sont pas incorrectes. Elles demandent simplement un échange avant de calculer une fourchette fiable."}</p></div></div><div className="mt-5 grid gap-3">{profileFlags.map((field) => { const option = field.options.find((entry) => entry.value === draft.profile[field.key]); return <article key={field.key} className="rounded-lg border border-border-subtle bg-surface-panel p-4"><p className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-accent">{isEnglish ? "Project context" : "Contexte du projet"}</p><h3 className="mt-2 text-[13px] font-semibold leading-5 text-text-primary">{isEnglish ? field.label.en : field.label.fr}</h3><p className="mt-2 text-[12px] leading-5 text-text-muted"><span className="font-medium text-text-secondary">{isEnglish ? "Your answer:" : "Votre réponse :"}</span> {option ? (isEnglish ? option.en : option.fr) : "—"}</p><button type="button" onClick={() => onReviewProfile(field.key)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-border-accent px-4 py-2 text-[11px] font-semibold text-text-accent transition-[background-color] hover:bg-surface-page-muted">{isEnglish ? "View or change this answer" : "Voir ou modifier cette réponse"}<ArrowRightIcon className="size-3.5" /></button></article>; })}{flags.map((flag) => { const copy = getManualReviewFlagCopy(flag, isEnglish); return <article key={`${flag.serviceId}-${flag.questionKey}`} className="rounded-lg border border-border-subtle bg-surface-panel p-4"><p className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-accent">{copy.service}</p><h3 className="mt-2 text-[13px] font-semibold leading-5 text-text-primary">{copy.question}</h3><p className="mt-2 text-[12px] leading-5 text-text-muted"><span className="font-medium text-text-secondary">{isEnglish ? "Your answer:" : "Votre réponse :"}</span> {copy.answer}</p><button type="button" onClick={() => onReviewQuestion(flag.questionKey)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-border-accent px-4 py-2 text-[11px] font-semibold text-text-accent transition-[background-color] hover:bg-surface-page-muted">{isEnglish ? "View or change this answer" : "Voir ou modifier cette réponse"}<ArrowRightIcon className="size-3.5" /></button></article>; })}</div></section> : null}</>;
}

function ReviewSection({ title, actionLabel, onEdit, children }: { title: string; actionLabel: string; onEdit: () => void; children: ReactNode }) {
  return <section className="mt-8 rounded-xl border border-border-subtle bg-surface-panel p-5 dark:border-white/10 dark:bg-white/5"><div className="flex items-center justify-between gap-4"><h2 className="text-[14px] font-semibold text-text-primary">{title}</h2><button type="button" onClick={onEdit} className="text-[12px] font-medium text-text-accent underline-offset-4 hover:underline">{actionLabel}</button></div><div className="mt-4 border-t border-border-subtle">{children}</div></section>;
}

function getSessionStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

function formatManualReviewReason(reason: ManualReviewReason, isEnglish: boolean): string {
  const labels: Record<ManualReviewReason["code"], { fr: string; en: string }> = {
    "no-service-selected": { fr: "Aucun service sélectionné", en: "No service selected" },
    "catalog-not-active": { fr: "Tarification commerciale en cours de validation", en: "Commercial pricing is being validated" },
    "pricing-not-configured": { fr: "Tarification du service à confirmer", en: "Service pricing needs confirmation" },
    "rounding-not-configured": { fr: "Règle d’arrondi à confirmer", en: "Rounding policy needs confirmation" },
    "tax-not-configured": { fr: "Traitement fiscal à confirmer", en: "Tax treatment needs confirmation" },
    "incomplete-profile": { fr: "Contexte projet incomplet", en: "Project context is incomplete" },
    "incomplete-answer": { fr: "Information requise manquante", en: "Required information is missing" },
    "questionnaire-manual-review": { fr: "Réponse à étudier manuellement", en: "Answer requires manual review" },
    "pricing-rule-manual-review": { fr: "Périmètre hors règle automatique", en: "Scope falls outside automatic pricing" },
  };
  const label = labels[reason.code];
  return isEnglish ? label.en : label.fr;
}

function ResultRange({ range, formatter, currency }: { range: XofRange; formatter: Intl.NumberFormat; currency: string }) {
  return <>{formatter.format(range.lower)} – {formatter.format(range.upper)} {currency}</>;
}

function AdjustmentList({ title, adjustments, isEnglish, formatter }: { title: string; adjustments: readonly AppliedAdjustment[]; isEnglish: boolean; formatter: Intl.NumberFormat }) {
  if (adjustments.length === 0) return null;
  return <div className="mt-4 border-t border-border-subtle pt-4"><p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-text-accent">{title}</p><ul className="mt-2 grid gap-2">{adjustments.map((adjustment) => <li key={adjustment.id} className="flex items-start justify-between gap-4 text-[11px] leading-5 text-text-muted"><span>{isEnglish ? adjustment.label.en : adjustment.label.fr}</span><span className="shrink-0 font-medium text-text-secondary"><ResultRange range={adjustment.effectXof} formatter={formatter} currency="XOF" /></span></li>)}</ul></div>;
}

type ScopeDisplayItem = { label: string; value?: string };

function resolveScopeDisplayItem(
  serviceId: EstimatorServiceId,
  input: CalculationScopeEntry["input"],
  value: QuestionnaireAnswer | undefined,
  isEnglish: boolean,
): ScopeDisplayItem | null {
  if (input.scope === "service-question") {
    const question = (serviceQuestionnaires[serviceId].questions as readonly ServiceQuestion[]).find((entry) => entry.key === input.key);
    if (!question) return null;
    const label = isEnglish ? question.label.en : question.label.fr;
    const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
    const formattedValues = values.map((entry) => {
      if (typeof entry === "number") {
        const unit = question.number?.unit;
        return `${new Intl.NumberFormat(isEnglish ? "en-GB" : "fr-FR").format(entry)}${unit ? ` ${isEnglish ? unit.en : unit.fr}` : ""}`;
      }
      const option = question.options?.find((candidate) => candidate.value === entry);
      return option ? (isEnglish ? option.label.en : option.label.fr) : null;
    }).filter((entry): entry is string => Boolean(entry));
    return { label, ...(formattedValues.length > 0 ? { value: formattedValues.join(", ") } : {}) };
  }

  const field = PROFILE_FIELDS.find((entry) => entry.key === input.key);
  if (!field) return null;
  const label = isEnglish ? field.label.en : field.label.fr;
  const option = typeof value === "string" ? field.options.find((entry) => entry.value === value) : undefined;
  return { label, ...(option ? { value: isEnglish ? option.en : option.fr } : {}) };
}

function ScopeRows({ title, entries, serviceId, isEnglish }: { title: string; entries: readonly CalculationScopeEntry[]; serviceId: EstimatorServiceId; isEnglish: boolean }) {
  const rows = entries.map((entry) => resolveScopeDisplayItem(serviceId, entry.input, entry.value, isEnglish)).filter((entry): entry is ScopeDisplayItem => Boolean(entry));
  if (rows.length === 0) return null;
  return <div><p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-text-accent">{title}</p><ul className="mt-2 grid gap-2">{rows.map((row, index) => <li key={`${row.label}-${index}`} className="text-[11px] leading-5 text-text-muted"><span>{row.label}</span>{row.value ? <span className="block font-medium text-text-secondary">{row.value}</span> : null}</li>)}</ul></div>;
}

function ScopeExclusionRows({ entries, serviceId, isEnglish }: { entries: readonly CalculationScopeExclusion[]; serviceId: EstimatorServiceId; isEnglish: boolean }) {
  const reasonLabels = {
    "explicit-exclusion": { fr: "Non inclus selon votre réponse", en: "Not included based on your answer" },
    "not-provided": { fr: "Non renseigné", en: "Not provided" },
    "brief-prefill-only": { fr: "Réservé au Brief client", en: "Reserved for the Client Brief" },
  } as const;
  const rows = entries.flatMap<ScopeDisplayItem & { reason: string }>((entry) => {
    const item = resolveScopeDisplayItem(serviceId, entry.input, entry.value, isEnglish);
    if (!item) return [];
    return [{ ...item, reason: isEnglish ? reasonLabels[entry.reason].en : reasonLabels[entry.reason].fr }];
  });
  if (rows.length === 0) return null;
  return <div><p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-text-accent">{isEnglish ? "Exclusions" : "Exclusions"}</p><ul className="mt-2 grid gap-2">{rows.map((row, index) => <li key={`${row.label}-${index}`} className="text-[11px] leading-5 text-text-muted"><span>{row.label}</span>{row.value ? <span className="block font-medium text-text-secondary">{row.value}</span> : null}<span className="block text-[10px]">{row.reason}</span></li>)}</ul></div>;
}

function CalculationScopeDetails({ estimate, isEnglish }: { estimate: ServiceEstimate; isEnglish: boolean }) {
  const scope = estimate.calculationScope;
  const claimed = new Set<string>();
  const unique = (entries: readonly CalculationScopeEntry[]) => entries.filter((entry) => {
    const key = `${entry.input.scope}:${entry.input.key}`;
    if (claimed.has(key)) return false;
    claimed.add(key);
    return true;
  });
  const baseEntries = unique(scope.baseScope.entries);
  const volumeEntries = unique(scope.volumes);
  const optionEntries = unique(scope.options);
  const inclusionEntries = unique(scope.inclusions);
  const hasContent = baseEntries.length + volumeEntries.length + optionEntries.length + inclusionEntries.length + scope.exclusions.length > 0;
  if (!hasContent) return null;

  return <details className="mt-4 border-t border-border-subtle pt-4"><summary className="cursor-pointer text-[11px] font-semibold text-text-accent marker:text-text-accent">{isEnglish ? "Calculation scope" : "Périmètre pris en compte"}</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><ScopeRows title={isEnglish ? "Base scope" : "Périmètre de base"} entries={baseEntries} serviceId={estimate.serviceId} isEnglish={isEnglish} /><ScopeRows title={isEnglish ? "Volumes" : "Volumes"} entries={volumeEntries} serviceId={estimate.serviceId} isEnglish={isEnglish} /><ScopeRows title={isEnglish ? "Options" : "Options"} entries={optionEntries} serviceId={estimate.serviceId} isEnglish={isEnglish} /><ScopeRows title={isEnglish ? "Other inclusions" : "Autres inclusions"} entries={inclusionEntries} serviceId={estimate.serviceId} isEnglish={isEnglish} /><ScopeExclusionRows entries={scope.exclusions} serviceId={estimate.serviceId} isEnglish={isEnglish} /></div></details>;
}

function ServiceResultCard({ service, result, estimate, currency, isEnglish, displayFormatter, xofFormatter }: { service: ServiceDefinition; result: EstimateResult; estimate: ServiceEstimate | undefined; currency: EstimatorCurrency; isEnglish: boolean; displayFormatter: Intl.NumberFormat; xofFormatter: Intl.NumberFormat }) {
  const Icon = service.Icon;
  let range: XofRange | null = estimate?.rangeXof ?? null;
  let rangeCurrency: EstimatorCurrency = "XOF";
  let formatter = xofFormatter;
  if (range && currency !== "XOF" && result.displayRange) {
    range = {
      lower: range.lower / result.displayRange.xofPerUnit,
      upper: range.upper / result.displayRange.xofPerUnit,
    };
    rangeCurrency = currency;
    formatter = displayFormatter;
  }

  return <article className="rounded-xl border border-border-subtle bg-surface-panel p-5 dark:border-white/10 dark:bg-white/5"><div className="flex items-start gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#fff0ec] text-text-accent dark:bg-[#854d63]/25"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><h3 className="text-[14px] font-semibold">{isEnglish ? service.en : service.fr}</h3><p className="mt-2 text-[12px] font-medium leading-5 text-text-secondary">{range ? <ResultRange range={range} formatter={formatter} currency={rangeCurrency} /> : (isEnglish ? "Manual review required" : "Étude manuelle requise")}</p>{range && currency !== "XOF" && !result.displayRange ? <p className="mt-1 text-[10px] leading-4 text-text-muted">{isEnglish ? "Shown in XOF because the global conversion is unavailable for this partial estimate." : "Affichée en XOF, car la conversion globale n’est pas disponible pour cette estimation partielle."}</p> : null}</div></div>
    <AdjustmentList title={isEnglish ? "Scope adjustments" : "Ajustements de périmètre"} adjustments={estimate?.appliedAdjustments ?? []} isEnglish={isEnglish} formatter={xofFormatter} />
    {estimate ? <CalculationScopeDetails estimate={estimate} isEnglish={isEnglish} /> : null}
    {estimate && estimate.manualReviewReasons.length > 0 ? <div className="mt-4 border-t border-border-subtle pt-4"><p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-text-accent">{isEnglish ? "Outside automatic calculation" : "Hors calcul automatique"}</p><ul className="mt-2 grid gap-2 text-[11px] leading-5 text-text-muted">{estimate.manualReviewReasons.map((reason, index) => <li key={`${reason.code}-${reason.questionKey ?? index}`}>{formatManualReviewReason(reason, isEnglish)}</li>)}</ul></div> : null}
  </article>;
}

function getEstimateStateCopy(state: EstimateFailureState, isEnglish: boolean) {
  const copies: Record<EstimateFailureState, { eyebrow: string; title: string; body: string; action: "retry" | "review" | "service" | "demo"; actionLabel: string }> = isEnglish ? {
    calibration: { eyebrow: "PRICING REFERENCE UNAVAILABLE", title: "This service’s pricing grid is not active yet.", body: "Your answers are complete, but the secure calculator cannot produce a reliable range until the pricing reference is published. You can review the retained service or try again later.", action: "service", actionLabel: "Review the service" },
    "rate-limited": { eyebrow: "TOO MANY CLOSE ATTEMPTS", title: "The calculator needs a pause.", body: "Several calculations were requested in a short period. Your answers are saved on this device. Wait about ten minutes, then try again.", action: "retry", actionLabel: "Try again later" },
    "invalid-input": { eyebrow: "ANSWERS TO REVIEW", title: "Some answers could not be read correctly.", body: "This can happen after an older saved draft is restored. Return to the review, confirm the displayed answers, then launch the calculation again.", action: "review", actionLabel: "Review my answers" },
    "save-failed": { eyebrow: "ESTIMATE NOT SAVED", title: "The calculation completed, but the result was not saved.", body: "No definitive copy was created on the server. Your draft is still available on this device, so you can safely try the calculation again.", action: "retry", actionLabel: "Calculate again" },
    "local-preview": { eyebrow: "LOCAL PREVIEW", title: "Secure calculation is not running in this local preview.", body: "Your answers are not the cause. Use a fictional demo result to review the end of the journey here, or run the calculation from the connected online preview.", action: "demo", actionLabel: "Show a demo result" },
    connection: { eyebrow: "CONNECTION INTERRUPTED", title: "The calculator could not reach the secure service.", body: "Check your internet connection, then try again. Your answers remain saved on this device.", action: "retry", actionLabel: "Try again" },
    unavailable: { eyebrow: "SERVICE TEMPORARILY UNAVAILABLE", title: "The secure calculator did not respond.", body: "The problem comes from the calculation service, not from your answers. They remain saved on this device. Try again now or return to the review if you want to make changes.", action: "retry", actionLabel: "Try again" },
  } : {
    calibration: { eyebrow: "RÉFÉRENTIEL TARIFAIRE INDISPONIBLE", title: "La grille tarifaire de ce service n’est pas encore active.", body: "Vos réponses sont complètes, mais le calculateur sécurisé ne peut pas produire une fourchette fiable tant que le référentiel n’est pas publié. Vous pouvez revoir le service retenu ou réessayer plus tard.", action: "service", actionLabel: "Revoir le service" },
    "rate-limited": { eyebrow: "TENTATIVES TROP RAPPROCHÉES", title: "Le calculateur a besoin d’une pause.", body: "Plusieurs calculs ont été demandés en peu de temps. Vos réponses sont sauvegardées sur cet appareil. Attendez environ dix minutes, puis réessayez.", action: "retry", actionLabel: "Réessayer plus tard" },
    "invalid-input": { eyebrow: "RÉPONSES À VÉRIFIER", title: "Certaines réponses n’ont pas pu être relues correctement.", body: "Cela peut arriver après la reprise d’un ancien brouillon. Revenez à la vérification, confirmez les réponses affichées, puis relancez le calcul.", action: "review", actionLabel: "Vérifier mes réponses" },
    "save-failed": { eyebrow: "ESTIMATION NON ENREGISTRÉE", title: "Le calcul a abouti, mais le résultat n’a pas été enregistré.", body: "Aucune copie définitive n’a été créée sur le serveur. Votre brouillon reste disponible sur cet appareil : vous pouvez relancer le calcul sans perdre vos réponses.", action: "retry", actionLabel: "Relancer le calcul" },
    "local-preview": { eyebrow: "PRÉVISUALISATION LOCALE", title: "Le calcul sécurisé n’est pas exécuté dans cet aperçu local.", body: "Vos réponses ne sont pas en cause. Affichez un résultat fictif pour contrôler la fin du parcours ici, ou lancez le calcul depuis la prévisualisation en ligne connectée.", action: "demo", actionLabel: "Voir un résultat de démonstration" },
    connection: { eyebrow: "CONNEXION INTERROMPUE", title: "Le calculateur n’a pas pu joindre le service sécurisé.", body: "Vérifiez votre connexion internet, puis réessayez. Vos réponses restent sauvegardées sur cet appareil.", action: "retry", actionLabel: "Réessayer" },
    unavailable: { eyebrow: "SERVICE TEMPORAIREMENT INDISPONIBLE", title: "Le calculateur sécurisé n’a pas répondu.", body: "Le problème vient du service de calcul, pas de vos réponses. Elles restent sauvegardées sur cet appareil. Réessayez maintenant ou revenez à la vérification si vous souhaitez les ajuster.", action: "retry", actionLabel: "Réessayer" },
  };
  return copies[state];
}

function SummaryStep({ isEnglish, draft, selectedServices, onNavigate, onReviewQuestion, onReviewProfile, onUseDemo }: { isEnglish: boolean; draft: EstimatorDraft; selectedServices: ServiceDefinition[]; onNavigate: (step: number) => void; onReviewQuestion: (questionKey: string) => void; onReviewProfile: (profileKey: keyof SharedProjectProfile) => void; onUseDemo: () => void }) {
  const filteredAnswers = useMemo(() => filterAnswersForSelectedServices(draft.serviceIds, draft.serviceAnswers), [draft.serviceAnswers, draft.serviceIds]);
  const inputSignature = useMemo(() => buildEstimateInputSignature({ serviceIds: draft.serviceIds, currency: draft.currency, answers: filteredAnswers, profile: draft.profile }), [draft.currency, draft.profile, draft.serviceIds, filteredAnswers]);
  const generation = useMemo(() => resolveEstimateGeneration(getSessionStorage(), inputSignature, () => crypto.randomUUID()), [inputSignature]);
  const [serverResult, setServerResult] = useState<EstimateResult | null>(null);
  const [sessionMetadata, setSessionMetadata] = useState<EstimateSessionMetadata | null>(null);
  const [requestState, setRequestState] = useState<"loading" | "ready" | EstimateFailureState>("loading");
  const [invalidKeys, setInvalidKeys] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [calculationStageComplete, setCalculationStageComplete] = useState(false);

  useEffect(() => {
    setCalculationStageComplete(false);
  }, [inputSignature, retryCount]);

  useEffect(() => {
    const controller = new AbortController();
    let didTimeout = false;
    const requestTimeout = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, 15_000);
    if (draft.demoScenario && draft.serviceIds[0]) {
      window.clearTimeout(requestTimeout);
      setServerResult(buildDemoResult(draft.serviceIds[0], draft.currency));
      setSessionMetadata(null);
      setRequestState("ready");
      return () => controller.abort();
    }
    setRequestState("loading");
    setInvalidKeys([]);
    setServerResult(null);
    setSessionMetadata(null);

    fetch("/api/project-estimate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": generation.idempotencyKey,
      },
      body: JSON.stringify({
        serviceIds: draft.serviceIds,
        currency: draft.currency,
        answers: filteredAnswers,
        profile: draft.profile,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.headers.get("content-type")?.includes("application/json")) {
          throw new Error("invalid_response");
        }
        const body = await response.json() as Partial<EstimateSessionMetadata> & { estimate?: EstimateResult; error?: string; details?: unknown };
        if (!response.ok) {
          if (Array.isArray(body.details)) setInvalidKeys(body.details.filter((entry): entry is string => typeof entry === "string").slice(0, 8));
          throw new Error(body.error ?? "estimate_unavailable");
        }
        if (!body.estimate || typeof body.estimateId !== "string" || typeof body.estimateToken !== "string" || typeof body.expiresAt !== "string") throw new Error("estimate_unavailable");
        const metadata = { estimateId: body.estimateId, estimateToken: body.estimateToken, expiresAt: body.expiresAt, serviceIds: [...draft.serviceIds] };
        saveEstimateSessionMetadata(getSessionStorage(), inputSignature, metadata);
        setServerResult(body.estimate);
        setSessionMetadata(metadata);
        setRequestState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError" && !didTimeout) return;
        const errorCode = didTimeout ? "request_timeout" : error instanceof Error ? error.message : undefined;
        setRequestState(classifyEstimateFailure(errorCode, { isDevelopment: import.meta.env.DEV, isOnline: typeof navigator === "undefined" ? true : navigator.onLine }));
      })
      .finally(() => window.clearTimeout(requestTimeout));

    return () => {
      window.clearTimeout(requestTimeout);
      controller.abort();
    };
  }, [draft.currency, draft.demoScenario, draft.profile, draft.serviceIds, filteredAnswers, generation.idempotencyKey, inputSignature, retryCount]);

  const result = serverResult;
  const displayFormatter = useMemo(() => new Intl.NumberFormat(isEnglish ? "en-GB" : "fr-FR", { maximumFractionDigits: draft.currency === "XOF" ? 0 : 2 }), [draft.currency, isEnglish]);
  const xofFormatter = useMemo(() => new Intl.NumberFormat(isEnglish ? "en-GB" : "fr-FR", { maximumFractionDigits: 0 }), [isEnglish]);
  const rangeLabel = result?.displayRange ? `${displayFormatter.format(result.displayRange.lower)} – ${displayFormatter.format(result.displayRange.upper)} ${draft.currency}` : null;
  if (!calculationStageComplete) {
    return <EstimateCalculationStage isEnglish={isEnglish} ready={requestState !== "loading"} onComplete={() => setCalculationStageComplete(true)} />;
  }

  const retryEstimate = () => {
    setCalculationStageComplete(false);
    setRetryCount((count) => count + 1);
  };

  const failureCopy = requestState !== "ready" && requestState !== "loading" ? getEstimateStateCopy(requestState, isEnglish) : null;
  const heading = rangeLabel
    ? (isEnglish ? "Your indicative estimate." : "Votre estimation indicative.")
    : requestState === "ready"
      ? (isEnglish ? "This project needs a closer look." : "Ce projet mérite une étude plus précise.")
      : failureCopy?.title ?? (isEnglish ? "The estimate is temporarily unavailable." : "L’estimation est temporairement indisponible.");
  const introduction = rangeLabel
    ? (isEnglish ? "This range concerns the single retained service and reflects the context you described." : "Cette fourchette concerne uniquement le service retenu et tient compte du contexte que vous avez décrit.")
    : requestState === "ready"
      ? (isEnglish ? "Some of your choices need Carole’s judgement before a reliable range can be shown." : "Certains de vos choix demandent le regard de Carole avant de présenter une fourchette fiable.")
      : undefined;
  const runFailureAction = () => {
    if (!failureCopy) return;
    if (failureCopy.action === "review" && invalidKeys[0]) {
      const profileField = PROFILE_FIELDS.find((entry) => entry.key === invalidKeys[0]);
      if (profileField) {
        onReviewProfile(profileField.key);
        return;
      }
      const question = SERVICES.flatMap((service) => serviceQuestionnaires[service.id].questions as readonly ServiceQuestion[]).find((entry) => entry.key === invalidKeys[0]);
      if (question) {
        onReviewQuestion(question.key);
        return;
      }
    }
    if (failureCopy.action === "demo") onUseDemo();
    else if (failureCopy.action === "review") onNavigate(5);
    else if (failureCopy.action === "service") onNavigate(2);
    else retryEstimate();
  };

  return <><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "ESTIMATE" : "ESTIMATION"}</p><h1 id="estimator-step-title" className="mt-5 max-w-[800px] font-serif text-[clamp(2.4rem,4vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.025em]">{heading}</h1>{introduction ? <p className="mt-5 max-w-[680px] text-[15px] leading-7 text-text-secondary">{introduction}</p> : null}
    <section className="mt-8 rounded-xl border border-border-accent bg-surface-accent-muted p-6" aria-live="polite"><p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-text-accent">{rangeLabel ? (isEnglish ? "INDICATIVE RANGE" : "FOURCHETTE INDICATIVE") : requestState === "ready" ? (isEnglish ? "PERSONALISED REVIEW" : "ÉTUDE PERSONNALISÉE") : failureCopy?.eyebrow}</p>{rangeLabel ? <><p className="mt-3 font-serif text-[clamp(2rem,4vw,3rem)] leading-none text-text-primary">{rangeLabel}</p><p className="mt-3 text-[11px] leading-5 text-text-muted">{isEnglish ? "Indicative range, not a contractual quote." : "Fourchette indicative, sans valeur de devis contractuel."}</p></> : requestState === "ready" ? <><h2 className="mt-3 text-[17px] font-semibold text-text-primary">{isEnglish ? "Carole will need to review one or more choices" : "Carole devra relire un ou plusieurs choix"}</h2><p className="mt-2 max-w-[620px] text-[13px] leading-6 text-text-secondary">{isEnglish ? "Use the links below to identify the exact answers concerned and adjust them if needed." : "Les liens ci-dessous indiquent précisément les réponses concernées et permettent de les ajuster si nécessaire."}</p></> : failureCopy ? <><h2 className="mt-3 text-[17px] font-semibold text-text-primary">{failureCopy.title}</h2><p className="mt-2 max-w-[640px] text-[13px] leading-6 text-text-secondary">{failureCopy.body}</p>{requestState === "invalid-input" && invalidKeys[0] ? <p className="mt-3 rounded-lg bg-surface-panel px-4 py-3 text-[12px] font-medium text-text-primary">{isEnglish ? "The button below will take you directly to the first answer concerned." : "Le bouton ci-dessous vous ramènera directement à la première réponse concernée."}</p> : null}<div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={requestState === "rate-limited"} onClick={runFailureAction} className="inline-flex h-11 items-center justify-center rounded-full bg-action-accent px-5 text-[12px] font-semibold text-white transition hover:bg-action-accent-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-action-accent">{requestState === "invalid-input" && invalidKeys[0] ? (isEnglish ? "Correct this answer" : "Corriger cette réponse") : failureCopy.actionLabel}</button>{failureCopy.action !== "review" ? <button type="button" onClick={() => onNavigate(5)} className="inline-flex h-11 items-center justify-center rounded-full border border-border-accent px-5 text-[12px] font-semibold text-text-accent transition hover:bg-surface-panel">{isEnglish ? "Review my answers" : "Revoir mes réponses"}</button> : null}</div></> : null}</section>

    {result ? <>
      <section className="mt-8"><h2 className="text-[11px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "RETAINED SERVICE" : "SERVICE RETENU"}</h2><div className="mt-4">{selectedServices.map((service) => <ServiceResultCard key={service.id} service={service} result={result} estimate={result.services.find((entry) => entry.serviceId === service.id)} currency={draft.currency} isEnglish={isEnglish} displayFormatter={displayFormatter} xofFormatter={xofFormatter} />)}</div></section>

      <section className="mt-8 border-y border-border-subtle bg-surface-page-muted px-5 py-7 sm:px-7" aria-labelledby="carole-method-heading">
        <p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "CAROLE’S METHOD" : "MÉTHODE CAROLE"}</p>
        <h2 id="carole-method-heading" className="mt-3 font-serif text-[clamp(1.65rem,3vw,2.15rem)] font-normal leading-tight text-text-primary">{isEnglish ? "A range shaped around your project" : "Une fourchette construite autour de votre projet"}</h2>
        <p className="mt-3 max-w-[64ch] text-[16px] leading-7 text-text-secondary">{isEnglish ? "This estimate considers the retained service, the scale of the project and your context. It draws on Carole’s experience in Benin, enriched by regional and international reference points. It remains indicative and non-contractual." : "Cette estimation tient compte du service retenu, de l’ampleur du projet et de votre contexte. Elle s’appuie sur l’expérience de Carole au Bénin, enrichie par des repères régionaux et internationaux. Elle reste indicative et non contractuelle."}</p>
      </section>

      {result.manualReviewReasons.length > 0 ? <section className="mt-8 rounded-xl border border-border-accent bg-surface-page-muted p-5"><h2 className="text-[11px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "POINTS TO DISCUSS" : "POINTS À ÉCHANGER"}</h2><ul className="mt-4 grid gap-3">{result.manualReviewReasons.map((reason, index) => { const question = reason.serviceId && reason.questionKey ? serviceQuestionnaires[reason.serviceId]?.questions.find((entry) => entry.key === reason.questionKey) : undefined; const profileField = reason.profileKey ? PROFILE_FIELDS.find((entry) => entry.key === reason.profileKey) : undefined; const title = question ? question.label[isEnglish ? "en" : "fr"] : profileField ? profileField.label[isEnglish ? "en" : "fr"] : formatManualReviewReason(reason, isEnglish); return <li key={`${reason.code}-${reason.serviceId ?? "global"}-${reason.questionKey ?? reason.profileKey ?? index}`} className="rounded-lg border border-border-subtle bg-surface-panel p-4"><p className="text-[12px] font-semibold leading-5 text-text-primary">{title}</p>{question ? <button type="button" onClick={() => onReviewQuestion(question.key)} className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-text-accent underline-offset-4 hover:underline">{isEnglish ? "View or edit this answer" : "Voir ou modifier cette réponse"}<ArrowRightIcon className="size-3.5" /></button> : profileField ? <button type="button" onClick={() => onReviewProfile(profileField.key)} className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-text-accent underline-offset-4 hover:underline">{isEnglish ? "View or edit this answer" : "Voir ou modifier cette réponse"}<ArrowRightIcon className="size-3.5" /></button> : null}</li>; })}</ul></section> : null}

      <section className="mt-10 border-t border-border-subtle pt-8"><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "OPTIONAL NEXT STEP" : "POUR ALLER PLUS LOIN"}</p><h2 className="mt-3 font-serif text-[clamp(1.8rem,3vw,2.35rem)] font-normal leading-tight">{isEnglish ? "Would you like to compose the related Client Brief?" : "Souhaitez-vous composer le Brief client associé ?"}</h2><p className="mt-3 max-w-[640px] text-[13px] leading-6 text-text-secondary">{isEnglish ? "This is optional. Compatible answers will be prefilled and you can complete the document at your own pace." : "Cette étape est facultative. Les réponses compatibles seront préremplies et vous pourrez compléter le document à votre rythme."}</p><div className="mt-6">{selectedServices.map((service) => { const Icon = service.Icon; const template = getClientBriefTemplate(service.id)!; const prefillCount = Object.keys(buildClientBriefPrefill(template, { profile: draft.profile, serviceAnswers: draft.serviceAnswers }).answers).length; const status = clientBriefStatus(service.id, sessionMetadata?.estimateId); const statusLabel = isEnglish ? ({ "not-started": "Not started", draft: "Draft", ready: "Ready", exported: "Downloaded", submitted: "Submitted" }[status]) : ({ "not-started": "Non commencé", draft: "Brouillon", ready: "Prêt", exported: "Téléchargé", submitted: "Soumis" }[status]); return <Link key={service.id} to={`/services/${SERVICE_BRIEF_SLUGS[service.id]}/brief-client?source=estimate`} className="group block rounded-xl border border-border-subtle bg-surface-panel p-5 transition hover:border-[#854d63]/45 dark:border-white/10 dark:bg-white/5"><div className="flex items-start gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#fff0ec] text-text-accent dark:bg-[#854d63]/25"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-[1.6px] text-text-accent">{isEnglish ? "CLIENT BRIEF" : "BRIEF CLIENT"}</p><span className="rounded-full bg-surface-page-muted px-2.5 py-1 text-[9px] font-semibold text-text-muted">{statusLabel}</span></div><h3 className="mt-1 text-[14px] font-semibold">{isEnglish ? service.en : service.fr}</h3><p className="mt-2 text-[12px] leading-5 text-text-muted">{isEnglish ? `${prefillCount} compatible fields ready to review` : `${prefillCount} champs compatibles prêts à relire`}</p></div><ArrowRightIcon className="mt-2 size-4 shrink-0 text-text-accent transition group-hover:translate-x-1" /></div></Link>; })}</div></section>
    </> : null}</>;
}

function ProjectSummaryContent({ isEnglish, draft, draftSaved, selectedServices, globalProgress, onEditCurrency, onEditServices }: { isEnglish: boolean; draft: EstimatorDraft; draftSaved: boolean; selectedServices: ServiceDefinition[]; globalProgress: ReturnType<typeof getQuestionnaireProgress>; onEditCurrency: () => void; onEditServices: () => void }) {
  const service = selectedServices[0];
  const Icon = service?.Icon;
  return <><p className="text-[11px] font-semibold uppercase tracking-[2.4px] text-text-accent">{isEnglish ? "YOUR PROJECT SUMMARY" : "RÉCAPITULATIF DU PROJET"}</p><div className="mt-7 flex items-start gap-3 border-b border-border-subtle pb-7"><CheckCircleIcon className={`mt-0.5 size-5 shrink-0 ${draftSaved ? "text-[#4a9a77]" : "text-text-muted"}`} /><div><p className={`text-[13px] font-medium ${draftSaved ? "text-[#3f8c6b]" : "text-text-muted"}`}>{draftSaved ? (isEnglish ? "Draft saved" : "Brouillon sauvegardé") : (isEnglish ? "Local save unavailable" : "Sauvegarde locale indisponible")}</p><p className="mt-1 text-[12px] text-text-muted">{isEnglish ? "You can resume it on this device" : "Vous pourrez le reprendre sur cet appareil"}</p></div></div><div className="border-b border-border-subtle py-7"><div className="flex items-center justify-between gap-4"><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "RETAINED SERVICE" : "SERVICE RETENU"}</p><button type="button" onClick={onEditServices} className="text-[12px] font-medium text-text-accent hover:underline">{isEnglish ? "Edit" : "Modifier"}</button></div>{service && Icon ? <div className="mt-5 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl border border-[#eadbd7] bg-[#fff5f2]"><Icon className="size-4" /></span><span className="text-[12px] font-semibold">{isEnglish ? service.en : service.fr}</span></div> : <p className="mt-4 text-[12px] text-text-muted">{isEnglish ? "No service retained yet." : "Aucun service retenu pour le moment."}</p>}</div><div className="border-b border-border-subtle py-7"><div className="flex items-center justify-between gap-4"><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "CURRENCY" : "DEVISE"}</p><button type="button" onClick={onEditCurrency} className="text-[12px] font-medium text-text-accent hover:underline">{isEnglish ? "Edit" : "Modifier"}</button></div><p className="mt-3 font-serif text-2xl">{draft.currency}</p></div><div className="border-b border-border-subtle py-7"><p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "PROGRESS" : "AVANCEMENT"}</p><div className="mt-4 flex items-end justify-between"><span className="font-serif text-3xl">{globalProgress.percentage}%</span><span className="text-[11px] text-text-muted">{globalProgress.completed}/{globalProgress.total}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border-subtle"><span className="block h-full rounded-full bg-[#854d63]" style={{ width: `${globalProgress.percentage}%` }} /></div></div><div className="mt-7 flex gap-4 rounded-xl bg-[#fff4ef] p-4 dark:bg-white/5"><DocumentTextIcon className="size-5 shrink-0 text-[#6f5f95]" /><p className="text-[12px] leading-5 text-text-secondary">{isEnglish ? "After the estimate, you may choose to complete the related Client Brief. Compatible answers will already be prefilled." : "Après l’estimation, vous pourrez choisir de compléter le Brief client associé. Les réponses compatibles seront déjà préremplies."}</p></div></>;
}

function ProjectSidebar({ isEnglish, draft, draftSaved, selectedServices, globalProgress, open, onClose, onEditCurrency, onEditServices }: { isEnglish: boolean; draft: EstimatorDraft; draftSaved: boolean; selectedServices: ServiceDefinition[]; globalProgress: ReturnType<typeof getQuestionnaireProgress>; open: boolean; onClose: () => void; onEditCurrency: () => void; onEditServices: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const compactQuery = window.matchMedia("(max-width: 1279px)");
    if (!compactQuery.matches) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const releaseScroll = lockBodyScroll();
    closeButtonRef.current?.focus();
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeys);
    compactQuery.addEventListener("change", closeAtDesktop);
    return () => {
      document.removeEventListener("keydown", handleKeys);
      compactQuery.removeEventListener("change", closeAtDesktop);
      releaseScroll();
      previousFocusRef.current?.focus();
    };
  }, [open]);
  const content = <ProjectSummaryContent isEnglish={isEnglish} draft={draft} draftSaved={draftSaved} selectedServices={selectedServices} globalProgress={globalProgress} onEditCurrency={onEditCurrency} onEditServices={onEditServices} />;
  return <><aside className="hidden border-l border-border-subtle bg-surface-page-muted px-10 py-14 xl:block">{content}</aside><AnimatePresence>{open ? <motion.div className="fixed inset-0 z-50 xl:hidden"><motion.button type="button" aria-label={isEnglish ? "Close summary" : "Fermer le récapitulatif"} className="absolute inset-0 bg-text-primary/30 backdrop-blur-[2px]" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} /><motion.aside ref={drawerRef} id="project-summary-drawer" role="dialog" aria-modal="true" aria-label={isEnglish ? "Project summary" : "Récapitulatif du projet"} className="absolute inset-y-0 right-0 w-[min(92vw,420px)] overflow-y-auto border-l border-border-subtle bg-surface-page-muted px-6 pb-10 pt-5 shadow-panel sm:px-8" initial={{ x: "100%", opacity: 0.65, filter: "blur(3px)" }} animate={{ x: 0, opacity: 1, filter: "blur(0px)" }} exit={{ x: "100%", opacity: 0.5, filter: "blur(3px)" }} transition={{ type: "spring", stiffness: 330, damping: 34, mass: 0.8 }}><div className="mb-7 flex items-center justify-between border-b border-border-subtle pb-5"><span className="text-[10px] font-semibold uppercase tracking-[2px] text-text-muted">{isEnglish ? "At a glance" : "En un coup d’œil"}</span><button ref={closeButtonRef} type="button" onClick={onClose} className="flex size-10 items-center justify-center rounded-full border border-border-subtle bg-surface-panel text-text-primary transition hover:border-border-accent hover:text-text-accent" aria-label={isEnglish ? "Close" : "Fermer"}><XMarkIcon className="size-5" /></button></div>{content}</motion.aside></motion.div> : null}</AnimatePresence></>;
}

function FieldHeading({ id, label, required = false, isEnglish = false }: { id?: string; label: string; required?: boolean; isEnglish?: boolean }) {
  return <h2 id={id} className="text-[11px] font-semibold uppercase tracking-[2px] text-text-accent">{label}{required ? <><span aria-hidden="true" className="ml-1">*</span><span className="sr-only"> {isEnglish ? "Required" : "Obligatoire"}</span></> : null}</h2>;
}

export default ProjectEstimator;
