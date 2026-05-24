import type { StructureResolver } from "sanity/structure";

const singleton = (S: Parameters<StructureResolver>[0], id: string, title: string) =>
  S.listItem()
    .title(title)
    .id(id)
    .child(S.document().schemaType(id).documentId(id).title(title));

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Contenus du site")
    .items([
      singleton(S, "siteSettings", "Paramètres du site"),
      singleton(S, "homePage", "Page d'accueil"),
      S.divider(),
      S.documentTypeListItem("service").title("Services"),
      S.documentTypeListItem("blogPost").title("Articles du blog"),
      S.documentTypeListItem("category").title("Catégories"),
      S.documentTypeListItem("testimonial").title("Témoignages"),
      S.divider(),
      S.documentTypeListItem("resource").title("Ressources & communautés"),
      S.documentTypeListItem("cvEntry").title("CV"),
    ]);
