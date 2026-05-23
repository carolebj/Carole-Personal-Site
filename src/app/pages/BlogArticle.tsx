import { ArrowLeftIcon, BookOpenIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import abstractAuditImage from "../../assets/blog/blog-abstract-audit.svg";
import abstractContentImage from "../../assets/blog/blog-abstract-content.svg";
import abstractEditorialImage from "../../assets/blog/blog-abstract-editorial.svg";
import abstractSocialImage from "../../assets/blog/blog-abstract-social.svg";

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
};

const blogImages = [abstractEditorialImage, abstractContentImage, abstractSocialImage, abstractAuditImage];

export default function BlogArticle() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const posts = t("blog.posts", { returnObjects: true }) as BlogPost[];
  const post = posts.find((item) => item.slug === slug) ?? posts[0];
  const postIndex = Math.max(0, posts.findIndex((item) => item.slug === post.slug));
  const postImage = blogImages[postIndex % blogImages.length] ?? abstractEditorialImage;

  return (
    <main className="bg-[#fcf9f8] px-5 pb-20 pt-32 text-[#1c1b1b] dark:bg-[#13100f] dark:text-[#f8f1ec] sm:px-8 md:pt-36 lg:px-8">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto max-w-[1040px]"
      >
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[1.5px] text-[#854d63] transition hover:text-[#6a364b] dark:text-[#f0adc4] dark:hover:text-[#f8d7e3]"
        >
          <ArrowLeftIcon className="size-4" />
          {t("blog.backToBlog")}
        </Link>

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
              <span>{post.date}</span>
            </div>
            <h1 className="mt-5 font-serif text-[44px] leading-[48px] text-[#1c1b1b] dark:text-[#f8f1ec] md:text-[64px] md:leading-[68px]">
              {post.title}
            </h1>
            <p className="mt-6 text-[19px] leading-8 text-[#5b4137] dark:text-[#dbc9c0]">
              {post.excerpt}
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#e4bfb2]/32 bg-[#ffd9e4] shadow-[0_24px_70px_rgba(28,27,27,0.08)] dark:border-white/10 dark:bg-[#2b1b20]">
            <img
              src={postImage}
              alt=""
              className="h-[22rem] w-full object-cover md:h-[30rem]"
            />
          </div>
        </header>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="space-y-11">
            {post.sections.map((section) => (
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
            ))}
          </div>

          <aside className="rounded-lg border border-[#e4bfb2]/32 bg-white p-6 shadow-[0_12px_36px_rgba(28,27,27,0.05)] dark:border-white/10 dark:bg-[#171111] lg:sticky lg:top-28">
            <p className="text-[12px] font-semibold uppercase tracking-[2px] text-[#854d63] dark:text-[#f0adc4]">
              {t("blog.takeawaysTitle")}
            </p>
            <ul className="mt-5 space-y-4">
              {post.takeaways.map((takeaway) => (
                <li key={takeaway} className="border-t border-[#e5e2e1]/75 pt-4 text-sm leading-6 text-[#5b4137] first:border-t-0 first:pt-0 dark:border-white/10 dark:text-[#dbc9c0]">
                  {takeaway}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </motion.article>
    </main>
  );
}
