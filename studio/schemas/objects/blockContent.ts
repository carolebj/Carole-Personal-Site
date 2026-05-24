import { defineArrayMember, defineType } from "sanity";

export const blockContent = defineType({
  name: "blockContent",
  title: "Contenu riche",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Paragraphe", value: "normal" },
        { title: "Titre de section", value: "h2" },
        { title: "Sous-titre", value: "h3" },
        { title: "Citation", value: "blockquote" },
      ],
      lists: [
        { title: "Liste", value: "bullet" },
        { title: "Liste numérotée", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Gras", value: "strong" },
          { title: "Italique", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            title: "Lien",
            type: "object",
            fields: [
              {
                name: "href",
                title: "URL",
                type: "url",
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      title: "Image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Texte alternatif",
          type: "string",
        },
      ],
    }),
  ],
});
