import { defineField, defineType } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  title: "Témoignage",
  type: "document",
  groups: [
    { name: "content", title: "Contenu", default: true },
    { name: "media", title: "Média" },
  ],
  fields: [
    defineField({
      name: "quote",
      title: "Citation",
      type: "localizedText",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "name",
      title: "Nom",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      title: "Rôle / entreprise",
      type: "localizedString",
      group: "content",
    }),
    defineField({
      name: "displayOrder",
      title: "Ordre d'affichage",
      type: "number",
      group: "content",
      initialValue: 0,
    }),
    defineField({
      name: "portrait",
      title: "Image optionnelle",
      type: "image",
      group: "media",
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "role.fr",
      media: "portrait",
    },
    prepare({ title, subtitle, media }: { title?: string; subtitle?: string; media?: unknown }) {
      return {
        title: title ?? "Anonyme",
        subtitle: subtitle ?? "",
        media,
      };
    },
  },
});
