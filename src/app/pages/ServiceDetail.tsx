import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

type ServiceDetail = {
  slug: string;
  title: string;
  accent: string;
  description: string;
  detailIntro: string;
  metricValue: string;
  metricLabel: string;
  projectTitle: string;
  projectDescription: string;
  bullets: string[];
};

export default function ServiceDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const services = t("services.items", { returnObjects: true }) as ServiceDetail[];
  const service = services.find((item) => item.slug === slug) ?? services[0];

  return (
    <main className="bg-[#fcf9f8] px-5 pb-20 pt-32 sm:px-8 md:pt-40 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto max-w-[1120px]"
      >
        <Link
          to="/#services"
          className="text-[12px] font-semibold uppercase tracking-[2px] text-[#854d63] transition hover:text-[#1c1b1b]"
        >
          {t("serviceDetail.back")}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:gap-14">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#854d63]">
              {t("serviceDetail.eyebrow")}
            </p>
            <h1 className="mt-5 max-w-[720px] font-serif text-[48px] leading-[52px] text-[#1c1b1b] md:text-[64px] md:leading-[68px]">
              {service.title}
              <br />
              <span className="italic text-[#854d63]">{service.accent}</span>
            </h1>
            <p className="mt-6 max-w-[640px] text-[18px] leading-8 text-[#5b4137]">
              {service.detailIntro}
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {service.bullets.map((bullet) => (
                <span
                  key={bullet}
                  className="rounded-full border border-[#e4bfb2]/55 bg-white px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[1px] text-[#5b4137]"
                >
                  {bullet}
                </span>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-lg border border-[#e4bfb2]/35 bg-white p-7 shadow-[0_18px_42px_rgba(28,27,27,0.05)]">
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-[#854d63]">
                {t("serviceDetail.metric")}
              </p>
              <p className="mt-5 font-serif text-[56px] leading-none text-[#1c1b1b]">
                {service.metricValue}
              </p>
              <p className="mt-4 text-[16px] leading-7 text-[#5b4137]">
                {service.metricLabel}
              </p>
            </div>

            <div className="rounded-lg border border-[#e4bfb2]/35 bg-[#ffd9e4]/35 p-7">
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-[#854d63]">
                {t("serviceDetail.project")}
              </p>
              <h2 className="mt-4 font-serif text-[28px] leading-8 text-[#1c1b1b]">
                {service.projectTitle}
              </h2>
              <p className="mt-4 text-[16px] leading-7 text-[#5b4137]">
                {service.projectDescription}
              </p>
            </div>
          </aside>
        </div>

        <Link
          to="/contact"
          className="mt-12 inline-flex h-[52px] items-center rounded-full bg-[#1c1b1b] px-8 text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-[#fcf9f8] transition hover:bg-[#854d63]"
        >
          {t("serviceDetail.cta")}
        </Link>
      </motion.section>
    </main>
  );
}
