import {
  BillIcon,
  BookIcon,
  CalendarIcon,
  ClipboardIcon,
  CogIcon,
  CommentIcon,
  DocumentIcon,
  FolderIcon,
  HomeIcon,
  TagIcon,
} from "@sanity/icons";
import type { StructureResolver } from "sanity/structure";

const singleton = (S: Parameters<StructureResolver>[0], id: string, title: string, icon?: ReturnType<typeof S.listItem>["icon"]) =>
  S.listItem()
    .title(title)
    .id(id)
    .icon(icon)
    .child(S.document().schemaType(id).documentId(id).title(title));

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Espace éditorial Carole")
    .items([
      singleton(S, "siteSettings", "Informations générales", HomeIcon),
      singleton(S, "homePage", "Page d'accueil", CogIcon),
      S.divider(),
      S.documentTypeListItem("service").title("Services").icon(BillIcon),
      S.documentTypeListItem("blogPost").title("Articles du blog").icon(DocumentIcon),
      S.documentTypeListItem("category").title("Catégories").icon(TagIcon),
      S.listItem()
        .title("Témoignages")
        .icon(CommentIcon)
        .child(
          S.documentTypeList("testimonial")
            .title("Témoignages")
            .defaultOrdering([{ field: "displayOrder", direction: "asc" }])
        ),
      S.documentTypeListItem("resource")
        .title("Ressources & communautés")
        .icon(FolderIcon),
      S.divider(),
      S.listItem()
        .title("CV")
        .icon(ClipboardIcon)
        .child(
          S.list()
            .title("CV")
            .items([
              S.documentListItem()
                .schemaType("cvEntry")
                .id("cv-experience")
                .title("Expériences")
                .icon(CalendarIcon)
                .child(
                  S.documentTypeList("cvEntry")
                    .title("Expériences")
                    .filter('_type == "cvEntry" && category == "experience"')
                    .defaultOrdering([{ field: "displayOrder", direction: "asc" }])
                ),
              S.documentListItem()
                .schemaType("cvEntry")
                .id("cv-education")
                .title("Formations")
                .icon(BookIcon)
                .child(
                  S.documentTypeList("cvEntry")
                    .title("Formations")
                    .filter('_type == "cvEntry" && category == "education"')
                    .defaultOrdering([{ field: "displayOrder", direction: "asc" }])
                ),
              S.documentListItem()
                .schemaType("cvEntry")
                .id("cv-skills")
                .title("Compétences")
                .icon(TagIcon)
                .child(
                  S.documentTypeList("cvEntry")
                    .title("Compétences")
                    .filter('_type == "cvEntry" && category in ["skill", "language", "achievement"]')
                    .defaultOrdering([{ field: "displayOrder", direction: "asc" }])
                ),
              S.divider(),
              S.documentTypeListItem("cvEntry").title("Toutes les entrées").icon(ClipboardIcon),
            ])
        ),
    ]);
