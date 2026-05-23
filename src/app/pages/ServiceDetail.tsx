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
  presentation?: string;
  whatIsIncluded?: string[];
  targetAudience?: string[];
  concreteApplications?: string[];
};

function AnimatedDigits({ value }: { value: string }) {
  const chars = Array.from(value);

  return (
    <span className="t-digit-group is-animating" aria-label={value}>
      {chars.map((char, index) => {
        const staggerIndex = index >= chars.length - 2 ? index - chars.length + 3 : undefined;
        return (
          <span
            key={`${char}-${index}`}
            aria-hidden="true"
            className="t-digit"
            data-stagger={staggerIndex}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

export default function ServiceDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const services = t("services.items", { returnObjects: true }) as ServiceDetail[];
  const slugAliases: Record<string, string> = {
    "direction-social-media": "communication-digitale",
    "social-media-direction": "digital-communication",
    "creation-contenu": "creation-contenus",
    "audit-conseil": "audit-consulting",
  };
  const normalizedSlug = slug ? slugAliases[slug] ?? slug : "";
  const service = services.find((item) => item.slug === normalizedSlug) ?? services[0];
  const whatIsIncluded = service.whatIsIncluded ?? service.bullets;
  const targetAudience = service.targetAudience ?? [];
  const concreteApplications = service.concreteApplications ?? [service.projectDescription];

  return (
    <main className="bg-surface-page px-5 pb-20 pt-32 text-text-primary sm:px-8 md:pt-40 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto max-w-[1120px]"
      >
        <Link
          to="/#services"
          className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent transition hover:text-text-primary"
        >
          {t("serviceDetail.back")}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:gap-14">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
              {t("serviceDetail.eyebrow")}
            </p>
            <h1 className="mt-5 max-w-[720px] font-serif text-[48px] leading-[52px] text-text-primary md:text-[64px] md:leading-[68px]">
              {service.title}
              <br />
              <span className="italic text-text-accent">{service.accent}</span>
            </h1>
            <p className="mt-6 max-w-[640px] text-[18px] leading-8 text-text-secondary">
              {service.detailIntro}
            </p>
            {service.presentation ? (
              <p className="mt-5 max-w-[700px] text-[16px] leading-8 text-text-secondary">
                {service.presentation}
              </p>
            ) : null}
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {service.bullets.map((bullet) => (
                <span
                  key={bullet}
                  className="rounded-full border border-border-accent bg-surface-panel px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[1px] text-text-secondary"
                >
                  {bullet}
                </span>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-lg border border-border-accent-muted bg-surface-panel p-7 shadow-[var(--shadow-panel)]">
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
                {t("serviceDetail.metric")}
              </p>
              <p className="mt-5 font-serif text-[56px] leading-none text-text-primary">
                <AnimatedDigits value={service.metricValue} />
              </p>
              <p className="mt-4 text-[16px] leading-7 text-text-secondary">
                {service.metricLabel}
              </p>
            </div>

            <div className="rounded-lg border border-border-accent-muted bg-surface-accent-muted p-7">
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-text-accent">
                {t("serviceDetail.project")}
              </p>
              <h2 className="mt-4 font-serif text-[28px] leading-8 text-text-primary">
                {service.projectTitle}
              </h2>
              <p className="mt-4 text-[16px] leading-7 text-text-secondary">
                {service.projectDescription}
              </p>
            </div>
          </aside>
        </div>

        <Link
          to="/contact"
          className="mt-12 inline-flex h-[52px] items-center rounded-full bg-action-strong px-8 text-[12px] font-semibold uppercase leading-4 tracking-[1px] text-text-on-strong transition hover:bg-action-strong-hover"
        >
          {t("serviceDetail.cta")}
        </Link>
      </motion.section>

      <section className="mx-auto mt-18 max-w-[1120px] border-t border-border-accent-muted pt-12">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
              {t("serviceDetail.includes")}
            </p>
            <h2 className="mt-4 max-w-[26rem] font-serif text-[34px] leading-10 text-text-primary">
              {service.title}{" "}
              <span className="italic text-text-accent">{service.accent}</span>
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {whatIsIncluded.map((item, index) => (
              <article
                key={item}
                className={`rounded-lg border border-border-accent-muted bg-surface-panel p-5 shadow-[var(--shadow-panel)] ${
                  index === 0 ? "md:row-span-2 md:min-h-[15rem]" : ""
                }`}
              >
                <span className="font-serif text-[28px] italic leading-none text-text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-5 text-[15px] leading-7 text-text-secondary">
                  {item}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {targetAudience.length > 0 ? (
        <section className="mx-auto mt-16 max-w-[1120px]">
          <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-lg border border-border-accent-muted bg-surface-accent-muted p-7">
              <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
                {t("serviceDetail.audience")}
              </p>
              <h2 className="mt-4 font-serif text-[32px] leading-9 text-text-primary">
                {t("serviceDetail.audienceTitle")}
              </h2>
            </div>
            <div className="grid gap-3">
              {targetAudience.map((item) => (
                <p
                  key={item}
                  className="rounded-full border border-border-accent bg-surface-panel px-5 py-4 text-[14px] font-semibold uppercase tracking-[1px] text-text-secondary"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto mt-16 max-w-[1120px]">
        <div className="mb-7 flex flex-col justify-between gap-4 border-t border-border-accent-muted pt-10 md:flex-row md:items-end">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-text-accent">
              {t("serviceDetail.applications")}
            </p>
            <h2 className="mt-4 font-serif text-[34px] leading-10 text-text-primary">
              {t("serviceDetail.applicationsTitle")}
            </h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {concreteApplications.map((item) => (
            <article
              key={item}
              className="rounded-lg border border-border-accent-muted bg-surface-panel p-6 transition duration-300 hover:-translate-y-1 hover:border-border-accent"
            >
              <p className="text-[15px] leading-7 text-text-secondary">{item}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
