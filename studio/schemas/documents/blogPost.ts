import { defineField, defineType } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export const blogPost = defineType({
  name: "blogPost",
  title: "Article du blog",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "writing", title: "Rédaction", default: true },
    { name: "translation", title: "Traduction" },
    { name: "publication", title: "Publication" },
    { name: "media", title: "Médias" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Titre",
      type: "localizedString",
      group: "writing",
      description: "Le titre principal de l'article. Le français sert de source éditoriale.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "publication",
      description: "L'URL courte de l'article. Générez-la depuis le titre français.",
      options: { source: "title.fr", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Extrait",
      type: "localizedText",
      group: "writing",
      description: "Résumé affiché sur les cartes de blog et les aperçus.",
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "reference",
      group: "publication",
      description: "Choisissez une catégorie existante ou créez-en une nouvelle directement depuis ce champ.",
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
      group: "publication",
    }),
    defineField({
      name: "readingTime",
      title: "Temps de lecture",
      type: "localizedString",
      group: "publication",
      description: "Exemple: 6 min de lecture / 6 min read.",
    }),
    defineField({
      name: "featured",
      title: "Mettre en avant",
      type: "boolean",
      group: "publication",
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
      group: "writing",
      description: "Points rapides qui aident le lecteur à scanner l'article.",
      of: [{ type: "localizedText" }],
    }),
    defineField({
      name: "body",
      title: "Contenu",
      type: "localizedBlockContent",
      group: "translation",
      description: "Article complet en français et en anglais, avec images intégrées si nécessaire.",
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
