import { defineField, defineType } from "sanity";

export const cvEntry = defineType({
  name: "cvEntry",
  title: "Entrée CV",
  type: "document",
  groups: [
    { name: "basic", title: "Informations", default: true },
    { name: "details", title: "Détails" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Titre",
      type: "localizedString",
      group: "basic",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "string",
      group: "basic",
      options: {
        layout: "radio",
        list: [
          { title: "Expérience", value: "experience" },
          { title: "Formation", value: "education" },
          { title: "Compétence", value: "skill" },
          { title: "Langue", value: "language" },
          { title: "Réalisation", value: "achievement" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "organization",
      title: "Organisation",
      type: "string",
      group: "basic",
    }),
    defineField({
      name: "period",
      title: "Période",
      type: "localizedString",
      group: "basic",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "localizedText",
      group: "details",
    }),
    defineField({
      name: "highlights",
      title: "Points clés",
      type: "array",
      group: "details",
      of: [{ type: "localizedText" }],
    }),
    defineField({
      name: "displayOrder",
      title: "Ordre d'affichage",
      type: "number",
      group: "basic",
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: "title.fr",
      subtitle: "category",
      media: "",
    },
    prepare({ title, subtitle }: { title?: string; subtitle?: string }) {
      const labels: Record<string, string> = {
        experience: "Expérience",
        education: "Formation",
        skill: "Compétence",
        language: "Langue",
        achievement: "Réalisation",
      };
      return {
        title: title || "Sans titre",
        subtitle: subtitle ? labels[subtitle] ?? subtitle : "",
      };
    },
  },
});
