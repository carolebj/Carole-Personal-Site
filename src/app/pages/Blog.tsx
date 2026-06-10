import { ArrowRightIcon, BookOpenIcon, ClockIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router";
import { motion } from "motion/react";
import type React from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHero } from "../components/PageHero";
import { SectionEyebrow } from "../components/SectionEyebrow";
import { PAGE_MAIN } from "../components/layout/publicPage";
import { useMotionSafe } from "../hooks/useMotionSafe";
import { toBlogPostViewModel } from "../../cms/adapters";
import { cmsImageUrl, useCmsCollection } from "../../cms/cmsContent";
import { isPublishedPost, type CmsBlogPost, type CmsImage } from "../../cms/types";
import abstractAuditImage from "../../assets/blog/blog-abstract-audit.svg";
import abstractContentImage from "../../assets/blog/blog-abstract-content.svg";
import abstractEditorialImage from "../../assets/blog/blog-abstract-editorial.svg";
import abstractSocialImage from "../../assets/blog/blog-abstract-social.svg";

type BlogPostPreview = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: string;
  featured?: boolean;
  coverImage?: CmsImage;
};

const blogImages = [abstractEditorialImage, abstractContentImage, abstractSocialImage, abstractAuditImage];

export default function Blog() {
  const { i18n, t } = useTranslation();
  const { reduceMotion, entranceTransition } = useMotionSafe();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const legacyPosts = useMemo(
    () => t("blog.posts", { returnObjects: true }) as BlogPostPreview[],
    [t]
  );
  const emptyCmsPosts = useMemo<CmsBlogPost[]>(() => [], []);
  const { data: cmsPosts, usingCms } = useCmsCollection<CmsBlogPost>("blogPost", emptyCmsPosts);
  const publishedCmsPosts = useMemo(() => cmsPosts.filter(isPublishedPost), [cmsPosts]);
  const posts = useMemo(
    () =>
      usingCms
        ? publishedCmsPosts.map((post) => toBlogPostViewModel(post, i18n.language))
        : legacyPosts,
    [usingCms, publishedCmsPosts, i18n.language, legacyPosts]
  );
  const featuredPost = posts.find((post) => post.featured) ?? posts[0];
  const categories = useMemo(
    () => [t("blog.allCategories"), ...Array.from(new Set(posts.map((post) => post.category)))],
    [posts, t]
  );
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visiblePosts = posts.filter((post) => {
    const matchesCategory = activeCategory === "all" || post.category === activeCategory;
    const searchableText = `${post.title} ${post.excerpt} ${post.category}`.toLowerCase();
    return matchesCategory && (!normalizedSearchQuery || searchableText.includes(normalizedSearchQuery));
  });
  const getPostImage = (slug: string) => {
    const post = posts.find((item) => item.slug === slug);
    const cmsImage = cmsImageUrl(post?.coverImage);

    if (cmsImage) {
      return cmsImage;
    }

    const index = posts.findIndex((item) => item.slug === slug);
    return blogImages[index % blogImages.length] ?? abstractEditorialImage;
  };

  return (
    <main className={PAGE_MAIN}>
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={entranceTransition}
        className="mx-auto grid max-w-[1160px] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14"
      >
        <PageHero
          eyebrow={t("blog.eyebrow")}
          title={t("blog.title")}
          subtitle={t("blog.subtitle")}
          titleClassName="text-[48px] leading-[52px] md:text-[64px] md:leading-[68px]"
        />

        {featuredPost ? (
        <Link
          to={`/blog/${featuredPost.slug}`}
          viewTransition
          className="group relative mx-auto block w-full max-w-[560px] overflow-hidden rounded-lg border border-border-accent/32 bg-white p-4 shadow-[0_24px_70px_rgba(28,27,27,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(28,27,27,0.12)] dark:border-white/10 dark:bg-surface-panel"
        >
          <div
            className="relative h-[25rem] overflow-hidden rounded-md bg-[#ffd9e4]"
            style={{ viewTransitionName: `blog-image-${featuredPost.slug}` } as React.CSSProperties}
          >
            <img
              src={getPostImage(featuredPost.slug)}
              alt=""
              aria-hidden
              className="public-media-outline h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,27,27,0)_28%,rgba(28,27,27,0.72)_100%)]" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-white/78">
                {t("blog.featured")}
              </p>
              <h2
                className="mt-3 max-w-[28rem] font-serif text-[32px] leading-9"
                style={{ viewTransitionName: `blog-title-${featuredPost.slug}` } as React.CSSProperties}
              >
                {featuredPost.title}
              </h2>
            </div>
          </div>
          <div className="grid gap-3 px-2 pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex flex-wrap gap-4 text-[12px] font-semibold uppercase tracking-[1.4px] text-text-accent dark:text-text-accent">
              <span className="inline-flex items-center gap-2">
                <BookOpenIcon className="size-4" />
                {featuredPost.category}
              </span>
              <span className="inline-flex items-center gap-2">
                <ClockIcon className="size-4" />
                {featuredPost.readingTime}
              </span>
            </div>
            <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[1.4px] text-text-primary transition group-hover:text-text-accent dark:text-text-primary dark:group-hover:text-[#f0adc4]">
              {t("blog.readArticle")}
              <ArrowRightIcon className="size-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
        ) : null}
      </motion.section>

      <section className="mx-auto mt-16 max-w-[1160px]">
        <div className="mb-8 space-y-6">
          <div>
            <SectionEyebrow>{t("blog.latestEyebrow")}</SectionEyebrow>
            <h2 className="mt-3 font-serif text-[32px] leading-9 dark:text-text-primary">
              {t("blog.latestTitle")}
            </h2>
          </div>
          <motion.div
            className="max-w-[820px] rounded-lg border border-border-accent/28 bg-white/78 p-3 shadow-[0_18px_44px_rgba(91,65,55,0.06)] dark:border-white/10 dark:bg-surface-panel"
          >
            <label className="relative block">
              <span className="sr-only">{t("blog.searchLabel")}</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-accent dark:text-text-accent" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("blog.searchPlaceholder")}
                className="public-input h-12 w-full rounded-md border border-border-accent/45 bg-surface-page px-12 text-sm text-text-primary placeholder:text-text-secondary/58 dark:border-white/10 dark:bg-white/5 dark:text-text-primary dark:placeholder:text-[#dbc9c0]/52"
              />
            </label>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((category) => {
                const isAll = category === t("blog.allCategories");
                const categoryValue = isAll ? "all" : category;
                const isActive = activeCategory === categoryValue;

                return (
                  <motion.button
                    type="button"
                    key={category}
                    onClick={() => setActiveCategory(categoryValue)}
                    whileTap={{ scale: 0.98 }}
                    className={`relative h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[1.2px] transition ${
                      isActive
                        ? "border-[#854d63] bg-[#854d63] text-white shadow-[0_12px_28px_rgba(133,77,99,0.16)]"
                        : "border-border-accent/70 bg-white text-text-secondary hover:border-[#854d63] hover:text-text-accent dark:border-white/10 dark:bg-surface-panel dark:text-text-secondary dark:hover:border-[#f0adc4] dark:hover:text-[#f0adc4]"
                    }`}
                  >
                    {category}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {visiblePosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              viewTransition
              className="group grid overflow-hidden rounded-lg border border-border-accent/28 bg-white shadow-[0_1px_2px_rgba(28,27,27,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(28,27,27,0.08)] dark:border-white/10 dark:bg-surface-panel sm:grid-cols-[12rem_1fr]"
            >
              <div
                className="h-56 overflow-hidden bg-[#ffd9e4] sm:h-full"
                style={{ viewTransitionName: `blog-image-${post.slug}` } as React.CSSProperties}
              >
                <img
                  src={getPostImage(post.slug)}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="public-media-outline h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[1.6px] text-text-accent dark:text-text-accent">
                  <span>{post.category}</span>
                  <span>{post.date}</span>
                </div>
                <h3
                  className="mt-4 font-serif text-[26px] leading-8 text-text-primary dark:text-text-primary"
                  style={{ viewTransitionName: `blog-title-${post.slug}` } as React.CSSProperties}
                >
                  {post.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-text-secondary dark:text-text-secondary">
                  {post.excerpt}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[1.3px] text-text-primary transition group-hover:text-text-accent dark:text-text-primary dark:group-hover:text-[#f0adc4]">
                  {t("blog.readArticle")}
                  <ArrowRightIcon className="size-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        {visiblePosts.length === 0 ? (
          <div className="rounded-lg border border-border-accent/28 bg-white p-8 text-center text-text-secondary dark:border-white/10 dark:bg-surface-panel dark:text-text-secondary">
            {t("blog.emptyState")}
          </div>
        ) : null}
      </section>
    </main>
  );
}
