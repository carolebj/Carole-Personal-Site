import type { AnyDoc } from "./store";
import { BlogArticleContent } from "../app/pages/BlogArticleContent";

type Localized = { fr?: string; en?: string };

// Renders the editor preview using the exact same component as the public
// reading page (`BlogArticle`), so what the editor sees matches what ships.
export default function BlogPreview({ doc, locale = "fr" }: { doc: AnyDoc; locale?: "fr" | "en" }) {
  const read = (value: unknown) => {
    if (value && typeof value === "object") {
      const loc = value as Localized;
      return loc[locale] || loc.fr || loc.en || "";
    }
    return typeof value === "string" ? value : "";
  };
  const date = typeof doc.publishedAt === "string" ? doc.publishedAt : "";
  const takeaways = Array.isArray(doc.takeaways)
    ? (doc.takeaways as Localized[]).map((t) => read(t)).filter(Boolean)
    : [];

  return (
    <div className="bg-[#fcf9f8] px-5 pb-20 pt-8 text-[#1c1b1b] dark:bg-[#13100f] dark:text-[#f8f1ec] sm:px-8">
      <article className="mx-auto max-w-[1040px]">
        <BlogArticleContent
          showEmptyHint
          post={{
            slug: typeof doc.slug === "string" ? doc.slug : "preview",
            title: read(doc.title) || "Titre de l'article",
            excerpt: read(doc.excerpt),
            category: read(doc.category) || "Catégorie",
            readingTime: read(doc.readingTime) || "5 min",
            date,
            takeaways,
            body: read(doc.body),
            imageSrc: (doc.coverImage as { url?: string } | null)?.url,
          }}
        />
      </article>
    </div>
  );
}
