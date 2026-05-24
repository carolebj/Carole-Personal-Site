import { defineField, defineType } from "sanity";

export const localizedBlockContent = defineType({
  name: "localizedBlockContent",
  title: "Contenu riche bilingue",
  type: "object",
  fields: [
    defineField({
      name: "fr",
      title: "Français",
      type: "blockContent",
    }),
    defineField({
      name: "en",
      title: "English",
      type: "blockContent",
    }),
  ],
});
