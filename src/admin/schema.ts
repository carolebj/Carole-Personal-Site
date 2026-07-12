// Schema-driven content model for the custom admin dashboard.
//
// This file is the single source of truth for what an editor can manage.
// Forms in the dashboard are generated from these definitions, so extending
// the CMS means editing this file, not building new screens.
//
// Field types are intentionally close to the existing `src/cms/types.ts`
// shapes so the same view-model adapters keep working once the data source
// moves from mock storage to a real backend.

export type FieldType =
  | "text"
  | "slug"
  | "boolean"
  | "date"
  | "url"
  | "email"
  | "select"
  | "tags"
  | "localizedString"
  | "localizedText"
  | "localizedRichText"
  | "localizedList"
  | "image"
  | "group";

export type SelectOption = { value: string; label: string };

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  options?: SelectOption[];
  fields?: FieldDef[];
  required?: boolean;
  validation?: "slug" | "url" | "email" | "date";
};

export type IconKey =
  | "home"
  | "about"
  | "services"
  | "blog"
  | "testimonial"
  | "resource"
  | "community"
  | "book"
  | "reference"
  | "cv"
  | "settings";

export type ContentType = {
  name: string;
  kind: "collection" | "singleton";
  label: string;
  labelSingular: string;
  description: string;
  icon: IconKey;
  group: "content" | "settings";
  /** Optional sub-section header rendered in the sidebar above this type. */
  section?: string;
  titleField: string;
  subtitleField?: string;
  publishLocales: "bilingual" | "fr";
  preview: "page" | "context";
  fields: FieldDef[];
};

const localizedString = (name: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({
  name,
  label,
  type: "localizedString",
  ...extra,
});

const requiredLocalizedString = (
  name: string,
  label: string,
  extra: Partial<FieldDef> = {},
): FieldDef => localizedString(name, label, { required: true, ...extra });

const seoPage = (name: string, label: string): FieldDef => ({
  name,
  label,
  type: "group",
  fields: [
    localizedString("title", "Titre"),
    { name: "description", label: "Description", type: "localizedText" },
  ],
});

const proseBlock = (name: string, label: string): FieldDef => ({
  name,
  label,
  type: "group",
  fields: [
    localizedString("label", "Sur-titre"),
    { name: "paragraphs", label: "Paragraphes", type: "localizedList" },
  ],
});

export const contentTypes: ContentType[] = [
  {
    name: "homePage",
    kind: "singleton",
    label: "Page d'accueil",
    labelSingular: "Page d'accueil",
    description: "Hero, manifeste, à propos et titres des sections services, témoignages et contact.",
    icon: "home",
    group: "content",
    titleField: "hero.title",
    publishLocales: "bilingual",
    preview: "page",
    fields: [
      {
        name: "hero",
        label: "Hero",
        type: "group",
        fields: [
          localizedString("eyebrow", "Sur-titre"),
          requiredLocalizedString("title", "Titre"),
          localizedString("accent", "Mot accentué"),
          localizedString("titleEnd", "Fin du titre"),
          { name: "description", label: "Description", type: "localizedText" },
          localizedString("primaryCta", "Bouton principal"),
          localizedString("secondaryCta", "Bouton secondaire"),
          { name: "portrait", label: "Portrait", type: "image" },
        ],
      },
      {
        name: "manifesto",
        label: "Manifeste",
        type: "group",
        fields: [
          localizedString("title", "Titre"),
          localizedString("accent", "Mot accentué"),
          { name: "body", label: "Texte", type: "localizedRichText" },
        ],
      },
      {
        name: "about",
        label: "À propos",
        type: "group",
        fields: [
          localizedString("title", "Titre"),
          localizedString("accent", "Mot accentué"),
          { name: "body", label: "Texte", type: "localizedRichText" },
          { name: "image", label: "Image", type: "image" },
        ],
      },
      {
        name: "servicesSection",
        label: "Section services (accueil)",
        type: "group",
        fields: [
          localizedString("titleAccent", "Titre — mot accentué"),
          localizedString("titleRest", "Titre — suite"),
          { name: "subtitle", label: "Sous-titre", type: "localizedText" },
        ],
      },
      {
        name: "testimonialsSection",
        label: "Section témoignages (accueil)",
        type: "group",
        fields: [
          localizedString("eyebrow", "Sur-titre"),
          localizedString("titleStart", "Titre — début"),
          localizedString("titleAccent", "Titre — mot accentué"),
        ],
      },
      {
        name: "contactSection",
        label: "Section contact (accueil)",
        type: "group",
        fields: [
          localizedString("eyebrow", "Sur-titre"),
          localizedString("titleStart", "Titre — début"),
          localizedString("titleAccent", "Titre — mot accentué"),
          { name: "description", label: "Description", type: "localizedText" },
          localizedString("meetingLink", "Lien rendez-vous"),
        ],
      },
    ],
  },
  {
    name: "aboutPage",
    kind: "singleton",
    label: "Page À propos",
    labelSingular: "Page À propos",
    description: "Contenu éditorial de la page /about.",
    icon: "about",
    group: "content",
    titleField: "hero.title",
    publishLocales: "bilingual",
    preview: "page",
    fields: [
      {
        name: "hero",
        label: "En-tête",
        type: "group",
        fields: [
          requiredLocalizedString("title", "Titre"),
          { name: "subtitle", label: "Sous-titre", type: "localizedText" },
        ],
      },
      { name: "image", label: "Photo", type: "image" },
      localizedString("imageAlt", "Texte alternatif de la photo"),
      {
        name: "identity",
        label: "Qui je suis",
        type: "group",
        fields: [
          localizedString("label", "Sur-titre"),
          localizedString("greeting", "Accroche"),
          localizedString("role", "Rôle"),
          { name: "paragraphs", label: "Paragraphes", type: "localizedList" },
        ],
      },
      proseBlock("work", "Ce que je fais"),
      proseBlock("value", "Ce que vous y gagnez"),
      proseBlock("approach", "Mon approche"),
      {
        name: "closing",
        label: "Conclusion",
        type: "group",
        fields: [{ name: "paragraphs", label: "Paragraphes", type: "localizedList" }],
      },
      {
        name: "ctaBand",
        label: "Bandeau d'appel à l'action",
        type: "group",
        fields: [
          localizedString("title", "Titre"),
          { name: "subtitle", label: "Sous-titre", type: "localizedText" },
          localizedString("ctaPrimary", "Bouton principal"),
          localizedString("ctaSecondary", "Bouton secondaire"),
        ],
      },
    ],
  },
  {
    name: "service",
    kind: "collection",
    label: "Services",
    labelSingular: "Service",
    description: "Les prestations présentées sur le site.",
    icon: "services",
    group: "content",
    section: "Services",
    titleField: "title",
    subtitleField: "accent",
    publishLocales: "bilingual",
    preview: "page",
    fields: [
      {
        name: "slug",
        label: "Identifiant URL",
        type: "slug",
        help: "Utilisé dans l'adresse /services/…",
        required: true,
        validation: "slug",
      },
      requiredLocalizedString("title", "Titre"),
      localizedString("accent", "Accroche courte"),
      { name: "description", label: "Description", type: "localizedText" },
      { name: "detailIntro", label: "Intro de la page détail", type: "localizedText" },
      { name: "presentation", label: "Présentation", type: "localizedRichText" },
      { name: "metricValue", label: "Chiffre clé", type: "text", placeholder: "+120%" },
      localizedString("metricLabel", "Légende du chiffre"),
      { name: "bullets", label: "Points clés", type: "localizedList" },
      { name: "whatIsIncluded", label: "Ce qui est inclus", type: "localizedList" },
      { name: "targetAudience", label: "Pour qui", type: "localizedList" },
      { name: "concreteApplications", label: "Applications concrètes", type: "localizedList" },
      {
        name: "caseStudy",
        label: "Étude de cas",
        type: "group",
        fields: [
          localizedString("title", "Titre"),
          { name: "description", label: "Description", type: "localizedText" },
        ],
      },
    ],
  },
  {
    name: "blogPost",
    kind: "collection",
    label: "Articles du blog",
    labelSingular: "Article",
    description: "Les articles éditoriaux.",
    icon: "blog",
    group: "content",
    titleField: "title",
    subtitleField: "category",
    publishLocales: "bilingual",
    preview: "page",
    fields: [
      { name: "slug", label: "Identifiant URL", type: "slug", required: true, validation: "slug" },
      requiredLocalizedString("title", "Titre"),
      { name: "excerpt", label: "Extrait", type: "localizedText", required: true },
      localizedString("category", "Catégorie", {
        help: "Libellé affiché sur l'article et dans les filtres du blog (ex. Stratégie, Organisation).",
      }),
      { name: "publishedAt", label: "Date de publication", type: "date" },
      localizedString("readingTime", "Temps de lecture", { placeholder: "5 min" }),
      { name: "featured", label: "Mettre en avant", type: "boolean" },
      { name: "coverImage", label: "Image de couverture", type: "image" },
      { name: "takeaways", label: "À retenir", type: "localizedList" },
      { name: "body", label: "Contenu", type: "localizedRichText", required: true },
    ],
  },
  {
    name: "testimonial",
    kind: "collection",
    label: "Témoignages",
    labelSingular: "Témoignage",
    description: "Les avis clients affichés sur le site.",
    icon: "testimonial",
    group: "content",
    titleField: "name",
    subtitleField: "role",
    publishLocales: "fr",
    preview: "context",
    fields: [
      { name: "name", label: "Nom", type: "text", required: true },
      localizedString("role", "Rôle / entreprise"),
      { name: "quote", label: "Citation", type: "localizedText", required: true },
      { name: "portrait", label: "Portrait", type: "image" },
    ],
  },
  // Carnet · Ressources & communautés — deux types distincts.
  // Le type est implicite selon le menu : inutile de le choisir.
  {
    name: "resource",
    kind: "collection",
    label: "Ressources",
    labelSingular: "Ressource",
    description: "Plateformes et outils éditoriaux référencés dans le carnet.",
    icon: "resource",
    group: "content",
    section: "Ressources & communautés",
    titleField: "title",
    publishLocales: "fr",
    preview: "context",
    fields: [
      requiredLocalizedString("title", "Titre"),
      {
        name: "categories",
        label: "Filtres thématiques",
        type: "tags",
        help: "Sélectionne un ou plusieurs filtres visibles sur la page.",
        options: [
          { value: "Veille & inspiration", label: "Veille & inspiration" },
          { value: "Social media", label: "Social media" },
          { value: "Femmes & numérique", label: "Femmes & numérique" },
        ],
      },
      { name: "description", label: "Description", type: "localizedText" },
      { name: "url", label: "Lien", type: "url", validation: "url" },
      { name: "image", label: "Visuel", type: "image" },
    ],
  },
  {
    name: "community",
    kind: "collection",
    label: "Communautés",
    labelSingular: "Communauté",
    description: "Communautés africaines référencées dans le carnet.",
    icon: "community",
    group: "content",
    section: "Ressources & communautés",
    titleField: "title",
    publishLocales: "fr",
    preview: "context",
    fields: [
      requiredLocalizedString("title", "Titre"),
      {
        name: "categories",
        label: "Filtres thématiques",
        type: "tags",
        help: "Sélectionne un ou plusieurs filtres visibles sur la page.",
        options: [
          { value: "Veille & inspiration", label: "Veille & inspiration" },
          { value: "Social media", label: "Social media" },
          { value: "Femmes & numérique", label: "Femmes & numérique" },
        ],
      },
      { name: "description", label: "Description", type: "localizedText" },
      { name: "url", label: "Lien", type: "url", validation: "url" },
      { name: "image", label: "Visuel", type: "image" },
    ],
  },
  // Carnet · Lectures & références — deux types distincts.
  {
    name: "book",
    kind: "collection",
    label: "Ouvrages recommandés",
    labelSingular: "Ouvrage",
    description: "Livres repères cités dans la page Lectures & références.",
    icon: "book",
    group: "content",
    section: "Lectures & références",
    titleField: "title",
    subtitleField: "author",
    publishLocales: "fr",
    preview: "context",
    fields: [
      requiredLocalizedString("title", "Titre"),
      { name: "author", label: "Auteur", type: "text", required: true },
      { name: "date", label: "Année", type: "text", placeholder: "2024" },
      { name: "description", label: "Description", type: "localizedText" },
      { name: "url", label: "Lien Google Books", type: "url", validation: "url" },
      { name: "image", label: "Couverture", type: "image" },
    ],
  },
  {
    name: "reference",
    kind: "collection",
    label: "Articles & newsletters",
    labelSingular: "Référence",
    description: "Newsletters et articles cités dans la page Lectures & références.",
    icon: "reference",
    group: "content",
    section: "Lectures & références",
    titleField: "title",
    subtitleField: "author",
    publishLocales: "fr",
    preview: "context",
    fields: [
      requiredLocalizedString("title", "Titre"),
      { name: "author", label: "Auteur / source", type: "text", required: true },
      localizedString("typeLabel", "Type affiché", { placeholder: "Newsletter" }),
      {
        name: "cardStyle",
        label: "Style de carte",
        type: "select",
        options: [
          { value: "standard", label: "Carte standard" },
          { value: "pinned", label: "Note épinglée" },
        ],
      },
      { name: "description", label: "Description", type: "localizedText" },
      { name: "url", label: "Lien", type: "url", validation: "url" },
    ],
  },
  {
    name: "cvPage",
    kind: "singleton",
    label: "En-tête CV",
    labelSingular: "En-tête CV",
    description: "Sur-titre, nom, rôle et introduction du curriculum vitæ.",
    icon: "cv",
    group: "content",
    section: "CV",
    titleField: "lastName",
    publishLocales: "fr",
    preview: "page",
    fields: [
      localizedString("eyebrow", "Sur-titre"),
      { name: "firstName", label: "Prénom", type: "text", placeholder: "Carole", required: true },
      { name: "lastName", label: "Nom", type: "text", placeholder: "Tonoukouen", required: true },
      localizedString("role", "Titre / rôle"),
      { name: "summary", label: "Introduction", type: "localizedText" },
      {
        name: "contacts",
        label: "Coordonnées",
        type: "group",
        fields: [
          { name: "email", label: "Email", type: "email", validation: "email" },
          { name: "phone", label: "Téléphone", type: "text" },
          localizedString("location", "Localisation"),
          localizedString("portfolioLabel", "Libellé du portfolio"),
          { name: "portfolioUrl", label: "Lien du portfolio", type: "url", validation: "url" },
        ],
      },
    ],
  },
  {
    name: "cvEntry",
    kind: "collection",
    label: "Parcours / CV",
    labelSingular: "Entrée de CV",
    description: "Expériences, formations, compétences.",
    icon: "cv",
    group: "content",
    section: "CV",
    titleField: "title",
    subtitleField: "organization",
    publishLocales: "fr",
    preview: "context",
    fields: [
      requiredLocalizedString("title", "Intitulé"),
      {
        name: "category",
        label: "Catégorie",
        type: "select",
        required: true,
        options: [
          { value: "experience", label: "Expérience" },
          { value: "education", label: "Formation" },
          { value: "skill", label: "Compétence" },
          { value: "language", label: "Langue" },
          { value: "achievement", label: "Réalisation" },
        ],
      },
      { name: "organization", label: "Organisation", type: "text" },
      localizedString("period", "Période", { placeholder: "2022 – 2024" }),
      { name: "description", label: "Description", type: "localizedText" },
      { name: "highlights", label: "Points forts", type: "localizedList" },
    ],
  },
  {
    name: "siteSettings",
    kind: "singleton",
    label: "Réglages du site",
    labelSingular: "Réglages du site",
    description: "Nom, SEO global, métadonnées par page, email et réseaux sociaux.",
    icon: "settings",
    group: "settings",
    titleField: "title",
    publishLocales: "bilingual",
    preview: "page",
    fields: [
      requiredLocalizedString("title", "Nom du site"),
      { name: "description", label: "Description par défaut (SEO)", type: "localizedText" },
      {
        name: "siteUrl",
        label: "URL du site",
        type: "url",
        help: "Base pour le canonical et le partage social (ex. https://www.carolebj.com).",
        placeholder: "https://www.carolebj.com",
        validation: "url",
      },
      { name: "ogImage", label: "Image de partage (Open Graph)", type: "image" },
      {
        name: "seoPages",
        label: "SEO par page",
        type: "group",
        fields: [
          seoPage("home", "Accueil"),
          seoPage("about", "À propos"),
          seoPage("services", "Services"),
          seoPage("blog", "Blog"),
          seoPage("contact", "Contact"),
          seoPage("cv", "CV"),
          seoPage("carnetResources", "Carnet · Ressources & communautés"),
          seoPage("carnetReadings", "Carnet · Lectures & références"),
        ],
      },
      { name: "contactEmail", label: "Email de contact", type: "email", validation: "email" },
      { name: "behance", label: "Behance (URL)", type: "url", validation: "url" },
      { name: "linkedin", label: "LinkedIn (URL)", type: "url", validation: "url" },
    ],
  },
];

export function getContentType(name: string): ContentType | undefined {
  return contentTypes.find((type) => type.name === name);
}
