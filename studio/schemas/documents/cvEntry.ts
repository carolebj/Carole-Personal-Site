import { defineField, defineType } from "sanity";

export const cvEntry = defineType({
  name: "cvEntry",
  title: "Entrée CV",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titre",
      type: "localizedString",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "string",
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
    }),
    defineField({
      name: "period",
      title: "Période",
      type: "localizedString",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "localizedText",
    }),
    defineField({
      name: "highlights",
      title: "Points clés",
      type: "array",
      of: [{ type: "localizedText" }],
    }),
    defineField({
      name: "displayOrder",
      title: "Ordre d'affichage",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: "title.fr",
      subtitle: "category",
    },
  },
});
