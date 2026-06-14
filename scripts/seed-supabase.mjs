/**
 * scripts/seed-supabase.mjs
 *
 * Pousse le contenu initial dans la base Supabase.
 * Usage :
 *   npm run cms:seed
 *   node --env-file=.env.local scripts/seed-supabase.mjs
 *   node --env-file=.env.local scripts/seed-supabase.mjs <email> <password>
 *
 * Identifiants : arguments CLI, ou CMS_SEED_EMAIL / CMS_SEED_PASSWORD dans .env.local
 * (compte Supabase > Authentication > Users).
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "../src/assets/resources");
const BUCKET = "media";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const [emailArg, passwordArg] = process.argv.slice(2);
const email = emailArg ?? process.env.CMS_SEED_EMAIL;
const password = passwordArg ?? process.env.CMS_SEED_PASSWORD;

if (!url || !key) {
  console.error("❌  VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquant dans .env.local");
  process.exit(1);
}
if (!email || !password) {
  console.error(
    "❌  Identifiants manquants. Ajoute CMS_SEED_EMAIL et CMS_SEED_PASSWORD dans .env.local",
  );
  console.error("    ou : node --env-file=.env.local scripts/seed-supabase.mjs <email> <password>");
  process.exit(1);
}

const sb = createClient(url, key);

// --- connexion ---------------------------------------------------------------
console.log(`\n🔐  Connexion en tant que ${email}…`);
const { error: authError } = await sb.auth.signInWithPassword({ email, password });
if (authError) {
  console.error("❌  Échec de connexion :", authError.message);
  process.exit(1);
}
console.log("✅  Connecté.\n");

// --- helpers -----------------------------------------------------------------
const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const L = (fr, en = "") => ({ fr, en });
const TABLE = "cms_documents";
const PUBLIC_TABLE = "cms_public_documents";

async function insertIfMissing(type, docId, data, position) {
  const { data: existing, error: lookupError } = await sb
    .from(TABLE)
    .select("doc_id, data, status, position, slug")
    .eq("type", type)
    .eq("doc_id", docId)
    .maybeSingle();
  if (lookupError) throw new Error(`${type}/${docId}: ${lookupError.message}`);
  if (existing) {
    const { data: revision, error: revisionLookupError } = await sb
      .from("cms_revisions")
      .select("revision_id")
      .eq("type", type)
      .eq("doc_id", docId)
      .limit(1)
      .maybeSingle();
    if (revisionLookupError) throw new Error(`${type}/${docId} revision: ${revisionLookupError.message}`);
    if (!revision) {
      const { error: revisionError } = await sb.from("cms_revisions").insert({
        type,
        doc_id: docId,
        data: existing.data,
        status: existing.status,
        position: existing.position,
        slug: existing.slug,
      });
      if (revisionError) throw new Error(`${type}/${docId} revision: ${revisionError.message}`);
    }
    process.stdout.write("·");
    return;
  }

  const now = new Date().toISOString();
  const payload = { ...data, id: docId };
  const slug = typeof data.slug === "string" ? data.slug : null;
  const { error } = await sb.from(TABLE).insert({
    type,
    doc_id: docId,
    data: payload,
    status: "published",
    position,
    slug,
    created_at: now,
    updated_at: now,
    published_at: now,
  });
  if (error) throw new Error(`${type}/${docId}: ${error.message}`);

  const { error: publicError } = await sb.from(PUBLIC_TABLE).insert({
    type,
    doc_id: docId,
    data: payload,
    position,
    slug,
    published_at: now,
  });
  if (publicError) throw new Error(`${type}/${docId} public: ${publicError.message}`);

  const { error: revisionError } = await sb.from("cms_revisions").insert({
    type,
    doc_id: docId,
    data: payload,
    status: "published",
    position,
    slug,
  });
  if (revisionError) throw new Error(`${type}/${docId} revision: ${revisionError.message}`);
  process.stdout.write(".");
}

const CARNET_FILES = {
  "le-depot": "le-depot.webp",
  laveiye: "laveiye.webp",
  "calendrier-cm-229": "calendrier-cm229.webp",
  "social-media-room": "social-media-room.webp",
  "women-in-tech-benin": "women-in-tech-benin.webp",
  "women-techmakers-abomey-calavi": "women-techmakers-abomey-calavi.webp",
};

const BOOK_COVERS = {
  "everybody-writes":
    "https://books.google.com/books/content?id=QGtECQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
  storybrand:
    "https://books.google.com/books/content?id=b3xDDgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
  "le-bug-humain":
    "https://books.google.com/books/content?id=_yODDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
};

const imageCache = new Map();

async function carnetImage(slug) {
  if (imageCache.has(slug)) return imageCache.get(slug);
  const file = CARNET_FILES[slug];
  if (!file) return null;

  const fallback = { url: `/cms/resources/${file}`, alt: { fr: `Visuel ${slug}`, en: `Visual ${slug}` } };
  try {
    const buffer = readFileSync(join(ASSETS_DIR, file));
    const path = `seed/carnet/${file}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
      upsert: true,
      contentType: "image/webp",
    });
    if (error) {
      console.log(`\n  ⚠️  upload ${slug}: ${error.message} — fallback public`);
      imageCache.set(slug, fallback);
      return fallback;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    const img = { url: data.publicUrl, alt: fallback.alt };
    imageCache.set(slug, img);
    return img;
  } catch (err) {
    console.log(`\n  ⚠️  fichier ${slug}: ${err.message} — fallback public`);
    imageCache.set(slug, fallback);
    return fallback;
  }
}

function bookImage(slug) {
  const url = BOOK_COVERS[slug];
  if (!url) return null;
  return { url, alt: { fr: `Couverture ${slug}`, en: `${slug} cover` } };
}

async function hydrateCarnetImages(data) {
  for (const doc of data.resource ?? []) {
    doc.image = await carnetImage(doc.slug);
  }
  for (const doc of data.community ?? []) {
    doc.image = await carnetImage(doc.slug);
  }
  for (const doc of data.book ?? []) {
    doc.image = bookImage(doc.slug);
  }
}

// --- données de seed ---------------------------------------------------------
const seed = {
  // singletons
  homePage: {
    id: "homePage",
    hero: {
      eyebrow: L("Communication digitale", "Digital communications"),
      title: L("Donner de la voix", "Giving voice"),
      accent: L("aux marques", "to brands"),
      titleEnd: L("qui ont du sens", "that matter"),
      description: L(
        "Chargée de communication digitale, j'accompagne les marques engagées de la stratégie à la publication.",
        "",
      ),
      primaryCta: L("Me contacter", "Get in touch"),
      secondaryCta: L("Voir les services", "View services"),
      portrait: null,
    },
    manifesto: {
      title: L("Mon manifeste", "My manifesto"),
      accent: L("intention", "intention"),
      body: L(
        "Chaque prise de parole doit servir une intention claire et une communauté réelle.",
        "",
      ),
    },
    about: {
      title: L("À propos", "About"),
      accent: L("parcours", "journey"),
      body: L(
        "Carole Tonoukouen, chargée de communication digitale et social media.",
        "",
      ),
      image: null,
    },
    servicesSection: {
      titleAccent: L("Mes", "My"),
      titleRest: L("Services", "Services"),
      subtitle: L(
        "Des solutions sur mesure pour structurer vos contenus et vos actions de communication.",
        "Tailored support to structure your content and communication actions.",
      ),
    },
    testimonialsSection: {
      eyebrow: L("Témoignages", "Testimonials"),
      titleStart: L("Mots doux de", "Kind words from"),
      titleAccent: L("mes clients", "my clients"),
    },
    contactSection: {
      eyebrow: L("Entrer en contact", "Get in touch"),
      titleStart: L("Parlez-moi de", "Tell me what"),
      titleAccent: L("votre besoin", "you need"),
      description: L(
        "Partagez quelques informations sur votre marque, vos canaux ou l'accompagnement recherché. Je vous répondrai avec une prochaine étape claire.",
        "Share a few details about your brand, your channels, or the support you are looking for. I will get back to you with a clear next step.",
      ),
      meetingLink: L("Ou opter pour un rendez-vous", "Or choose to book a call"),
    },
  },

  aboutPage: {
    id: "aboutPage",
    hero: {
      title: L("À propos", "About"),
      subtitle: L(
        "Qui je suis, ce que je fais concrètement et la manière dont j'accompagne les marques et les projets.",
        "Who I am, what I do in practice, and how I support brands and projects.",
      ),
    },
    image: null,
    imageAlt: L(
      "Carole travaillant sur une communication digitale",
      "Carole working on digital communication",
    ),
    identity: {
      label: L("Qui je suis", "Who I am"),
      greeting: L("Enchantée, moi c'est Carole Tonoukouen.", "Lovely to meet you. I'm Carole Tonoukouen."),
      role: L(
        "Chargée de communication digitale, coordination éditoriale et rédaction",
        "Digital communications officer, editorial coordination, and writing",
      ),
      paragraphs: [
        L(
          "Je suis basée à Cotonou et j'accompagne des entreprises, des organisations et des porteurs de projets qui souhaitent clarifier leur message, structurer leurs contenus et renforcer leur visibilité en ligne, sans se noyer dans la cadence des réseaux.",
          "I'm based in Cotonou and I support businesses, organizations, and project owners who want to clarify their message, structure their content, and strengthen their online visibility, without drowning in the pace of social media.",
        ),
        L(
          "Après plusieurs expériences concrètes en coordination éditoriale et en gestion de plateformes, j'ai choisi de me spécialiser dans l'accompagnement de marques qui veulent passer d'une communication réactive au jour le jour à un rythme éditorial planifié et porteur de sens.",
          "After several hands-on experiences in editorial coordination and platform management, I chose to specialize in supporting brands that want to move from reactive day-to-day communication to a planned, meaningful editorial cadence.",
        ),
        L(
          "Je crois qu'une présence digitale réussie ne repose pas sur la quantité de publications, mais sur la pertinence, la structure et la régularité. Mon rôle consiste donc à prendre en charge le travail en amont, notamment les calendriers, la rédaction et la coordination visuelle, afin que chaque prise de parole renforce la confiance avec votre public.",
          "I believe a strong digital presence relies on relevance, structure, and consistency rather than posting volume. My role is therefore to handle the groundwork, including calendars, writing, and visual coordination, so that every public message builds trust with your audience.",
        ),
      ],
    },
    work: {
      label: L("Ce que je fais", "What I do"),
      paragraphs: [
        L(
          "Concrètement, j'interviens sur la stratégie éditoriale, la communication digitale et la création de contenus. Je vous aide à définir une ligne claire, des piliers de sujets et un positionnement lisible sur vos canaux, puis à tenir ce cap dans le temps.",
          "In practice, I work across editorial strategy, digital communication, and content creation. I help you define a clear line, content pillars, and readable positioning across your channels, then hold that direction over time.",
        ),
        L(
          "Je rédige, je pilote les calendriers et je coordonne les supports visuels. J'aligne par ailleurs chaque publication sur vos objectifs. Que ce soit pour LinkedIn, un blog, des campagnes ponctuelles ou une présence institutionnelle, l'objectif reste le même : moins de dispersion et plus de cohérence.",
          "I write, steer calendars, and coordinate visual assets. I also align each publication with your goals. Whether it's LinkedIn, a blog, one-off campaigns, or an institutional presence, the aim remains the same: less scatter and more coherence.",
        ),
        L(
          "Selon les projets, je peux aussi assurer le community management, la traduction FR/EN, le reporting et le suivi des performances, toujours dans une logique d'organisation et de clarté plutôt que de volume pour le volume.",
          "Depending on the project, I can also handle community management, FR/EN translation, reporting, and performance follow-up, always with organization and clarity in mind rather than volume for volume's sake.",
        ),
      ],
    },
    value: {
      label: L("Ce que vous y gagnez", "What you gain"),
      paragraphs: [
        L(
          "Travailler avec moi, c'est d'abord gagner en lisibilité. Votre message devient plus net et plus accessible, sans perdre pour autant votre personnalité ni votre voix.",
          "Working with me means gaining readability first. Your message becomes sharper and more accessible, without losing your personality or voice.",
        ),
        L(
          "Vous bénéficiez également d'une rigueur opérationnelle : des systèmes éditoriaux plus simples à tenir, une cadence réaliste et des formats qui se répondent. La stratégie précède par ailleurs la création, de sorte que chaque canal et chaque format répondent à un objectif et à une audience identifiés.",
          "You also benefit from operational rigor: editorial systems that are easier to maintain, a realistic cadence, and formats that echo each other. Strategy comes before creation, so every channel and every format serves a clear objective and a defined audience.",
        ),
        L(
          "En fin de parcours, vous déléguez une part importante de la charge mentale liée à la communication, tout en conservant la main sur les orientations qui comptent vraiment pour vous.",
          "In the end, you delegate a significant share of the mental load tied to communication while keeping control over the directions that matter to you.",
        ),
      ],
    },
    approach: {
      label: L("Mon approche", "My approach"),
      paragraphs: [
        L(
          "Je commence toujours par lire votre contexte, c'est-à-dire comprendre votre marque, vos objectifs et vos publics, puis auditer ce qui existe déjà afin de repérer les écarts de message.",
          "I always start by reading your context, which means understanding your brand, your goals, and your audiences, then auditing what already exists in order to spot message gaps.",
        ),
        L(
          "Ensuite, nous cadrons ensemble la ligne éditoriale, les piliers de contenu et la cadence de publication. Ce n'est qu'après ce socle que j'entame le déploiement : rédaction, visuels, scripts courts et calendriers prêts à publier.",
          "Next, we frame things together: editorial line, content pillars, and publishing cadence. Only after that foundation do I move into deployment, including writing, visuals, short scripts, and ready-to-publish calendars.",
        ),
        L(
          "Le suivi fait enfin partie du processus. J'analyse les retours, j'ajuste les angles et j'identifie les thèmes qui génèrent le plus d'échanges. L'accompagnement reste ainsi simple, lisible et tenable sur la durée.",
          "Follow-up is finally part of the process. I analyze feedback, adjust angles, and identify topics that spark the most conversation. The support therefore stays simple, readable, and sustainable over time.",
        ),
      ],
    },
    closing: {
      paragraphs: [
        L(
          "Si vous cherchez quelqu'un pour structurer votre communication, tenir le fil éditorial et vous faire gagner du temps sans alourdir le dispositif, je serais ravie d'en discuter avec vous.",
          "If you're looking for someone to structure your communication, hold the editorial thread, and save you time without weighing down the setup, I would be glad to discuss it with you.",
        ),
      ],
    },
    ctaBand: {
      title: L("Parlons de votre communication", "Let's talk about your communication"),
      subtitle: L(
        "Expliquez-moi votre contexte, vos canaux et vos priorités. Nous identifierons ensemble la forme d'accompagnement la plus adaptée à votre situation.",
        "Tell me about your context, channels, and priorities. Together, we will identify the most suitable support format for your situation.",
      ),
      ctaPrimary: L("Me contacter", "Contact me"),
      ctaSecondary: L("Voir mes services", "View my services"),
    },
  },

  cvPage: {
    id: "cvPage",
    eyebrow: L("Curriculum vitæ", "Curriculum vitae"),
    firstName: "Carole",
    lastName: "Tonoukouen",
    role: L("Chargée de communication", "Communications officer"),
    summary: L(
      "Jeune professionnelle en communication, j'ai acquis une expérience concrète en gestion de contenus, coordination d'activités et appui à la mise en œuvre de stratégies de communication. Organisée et proactive, je souhaite évoluer au sein d'une structure où je pourrai renforcer mes compétences tout en contribuant activement aux projets.",
      "As a young communications professional, I have gained hands-on experience in content management, activity coordination, and support for communication strategy deployment. Organized and proactive, I am looking to grow within a structure where I can strengthen my skills while actively contributing to projects.",
    ),
    contacts: {
      email: "caroletonoukouen@gmail.com",
      phone: "+229 01 95 93 44 54",
      location: L("Cotonou, Bénin", "Cotonou, Benin"),
      portfolioLabel: L("Behance.net", "Behance.net"),
      portfolioUrl: "https://www.behance.net/caroletonoukouen",
    },
  },

  siteSettings: {
    id: "siteSettings",
    title: L("Carole Tonoukouen", "Carole Tonoukouen"),
    description: L(
      "Portfolio de Carole Tonoukouen, chargée de communication digitale : stratégie éditoriale, contenus, campagnes et visibilité de marque.",
      "Portfolio of Carole Tonoukouen, digital communications officer: editorial strategy, content, campaigns, and brand visibility.",
    ),
    siteUrl: "https://carole-portfolio.vercel.app",
    ogImage: null,
    seoPages: {
      home: {
        title: L("Carole Tonoukouen | Communication digitale", "Carole Tonoukouen | Digital communication"),
        description: L(
          "Portfolio de Carole Tonoukouen, chargée de communication digitale : stratégie éditoriale, contenus, campagnes et visibilité de marque.",
          "Portfolio of Carole Tonoukouen, digital communications officer: editorial strategy, content, campaigns, and brand visibility.",
        ),
      },
      about: {
        title: L("À propos | Carole Tonoukouen", "About | Carole Tonoukouen"),
        description: L(
          "Découvrez le parcours de Carole Tonoukouen et son approche de la communication digitale claire, structurée et cohérente.",
          "Discover Carole Tonoukouen's background and approach to clear, structured, consistent digital communication.",
        ),
      },
      services: {
        title: L(
          "Services de communication digitale | Carole Tonoukouen",
          "Digital communication services | Carole Tonoukouen",
        ),
        description: L(
          "Stratégie éditoriale, campagnes digitales, création de contenus et audit de présence en ligne pour clarifier votre communication.",
          "Editorial strategy, digital campaigns, content creation, and online presence audits to clarify your communication.",
        ),
      },
      blog: {
        title: L("Blog communication digitale | Carole Tonoukouen", "Digital communication blog | Carole Tonoukouen"),
        description: L(
          "Articles et notes pratiques sur la ligne éditoriale, le calendrier de contenu, les réseaux sociaux et l'audit digital.",
          "Practical articles and notes on editorial direction, content calendars, social media, and digital audits.",
        ),
      },
      contact: {
        title: L("Contact | Carole Tonoukouen", "Contact | Carole Tonoukouen"),
        description: L(
          "Contactez Carole Tonoukouen pour échanger sur vos besoins en communication digitale, contenu et visibilité.",
          "Contact Carole Tonoukouen to discuss your digital communication, content, and visibility needs.",
        ),
      },
      cv: {
        title: L("CV | Carole Tonoukouen", "Resume | Carole Tonoukouen"),
        description: L(
          "CV de Carole Tonoukouen : expérience, compétences, formations et réalisations en communication digitale.",
          "Carole Tonoukouen resume: experience, skills, education, and digital communication achievements.",
        ),
      },
      carnetResources: {
        title: L("Ressources & communautés | Carole Tonoukouen", "Resources & communities | Carole Tonoukouen"),
        description: L(
          "Ressources, outils et communautés pour nourrir une pratique de communication digitale plus solide.",
          "Resources, tools, and communities for a stronger digital communication practice.",
        ),
      },
      carnetReadings: {
        title: L("Lectures & références | Carole Tonoukouen", "Readings & references | Carole Tonoukouen"),
        description: L(
          "Ouvrages, newsletters et références pour affiner le regard et nourrir la pratique éditoriale.",
          "Books, newsletters, and references to sharpen your editorial practice.",
        ),
      },
    },
    contactEmail: "hello@carole.com",
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
  },

  // collections — tableaux de docs
  service: [
    {
      slug: "strategie-editoriale",
      title: L("Stratégie éditoriale", "Editorial strategy"),
      accent: L("Une ligne claire, des prises de parole utiles", ""),
      description: L("Définition de la ligne éditoriale, des piliers de contenu et du calendrier.", ""),
      detailIntro: L("", ""),
      presentation: L("", ""),
      metricValue: "+120%",
      metricLabel: L("d'engagement moyen", ""),
      bullets: [L("Audit des contenus existants", ""), L("Définition des piliers éditoriaux", ""), L("Calendrier éditorial mensuel", "")],
      whatIsIncluded: [L("Calendrier mensuel sur-mesure", ""), L("Charte éditoriale", "")],
      targetAudience: [L("Marques engagées", ""), L("Associations et structures culturelles", "")],
      concreteApplications: [L("Lancement de campagne de sensibilisation", "")],
      caseStudy: { title: L("Refonte ligne édito", ""), description: L("", "") },
    },
    {
      slug: "community-management",
      title: L("Community management", "Community management"),
      accent: L("Animer, fédérer, faire grandir", ""),
      description: L("Gestion quotidienne des réseaux et animation de communauté.", ""),
      detailIntro: L("", ""),
      presentation: L("", ""),
      metricValue: "x3",
      metricLabel: L("de portée organique", ""),
      bullets: [L("Modération et animation quotidienne", ""), L("Réponse aux commentaires", "")],
      whatIsIncluded: [L("Reporting mensuel", ""), L("Propositions de contenu", "")],
      targetAudience: [L("PME, associations", ""), L("Collectivités locales", "")],
      concreteApplications: [],
      caseStudy: { title: L("", ""), description: L("", "") },
    },
    {
      slug: "creation-de-contenu",
      title: L("Création de contenu", "Content creation"),
      accent: L("Des visuels et des mots qui racontent", ""),
      description: L("Production de contenus texte, visuels et vidéo adaptés à chaque réseau.", ""),
      detailIntro: L("", ""),
      presentation: L("", ""),
      metricValue: "×4",
      metricLabel: L("de taux de clic moyen", ""),
      bullets: [L("Copywriting réseaux sociaux", ""), L("Direction artistique des visuels", "")],
      whatIsIncluded: [L("Pack contenus mensuels", "")],
      targetAudience: [L("Entrepreneurs solo", ""), L("Marques de produits", "")],
      concreteApplications: [],
      caseStudy: { title: L("", ""), description: L("", "") },
    },
  ],

  blogPost: [
    {
      slug: "construire-une-ligne-editoriale",
      title: L("Construire une ligne éditoriale qui tient", ""),
      excerpt: L("Les 4 piliers d'une présence cohérente sur les réseaux.", ""),
      category: L("Stratégie", "Strategy"),
      publishedAt: "2026-05-12",
      readingTime: L("6 min", ""),
      featured: true,
      coverImage: null,
      takeaways: [
        L("Définir une intention éditoriale claire avant de publier", ""),
        L("Identifier 3 à 5 piliers de contenu récurrents", ""),
        L("Créer un calendrier éditorial réaliste et flexible", ""),
      ],
      body: L(
        "Avant de publier, il faut savoir pourquoi. Une ligne éditoriale, ce n'est pas une liste de sujets : c'est une promesse faite à sa communauté.\n\nLes 4 piliers d'une présence cohérente sont : l'intention (pourquoi je prends la parole), la tonalité (comment je parle), les formats (texte, visuel, vidéo), et la régularité (à quelle fréquence).\n\nSans ces 4 éléments, les publications restent des pièces isolées. Avec eux, elles forment une narration.",
        "",
      ),
    },
    {
      slug: "calendrier-editorial-2026",
      title: L("Le calendrier éditorial, mode d'emploi", ""),
      excerpt: L("Planifier sans s'épuiser : les principes d'un calendrier qui dure.", ""),
      category: L("Organisation", "Organization"),
      publishedAt: "2026-04-02",
      readingTime: L("4 min", ""),
      featured: false,
      coverImage: null,
      takeaways: [
        L("Un calendrier trop plein est pire qu'aucun calendrier", ""),
        L("Batcher la production de contenu par thématique", ""),
      ],
      body: L(
        "Le calendrier éditorial est l'outil qui transforme une bonne intention en exécution régulière.\n\nLa première erreur : vouloir publier tous les jours. Mieux vaut 3 publications de qualité par semaine qu'un flux quotidien épuisant.\n\nLa deuxième erreur : ne pas batcher. Regrouper la production (toutes les captions d'un coup, tous les visuels d'un coup) divise le temps passé par deux.",
        "",
      ),
    },
  ],

  testimonial: [
    {
      name: "Cynthia",
      role: L("Fondatrice, marque de cosmétiques naturels", ""),
      quote: L(
        "Carole a transformé notre présence en ligne en quelques mois. Notre communauté a vraiment décollé.",
        "",
      ),
      portrait: null,
    },
    {
      name: "Julian",
      role: L("Directeur, association culturelle", ""),
      quote: L(
        "Une vraie vision éditoriale, rigoureuse et sensible. Elle comprend nos valeurs et sait les mettre en mots.",
        "",
      ),
      portrait: null,
    },
    {
      name: "Uzoma",
      role: L("Responsable communication, ONG", ""),
      quote: L(
        "Grâce à Carole, nos campagnes ont trouvé le ton juste pour toucher notre public cible.",
        "",
      ),
      portrait: null,
    },
  ],

  // Carnet · Ressources (type implicite : Ressource)
  resource: [
    {
      slug: "le-depot",
      title: L("LE DÉPÔT", "LE DÉPÔT"),
      categories: ["Veille & inspiration", "Social media"],
      description: L(
        "Une bibliothèque vivante de la communication africaine pour découvrir, déposer et référencer des campagnes d'Afrique francophone.",
        "A living library for African communication, built to discover, submit, and reference campaigns from French-speaking Africa.",
      ),
      url: "https://ledepot.co/",
      image: null,
    },
    {
      slug: "laveiye",
      title: L("LAVEIYE", "LAVEIYE"),
      categories: ["Veille & inspiration", "Social media"],
      description: L(
        "Une plateforme de veille qui rassemble des campagnes marketing africaines pour analyser, benchmarker et nourrir des concepts plus solides.",
        "A monitoring platform gathering African marketing campaigns to analyze, benchmark, and build stronger creative concepts.",
      ),
      url: "https://laveiye.com/",
      image: null,
    },
    {
      slug: "calendrier-cm-229",
      title: L("Calendrier du CM 229", "Calendrier du CM 229"),
      categories: ["Veille & inspiration", "Social media"],
      description: L(
        "Un outil éditorial local mis à jour chaque année, avec dates importantes, inspirations de campagnes et conseils de professionnels du digital au Bénin.",
        "A local editorial tool updated every year with key dates, campaign inspiration, and practical advice from digital professionals in Benin.",
      ),
      url: "https://calendrierducm.bj/",
      image: null,
    },
  ],

  // Carnet · Communautés (type implicite : Communauté)
  community: [
    {
      slug: "social-media-room",
      title: L("Social Media Room", "Social Media Room"),
      categories: ["Social media"],
      description: L(
        "Une communauté panafricaine et un cabinet d'accompagnement pour développer ses compétences en social media, accéder à des formations et échanger entre professionnels.",
        "A pan-African community and support structure for growing social media skills, joining training programs, and exchanging with professionals.",
      ),
      url: "https://socialmediaroom.africa/",
      image: null,
    },
    {
      slug: "women-in-tech-benin",
      title: L("WOMEN IN TECH BENIN", "WOMEN IN TECH BENIN"),
      categories: ["Femmes & numérique"],
      description: L(
        "Une plateforme pour connecter, former et inspirer les filles et femmes dans le numérique au Bénin, avec répertoire, mentors, fiches métiers et événements.",
        "A platform connecting, training, and inspiring girls and women in Benin's digital sector through role models, mentors, career sheets, and events.",
      ),
      url: "https://womenintech.bj/",
      image: null,
    },
    {
      slug: "women-techmakers-abomey-calavi",
      title: L("Women Techmakers Abomey-Calavi", "Women Techmakers Abomey-Calavi"),
      categories: ["Femmes & numérique"],
      description: L(
        "Une communauté de femmes passionnées par les technologies de programmation, portée par des sessions de renforcement de capacités, de networking et d'inspiration.",
        "A community for women passionate about programming technologies, with capacity-building sessions, networking, and inspiration around emerging tech.",
      ),
      url: "https://www.linkedin.com/company/women-techmakers-abomey-calavi/",
      image: null,
    },
  ],

  // Carnet · Ouvrages recommandés (type implicite : Ouvrage)
  book: [
    {
      slug: "everybody-writes",
      title: L("Everybody Writes", "Everybody Writes"),
      author: "Ann Handley",
      date: "2014",
      description: L(
        "Je le trouve indispensable pour créer du contenu avec plus de clarté. Il aide à mieux structurer ses idées et à raconter simplement.",
        "I find it essential for creating content with more clarity. It helps structure ideas and tell simple stories with confidence.",
      ),
      url: "https://books.google.com/books?id=QGtECQAAQBAJ",
      image: null,
    },
    {
      slug: "storybrand",
      title: L("Storybrand", "Storybrand"),
      author: "Donald Miller",
      date: "2017",
      description: L(
        "J'aime sa manière très simple de ramener un message de marque à l'essentiel : le client, son problème et la promesse claire.",
        "I like how simply it brings a brand message back to what matters: the customer, their problem, and a clear promise.",
      ),
      url: "https://books.google.com/books?id=b3xDDgAAQBAJ",
      image: null,
    },
    {
      slug: "le-bug-humain",
      title: L("Le Bug Humain", "Le Bug Humain"),
      author: "Sébastien Bohler",
      date: "2019",
      description: L(
        "Je le garde comme repère pour comprendre nos réflexes d'attention, nos biais, et ce que le digital vient parfois amplifier.",
        "I keep it as a reference for understanding attention reflexes, biases, and what digital environments can amplify.",
      ),
      url: "https://books.google.com/books?id=_yODDwAAQBAJ",
      image: null,
    },
  ],

  // Carnet · Articles & newsletters (type implicite : Référence)
  reference: [
    {
      slug: "marketing-brew",
      title: L("Marketing Brew", "Marketing Brew"),
      author: "Brew Team",
      typeLabel: L("Newsletter", "Newsletter"),
      cardStyle: "standard",
      description: L(
        "Une newsletter trihebdomadaire qui décrypte l'actualité des marques, les campagnes créatives et les mutations du secteur publicitaire.",
        "A tri-weekly newsletter decoding brand news, creative campaigns, and changes in the advertising sector.",
      ),
      url: "",
      image: null,
    },
    {
      slug: "growth-letter",
      title: L("Growth Letter", "Growth Letter"),
      author: "Yann Leonardi",
      typeLabel: L("Contenu cité", "Cited content"),
      cardStyle: "pinned",
      description: L(
        "Des analyses concrètes des stratégies marketing, du positionnement produit et de la psychologie de l'attention.",
        "Concrete breakdowns of marketing strategies, product positioning, and the psychology of attention.",
      ),
      url: "",
      image: null,
    },
  ],

  cvEntry: [
    {
      title: L("Chargée de communication digitale", ""),
      category: "experience",
      organization: "Agence Édito",
      period: L("2023 – aujourd'hui", ""),
      description: L("Pilotage de la communication digitale de marques engagées.", ""),
      highlights: [
        L("Gestion de 6 comptes clients simultanément", ""),
        L("Mise en place de stratégies éditoriales sur 4 réseaux", ""),
      ],
    },
    {
      title: L("Chargée de communication", ""),
      category: "experience",
      organization: "Association Culturelle Laveiye",
      period: L("2021 – 2023", ""),
      description: L("Animation des réseaux sociaux et couverture d'événements.", ""),
      highlights: [L("Croissance de +200% de l'audience Instagram", "")],
    },
    {
      title: L("Master Communication des organisations", ""),
      category: "education",
      organization: "Université d'Abomey-Calavi",
      period: L("2019 – 2021", ""),
      description: L("Spécialisation communication digitale et stratégie de marque.", ""),
      highlights: [],
    },
    {
      id: "cv-education",
      title: L(
        "Licence en littérature et civilisation américaines · Université de Parakou · 2020",
        "Bachelor's degree in American literature and civilization · University of Parakou · 2020",
      ),
      category: "education",
      highlights: [
        L("Growth marketing · Digital Valley · 2026", "Growth marketing · Digital Valley · 2026"),
        L("Stratégie des médias sociaux · Impacter · 2022", "Social media strategy · Impacter · 2022"),
        L("Rédaction web SEO · LFI · 2022", "SEO web writing · LFI · 2022"),
        L("Design graphique · EtriLabs · 2019", "Graphic design · EtriLabs · 2019"),
      ],
    },
    {
      id: "cv-skills",
      title: L(
        "Rédaction de contenu, storytelling et communication institutionnelle",
        "Content writing, storytelling, and institutional communication",
      ),
      category: "skill",
      highlights: [
        L("Graphisme avec Canva et Adobe Suite", "Graphic design with Canva and Adobe Suite"),
        L("Community management", "Community management"),
        L("Coordination d'événements", "Event coordination"),
        L("Traduction et adaptation FR/EN", "FR/EN translation and adaptation"),
        L("Meta Business Suite, Trello et WordPress", "Meta Business Suite, Trello, and WordPress"),
        L("Analyse des performances et reporting", "Performance analysis and reporting"),
      ],
    },
    {
      id: "cv-achievements",
      title: L(
        "Participation à la stratégie de positionnement visuel du Réseau Revia Afrique",
        "Contributed to the visual positioning strategy of Réseau Revia Afrique",
      ),
      category: "achievement",
      highlights: [
        L("Graphiste bénévole à Women in Tech Bénin", "Volunteer graphic designer for Women in Tech Benin"),
      ],
    },
    {
      id: "cv-languages",
      title: L("Français : courant, langue native", "French: fluent, native language"),
      category: "language",
      highlights: [
        L("Anglais : B2, intermédiaire avancé", "English: B2, upper-intermediate"),
      ],
    },
  ],

};

// --- insertion ---------------------------------------------------------------
const singletons = ["homePage", "aboutPage", "cvPage", "siteSettings"];

console.log("\n🖼️  Préparation des visuels carnet…");
await hydrateCarnetImages(seed);

console.log("\n📥  Initialisation additive (les contenus existants sont préservés)…\n");

for (const [type, value] of Object.entries(seed)) {
  process.stdout.write(`  ${type.padEnd(16)} `);
  try {
    if (singletons.includes(type)) {
      await insertIfMissing(type, type, value, 0);
    } else {
      for (const [position, doc] of value.entries()) {
        const docId = doc.slug ?? doc.name?.fr ?? id(type);
        await insertIfMissing(type, docId, doc, position);
      }
    }
    console.log(" ✅");
  } catch (err) {
    console.log(` ❌  ${err.message}`);
  }
}

console.log("\n🎉  Initialisation terminée. Aucun contenu existant n'a été écrasé.\n");
