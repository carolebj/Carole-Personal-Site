import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { useLang } from "../i18n/LanguageContext";

export default function About() {
  const { t } = useTranslation();
  const { lang } = useLang();

  return (
    <section id="about" className="py-24 bg-stone-50 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            <motion.h2
              key={lang + "-about-title"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-4xl font-serif font-bold text-emerald-950 mb-8"
            >
              {t("about.title")}
            </motion.h2>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={lang + "-about-body"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="prose prose-lg mx-auto text-stone-600 leading-relaxed"
            >
              <p className="mb-6 text-xl font-medium text-emerald-900">
                {t("about.intro")}
              </p>
              <p className="mb-6">{t("about.p1")}</p>
              <p>{t("about.p2")}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
