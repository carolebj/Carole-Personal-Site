import { motion, AnimatePresence } from "motion/react";
import { TrophyIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useLang } from "../i18n/LanguageContext";

export default function Certifications() {
  const { t } = useTranslation();
  const { lang } = useLang();

  const items = t("certifications.items", { returnObjects: true }) as string[];

  return (
    <section className="py-20 bg-stone-100 border-t border-stone-200">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-full mb-4">
            <TrophyIcon className="w-6 h-6 text-emerald-800" />
          </div>
          <AnimatePresence mode="wait">
            <motion.h2
              key={lang + "-cert-title"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-3xl font-serif font-bold text-emerald-950"
            >
              {t("certifications.title")}
            </motion.h2>
          </AnimatePresence>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((cert, index) => (
            <motion.div
              key={index}
              className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex items-center gap-4 hover:border-amber-400 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <CheckCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="font-medium text-stone-700">{cert}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}