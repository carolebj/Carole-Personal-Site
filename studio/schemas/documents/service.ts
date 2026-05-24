import { defineField, defineType } from "sanity";

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "accent",
      title: "Accent du titre",
      type: "localizedString",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title.fr", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "displayOrder",
      title: "Ordre d'affichage",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "description",
      title: "Description courte",
      type: "localizedText",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "detailIntro",
      title: "Introduction page détail",
      type: "localizedText",
    }),
    defineField({
      name: "presentation",
      title: "Présentation longue",
      type: "localizedText",
    }),
    defineField({
      name: "metricValue",
      title: "Chiffre clé",
      type: "string",
    }),
    defineField({
      name: "metricLabel",
      title: "Description du chiffre clé",
      type: "localizedText",
    }),
    defineField({
      name: "bullets",
      title: "Points rapides",
      type: "array",
      of: [{ type: "localizedString" }],
    }),
    defineField({
      name: "whatIsIncluded",
      title: "Ce qui est inclus",
      type: "array",
      of: [{ type: "localizedText" }],
    }),
    defineField({
      name: "targetAudience",
      title: "Pour qui",
      type: "array",
      of: [{ type: "localizedText" }],
    }),
    defineField({
      name: "concreteApplications",
      title: "Applications concrètes",
      type: "array",
      of: [{ type: "localizedText" }],
    }),
    defineField({
      name: "caseStudy",
      title: "Cas d'usage",
      type: "object",
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
