// Shared image references for Carnet content (resources, communities, books).
// Files live in public/cms/resources/ so they work in the dashboard and on the site.

type CarnetImage = { url: string; alt: { fr: string; en: string } };

const resource = (filename: string, altFr: string, altEn = altFr): CarnetImage => ({
  url: `/cms/resources/${filename}`,
  alt: { fr: altFr, en: altEn },
});

export const carnetImagesBySlug: Record<string, CarnetImage> = {
  "le-depot": resource("le-depot.webp", "Visuel LE DÉPÔT"),
  laveiye: resource("laveiye.webp", "Visuel LAVEIYE"),
  "calendrier-cm-229": resource("calendrier-cm229.webp", "Visuel Calendrier du CM 229"),
  "social-media-room": resource("social-media-room.webp", "Visuel Social Media Room"),
  "women-in-tech-benin": resource("women-in-tech-benin.webp", "Visuel WOMEN IN TECH BENIN"),
  "women-techmakers-abomey-calavi": resource(
    "women-techmakers-abomey-calavi.webp",
    "Visuel Women Techmakers Abomey-Calavi",
  ),
};

export const bookCoversBySlug: Record<string, CarnetImage> = {
  "everybody-writes": {
    url: "https://books.google.com/books/content?id=QGtECQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    alt: { fr: "Couverture Everybody Writes", en: "Everybody Writes cover" },
  },
  storybrand: {
    url: "https://books.google.com/books/content?id=b3xDDgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    alt: { fr: "Couverture Storybrand", en: "Storybrand cover" },
  },
  "le-bug-humain": {
    url: "https://books.google.com/books/content?id=_yODDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    alt: { fr: "Couverture Le Bug Humain", en: "Le Bug Humain cover" },
  },
};
