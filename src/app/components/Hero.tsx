import carolePortrait from "../../assets/carole-portrait.min.png";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useTranslation, Trans } from "react-i18next";
import { useLang } from "../i18n/LanguageContext";

export default function Hero() {
  const { t } = useTranslation();
  const { lang } = useLang();

  const scrollToAbout = () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-emerald-950 overflow-hidden text-stone-100 pt-20">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-[128px] transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-800 rounded-full blur-[128px] transform -translate-x-1/3 translate-y-1/4"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between">
        {/* Text Content */}
        <motion.div
          className="md:w-1/2 text-center md:text-left mb-12 md:mb-0"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.p
            className="text-amber-400 font-medium mb-4 tracking-widest uppercase text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={lang + "-subtitle"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="inline-block"
              >
                {t("hero.subtitle")}
              </motion.span>
            </AnimatePresence>
          </motion.p>

          <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-6 text-stone-100">
            <AnimatePresence mode="wait">
              <motion.span
                key={lang + "-greeting"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="inline-block"
              >
                {t("hero.greeting")}
              </motion.span>
            </AnimatePresence>{" "}
            <br />
            <span className="text-amber-400">Carole Tonoukouen</span>
          </h1>

          <AnimatePresence mode="wait">
            <motion.p
              key={lang + "-desc"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-lg md:text-xl text-stone-300 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed"
            >
              <Trans
                i18nKey="hero.description"
                components={{
                  strong: (
                    <span className="text-amber-400 font-medium" />
                  ),
                }}
              />
            </motion.p>
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a
              href="#projects"
              className="px-8 py-4 bg-amber-500 text-emerald-950 font-bold rounded-full hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={lang + "-cta1"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {t("hero.viewWork")}
                </motion.span>
              </AnimatePresence>
              <ArrowRightIcon className="w-5 h-5" />
            </a>
            <a
              href="#contact"
              className="px-8 py-4 border border-stone-100 text-stone-100 font-medium rounded-full hover:bg-stone-100/10 transition-colors flex items-center justify-center"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={lang + "-cta2"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {t("hero.contactMe")}
                </motion.span>
              </AnimatePresence>
            </a>
          </div>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          className="md:w-1/2 flex justify-center md:justify-end relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="relative w-80 h-80 md:w-[450px] md:h-[450px]">
            {/* Decorative Frame */}
            <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full transform translate-x-4 translate-y-4"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-emerald-500 rounded-full opacity-20 blur-xl"></div>

            {/* Image Container */}
            <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-emerald-900 shadow-2xl">
              <img
                src={carolePortrait}
                alt="Carole Tonoukouen"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating Badge */}
            <motion.div
              className="absolute bottom-8 -left-8 bg-stone-100 text-emerald-950 p-4 rounded-xl shadow-xl max-w-[180px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <p className="font-bold text-lg text-emerald-800">
                {t("hero.yearsCount")}
              </p>
              <p className="text-xs font-medium text-emerald-900/70">
                {t("hero.yearsLabel")}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer text-stone-400 hover:text-amber-400 transition-colors"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={scrollToAbout}
      >
        <ChevronDownIcon className="w-8 h-8" />
      </motion.div>
    </section>
  );
}
