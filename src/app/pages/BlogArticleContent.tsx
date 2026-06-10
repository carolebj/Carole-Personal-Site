import { ArrowLeftIcon, BookOpenIcon, ClockIcon } from "@heroicons/react/24/outline";
import { PortableText } from "@portabletext/react";
import { Link } from "react-router";
import type React from "react";
import type { PortableTextBlock } from "@portabletext/types";

export type BlogArticleSection = {
  title: string;
  body: string[];
};

export type BlogArticleContentModel = {
  slug: string;
  title: string;
  excerpt?: string;
  category: string;
  readingTime: string;
  date?: string;
  takeaways: string[];
  /** Plain-text body (paragraphs separated by blank lines) or rich PortableText blocks. */
  body?: string | PortableTextBlock[];
  /** Legacy fallback when no `body` is provided. */
  sections?: BlogArticleSection[];
  /** Resolved cover image URL (already includes any fallback). */
  imageSrc?: string;
  imageAlt?: string;
};

export type BlogArticleLabels = {
  backToBlog: string;
  takeawaysTitle: string;
  coverPlaceholder: string;
  emptyBody: string;
};

const DEFAULT_LABELS: BlogArticleLabels = {
  backToBlog: "Retour au blog",
  takeawaysTitle: "À retenir",
  coverPlaceholder: "Image de couverture",
  emptyBody:
    "Le contenu de l'article apparaîtra ici. Reviens à l'édition pour rédiger le texte.",
};

function isPortableBlocks(body: unknown): body is PortableTextBlock[] {
  return Array.isArray(body);
}

/** Split a plain-text body into paragraphs (blank line = new paragraph). */
export function bodyToParagraphs(body: unknown): string[] {
  if (typeof body !== "string") return [];
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/**
 * Shared article body rendered identically by the public reading page
 * (`BlogArticle`) and the dashboard preview (`BlogPreview`). This guarantees
 * the editor preview matches what visitors actually see.
 */
export function BlogArticleContent({
  post,
  interactive = false,
  showEmptyHint = false,
  labels: labelOverrides,
}: {
  post: BlogArticleContentModel;
  /** Public page: render router link, motion-friendly view transitions. */
  interactive?: boolean;
  /** Preview: show an editor hint when the body is empty. */
  showEmptyHint?: boolean;
  labels?: Partial<BlogArticleLabels>;
}) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const paragraphs = bodyToParagraphs(post.body);
  const hasPortable = isPortableBlocks(post.body) && post.body.length > 0;
  const sections = post.sections ?? [];

  return (
    <>
      {interactive ? (
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[1.5px] text-[#854d63] transition hover:text-[#6a364b] dark:text-[#f0adc4] dark:hover:text-[#f8d7e3]"
        >
          <ArrowLeftIcon className="size-4" />
          {labels.backToBlog}
        </Link>
      ) : (
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[1.5px] text-[#854d63] dark:text-[#f0adc4]">
          <ArrowLeftIcon className="size-4" />
          {labels.backToBlog}
        </span>
      )}

      <header className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <div className="flex flex-wrap gap-4 text-[12px] font-semibold uppercase tracking-[1.6px] text-[#854d63] dark:text-[#f0adc4]">
            <span className="inline-flex items-center gap-2">
              <BookOpenIcon className="size-4" />
              {post.category}
            </span>
            <span className="inline-flex items-center gap-2">
              <ClockIcon className="size-4" />
              {post.readingTime}
            </span>
            {post.date ? <span>{post.date}</span> : null}
          </div>
          <h1
            className="mt-5 font-serif text-[44px] leading-[48px] text-[#1c1b1b] dark:text-[#f8f1ec] md:text-[64px] md:leading-[68px]"
            style={
              interactive
                ? ({ viewTransitionName: `blog-title-${post.slug}` } as React.CSSProperties)
                : undefined
            }
          >
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-6 text-[19px] leading-8 text-[#5b4137] dark:text-[#dbc9c0]">
              {post.excerpt}
            </p>
          ) : null}
        </div>

        <div
          className="overflow-hidden rounded-lg border border-[#e4bfb2]/32 bg-[#ffd9e4] shadow-[0_24px_70px_rgba(28,27,27,0.08)] dark:border-white/10 dark:bg-[#2b1b20]"
          style={
            interactive
              ? ({ viewTransitionName: `blog-image-${post.slug}` } as React.CSSProperties)
              : undefined
          }
        >
          {post.imageSrc ? (
            <img
              src={post.imageSrc}
              alt={post.imageAlt ?? ""}
              className="h-[22rem] w-full object-cover md:h-[30rem]"
            />
          ) : (
            <div className="flex h-[22rem] w-full items-center justify-center bg-gradient-to-br from-[#ffd9e4] to-[#ffdcbd] text-[13px] font-medium uppercase tracking-[1.5px] text-[#854d63]/70 md:h-[30rem]">
              {labels.coverPlaceholder}
            </div>
          )}
        </div>
      </header>

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-11">
          {hasPortable ? (
            <div className="space-y-6 text-[17px] leading-8 text-[#5b4137] dark:text-[#dbc9c0]">
              <PortableText value={post.body as PortableTextBlock[]} />
            </div>
          ) : paragraphs.length > 0 ? (
            <div className="space-y-6 text-[17px] leading-8 text-[#5b4137] dark:text-[#dbc9c0]">
              {paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          ) : sections.length > 0 ? (
            sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-serif text-[30px] leading-9 text-[#1c1b1b] dark:text-[#f8f1ec]">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-[17px] leading-8 text-[#5b4137] dark:text-[#dbc9c0]">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))
          ) : showEmptyHint ? (
            <p className="italic text-[#a09c98]">{labels.emptyBody}</p>
          ) : null}
        </div>

        {post.takeaways.length > 0 ? (
          <aside className="rounded-lg border border-[#e4bfb2]/32 bg-white p-6 shadow-[0_12px_36px_rgba(28,27,27,0.05)] dark:border-white/10 dark:bg-[#171111] lg:sticky lg:top-28">
            <p className="text-[12px] font-semibold uppercase tracking-[2px] text-[#854d63] dark:text-[#f0adc4]">
              {labels.takeawaysTitle}
            </p>
            <ul className="mt-5 space-y-4">
              {post.takeaways.map((takeaway, i) => (
                <li
                  key={i}
                  className="border-t border-[#e5e2e1]/75 pt-4 text-sm leading-6 text-[#5b4137] first:border-t-0 first:pt-0 dark:border-white/10 dark:text-[#dbc9c0]"
                >
                  {takeaway}
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </>
  );
}
