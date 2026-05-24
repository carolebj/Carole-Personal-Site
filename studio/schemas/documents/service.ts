import { defineField, defineType } from "sanity";

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  groups: [
    { name: "presentation", title: "Présentation", default: true },
    { name: "details", title: "Détails" },
    { name: "audience", title: "Public & Applications" },
    { name: "caseStudy", title: "Cas d'usage" },
  ],
  orderings: [
    {
      title: "Ordre d'affichage",
      name: "displayOrderAsc",
      by: [{ field: "displayOrder", direction: "asc" }],
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Titre",
      type: "localizedString",
      group: "presentation",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "accent",
      title: "Accent du titre",
      type: "localizedString",
      group: "presentation",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "presentation",
      options: { source: "title.fr", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "displayOrder",
      title: "Ordre d'affichage",
      type: "number",
      group: "presentation",
      initialValue: 0,
    }),
    defineField({
      name: "description",
      title: "Description courte",
      type: "localizedText",
      group: "presentation",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "detailIntro",
      title: "Introduction page détail",
      type: "localizedText",
      group: "presentation",
    }),
    defineField({
      name: "presentation",
      title: "Présentation longue",
      type: "localizedText",
      group: "presentation",
    }),
    defineField({
      name: "metricValue",
      title: "Chiffre clé",
      type: "string",
      group: "details",
    }),
    defineField({
      name: "metricLabel",
      title: "Description du chiffre clé",
      type: "localizedText",
      group: "details",
    }),
    defineField({
      name: "bullets",
      title: "Points rapides",
      type: "array",
      group: "details",
      of: [{ type: "localizedString" }],
    }),
    defineField({
      name: "whatIsIncluded",
      title: "Ce qui est inclus",
      type: "array",
      group: "details",
      of: [{ type: "localizedText" }],
    }),
    defineField({
      name: "targetAudience",
      title: "Pour qui",
      type: "array",
      group: "audience",
      of: [{ type: "localizedText" }],
    }),
    defineField({
      name: "concreteApplications",
      title: "Applications concrètes",
      type: "array",
      group: "audience",
      of: [{ type: "localizedText" }],
    }),
    defineField({
      name: "caseStudy",
      title: "Cas d'usage",
      type: "object",
      group: "caseStudy",
      fields: [
        { name: "title", title: "Titre", type: "localizedString" },
        { name: "description", title: "Description", type: "localizedText" },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title.fr",
      subtitle: "slug.current",
    },
  },
});
