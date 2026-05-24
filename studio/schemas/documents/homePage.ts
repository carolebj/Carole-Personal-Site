import { defineField, defineType } from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Page d'accueil",
  type: "document",
  fields: [
    defineField({
      name: "hero",
      title: "Hero",
      type: "object",
      fields: [
        { name: "eyebrow", title: "Surtitre", type: "localizedString" },
        { name: "title", title: "Titre", type: "localizedString" },
        { name: "accent", title: "Partie mise en avant", type: "localizedString" },
        { name: "titleEnd", title: "Fin du titre", type: "localizedString" },
        { name: "description", title: "Description", type: "localizedText" },
        { name: "primaryCta", title: "Bouton principal", type: "localizedString" },
        { name: "secondaryCta", title: "Bouton secondaire", type: "localizedString" },
        {
          name: "portrait",
          title: "Portrait principal",
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "alt", title: "Texte alternatif", type: "localizedString" }],
        },
      ],
    }),
    defineField({
      name: "manifesto",
      title: "Manifesto",
      type: "object",
      fields: [
        { name: "title", title: "Titre", type: "localizedString" },
        { name: "accent", title: "Accent", type: "localizedString" },
        { name: "body", title: "Texte", type: "localizedBlockContent" },
      ],
    }),
    defineField({
      name: "about",
      title: "À propos",
      type: "object",
      fields: [
        { name: "title", title: "Titre", type: "localizedString" },
        { name: "accent", title: "Accent", type: "localizedString" },
        { name: "body", title: "Texte", type: "localizedBlockContent" },
        {
          name: "image",
          title: "Image à propos",
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "alt", title: "Texte alternatif", type: "localizedString" }],
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Page d'accueil" }),
  },
});
