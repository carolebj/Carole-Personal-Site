import { CogIcon, HomeIcon, BillIcon, DocumentIcon, TagIcon, CommentIcon, BookIcon, ClipboardIcon, FolderIcon } from "@sanity/icons";
import type { StructureResolver } from "sanity/structure";

const singleton = (S: Parameters<StructureResolver>[0], id: string, title: string, icon?: ReturnType<typeof S.listItem>["icon"]) =>
  S.listItem()
    .title(title)
    .id(id)
    .icon(icon)
    .child(S.document().schemaType(id).documentId(id).title(title));

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Contenus du site")
    .items([
      S.listItem()
        .title("Configuration")
        .icon(CogIcon)
        .child(
          S.list()
            .title("Configuration")
            .items([
              singleton(S, "siteSettings", "Paramètres du site", CogIcon),
              singleton(S, "homePage", "Page d'accueil", HomeIcon),
            ])
        ),
      S.divider(),
      S.listItem()
        .title("Services & Blog")
        .icon(DocumentIcon)
        .child(
          S.list()
            .title("Services & Blog")
            .items([
              S.documentTypeListItem("service").title("Services").icon(BillIcon),
              S.documentTypeListItem("blogPost").title("Articles du blog").icon(DocumentIcon),
              S.documentTypeListItem("category").title("Catégories").icon(TagIcon),
            ])
        ),
      S.listItem()
        .title("Témoignages & Références")
        .icon(CommentIcon)
        .child(
          S.list()
            .title("Témoignages & Références")
            .items([
              S.documentTypeListItem("testimonial").title("Témoignages").icon(CommentIcon),
              S.documentTypeListItem("resource").title("Ressources & communautés").icon(FolderIcon),
            ])
        ),
      S.divider(),
      S.documentTypeListItem("cvEntry").title("CV").icon(ClipboardIcon),
    ]);
