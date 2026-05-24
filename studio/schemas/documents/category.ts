import { defineField, defineType } from "sanity";
import { TagIcon } from "@sanity/icons";

export const category = defineType({
  name: "category",
  title: "Catégorie",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      title: "Nom",
      type: "localizedString",
      description: "Nom visible dans les filtres et les cartes de blog.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "Identifiant court utilisé par le site.",
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
