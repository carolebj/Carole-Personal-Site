import { defineField, defineType } from "sanity";
import { LocalizedStringInput } from "../../components/LocalizedFieldInput";

export const localizedString = defineType({
  name: "localizedString",
  title: "Texte court bilingue",
  type: "object",
  components: {
    input: LocalizedStringInput,
  },
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
