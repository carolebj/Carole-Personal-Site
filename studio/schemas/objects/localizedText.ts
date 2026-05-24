import { defineField, defineType } from "sanity";
import { LocalizedTextInput } from "../../components/LocalizedFieldInput";

export const localizedText = defineType({
  name: "localizedText",
  title: "Texte long bilingue",
  type: "object",
  components: {
    input: LocalizedTextInput,
  },
  fields: [
    defineField({
      name: "fr",
      title: "Français",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "en",
      title: "English",
      type: "text",
      rows: 4,
    }),
  ],
});
