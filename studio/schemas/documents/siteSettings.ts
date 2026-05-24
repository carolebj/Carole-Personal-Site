import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Paramètres du site",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Nom du site",
      type: "localizedString",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description SEO",
      type: "localizedText",
    }),
    defineField({
      name: "contactEmail",
      title: "Email de contact",
      type: "email",
    }),
    defineField({
      name: "socialLinks",
      title: "Liens sociaux",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Nom", type: "string" },
            { name: "url", title: "URL", type: "url" },
          ],
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Paramètres du site" }),
  },
});
