import { readFileSync } from "fs";
import { extname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { mergeMissing } from "./lib/merge-missing.mjs";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.CMS_SEED_EMAIL;
const password = process.env.CMS_SEED_PASSWORD;
const apply = process.argv.includes("--apply");
const only = process.argv.find((argument) => argument.startsWith("--only="))?.slice("--only=".length);
const BUCKET = "media";
const ROOT = fileURLToPath(new URL("../", import.meta.url));

if (!url || !key || !email || !password) {
  console.error("Configuration Supabase ou identifiants CMS manquants dans .env.local.");
  process.exit(1);
}

const L = (fr, en) => ({ fr, en });

const content = {
  service: {
    "strategie-editoriale": {
      accent: L("Une ligne claire, des prises de parole utiles", "A clear line, useful brand messages"),
      description: L(
        "Définition de la ligne éditoriale, des piliers de contenu et du calendrier.",
        "Definition of your editorial line, content pillars, and publishing calendar.",
      ),
      detailIntro: L(
        "Une fondation claire pour transformer vos idées en ligne éditoriale durable, lisible et cohérente sur chaque canal.",
        "A clear foundation that turns scattered ideas into a durable editorial line people can understand and follow.",
      ),
      presentation: L(
        "Beaucoup de marques publient par habitude, sans direction stratégique claire. Une stratégie éditoriale rigoureuse recentre les prises de parole sur ce qui compte vraiment, avec des thèmes d'autorité, un ton reconnaissable et un système réaliste.",
        "Many brands publish out of habit without a clear strategic direction. A rigorous editorial strategy refocuses messaging on what matters through authority topics, a recognizable tone, and a realistic system.",
      ),
      metricLabel: L(
        "piliers de contenu structurés pour guider les publications",
        "content pillars structured to guide recurring publishing",
      ),
      bullets: [
        L("Audit des contenus existants", "Existing content audit"),
        L("Définition des piliers éditoriaux", "Editorial pillar definition"),
        L("Calendrier éditorial mensuel", "Monthly editorial calendar"),
      ],
      whatIsIncluded: [
        L("Calendrier mensuel sur-mesure", "Tailored monthly calendar"),
        L("Charte éditoriale", "Editorial guidelines"),
      ],
      targetAudience: [
        L("Marques engagées", "Purpose-driven brands"),
        L("Associations et structures culturelles", "Associations and cultural organizations"),
      ],
      concreteApplications: [
        L("Lancement de campagne de sensibilisation", "Awareness campaign launch"),
      ],
      caseStudy: {
        title: L("Refonte ligne édito", "Editorial direction redesign"),
        description: L(
          "Organisation des angles, hiérarchisation des sujets experts et préparation d'un calendrier mensuel.",
          "Organizing angles, prioritizing expert topics, and preparing a monthly calendar.",
        ),
      },
    },
    "community-management": {
      accent: L("Animer, fédérer, faire grandir", "Engage, connect, and grow"),
      description: L(
        "Gestion quotidienne des réseaux et animation de communauté.",
        "Daily social media management and community engagement.",
      ),
      detailIntro: L(
        "Un accompagnement continu pour publier avec intention, entretenir les échanges et garder un cap cohérent.",
        "Ongoing support to publish intentionally, nurture conversations, and maintain a consistent direction.",
      ),
      presentation: L(
        "Le community management relie organisation éditoriale, qualité de réponse et suivi des signaux utiles. L'objectif est de créer une présence régulière sans perdre la voix de la marque.",
        "Community management connects editorial organization, thoughtful responses, and useful signal tracking. The goal is a consistent presence that keeps the brand voice intact.",
      ),
      metricLabel: L("de portée organique", "organic reach"),
      bullets: [
        L("Modération et animation quotidienne", "Daily moderation and engagement"),
        L("Réponse aux commentaires", "Comment and message responses"),
      ],
      whatIsIncluded: [
        L("Reporting mensuel", "Monthly reporting"),
        L("Propositions de contenu", "Content recommendations"),
      ],
      targetAudience: [
        L("PME, associations", "Small businesses and associations"),
        L("Collectivités locales", "Local organizations"),
      ],
      concreteApplications: [
        L("Calendrier d'animation et protocole de réponse", "Engagement calendar and response guidelines"),
      ],
      caseStudy: {
        title: L("Installer un rythme de conversation", "Creating a reliable conversation rhythm"),
        description: L(
          "Mise en place d'une cadence, coordination des contenus et suivi des sujets qui génèrent le plus d'échanges.",
          "Setting the cadence, coordinating content, and tracking topics that create stronger conversations.",
        ),
      },
    },
    "creation-de-contenu": {
      accent: L("Des visuels et des mots qui racontent", "Visuals and words that tell a story"),
      description: L(
        "Production de contenus texte, visuels et vidéo adaptés à chaque réseau.",
        "Production of written, visual, and video content adapted to each platform.",
      ),
      detailIntro: L(
        "Des contenus pensés pour porter la voix de la marque, faciliter la régularité et créer une relation naturelle avec l'audience.",
        "Content designed to carry the brand voice, support consistency, and build a natural relationship with the audience.",
      ),
      presentation: L(
        "Chaque publication associe un angle clair, un texte soigné et une mise en forme adaptée au contexte de lecture. Les idées longues peuvent devenir posts, carrousels ou scripts courts sans perdre leur cohérence.",
        "Each publication combines a clear angle, carefully written copy, and a format suited to its reading context. Long-form ideas can become posts, carousels, or short scripts without losing coherence.",
      ),
      metricLabel: L("de taux de clic moyen", "average click-through rate"),
      bullets: [
        L("Copywriting réseaux sociaux", "Social media copywriting"),
        L("Direction artistique des visuels", "Visual art direction"),
      ],
      whatIsIncluded: [
        L("Pack contenus mensuels", "Monthly content package"),
        L("Scripts courts et angles de carrousels", "Short scripts and carousel angles"),
      ],
      targetAudience: [
        L("Entrepreneurs solo", "Independent professionals"),
        L("Marques de produits", "Product brands"),
      ],
      concreteApplications: [
        L("Posts, carrousels et scripts prêts à publier", "Publication-ready posts, carousels, and scripts"),
      ],
      caseStudy: {
        title: L("Transformer l'expertise en contenus", "Turning expertise into content"),
        description: L(
          "Déclinaison d'idées longues en formats courts pour maintenir une présence claire sans repartir de zéro.",
          "Turning long-form ideas into short formats to maintain a clear presence without starting over.",
        ),
      },
    },
  },
  blogPost: {
    "construire-une-ligne-editoriale": {
      title: L("Construire une ligne éditoriale qui tient", "Build an editorial line that lasts"),
      excerpt: L(
        "Les 4 piliers d'une présence cohérente sur les réseaux.",
        "The four pillars of a consistent social media presence.",
      ),
      readingTime: L("6 min", "6 min"),
      takeaways: [
        L("Définir une intention éditoriale claire avant de publier", "Define a clear editorial intention before publishing"),
        L("Identifier 3 à 5 piliers de contenu récurrents", "Identify three to five recurring content pillars"),
        L("Créer un calendrier éditorial réaliste et flexible", "Create a realistic and flexible editorial calendar"),
      ],
      body: L(
        "Avant de publier, il faut savoir pourquoi. Une ligne éditoriale, ce n'est pas une liste de sujets : c'est une promesse faite à sa communauté.\n\nLes 4 piliers d'une présence cohérente sont : l'intention (pourquoi je prends la parole), la tonalité (comment je parle), les formats (texte, visuel, vidéo), et la régularité (à quelle fréquence).\n\nSans ces 4 éléments, les publications restent des pièces isolées. Avec eux, elles forment une narration.",
        "Before publishing, you need to know why. An editorial line is not a list of topics: it is a promise made to your community.\n\nThe four pillars of a consistent presence are intention (why you speak), tone (how you speak), formats (text, visuals, or video), and consistency (how often you publish).\n\nWithout these four elements, publications remain isolated pieces. Together, they form a recognizable narrative.",
      ),
    },
    "calendrier-editorial-2026": {
      title: L("Le calendrier éditorial, mode d'emploi", "The editorial calendar: a practical guide"),
      excerpt: L(
        "Planifier sans s'épuiser : les principes d'un calendrier qui dure.",
        "Plan without burning out: the principles of a calendar that lasts.",
      ),
      readingTime: L("4 min", "4 min"),
      takeaways: [
        L("Un calendrier trop plein est pire qu'aucun calendrier", "An overloaded calendar is worse than no calendar"),
        L("Batcher la production de contenu par thématique", "Batch content production by topic"),
      ],
      body: L(
        "Le calendrier éditorial est l'outil qui transforme une bonne intention en exécution régulière.\n\nLa première erreur : vouloir publier tous les jours. Mieux vaut 3 publications de qualité par semaine qu'un flux quotidien épuisant.\n\nLa deuxième erreur : ne pas batcher. Regrouper la production (toutes les captions d'un coup, tous les visuels d'un coup) divise le temps passé par deux.",
        "An editorial calendar turns a good intention into consistent execution.\n\nThe first mistake is trying to publish every day. Three thoughtful posts each week are more useful than an exhausting daily stream.\n\nThe second mistake is failing to batch production. Grouping similar work together, such as writing captions or preparing visuals, can significantly reduce the time spent.",
      ),
    },
  },
  cvEntry: {
    "cvEntry-mq7hto5y-ab5g5": {
      title: L("Chargée de communication digitale", "Digital communications officer"),
      period: L("2023 – aujourd'hui", "2023 – present"),
      description: L(
        "Pilotage de la communication digitale de marques engagées.",
        "Led digital communications for purpose-driven brands.",
      ),
      highlights: [
        L("Gestion de 6 comptes clients simultanément", "Managed six client accounts simultaneously"),
        L("Mise en place de stratégies éditoriales sur 4 réseaux", "Implemented editorial strategies across four platforms"),
      ],
    },
    "cvEntry-mq7htodj-97x9j": {
      title: L("Chargée de communication", "Communications officer"),
      period: L("2021 – 2023", "2021 – 2023"),
      description: L(
        "Animation des réseaux sociaux et couverture d'événements.",
        "Managed social platforms and covered events.",
      ),
      highlights: [
        L("Croissance de +200% de l'audience Instagram", "Grew the Instagram audience by more than 200%"),
      ],
    },
    "cvEntry-mq7htoky-q5flg": {
      title: L("Master Communication des organisations", "Master's degree in organizational communication"),
      period: L("2019 – 2021", "2019 – 2021"),
      description: L(
        "Spécialisation communication digitale et stratégie de marque.",
        "Specialized in digital communication and brand strategy.",
      ),
    },
    "cv-education": {
      id: "cv-education",
      category: "education",
      title: L(
        "Licence en littérature et civilisation américaines · Université de Parakou · 2020",
        "Bachelor's degree in American literature and civilization · University of Parakou · 2020",
      ),
      highlights: [
        L("Growth marketing · Digital Valley · 2026", "Growth marketing · Digital Valley · 2026"),
        L("Stratégie des médias sociaux · Impacter · 2022", "Social media strategy · Impacter · 2022"),
        L("Rédaction web SEO · LFI · 2022", "SEO web writing · LFI · 2022"),
        L("Design graphique · EtriLabs · 2019", "Graphic design · EtriLabs · 2019"),
      ],
    },
    "cv-skills": {
      id: "cv-skills",
      category: "skill",
      title: L(
        "Rédaction de contenu, storytelling et communication institutionnelle",
        "Content writing, storytelling, and institutional communication",
      ),
      highlights: [
        L("Graphisme avec Canva et Adobe Suite", "Graphic design with Canva and Adobe Suite"),
        L("Community management", "Community management"),
        L("Coordination d'événements", "Event coordination"),
        L("Traduction et adaptation FR/EN", "FR/EN translation and adaptation"),
        L("Meta Business Suite, Trello et WordPress", "Meta Business Suite, Trello, and WordPress"),
        L("Analyse des performances et reporting", "Performance analysis and reporting"),
      ],
    },
    "cv-achievements": {
      id: "cv-achievements",
      category: "achievement",
      title: L(
        "Participation à la stratégie de positionnement visuel du Réseau Revia Afrique",
        "Contributed to the visual positioning strategy of Réseau Revia Afrique",
      ),
      highlights: [
        L(
          "Graphiste bénévole à Women in Tech Bénin",
          "Volunteer graphic designer for Women in Tech Benin",
        ),
      ],
    },
    "cv-languages": {
      id: "cv-languages",
      category: "language",
      title: L("Français : courant, langue native", "French: fluent, native language"),
      highlights: [
        L("Anglais : B2, intermédiaire avancé", "English: B2, upper-intermediate"),
      ],
    },
  },
  cvPage: {
    cvPage: {
      contacts: {
        email: "caroletonoukouen@gmail.com",
        phone: "+229 01 95 93 44 54",
        location: L("Cotonou, Bénin", "Cotonou, Benin"),
        portfolioLabel: L("Behance.net", "Behance.net"),
        portfolioUrl: "https://www.behance.net/caroletonoukouen",
      },
    },
  },
  aboutPage: {
    aboutPage: {
      imageAlt: L("Portrait de Carole Tonoukouen", "Portrait of Carole Tonoukouen"),
    },
  },
  siteSettings: {
    siteSettings: {
      description: L(
        "Site personnel de Carole Tonoukouen, chargée de communication digitale : stratégie éditoriale, contenus, campagnes et visibilité de marque.",
        "Personal website of Carole Tonoukouen, digital communications officer: editorial strategy, content, campaigns, and brand visibility.",
      ),
      siteUrl: "https://www.carolebj.com",
    },
  },
};

const newDocumentPositions = {
  "cvEntry/cv-education": 3,
  "cvEntry/cv-skills": 4,
  "cvEntry/cv-achievements": 5,
  "cvEntry/cv-languages": 6,
};

const media = [
  ["homePage", "homePage", ["hero", "portrait"], "src/assets/carole-redesign-portrait.webp", L("Portrait de Carole Tonoukouen", "Portrait of Carole Tonoukouen")],
  ["homePage", "homePage", ["about", "image"], "src/assets/carole-shape-static.png", L("Carole Tonoukouen", "Carole Tonoukouen")],
  ["aboutPage", "aboutPage", ["image"], "src/assets/carole-about-portrait.avif", L("Portrait de Carole Tonoukouen", "Portrait of Carole Tonoukouen")],
  ["blogPost", "construire-une-ligne-editoriale", ["coverImage"], "src/assets/blog/blog-abstract-editorial.svg", L("Composition abstraite sur la stratégie éditoriale", "Abstract composition about editorial strategy")],
  ["blogPost", "calendrier-editorial-2026", ["coverImage"], "src/assets/blog/blog-abstract-content.svg", L("Composition abstraite sur le calendrier éditorial", "Abstract composition about editorial planning")],
  ["testimonial", "bachiratou-issiako-toure", ["portrait"], "src/assets/testimonials/testimonial-bachiratou-issiako-toure.webp", L("Portrait professionnel de Bachiratou ISSIAKO TOURE", "Professional portrait of Bachiratou ISSIAKO TOURE")],
  ["testimonial", "cynthia-s", ["portrait"], "src/assets/testimonials/testimonial-cynthia.svg", L("Portrait illustré de Cynthia", "Illustrated portrait of Cynthia")],
  ["testimonial", "julian-f", ["portrait"], "src/assets/testimonials/testimonial-julian.svg", L("Portrait illustré de Julian", "Illustrated portrait of Julian")],
  ["testimonial", "uzoma-obidike", ["portrait"], "src/assets/testimonials/testimonial-uzoma.svg", L("Portrait illustré d'Uzoma", "Illustrated portrait of Uzoma")],
  ["siteSettings", "siteSettings", ["ogImage"], "public/carole-tonoukouen-social-preview.png", L("Carole Tonoukouen — Chargée de communication digitale", "Carole Tonoukouen — Digital communications officer")],
];
const selectedMedia = only
  ? media.filter(([type, docId]) => `${type}/${docId}` === only)
  : media;

function contentType(path) {
  return {
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".avif": "image/avif",
  }[extname(path)] ?? "application/octet-stream";
}

function setNested(target, path, value) {
  let cursor = target;
  for (const key of path.slice(0, -1)) cursor = cursor[key] ??= {};
  cursor[path.at(-1)] = value;
}

const sb = createClient(url, key);
const { error: authError } = await sb.auth.signInWithPassword({ email, password });
if (authError) throw authError;

for (const [type, docId, path, file, alt] of selectedMedia) {
  const storagePath = `content/${type}/${docId}/${file.split("/").at(-1)}`;
  if (apply) {
    const bytes = readFileSync(join(ROOT, file));
    const { error } = await sb.storage.from(BUCKET).upload(storagePath, bytes, {
      upsert: true,
      contentType: contentType(file),
    });
    if (error) throw error;
  }
  const { data } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
  content[type] ??= {};
  content[type][docId] ??= {};
  setNested(content[type][docId], path, { url: data.publicUrl, alt });
}

/** Media synced from repo — always replace (not merge-only) when applying. */
const forcedMedia = new Map(
  selectedMedia.map(([type, docId, path]) => [`${type}/${docId}/${path.join(".")}`, { type, docId, path }]),
);

function applyForcedMedia(data, additions) {
  const next = structuredClone(data);
  for (const { type, docId, path } of forcedMedia.values()) {
    let sourceCursor = additions;
    for (const key of path) sourceCursor = sourceCursor?.[key];
    if (!sourceCursor) continue;
    let targetCursor = next;
    for (const key of path.slice(0, -1)) targetCursor = targetCursor[key] ??= {};
    targetCursor[path.at(-1)] = structuredClone(sourceCursor);
  }
  return next;
}

const changes = [];
for (const [type, documents] of Object.entries(content)) {
  for (const [docId, additions] of Object.entries(documents)) {
    if (only && `${type}/${docId}` !== only) continue;
    const { data: row, error } = await sb
      .from("cms_documents")
      .select("data, slug, position, status")
      .eq("type", type)
      .eq("doc_id", docId)
      .maybeSingle();
    if (error) throw error;
    const newPosition = newDocumentPositions[`${type}/${docId}`];
    if (!row && newPosition === undefined) {
      console.warn(`Ignoré, document absent : ${type}/${docId}`);
      continue;
    }

    const mergedBase = row ? mergeMissing(row.data, additions) : structuredClone(additions);
    const merged = row ? applyForcedMedia(mergedBase, additions) : mergedBase;
    if (type === "aboutPage" && docId === "aboutPage" && additions.imageAlt) {
      merged.imageAlt = structuredClone(additions.imageAlt);
    }
    if (row && JSON.stringify(merged) === JSON.stringify(row.data)) continue;
    changes.push(`${type}/${docId}`);
    if (!apply) continue;

    const { error: saveError } = await sb.rpc("cms_save_document", {
      p_type: type,
      p_doc_id: docId,
      p_data: merged,
      p_slug: row?.slug ?? null,
      p_position: row?.position ?? newPosition,
    });
    if (saveError) throw saveError;
    const shouldPublish = !row || row.status === "published";
    if (shouldPublish) {
      const { error: publishError } = await sb.rpc("cms_publish_document", {
        p_type: type,
        p_doc_id: docId,
      });
      if (publishError) throw publishError;
    }
  }
}

console.log(`${apply ? "Synchronisés" : "À synchroniser"} : ${changes.length} document(s).`);
for (const change of changes) console.log(`- ${change}`);
if (!apply) console.log("Relance avec --apply pour enregistrer et publier ces compléments.");
