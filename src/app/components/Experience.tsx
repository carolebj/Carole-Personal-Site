import { motion, AnimatePresence } from "motion/react";
import { CalendarDaysIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useLang } from "../i18n/LanguageContext";

interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  location: string;
  description: string;
}

export default function Experience() {
  const { t } = useTranslation();
  const { lang } = useLang();

  const items = t("experience.items", { returnObjects: true }) as ExperienceItem[];

  return (
    <section id="experience" className="py-24 bg-stone-50 text-emerald-950 relative">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <AnimatePresence mode="wait">
            <motion.h2
              key={lang + "-exp-title"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-4xl font-serif font-bold mb-4"
            >
              {t("experience.title")}
            </motion.h2>
          </AnimatePresence>
          <div className="h-1 w-20 bg-emerald-950 mx-auto rounded-full"></div>
        </motion.div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 h-full w-0.5 bg-emerald-200 top-0"></div>

          <div className="space-y-12">
            {items.map((exp, index) => (
              <motion.div
                key={index}
                className={`relative flex flex-col md:flex-row items-center ${
                  index % 2 === 0 ? "md:flex-row-reverse" : ""
                }`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                {/* Timeline Dot */}
                <div className="absolute left-0 md:left-1/2 transform -translate-x-1/2 w-4 h-4 bg-amber-400 rounded-full border-4 border-stone-50 z-10 shadow-sm"></div>

                {/* Content */}
                <div className="w-full md:w-1/2 pl-8 md:pl-12 md:pr-12">
                  <div
                    className={`bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow duration-300 ${
                      index % 2 === 0
                        ? "text-left"
                        : "text-left md:text-right"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={lang + "-exp-" + index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h3 className="text-xl font-bold text-emerald-900 mb-1">
                          {exp.role}
                        </h3>
                        <h4 className="text-lg font-medium text-amber-500 mb-4">
                          {exp.company}
                        </h4>

                        <div
                          className={`flex items-center gap-4 text-sm text-stone-500 mb-4 ${
                            index % 2 === 0
                              ? "justify-start"
                              : "justify-start md:justify-end"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                            <span>{exp.period}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="w-3.5 h-3.5" />
                            <span>{exp.location}</span>
                          </div>
                        </div>

                        <p className="text-stone-600 leading-relaxed text-sm">
                          {exp.description}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}