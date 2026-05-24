import { defineField, defineType } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Article du blog",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titre",
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
      name: "excerpt",
      title: "Extrait",
      type: "localizedText",
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "reference",
      to: [{ type: "category" }],
      options: {
        disableNew: false,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Date de publication",
      type: "datetime",
    }),
    defineField({
      name: "readingTime",
      title: "Temps de lecture",
      type: "localizedString",
    }),
    defineField({
      name: "featured",
      title: "Mettre en avant",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "coverImage",
      title: "Image de couverture",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Texte alternatif", type: "localizedString" }],
    }),
    defineField({
      name: "takeaways",
      title: "À retenir",
      type: "array",
      of: [{ type: "localizedText" }],
    }),
    defineField({
      name: "body",
      title: "Contenu",
      type: "localizedBlockContent",
    }),
  ],
  preview: {
    select: {
      title: "title.fr",
      subtitle: "category.fr",
      media: "coverImage",
    },
  },
});
