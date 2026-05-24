import { defineField, defineType } from "sanity";

export const localizedString = defineType({
  name: "localizedString",
  title: "Texte court bilingue",
  type: "object",
  fields: [
    defineField({
      name: "fr",
      title: "Français",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "en",
      title: "English",
      type: "string",
    }),
  ],
});
