import {
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  ExclamationCircleIcon,
  EyeDropperIcon,
  LinkIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "../../lib/supabase";
import { PAGE_MAIN } from "../components/layout/publicPage";
import { useSeoOverride } from "../seo/SeoOverrideContext";

type QuestionType = "choice" | "multi" | "text" | "textarea";
type AnswerValue = string | string[];
type Answers = Record<string, AnswerValue>;
type SubmitState = "idle" | "review" | "submitting" | "success" | "error";

type Question = {
  id: string;
  label: string;
  helper?: string;
  type: QuestionType;
  options?: string[];
  placeholder?: string;
  dependsOn?: (answers: Answers) => boolean;
};

type Section = {
  id: string;
  title: string;
  intro: string;
  questions: Question[];
};

type LogoStyle = {
  id: string;
  name: string;
  description: string;
  examples: string;
  image: string;
};

type InspirationFile = {
  file: File;
  previewUrl: string;
};

type StoredDraft = {
  answers?: Answers;
  colors?: Array<string | null>;
};

declare global {
  interface Window {
    EyeDropper?: new () => {
      open: () => Promise<{ sRGBHex: string }>;
    };
  }
}

const STORAGE_KEY = "carole-design-brief";
const EMPTY_COLORS = [null, null, null, null, null] as Array<string | null>;

const logoStyles: LogoStyle[] = [
  {
    id: "Logotype / wordmark",
    name: "Logotype",
    description: "Le nom devient le signe principal.",
    examples: "Google, Coca-Cola, Disney, Canon",
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  },
  {
    id: "Marque picturale",
    name: "Marque picturale",
    description: "Une icône reconnaissable porte la marque.",
    examples: "Apple, Shell, Dropbox",
    image: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  },
  {
    id: "Logo abstrait",
    name: "Logo abstrait",
    description: "Une forme propriétaire, moins littérale.",
    examples: "Nike, Pepsi, Spotify",
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
  },
  {
    id: "Lettrine",
    name: "Lettrine",
    description: "Des initiales simples structurent l'identité.",
    examples: "NASA, H&M, BBC",
    image: "https://upload.wikimedia.org/wikipedia/commons/2/24/LEGO_logo.svg",
  },
  {
    id: "Lettre unique",
    name: "Lettre unique",
    description: "Une seule lettre devient un signe fort.",
    examples: "Netflix, Tesla, WordPress",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
  },
  {
    id: "Monogramme",
    name: "Monogramme",
    description: "Des lettres entrelacées donnent une perception plus premium.",
    examples: "Louis Vuitton, Chanel, YSL",
    image: "",
  },
  {
    id: "Mascotte",
    name: "Mascotte",
    description: "Un personnage incarne l'univers de marque.",
    examples: "KFC, Michelin, Reddit",
    image: "https://upload.wikimedia.org/wikipedia/en/5/57/KFC_logo-image.svg",
  },
  {
    id: "Marque combinée",
    name: "Marque combinée",
    description: "Nom et symbole fonctionnent ensemble.",
    examples: "Lacoste, Amazon, NBA, NBC",
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  },
  {
    id: "Emblème",
    name: "Emblème",
    description: "Texte et symbole sont intégrés dans une forme.",
    examples: "Starbucks, Harley-Davidson, NFL",
    image: "https://upload.wikimedia.org/wikipedia/en/d/d3/Starbucks_Corporation_Logo_2011.svg",
  },
];

const sections: Section[] = [
  {
    id: "orientation",
    title: "Point de départ",
    intro: "On commence par comprendre le niveau de clarté du projet. Le reste du brief s'adapte à cette réponse.",
    questions: [
      {
        id: "clarity",
        label: "Savez-vous déjà précisément ce que vous voulez ?",
        helper: "Cela aide Carole à savoir s'il faut cadrer, orienter ou directement produire.",
        type: "choice",
        options: [
          "Oui, j'ai un besoin clair",
          "J'ai une idée générale mais elle doit être structurée",
          "Je ne sais pas encore, j'ai besoin d'être guidé",
        ],
      },
      {
        id: "projectType",
        label: "Quel besoin décrit le mieux votre projet aujourd'hui ?",
        type: "choice",
        dependsOn: (answers) => answers.clarity !== "Je ne sais pas encore, j'ai besoin d'être guidé",
        options: [
          "Identité visuelle complète",
          "Logo / logotype",
          "Charte graphique",
          "Stratégie de marque",
          "Stratégie de communication",
          "Supports graphiques ponctuels",
          "Je dois encore choisir",
        ],
      },
      {
        id: "guidanceNeed",
        label: "Qu'est-ce que vous voulez réussir, même si le type de service n'est pas encore clair ?",
        helper: "Décrivez le résultat attendu plutôt que le livrable. Carole pourra ensuite recommander logo, charte, identité, stratégie ou supports.",
        type: "textarea",
        placeholder: "Ex. rendre la marque plus professionnelle, lancer une activité, clarifier mon image, mieux communiquer sur Instagram...",
        dependsOn: (answers) => answers.clarity === "Je ne sais pas encore, j'ai besoin d'être guidé",
      },
    ],
  },
  {
    id: "summary",
    title: "Informations générales",
    intro: "Les informations minimales pour identifier le client, le contexte et la personne référente.",
    questions: [
      { id: "briefDate", label: "Date du brief", type: "text", placeholder: "Ex. 20 juin 2026" },
      { id: "clientName", label: "Nom de l'organisation ou du projet", type: "text", placeholder: "Nom de l'entreprise, association, initiative ou marque" },
      { id: "contactPerson", label: "Nom et poste de la personne référente", type: "text", placeholder: "Nom + rôle" },
      { id: "contactEmail", label: "Email ou contact de suivi", type: "text", placeholder: "adresse@email.com, téléphone ou WhatsApp" },
    ],
  },
  {
    id: "overview",
    title: "Vue d'ensemble",
    intro: "Comprendre l'activité, le marché et la situation actuelle avant de parler d'esthétique.",
    questions: [
      {
        id: "businessStage",
        label: "Où en est votre activité ?",
        type: "choice",
        options: ["Idée en construction", "Lancement proche", "Activité déjà lancée", "Refonte / repositionnement"],
      },
      {
        id: "activity",
        label: "Description de l'entreprise, de l'activité ou du projet",
        type: "textarea",
        placeholder: "Produits, services, zone géographique, modèle économique, contexte, ambitions...",
      },
      {
        id: "difference",
        label: "Qu'est-ce qui vous différencie des autres ?",
        type: "textarea",
        placeholder: "Votre argument principal, votre manière de faire, votre histoire, votre avantage...",
      },
      {
        id: "audience",
        label: "Public cible prioritaire",
        type: "textarea",
        placeholder: "Client idéal, contexte d'achat, besoins, freins, habitudes, âge, localisation...",
      },
    ],
  },
  {
    id: "brand",
    title: "Marque et positionnement",
    intro: "Mettre des mots sur la vision, le ton et les critères qui guideront les choix créatifs.",
    questions: [
      {
        id: "hasName",
        label: "Le nom de la marque est-il déjà défini ?",
        type: "choice",
        options: ["Oui, le nom est validé", "J'ai quelques pistes", "Non, il faut m'aider à le trouver"],
      },
      {
        id: "brandName",
        label: "Nom retenu, pistes actuelles ou contraintes de naming",
        type: "textarea",
        placeholder: "Nom choisi, variantes, mots à garder ou éviter, langue souhaitée, signification...",
      },
      {
        id: "namingInputs",
        label: "Si le nom n'est pas défini, quelles idées doivent guider sa recherche ?",
        type: "textarea",
        placeholder: "Vision, mots importants, fondateur, territoire, émotion, promesse, culture...",
        dependsOn: (answers) => answers.hasName !== "Oui, le nom est validé",
      },
      {
        id: "vision",
        label: "Vision, mission ou ambition de la marque",
        type: "textarea",
        placeholder: "Ce que la marque veut changer, défendre, simplifier ou faire ressentir...",
      },
      {
        id: "positioning",
        label: "Quels attributs doivent être ressentis ?",
        type: "multi",
        options: [
          "Professionnel",
          "Premium",
          "Accessible",
          "Audacieux",
          "Chaleureux",
          "Minimal",
          "Créatif",
          "Traditionnel",
          "Innovant",
          "Élégant",
          "Jeune",
          "Institutionnel",
        ],
      },
    ],
  },
  {
    id: "visual",
    title: "Pistes visuelles",
    intro: "Choisir des directions concrètes : types de logos, couleurs, inspirations et éléments existants.",
    questions: [
      {
        id: "visualState",
        label: "Quels éléments graphiques existent déjà ?",
        type: "multi",
        options: [
          "Logo existant",
          "Couleurs existantes",
          "Typographies existantes",
          "Charte graphique",
          "Templates réseaux sociaux",
          "Aucun élément pour le moment",
        ],
      },
      {
        id: "competitors",
        label: "Marques concurrentes, marques admirées ou marques à ne pas imiter",
        type: "textarea",
        placeholder: "Noms, liens, comptes Instagram, logos à éviter, références positives...",
      },
    ],
  },
  {
    id: "deliverables",
    title: "Livrables et contraintes",
    intro: "On termine par les usages, les livrables et seulement ensuite les contraintes de budget ou de délai.",
    questions: [
      {
        id: "deliverables",
        label: "De quoi avez-vous besoin à la fin du projet ?",
        type: "multi",
        options: [
          "Tout ce qui est utile pour lancer proprement",
          "Logo principal",
          "Variantes du logo",
          "Palette de couleurs",
          "Choix typographiques",
          "Mini charte graphique",
          "Templates réseaux sociaux",
          "Carte de visite",
          "Flyer / affiche",
          "Pitch deck",
          "Kit complet de lancement",
        ],
      },
      {
        id: "usage",
        label: "Où l'identité ou les créations devront-elles vivre en priorité ?",
        type: "multi",
        options: [
          "Instagram / réseaux sociaux",
          "Site web",
          "Documents commerciaux",
          "Packaging",
          "Enseigne / signalétique",
          "Événementiel",
          "WhatsApp / mobile",
          "Impression papier",
        ],
      },
      {
        id: "success",
        label: "À quoi saura-t-on que le design est réussi ?",
        type: "textarea",
        placeholder: "La cible comprend vite, la marque paraît plus premium, le logo fonctionne en petit...",
      },
      {
        id: "constraints",
        label: "Délais, budget estimatif, validations ou contraintes importantes",
        type: "textarea",
        placeholder: "Date idéale, budget ou fourchette si connue, personnes qui valident, contraintes techniques...",
      },
    ],
  },
];

function isAnswered(value: AnswerValue | undefined) {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

function getAnswerText(value: AnswerValue | undefined) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return value;
}

function getVisibleSections(answers: Answers) {
  return sections.map((section) => ({
    ...section,
    questions: section.questions.filter((question) => !question.dependsOn || question.dependsOn(answers)),
  }));
}

function toggleListValue(current: AnswerValue | undefined, option: string, max?: number) {
  const values = Array.isArray(current) ? current : [];
  if (values.includes(option)) return values.filter((value) => value !== option);
  if (max && values.length >= max) return [...values.slice(1), option];
  return [...values, option];
}

function splitLinks(value: AnswerValue | undefined) {
  return getAnswerText(value)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item));
}

function isStoredDraft(value: unknown): value is StoredDraft {
  return Boolean(value && typeof value === "object" && "answers" in value);
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  if (question.type === "choice") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options?.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`group min-h-16 rounded-lg border px-4 py-3 text-left text-[14px] leading-5 transition ${
                selected
                  ? "border-[#854d63] bg-[#854d63] text-white shadow-[0_14px_32px_rgba(133,77,99,0.18)]"
                  : "border-[#d8c8c2] bg-[#fcf9f8] text-text-primary hover:-translate-y-0.5 hover:border-[#854d63] hover:bg-white hover:shadow-[0_10px_26px_rgba(91,65,55,0.08)] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              }`}
            >
              <span className="flex items-center justify-between gap-4">
                <span>{option}</span>
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                    selected ? "border-white bg-white text-[#854d63]" : "border-border-accent group-hover:border-[#854d63]"
                  }`}
                >
                  {selected ? <CheckCircleIcon className="size-4" /> : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "multi") {
    return (
      <div className="flex flex-wrap gap-2">
        {question.options?.map((option) => {
          const selected = Array.isArray(value) && value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(toggleListValue(value, option))}
              className={`rounded-full border px-4 py-2 text-[13px] transition ${
                selected
                  ? "border-[#854d63] bg-[#854d63] text-white"
                  : "border-border-accent bg-white text-text-secondary hover:border-[#854d63] hover:text-text-primary dark:border-white/10 dark:bg-white/5"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "text") {
    return (
      <input
        value={getAnswerText(value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder}
        className="public-input h-11 w-full rounded-md border border-border-subtle bg-white px-3 text-[14px] text-text-primary placeholder:text-text-muted dark:border-white/10 dark:bg-white/5"
      />
    );
  }

  return (
    <textarea
      value={getAnswerText(value)}
      onChange={(event) => onChange(event.target.value)}
      placeholder={question.placeholder}
      rows={4}
      className="public-input min-h-28 w-full resize-y rounded-md border border-border-subtle bg-white px-3 py-3 text-[14px] leading-6 text-text-primary placeholder:text-text-muted dark:border-white/10 dark:bg-white/5"
    />
  );
}

export default function DesignBrief() {
  const [answers, setAnswers] = useState<Answers>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};
      const parsed = JSON.parse(stored) as unknown;
      return isStoredDraft(parsed) ? parsed.answers ?? {} : (parsed as Answers);
    } catch {
      return {};
    }
  });
  const [colors, setColors] = useState<Array<string | null>>(() => {
    if (typeof window === "undefined") return EMPTY_COLORS;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return EMPTY_COLORS;
      const parsed = JSON.parse(stored) as StoredDraft;
      return Array.isArray(parsed.colors) ? parsed.colors : EMPTY_COLORS;
    } catch {
      return EMPTY_COLORS;
    }
  });
  const [files, setFiles] = useState<InspirationFile[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");

  const visibleSections = useMemo(() => getVisibleSections(answers), [answers]);
  const allQuestions = visibleSections.flatMap((section) => section.questions);
  const completedCount = allQuestions.filter((question) => isAnswered(answers[question.id])).length;
  const progress = Math.round((completedCount / allQuestions.length) * 100);
  const selectedLogoStyles = Array.isArray(answers.logoStyles) ? answers.logoStyles : [];
  const selectedColors = colors.filter((color): color is string => Boolean(color));
  const hasDraft = completedCount > 0 || selectedColors.length > 0 || files.length > 0;

  useSeoOverride(
    useMemo(
      () => ({
        title: "Design brief - Carole T.",
        description:
          "Un brief guidé pour cadrer un logo, une charte graphique, une identité de marque ou une stratégie de communication.",
      }),
      [],
    ),
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, colors }));
  }, [answers, colors]);

  useEffect(() => {
    return () => files.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, [files]);

  const setAnswer = (id: string, value: AnswerValue) => {
    setAnswers((current) => {
      if (id === "clarity" && value === "Je ne sais pas encore, j'ai besoin d'être guidé") {
        const { projectType: _projectType, ...rest } = current;
        return { ...rest, [id]: value };
      }

      return { ...current, [id]: value };
    });
  };

  const setColor = (index: number, value: string) => {
    setColors((current) => current.map((color, colorIndex) => (colorIndex === index ? value : color)));
  };

  const pickColor = async (index: number) => {
    if (!window.EyeDropper) return;
    const result = await new window.EyeDropper().open();
    setColor(index, result.sRGBHex);
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setFiles((current) => [
      ...current,
      ...Array.from(fileList).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const resetDraft = () => {
    if (!window.confirm("Effacer toutes les réponses et recommencer le brief ?")) return;
    files.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setAnswers({});
    setColors(EMPTY_COLORS);
    setFiles([]);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const submitBrief = async () => {
    const sb = getSupabase();
    if (!sb) {
      setSubmitState("error");
      setSubmitError("Supabase n'est pas configuré dans cet environnement. La soumission sera disponible dès que les variables VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY seront présentes.");
      return;
    }

    setSubmitState("submitting");
    setSubmitError("");

    const submissionId = crypto.randomUUID();
    const assetPaths: string[] = [];

    try {
      for (const item of files) {
        const extension = item.file.name.split(".").pop() ?? "file";
        const path = `${submissionId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await sb.storage.from("brief-assets").upload(path, item.file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        assetPaths.push(path);
      }

      const { error } = await sb.from("design_brief_submissions").insert({
        id: submissionId,
        client_name: getAnswerText(answers.clientName) || null,
        contact_name: getAnswerText(answers.contactPerson) || null,
        contact_email: getAnswerText(answers.contactEmail) || null,
        project_type: getAnswerText(answers.projectType) || getAnswerText(answers.guidanceNeed) || null,
        answers,
        logo_styles: selectedLogoStyles,
        color_palette: selectedColors,
        inspiration_links: splitLinks(answers.inspirationLinks),
        asset_paths: assetPaths,
      });

      if (error) throw error;

      setSubmitState("success");
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      setSubmitState("error");
      setSubmitError(error instanceof Error ? error.message : "La soumission a échoué.");
    }
  };

  return (
    <main className={`${PAGE_MAIN} overflow-hidden bg-[#f7f4f2] dark:bg-surface-page`}>
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[1180px]"
      >
        <div className="border-b border-border-subtle pb-8">
          <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">Brief graphisme</p>
          <h1 className="mt-5 max-w-[850px] font-serif text-[42px] leading-[46px] text-text-primary sm:text-[62px] sm:leading-[66px]">
            Design Brief
          </h1>
          <p className="mt-5 max-w-[780px] text-[17px] leading-8 text-text-secondary">
            Un espace guidé pour cadrer une identité, un logotype, une charte, une stratégie de marque ou des supports graphiques, puis transmettre le brief à Carole.
          </p>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,860px)_260px] xl:items-start">
          <div className="rounded-lg border border-border-subtle bg-white px-5 py-6 text-text-primary shadow-[0_18px_50px_rgba(28,27,27,0.05)] dark:border-white/10 dark:bg-[#171312] dark:text-[#f8f1ec] sm:px-8 sm:py-8">
            <div className="rounded-md border border-[#dbe5f2] bg-[#f5f9ff] p-4 text-[14px] leading-6 text-[#27405f] dark:border-[#f0adc4]/25 dark:bg-[#251d1c] dark:text-[#f4e7df]">
              <div className="flex gap-3">
                <ExclamationCircleIcon className="mt-0.5 size-5 shrink-0 text-[#2b74c7] dark:text-[#f0adc4]" />
                <div>
                  <p>
                    Répondez dans l'ordre. Si une réponse n'est pas encore claire, laissez-la vide : le but est aussi de révéler ce qui doit être cadré avec Carole.
                  </p>
                  <p className="mt-2 text-[12px] font-semibold uppercase tracking-[1.4px] text-[#2b5f97] dark:text-[#f0adc4]">
                    Brouillon sauvegardé automatiquement dans ce navigateur
                  </p>
                </div>
              </div>
            </div>

            {visibleSections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28 border-b border-border-subtle py-10 last:border-b-0 dark:border-white/10">
                <div className="mb-7">
                  <h2 className="font-serif text-[32px] leading-[36px] text-text-primary">{section.title}</h2>
                  <p className="mt-3 max-w-[700px] text-[14px] leading-6 text-text-muted dark:text-[#d8c7bf]">{section.intro}</p>
                </div>

                {section.id === "visual" ? (
                  <>
                    <div className="mb-8">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <h3 className="text-[15px] font-semibold text-text-primary">Types de logos qui vous parlent</h3>
                          <p className="mt-1 text-[13px] text-text-muted dark:text-[#d8c7bf]">Choisissez jusqu'à deux familles. Les exemples servent uniquement à comprendre le style.</p>
                        </div>
                        <p className="text-[13px] text-text-muted dark:text-[#d8c7bf]">{selectedLogoStyles.length}/2</p>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {logoStyles.map((style) => {
                          const selected = selectedLogoStyles.includes(style.id);
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => setAnswer("logoStyles", toggleListValue(answers.logoStyles, style.id, 2))}
                              className={`rounded-lg border p-3 text-left transition ${
                                selected
                                  ? "border-[#854d63] bg-[#fff5f8] shadow-[0_12px_28px_rgba(133,77,99,0.12)] dark:border-[#f0adc4] dark:bg-[#332426] dark:shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
                                  : "border-border-subtle bg-[#fcf9f8] hover:-translate-y-0.5 hover:border-[#854d63] hover:bg-white dark:border-white/12 dark:bg-[#201918] dark:hover:border-[#f0adc4]/70 dark:hover:bg-[#2a211f]"
                              }`}
                            >
                              <span className="flex h-20 items-center justify-center rounded-md bg-white p-3 dark:bg-[#f8f1ec]">
                                {style.id === "Monogramme" ? (
                                  <span className="relative flex h-14 w-24 items-center justify-center font-serif text-[#161313]" aria-hidden="true">
                                    <span className="absolute -translate-x-3 text-[48px] italic leading-none">C</span>
                                    <span className="absolute translate-x-3 text-[48px] italic leading-none">T</span>
                                    <span className="absolute h-12 w-12 rotate-45 border border-[#161313]/45" />
                                  </span>
                                ) : (
                                  <img src={style.image} alt="" className="max-h-12 max-w-[140px] object-contain" loading="lazy" />
                                )}
                              </span>
                              <span className="mt-3 flex items-start justify-between gap-3">
                                <span>
                                  <span className="block text-[14px] font-semibold text-text-primary">{style.name}</span>
                                  <span className="mt-1 block text-[12px] leading-5 text-text-muted dark:text-[#d8c7bf]">{style.description}</span>
                                </span>
                                <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#854d63] bg-[#854d63] text-white dark:border-[#f0adc4] dark:bg-[#f0adc4] dark:text-[#171312]" : "border-border-accent dark:border-[#f0adc4]/40"}`}>
                                  {selected ? <CheckCircleIcon className="size-4" /> : null}
                                </span>
                              </span>
                              <span className="mt-2 block text-[11px] leading-4 text-text-muted dark:text-[#cdb9ae]">{style.examples}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-8 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6">
                      <label className="pt-1 text-[13px] font-semibold leading-5 text-text-primary">
                        Couleurs pressenties
                        <span className="mt-1 block text-[12px] font-normal leading-5 text-text-muted">
                          Cliquez un carré pour choisir une couleur. Le sélecteur pipette peut aussi récupérer une couleur à l'écran.
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {colors.map((color, index) => (
                          <div key={index} className="rounded-lg border border-border-subtle bg-white p-2">
                            <label
                              className="relative block h-14 w-16 cursor-pointer overflow-hidden rounded-md border border-border-subtle"
                              style={
                                color
                                  ? { background: color }
                                  : {
                                      backgroundColor: "#fff",
                                      backgroundImage:
                                        "linear-gradient(45deg, #e8e0dc 25%, transparent 25%), linear-gradient(-45deg, #e8e0dc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e8e0dc 75%), linear-gradient(-45deg, transparent 75%, #e8e0dc 75%)",
                                      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                                      backgroundSize: "16px 16px",
                                    }
                              }
                            >
                              <span className="sr-only">Choisir la couleur {index + 1}</span>
                              <input
                                type="color"
                                value={color ?? "#854d63"}
                                onChange={(event) => setColor(index, event.target.value)}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              />
                              {!color ? (
                                <span className="absolute inset-0 flex items-center justify-center text-[16px] font-semibold text-text-muted">
                                  +
                                </span>
                              ) : null}
                            </label>
                            {window.EyeDropper ? (
                              <button
                                type="button"
                                onClick={() => void pickColor(index)}
                                className="mt-2 flex h-8 w-full items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-text-accent"
                                aria-label={`Prélever la couleur ${index + 1}`}
                              >
                                <EyeDropperIcon className="size-4" />
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="grid gap-7">
                  {section.questions.map((question) => (
                    <div key={question.id} className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6">
                      <label className="pt-1 text-[13px] font-semibold leading-5 text-text-primary">
                        {question.label}
                        {question.helper ? <span className="mt-1 block text-[12px] font-normal leading-5 text-text-muted">{question.helper}</span> : null}
                      </label>
                      <QuestionField question={question} value={answers[question.id]} onChange={(value) => setAnswer(question.id, value)} />
                    </div>
                  ))}
                </div>

                {section.id === "visual" ? (
                  <div className="mt-8 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6">
                    <label className="pt-1 text-[13px] font-semibold leading-5 text-text-primary">
                      Inspirations à soumettre
                      <span className="mt-1 block text-[12px] font-normal leading-5 text-text-muted">
                        Ajoutez des images/fichiers et des liens. Ils seront attachés à la soumission.
                      </span>
                    </label>
                    <div className="grid gap-3">
                      <textarea
                        value={getAnswerText(answers.inspirationLinks)}
                        onChange={(event) => setAnswer("inspirationLinks", event.target.value)}
                        rows={3}
                        placeholder="Liens vers Pinterest, Instagram, Behance, anciens logos, moodboards..."
                        className="public-input min-h-24 w-full rounded-md border border-border-subtle bg-white px-3 py-3 text-[14px] leading-6 text-text-primary placeholder:text-text-muted"
                      />
                      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border-accent bg-[#fcf9f8] px-4 py-5 text-center transition hover:bg-white">
                        <DocumentArrowUpIcon className="size-6 text-text-accent" />
                        <span className="mt-2 text-[13px] font-semibold text-text-primary">Ajouter des fichiers d'inspiration</span>
                        <span className="mt-1 text-[12px] leading-5 text-text-muted">PNG, JPG, WebP, GIF ou PDF, 5 Mo maximum par fichier.</span>
                        <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" className="sr-only" onChange={(event) => addFiles(event.target.files)} />
                      </label>
                      {files.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {files.map((item) => (
                            <div key={item.previewUrl} className="flex items-center gap-3 rounded-md border border-border-subtle bg-white p-2">
                              {item.file.type.startsWith("image/") ? (
                                <img src={item.previewUrl} alt="" className="size-12 rounded object-cover" />
                              ) : (
                                <LinkIcon className="size-5 text-text-accent" />
                              )}
                              <span className="min-w-0 truncate text-[13px] text-text-secondary">{item.file.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </section>
            ))}

            <div className="mt-6 flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setSubmitState("review")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#854d63] px-6 text-[12px] font-semibold uppercase tracking-[1.4px] text-white transition hover:bg-[#6a364b]"
              >
                <CheckCircleIcon className="size-4" />
                Confirmer mes choix
              </button>
            </div>
          </div>

          <aside className="hidden xl:block xl:sticky xl:top-28">
            <div className="border-l border-border-subtle pl-5">
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">Sommaire</p>
              <div className="mt-4 grid gap-3">
                {visibleSections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="text-[13px] font-semibold leading-5 text-text-muted transition hover:text-text-accent">
                    {section.title}
                  </a>
                ))}
              </div>
              <div className="mt-7 rounded-md border border-border-subtle bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">Avancement</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee9e8] dark:bg-white/10">
                  <div className="h-full rounded-full bg-[#854d63] transition-all duration-300 dark:bg-[#f0adc4]" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-[13px] leading-5 text-text-muted">{completedCount}/{allQuestions.length} champs renseignés</p>
              </div>
              {!isSupabaseConfigured ? (
                <p className="mt-4 rounded-md border border-border-accent bg-[#fff8f1] p-3 text-[12px] leading-5 text-text-muted">
                  Mode local : la soumission nécessite Supabase configuré.
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </motion.section>

      {submitState === "review" || submitState === "submitting" || submitState === "success" || submitState === "error" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-5 shadow-[0_30px_90px_rgba(0,0,0,0.22)] dark:bg-surface-panel sm:p-7">
            {submitState === "success" ? (
              <div className="py-8 text-center">
                <CheckCircleIcon className="mx-auto size-12 text-text-accent" />
                <h2 className="mt-4 font-serif text-[34px] leading-[38px] text-text-primary">Brief soumis</h2>
                <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-text-secondary">
                  Merci. Le brief a été enregistré et pourra être consulté depuis le dashboard.
                </p>
                <button type="button" onClick={() => setSubmitState("idle")} className="mt-6 h-11 rounded-full bg-action-strong px-6 text-[12px] font-semibold uppercase tracking-[1.4px] text-text-on-strong">
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-serif text-[34px] leading-[38px] text-text-primary">Récapitulatif avant soumission</h2>
                <p className="mt-3 text-[14px] leading-6 text-text-muted">
                  Vérifiez les informations principales. Vous pourrez revenir modifier avant d'envoyer.
                </p>
                <div className="mt-5 grid gap-4">
                  {visibleSections.map((section) => {
                    const answered = section.questions.filter((question) => isAnswered(answers[question.id]));
                    if (answered.length === 0 && section.id !== "visual") return null;
                    return (
                      <div key={section.id} className="rounded-md border border-border-subtle p-4">
                        <h3 className="text-[14px] font-semibold text-text-primary">{section.title}</h3>
                        <dl className="mt-3 grid gap-2">
                          {answered.map((question) => (
                            <div key={question.id} className="grid gap-1 text-[13px] sm:grid-cols-[180px_1fr]">
                              <dt className="font-semibold text-text-muted">{question.label}</dt>
                              <dd className="whitespace-pre-wrap text-text-secondary">{getAnswerText(answers[question.id])}</dd>
                            </div>
                          ))}
                          {section.id === "visual" ? (
                            <>
                              <div className="grid gap-1 text-[13px] sm:grid-cols-[180px_1fr]">
                                <dt className="font-semibold text-text-muted">Styles de logo</dt>
                                <dd className="text-text-secondary">{selectedLogoStyles.join(", ") || "Non renseigné"}</dd>
                              </div>
                              <div className="grid gap-1 text-[13px] sm:grid-cols-[180px_1fr]">
                                <dt className="font-semibold text-text-muted">Couleurs</dt>
                                <dd className="flex flex-wrap gap-2">
                                  {selectedColors.length > 0 ? selectedColors.map((color) => (
                                    <span key={color} className="inline-flex items-center gap-2 text-text-secondary">
                                      <span className="size-4 rounded-full border border-border-subtle" style={{ background: color }} />
                                      {color}
                                    </span>
                                  )) : <span className="text-text-muted">Aucune couleur choisie</span>}
                                </dd>
                              </div>
                              <div className="grid gap-1 text-[13px] sm:grid-cols-[180px_1fr]">
                                <dt className="font-semibold text-text-muted">Fichiers</dt>
                                <dd className="text-text-secondary">{files.map((item) => item.file.name).join(", ") || "Aucun fichier"}</dd>
                              </div>
                            </>
                          ) : null}
                        </dl>
                      </div>
                    );
                  })}
                </div>
                {submitState === "error" ? <p className="mt-4 rounded-md border border-destructive/30 p-3 text-sm text-destructive">{submitError}</p> : null}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setSubmitState("idle")} disabled={submitState === "submitting"} className="h-11 rounded-full border border-border-accent px-6 text-[12px] font-semibold uppercase tracking-[1.4px] text-text-accent">
                    Modifier
                  </button>
                  <button type="button" onClick={() => void submitBrief()} disabled={submitState === "submitting"} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#854d63] px-6 text-[12px] font-semibold uppercase tracking-[1.4px] text-white disabled:opacity-55">
                    <PaperAirplaneIcon className="size-4" />
                    {submitState === "submitting" ? "Soumission..." : "Soumettre le brief"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {hasDraft && submitState !== "success" ? (
        <button
          type="button"
          onClick={resetDraft}
          className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border-accent bg-white px-5 text-[12px] font-semibold uppercase tracking-[1.2px] text-text-accent shadow-[0_18px_50px_rgba(28,27,27,0.16)] transition hover:-translate-y-0.5 hover:bg-[#fff5f8] dark:border-white/15 dark:bg-surface-panel"
        >
          <ArrowPathIcon className="size-4" />
          Réinitialiser
        </button>
      ) : null}
    </main>
  );
}
