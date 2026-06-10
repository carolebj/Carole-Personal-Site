import { useParams } from "react-router";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toBlogPostViewModel } from "../../cms/adapters";
import { cmsImageUrl, useCmsCollection } from "../../cms/cmsContent";
import { isPublishedPost, type CmsBlogPost, type CmsImage } from "../../cms/types";
import type { PortableTextBlock } from "@portabletext/types";
import abstractAuditImage from "../../assets/blog/blog-abstract-audit.svg";
import abstractContentImage from "../../assets/blog/blog-abstract-content.svg";
import abstractEditorialImage from "../../assets/blog/blog-abstract-editorial.svg";
import abstractSocialImage from "../../assets/blog/blog-abstract-social.svg";
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

const blogImages = [abstractEditorialImage, abstractContentImage, abstractSocialImage, abstractAuditImage];

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
  const postImage = cmsImage ?? blogImages[postIndex % blogImages.length] ?? abstractEditorialImage;
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
