import { motion, AnimatePresence } from "motion/react";
import {
  UserGroupIcon,
  ArrowTrendingUpIcon,
  PaintBrushIcon,
  ChatBubbleOvalLeftIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useLang } from "../i18n/LanguageContext";

const skillIcons = [
  ArrowTrendingUpIcon,
  UserGroupIcon,
  PaintBrushIcon,
  MagnifyingGlassIcon,
  ChatBubbleOvalLeftIcon,
  ChartBarIcon,
];

export default function Skills() {
  const { t } = useTranslation();
  const { lang } = useLang();

  const items = t("skills.items", { returnObjects: true }) as {
    name: string;
    description: string;
  }[];

  return (
    <section id="skills" className="py-24 bg-emerald-950 text-stone-100 relative">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            <motion.h2
              key={lang + "-skills-title"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-4xl font-serif font-bold text-stone-100 mb-4"
            >
              {t("skills.title")}
            </motion.h2>
          </AnimatePresence>
          <div className="h-1 w-20 bg-amber-500 mx-auto rounded-full"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((skill, index) => {
            const Icon = skillIcons[index];
            return (
              <motion.div
                key={index}
                className="bg-emerald-900/50 p-8 rounded-2xl border border-emerald-800 hover:border-amber-500/50 transition-colors group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="bg-emerald-950 p-4 rounded-xl inline-block mb-6 group-hover:bg-amber-500 transition-colors duration-300">
                  <Icon
                    className="w-8 h-8 text-amber-500 group-hover:text-emerald-950 transition-colors duration-300"
                  />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={lang + "-skill-" + index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-xl font-bold mb-3 text-stone-100">
                      {skill.name}
                    </h3>
                    <p className="text-stone-400 leading-relaxed group-hover:text-stone-300 transition-colors">
                      {skill.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}