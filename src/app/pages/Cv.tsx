import {
  EnvelopeIcon,
  LinkIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toCvViewModel } from "../../cms/adapters";
import { cvEntryQuery } from "../../cms/queries";
import type { CmsCvEntry } from "../../cms/types";
import { useSanityQuery } from "../../cms/useSanityQuery";

type CvContact = {
  label: string;
  value: string;
  href?: string;
};

type CvSection = {
  title: string;
  items: string[];
};

type CvExperience = {
  title: string;
  organization: string;
  period: string;
  bullets: string[];
};

const contactIcons = [EnvelopeIcon, PhoneIcon, MapPinIcon, LinkIcon];

export default function Cv() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { data: cmsEntries } = useSanityQuery(cvEntryQuery, [] as CmsCvEntry[]);
  const usingCms = cmsEntries.length > 0;
  const contacts = t("cv.contacts", { returnObjects: true }) as CvContact[];
  const cvData = useMemo(() => {
    if (usingCms) {
      return toCvViewModel(cmsEntries, locale);
    }
    return null;
  }, [cmsEntries, usingCms, locale]);
  const sidebarSections = usingCms && cvData ? cvData.sidebar : (t("cv.sidebar", { returnObjects: true }) as CvSection[]);
  const experiences = usingCms && cvData ? cvData.experiences : (t("cv.experiences", { returnObjects: true }) as CvExperience[]);

  return (
    <main className="bg-[#fcf9f8] px-5 pb-20 pt-28 dark:bg-[#13100f] sm:px-8 lg:px-8">
      <section className="mx-auto max-w-[1120px]">
        <div className="rounded-[28px] border border-[#e5e2e1]/80 bg-white p-6 shadow-[0_24px_80px_rgba(28,27,27,0.08)] dark:border-white/10 dark:bg-[#171312] sm:p-8 lg:p-10">
          <div className="border-b border-[#1c1b1b]/20 pb-7 dark:border-white/15">
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#854d63] dark:text-[#f0adc4]">
              {t("cv.eyebrow")}
            </p>
            <h1 className="mt-4 text-[clamp(3rem,7vw,6.25rem)] font-semibold uppercase leading-[0.9] tracking-[0.03em] text-[#1c1b1b] dark:text-[#f8f1ec]">
              <span className="block font-light normal-case tracking-[0.08em]">Carole</span>
              Tonoukouen
            </h1>
            <p className="mt-4 text-[clamp(1.7rem,4vw,3.25rem)] font-semibold uppercase leading-none tracking-[0.04em] text-[#1c1b1b] dark:text-[#f8f1ec]">
              {t("cv.role")}
            </p>
            <p className="mt-4 max-w-[56rem] text-base leading-7 text-[#4f4540] dark:text-[#dbc9c0]">
              {t("cv.summary")}
            </p>
          </div>

          <div className="grid gap-3 border-b border-[#1c1b1b]/20 py-5 dark:border-white/15 md:grid-cols-2 lg:grid-cols-4">
            {contacts.map((contact, index) => {
              const ContactIcon = contactIcons[index % contactIcons.length];
              const content = (
                <>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1c1b1b] text-white dark:bg-[#f8f1ec] dark:text-[#1c1415]">
                    <ContactIcon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[2px] text-[#854d63] dark:text-[#f0adc4]">
                      {contact.label}
                    </span>
                    <span className="block truncate text-sm font-semibold text-[#1c1b1b] dark:text-[#f8f1ec]">
                      {contact.value}
                    </span>
                  </span>
                </>
              );

              return contact.href ? (
                <a
                  key={contact.label}
                  href={contact.href}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-[#ffd9e4]/30 dark:hover:bg-white/8"
                >
                  {content}
                </a>
              ) : (
                <div key={contact.label} className="flex items-center gap-3 rounded-2xl px-2 py-2">
                  {content}
                </div>
              );
            })}
          </div>

          <div className="grid gap-10 pt-9 lg:grid-cols-[0.42fr_0.58fr]">
            <aside className="space-y-6">
              {sidebarSections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-[24px] font-semibold uppercase leading-none tracking-[0.04em] text-[#1c1b1b] dark:text-[#f8f1ec]">
                    {section.title}
                  </h2>
                  <div className="mt-3 rounded-2xl bg-[#eee9e8] p-5 dark:bg-white/8">
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-[#1c1b1b] marker:text-[#854d63] dark:text-[#f8f1ec] dark:marker:text-[#f0adc4]">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              ))}
            </aside>

            <section>
              <h2 className="text-[24px] font-semibold uppercase leading-none tracking-[0.04em] text-[#1c1b1b] dark:text-[#f8f1ec]">
                {t("cv.experienceTitle")}
              </h2>
              <div className="relative mt-6 space-y-5 pl-8 before:absolute before:bottom-4 before:left-[5px] before:top-4 before:w-px before:bg-[linear-gradient(to_bottom,rgba(133,77,99,0),rgba(133,77,99,0.55),rgba(133,77,99,0))] dark:before:bg-[linear-gradient(to_bottom,rgba(240,173,196,0),rgba(240,173,196,0.55),rgba(240,173,196,0))]">
                {experiences.map((experience) => (
                  <article
                    key={`${experience.organization}-${experience.period}`}
                    className="relative rounded-2xl border border-[#e5e2e1]/80 bg-[#fcf9f8] p-5 shadow-[0_14px_36px_rgba(28,27,27,0.04)] dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="absolute -left-[33px] top-6 flex size-3 items-center justify-center rounded-full bg-white ring-1 ring-[#854d63]/70 dark:bg-[#171312] dark:ring-[#f0adc4]/70">
                      <span className="size-1.5 rounded-full bg-[#854d63] dark:bg-[#f0adc4]" />
                    </span>
                    <h3 className="text-lg font-semibold uppercase tracking-[0.03em] text-[#1c1b1b] dark:text-[#f8f1ec]">
                      {experience.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-[#1c1b1b] dark:text-[#f8f1ec]">
                      {experience.organization} · {experience.period}
                    </p>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-[#4f4540] dark:text-[#dbc9c0]">
                      {experience.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
