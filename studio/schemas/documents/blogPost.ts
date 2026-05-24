import { defineField, defineType } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Article du blog",
  type: "document",
  groups: [
    { name: "content", title: "Contenu", default: true },
    { name: "metadata", title: "Méta-données" },
    { name: "media", title: "Média" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Titre",
      type: "localizedString",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "metadata",
      options: { source: "title.fr", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Extrait",
      type: "localizedText",
      group: "content",
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "reference",
      group: "metadata",
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
      group: "metadata",
    }),
    defineField({
      name: "readingTime",
      title: "Temps de lecture",
      type: "localizedString",
      group: "metadata",
    }),
    defineField({
      name: "featured",
      title: "Mettre en avant",
      type: "boolean",
      group: "metadata",
      initialValue: false,
    }),
    defineField({
      name: "coverImage",
      title: "Image de couverture",
      type: "image",
      group: "media",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Texte alternatif", type: "localizedString" }],
    }),
    defineField({
      name: "takeaways",
      title: "À retenir",
      type: "array",
      group: "content",
      of: [{ type: "localizedText" }],
    }),
    defineField({
      name: "body",
      title: "Contenu",
      type: "localizedBlockContent",
      group: "content",
    }),
  ],
  preview: {
    select: {
      title: "title.fr",
      subtitle: "slug.current",
      media: "coverImage",
    },
    prepare({ title, subtitle, media }: { title?: string; subtitle?: string; media?: unknown }) {
      return {
        title: title ?? "Sans titre",
        subtitle: subtitle ? `/${subtitle}` : "",
        media,
      };
    },
  },
});
