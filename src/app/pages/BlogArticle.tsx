import { useParams } from "react-router";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toBlogPostViewModel } from "../../cms/adapters";
import { cmsImageUrl, useCmsCollection } from "../../cms/cmsContent";
import { isPublishedPost, localized, type CmsBlogPost, type CmsImage } from "../../cms/types";
import type { PortableTextBlock } from "@portabletext/types";
import { PAGE_MAIN } from "../components/layout/publicPage";
import { useSeoOverride } from "../seo/SeoOverrideContext";
import { BlogArticleContent } from "./BlogArticleContent";

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: string;
  takeaways: string[];
  sections: Array<{
    title: string;
    body: string[];
  }>;
  body?: string | PortableTextBlock[];
  coverImage?: CmsImage;
};

const blogImages = [
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1600&q=80",
];

export default function BlogArticle() {
  const { slug } = useParams();
  const { i18n, t } = useTranslation();
  const legacyPosts = useMemo(
    () => t("blog.posts", { returnObjects: true }) as BlogPost[],
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
  const post = posts.find((item) => item.slug === slug) ?? posts[0];
  const postIndex = Math.max(0, posts.findIndex((item) => item.slug === post.slug));
  const cmsImage = cmsImageUrl(post.coverImage);
  const postImage = usingCms
    ? cmsImage
    : blogImages[postIndex % blogImages.length] ?? blogImages[0];
  const seoOverride = useMemo(
    () =>
      post
        ? {
            title: `${post.title} | Carole Tonoukouen`,
            description: post.excerpt,
            image: postImage,
            ogType: "article",
          }
        : null,
    [post, postImage],
  );
  useSeoOverride(seoOverride);

  return (
    <main className={PAGE_MAIN}>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto max-w-[1040px]"
      >
        <BlogArticleContent
          interactive
          post={{
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            category: post.category,
            readingTime: post.readingTime,
            date: post.date,
            takeaways: post.takeaways,
            body: post.body,
            sections: post.sections,
            imageSrc: postImage,
            imageAlt: post.coverImage ? localized(post.coverImage.alt, i18n.language) : "",
          }}
          labels={{
            backToBlog: t("blog.backToBlog"),
            takeawaysTitle: t("blog.takeawaysTitle"),
          }}
        />
      </motion.article>
    </main>
  );
}
