import type { AnyDoc } from "./store";
import { BlogArticleContent } from "../app/pages/BlogArticleContent";

type Localized = { fr?: string; en?: string };

function fr(value: unknown): string {
  if (value && typeof value === "object") {
    const loc = value as Localized;
    return loc.fr || loc.en || "";
  }
  return typeof value === "string" ? value : "";
}

// Renders the editor preview using the exact same component as the public
// reading page (`BlogArticle`), so what the editor sees matches what ships.
export default function BlogPreview({ doc }: { doc: AnyDoc }) {
  const date = typeof doc.publishedAt === "string" ? doc.publishedAt : "";
  const takeaways = Array.isArray(doc.takeaways)
    ? (doc.takeaways as Localized[]).map((t) => fr(t)).filter(Boolean)
    : [];

  return (
    <div className="bg-[#fcf9f8] px-5 pb-20 pt-8 text-[#1c1b1b] dark:bg-[#13100f] dark:text-[#f8f1ec] sm:px-8">
      <article className="mx-auto max-w-[1040px]">
        <BlogArticleContent
          showEmptyHint
          post={{
            slug: typeof doc.slug === "string" ? doc.slug : "preview",
            title: fr(doc.title) || "Titre de l'article",
            excerpt: fr(doc.excerpt),
            category: fr(doc.category) || "Catégorie",
            readingTime: fr(doc.readingTime) || "5 min",
            date,
            takeaways,
            body: fr(doc.body),
            imageSrc: (doc.coverImage as { url?: string } | null)?.url,
          }}
        />
      </article>
    </div>
  );
}
