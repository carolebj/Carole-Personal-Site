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
};

export type IconKey =
  | "home"
  | "services"
  | "blog"
  | "testimonial"
  | "resource"
  | "community"
  | "book"
  | "reference"
  | "cv"
  | "category"
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
  fields: FieldDef[];
};

const localizedString = (name: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({
  name,
  label,
  type: "localizedString",
  ...extra,
});

export const contentTypes: ContentType[] = [
  {
    name: "homePage",
    kind: "singleton",
    label: "Page d'accueil",
    labelSingular: "Page d'accueil",
    description: "Le hero, le manifeste et la section à propos.",
    icon: "home",
    group: "content",
    titleField: "hero.title",
    fields: [
      {
        name: "hero",
        label: "Hero",
        type: "group",
        fields: [
          localizedString("eyebrow", "Sur-titre"),
          localizedString("title", "Titre"),
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
    titleField: "title",
    subtitleField: "accent",
    fields: [
      { name: "slug", label: "Identifiant URL", type: "slug", help: "Utilisé dans l'adresse /services/…" },
      localizedString("title", "Titre"),
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
    fields: [
      { name: "slug", label: "Identifiant URL", type: "slug" },
      localizedString("title", "Titre"),
      { name: "excerpt", label: "Extrait", type: "localizedText" },
      localizedString("category", "Catégorie"),
      { name: "publishedAt", label: "Date de publication", type: "date" },
      localizedString("readingTime", "Temps de lecture", { placeholder: "5 min" }),
      { name: "featured", label: "Mettre en avant", type: "boolean" },
      { name: "coverImage", label: "Image de couverture", type: "image" },
      { name: "takeaways", label: "À retenir", type: "localizedList" },
      { name: "body", label: "Contenu", type: "localizedRichText" },
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
    fields: [
      { name: "name", label: "Nom", type: "text" },
      localizedString("role", "Rôle / entreprise"),
      { name: "quote", label: "Citation", type: "localizedText" },
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
    fields: [
      localizedString("title", "Titre"),
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
      { name: "url", label: "Lien", type: "url" },
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
    fields: [
      localizedString("title", "Titre"),
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
      { name: "url", label: "Lien", type: "url" },
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
    fields: [
      localizedString("title", "Titre"),
      { name: "author", label: "Auteur", type: "text" },
      { name: "date", label: "Année", type: "text", placeholder: "2024" },
      { name: "description", label: "Description", type: "localizedText" },
      { name: "url", label: "Lien Google Books", type: "url" },
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
    fields: [
      localizedString("title", "Titre"),
      { name: "author", label: "Auteur / source", type: "text" },
      { name: "description", label: "Description", type: "localizedText" },
      { name: "url", label: "Lien", type: "url" },
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
    titleField: "title",
    subtitleField: "organization",
    fields: [
      localizedString("title", "Intitulé"),
      {
        name: "category",
        label: "Catégorie",
        type: "select",
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
    name: "category",
    kind: "collection",
    label: "Catégories",
    labelSingular: "Catégorie",
    description: "Catégories d'articles du blog.",
    icon: "category",
    group: "content",
    titleField: "title",
    subtitleField: "slug",
    fields: [
      localizedString("title", "Nom"),
      { name: "slug", label: "Identifiant URL", type: "slug" },
    ],
  },
  {
    name: "siteSettings",
    kind: "singleton",
    label: "Réglages du site",
    labelSingular: "Réglages du site",
    description: "Nom, description SEO, email, réseaux sociaux.",
    icon: "settings",
    group: "settings",
    titleField: "title",
    fields: [
      localizedString("title", "Nom du site"),
      { name: "description", label: "Description (SEO)", type: "localizedText" },
      { name: "contactEmail", label: "Email de contact", type: "email" },
      { name: "instagram", label: "Instagram (URL)", type: "url" },
      { name: "linkedin", label: "LinkedIn (URL)", type: "url" },
    ],
  },
];

export function getContentType(name: string): ContentType | undefined {
  return contentTypes.find((type) => type.name === name);
}
