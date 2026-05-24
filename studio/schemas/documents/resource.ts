import { defineField, defineType } from "sanity";

export const resource = defineType({
  name: "resource",
  title: "Ressource",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titre",
      type: "localizedString",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        layout: "radio",
        list: [
          { title: "Plateforme", value: "platform" },
          { title: "Outil", value: "tool" },
          { title: "Campagne inspirante", value: "campaign" },
          { title: "Communauté", value: "community" },
          { title: "Lecture", value: "reading" },
          { title: "Référence", value: "reference" },
        ],
      },
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "localizedText",
    }),
    defineField({
      name: "url",
      title: "Lien",
      type: "url",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
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
      subtitle: "kind",
      media: "image",
    },
  },
});
