import { Link } from "react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

export default function Blog() {
  const { t } = useTranslation();

  return (
    <main className="min-h-[70vh] bg-[#fcf9f8] px-5 pb-20 pt-32 sm:px-8 md:pt-40 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto max-w-[960px]"
      >
        <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#854d63]">
          {t("nav.blog")}
        </p>
        <h1 className="mt-5 font-serif text-[48px] leading-[52px] text-[#1c1b1b] md:text-[64px] md:leading-[68px]">
          {t("blog.title")}
        </h1>
        <p className="mt-6 max-w-[640px] text-[18px] leading-8 text-[#5b4137]">
          {t("blog.subtitle")}
        </p>
        <Link
          to="/"
          className="mt-10 inline-flex h-[52px] items-center rounded-full bg-[#1c1b1b] px-8 text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-[#fcf9f8] transition hover:bg-[#854d63]"
        >
          {t("serviceDetail.back")}
        </Link>
      </motion.section>
    </main>
  );
}
