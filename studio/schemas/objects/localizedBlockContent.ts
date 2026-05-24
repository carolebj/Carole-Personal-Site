import { defineField, defineType } from "sanity";
import { LocalizedBlockInput } from "../../components/LocalizedBlockInput";

export const localizedBlockContent = defineType({
  name: "localizedBlockContent",
  title: "Contenu riche bilingue",
  type: "object",
  components: {
    input: LocalizedBlockInput,
  },
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
