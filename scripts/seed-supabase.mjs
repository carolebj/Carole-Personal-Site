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

async function upsert(type, docId, data) {
  const { error } = await sb.from(TABLE).upsert(
    { type, doc_id: docId, data: { ...data, id: docId }, updated_at: new Date().toISOString() },
    { onConflict: "type,doc_id" },
  );
  if (error) throw new Error(`${type}/${docId}: ${error.message}`);
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
  },

  siteSettings: {
    id: "siteSettings",
    title: L("Carole Tonoukouen", "Carole Tonoukouen"),
    description: L("Portfolio de communication digitale.", ""),
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
  ],

  category: [
    { title: L("Stratégie", "Strategy"), slug: "strategie" },
    { title: L("Organisation", "Organization"), slug: "organisation" },
    { title: L("Inspiration", "Inspiration"), slug: "inspiration" },
    { title: L("Outils", "Tools"), slug: "outils" },
  ],
};

// --- insertion ---------------------------------------------------------------
const singletons = ["homePage", "siteSettings"];

// Le dashboard devient la source de vérité : on repart d'un état propre.
// On efface les types courants ET les anciens noms de types (toolResource, reading)
// qui peuvent encore traîner dans Supabase suite à des seeds précédents.
const legacyTypes = ["toolResource", "reading"];
const typesToWipe = [...new Set([...Object.keys(seed), ...legacyTypes])];

console.log("🧹  Nettoyage du contenu existant (par type)…\n");
for (const type of typesToWipe) {
  const { error } = await sb.from(TABLE).delete().eq("type", type);
  if (error) {
    console.log(`  ${type.padEnd(20)}  ⚠️  ${error.message}`);
  }
}

console.log("\n🖼️  Préparation des visuels carnet…");
await hydrateCarnetImages(seed);

console.log("\n📥  Insertion du contenu réel…\n");

for (const [type, value] of Object.entries(seed)) {
  process.stdout.write(`  ${type.padEnd(16)} `);
  try {
    if (singletons.includes(type)) {
      await upsert(type, type, value);
    } else {
      for (const doc of value) {
        const docId = doc.slug ?? doc.name?.fr ?? id(type);
        await upsert(type, docId, doc);
      }
    }
    console.log(" ✅");
  } catch (err) {
    console.log(` ❌  ${err.message}`);
  }
}

console.log("\n🎉  Seed terminé. Rafraîchis /dashboard pour voir le contenu.\n");
