import { defineField, defineType } from "sanity";

export const category = defineType({
  name: "category",
  title: "Catégorie",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Nom",
      type: "localizedString",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title.fr", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "localizedText",
    }),
  ],
  preview: {
    select: {
      title: "title.fr",
      subtitle: "slug.current",
    },
  },
});
