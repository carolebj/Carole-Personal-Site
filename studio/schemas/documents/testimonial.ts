import { defineField, defineType } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  title: "Témoignage",
  type: "document",
  fields: [
    defineField({
      name: "quote",
      title: "Citation",
      type: "localizedText",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "name",
      title: "Nom",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      title: "Rôle / entreprise",
      type: "localizedString",
    }),
    defineField({
      name: "displayOrder",
      title: "Ordre d'affichage",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "portrait",
      title: "Image optionnelle",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "role.fr",
      media: "portrait",
    },
  },
});
