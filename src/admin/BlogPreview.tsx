import { ArrowLeftIcon, BookOpenIcon, ClockIcon } from "@heroicons/react/24/outline";
import type { AnyDoc } from "./store";

type Localized = { fr?: string; en?: string };

function fr(value: unknown): string {
  if (value && typeof value === "object") {
    const loc = value as Localized;
    return loc.fr || loc.en || "";
  }
  return typeof value === "string" ? value : "";
}

// Mirrors the public blog article reading layout (src/app/pages/BlogArticle.tsx)
// so the editor preview matches what gets published.
export default function BlogPreview({ doc }: { doc: AnyDoc }) {
  const title = fr(doc.title) || "Titre de l'article";
  const excerpt = fr(doc.excerpt);
  const category = fr(doc.category) || "Catégorie";
  const readingTime = fr(doc.readingTime) || "5 min";
  const date = typeof doc.publishedAt === "string" ? doc.publishedAt : "";
  const coverUrl = (doc.coverImage as { url?: string } | null)?.url;
  const bodyText = fr(doc.body);
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const takeaways = Array.isArray(doc.takeaways)
    ? (doc.takeaways as Localized[]).map((t) => fr(t)).filter(Boolean)
    : [];

  return (
    <div className="bg-[#fcf9f8] px-5 pb-20 pt-8 text-[#1c1b1b] sm:px-8">
      <article className="mx-auto max-w-[1040px]">
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[1.5px] text-[#854d63]">
          <ArrowLeftIcon className="size-4" />
          Retour au blog
        </span>

        <header className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="flex flex-wrap gap-4 text-[12px] font-semibold uppercase tracking-[1.6px] text-[#854d63]">
              <span className="inline-flex items-center gap-2">
                <BookOpenIcon className="size-4" />
                {category}
              </span>
              <span className="inline-flex items-center gap-2">
                <ClockIcon className="size-4" />
                {readingTime}
              </span>
              {date ? <span>{date}</span> : null}
            </div>
            <h1 className="mt-5 font-serif text-[44px] leading-[48px] text-[#1c1b1b] md:text-[64px] md:leading-[68px]">
              {title}
            </h1>
            {excerpt ? (
              <p className="mt-6 text-[19px] leading-8 text-[#5b4137]">{excerpt}</p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-lg border border-[#e4bfb2]/32 bg-[#ffd9e4] shadow-[0_24px_70px_rgba(28,27,27,0.08)]">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="h-[22rem] w-full object-cover md:h-[30rem]" />
            ) : (
              <div className="flex h-[22rem] w-full items-center justify-center bg-gradient-to-br from-[#ffd9e4] to-[#ffdcbd] text-[13px] font-medium uppercase tracking-[1.5px] text-[#854d63]/70 md:h-[30rem]">
                Image de couverture
              </div>
            )}
          </div>
        </header>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="space-y-6 text-[17px] leading-8 text-[#5b4137]">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)
            ) : (
              <p className="italic text-[#a09c98]">
                Le contenu de l'article apparaîtra ici. Reviens à l'édition pour rédiger le texte.
              </p>
            )}
          </div>

          {takeaways.length > 0 ? (
            <aside className="rounded-lg border border-[#e4bfb2]/32 bg-white p-6 shadow-[0_12px_36px_rgba(28,27,27,0.05)] lg:sticky lg:top-28">
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-[#854d63]">À retenir</p>
              <ul className="mt-5 space-y-4">
                {takeaways.map((takeaway, i) => (
                  <li
                    key={i}
                    className="border-t border-[#e5e2e1]/75 pt-4 text-sm leading-6 text-[#5b4137] first:border-t-0 first:pt-0"
                  >
                    {takeaway}
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </article>
    </div>
  );
}
