import { motion, AnimatePresence } from "motion/react";
import { PaperAirplaneIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { useLang } from "../i18n/LanguageContext";

export default function Contact() {
  const { t } = useTranslation();
  const { lang } = useLang();

  return (
    <section
      id="contact"
      className="py-24 bg-emerald-950 text-stone-100 relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-900/20 skew-x-12 transform translate-x-1/4"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-16">
          {/* Contact Info */}
          <motion.div
            className="md:w-1/3"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={lang + "-contact-info"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-4xl font-serif font-bold mb-6 text-white">
                  {t("contact.title")}
                </h2>
                <p className="text-stone-300 mb-10 leading-relaxed">
                  {t("contact.subtitle")}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-900 rounded-lg text-amber-400">
                  <EnvelopeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-100">
                    {t("contact.email")}
                  </h4>
                  <a
                    href="mailto:caroletonoukouen@gmail.com"
                    className="text-stone-400 hover:text-amber-400 transition-colors"
                  >
                    caroletonoukouen@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-900 rounded-lg text-amber-400">
                  <PhoneIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-100">
                    {t("contact.phone")}
                  </h4>
                  <p className="text-stone-400">+229 01 23 45 67 89</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-900 rounded-lg text-amber-400">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-100">
                    {t("contact.location")}
                  </h4>
                  <p className="text-stone-400">{t("contact.locationValue")}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            className="md:w-2/3"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              <motion.form
                key={lang + "-contact-form"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-emerald-800/50 shadow-xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-stone-300 mb-2"
                    >
                      {t("contact.nameLabel")}
                    </label>
                    <input
                      type="text"
                      id="name"
                      autoComplete="name"
                      className="w-full bg-emerald-900/30 border border-emerald-800 rounded-lg px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder-stone-500"
                      placeholder={t("contact.namePlaceholder")}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-stone-300 mb-2"
                    >
                      {t("contact.emailLabel")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      autoComplete="email"
                      className="w-full bg-emerald-900/30 border border-emerald-800 rounded-lg px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder-stone-500"
                      placeholder={t("contact.emailPlaceholder")}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-stone-300 mb-2"
                  >
                    {t("contact.subjectLabel")}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    autoComplete="off"
                    className="w-full bg-emerald-900/30 border border-emerald-800 rounded-lg px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder-stone-500"
                    placeholder={t("contact.subjectPlaceholder")}
                  />
                </div>

                <div className="mb-8">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-stone-300 mb-2"
                  >
                    {t("contact.messageLabel")}
                  </label>
                  <textarea
                    id="message"
                    autoComplete="off"
                    rows={4}
                    className="w-full bg-emerald-900/30 border border-emerald-800 rounded-lg px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder-stone-500"
                    placeholder={t("contact.messagePlaceholder")}
                  ></textarea>
                </div>

                <button
                  type="button"
                  className="w-full bg-amber-500 text-emerald-950 font-bold py-4 rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                >
                  {t("contact.send")} <PaperAirplaneIcon className="w-4.5 h-4.5" />
                </button>
              </motion.form>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
