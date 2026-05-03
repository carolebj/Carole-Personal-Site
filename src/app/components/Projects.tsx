import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useLang } from "../i18n/LanguageContext";

const projectImages = [
  "https://images.unsplash.com/photo-1622503247445-cfe020cd0e5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1654868537177-86c35bb6b226?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1648260295950-29435aa1678a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
];

interface ProjectItem {
  title: string;
  category: string;
  description: string;
}

export default function Projects() {
  const { t } = useTranslation();
  const { lang } = useLang();

  const items = t("projects.items", { returnObjects: true }) as ProjectItem[];

  return (
    <section id="projects" className="py-24 bg-emerald-950 text-stone-100">
      <div className="container mx-auto px-6">
        <motion.div
          className="flex flex-col md:flex-row justify-between items-end mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              <motion.h2
                key={lang + "-proj-title"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-4xl font-serif font-bold mb-4 text-stone-100"
              >
                {t("projects.title")}
              </motion.h2>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p
                key={lang + "-proj-sub"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-stone-400"
              >
                {t("projects.subtitle")}
              </motion.p>
            </AnimatePresence>
          </div>
          <a
            href="#"
            className="hidden md:flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors font-medium group"
          >
            {t("projects.viewAll")}
            <ArrowUpRightIcon
              className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"
            />
          </a>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((project, index) => (
            <motion.div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-emerald-900/30"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={projectImages[index]}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
              </div>

              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-transparent opacity-90 transition-opacity duration-300 flex flex-col justify-end p-8">
                <span className="text-amber-400 text-sm font-bold uppercase tracking-wider mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                  {project.category}
                </span>
                <h3 className="text-2xl font-bold text-stone-100 mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-150">
                  {project.title}
                </h3>
                <p className="text-stone-300 text-sm opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-200">
                  {project.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            {t("projects.viewAll")}
            <ArrowUpRightIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}