import { CheckIcon } from "@heroicons/react/24/outline";
import { animate, motion, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { langLabels, useLang, type Lang } from "../i18n/LanguageContext";

const languages: { code: Lang; flag: string }[] = [
  { code: "fr", flag: "FR" },
  { code: "en", flag: "EN" },
];

export default function Footer() {
  const { t } = useTranslation();
  const { lang, setLang } = useLang();
  const year = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const returnTimeoutRef = useRef<number | undefined>(undefined);
  const returnAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const isReturningRef = useRef(false);

  const links = [
    { label: t("footer.behance"), href: "https://www.behance.net/caroletonoukouen", external: true },
    { label: t("footer.linkedin"), href: "https://www.linkedin.com/in/caroletonoukouen/", external: true },
    { label: t("footer.contact"), href: "/contact", external: false },
  ];

  useEffect(() => {
    const getFooterRestY = () => {
      const footer = footerRef.current;
      if (!footer) {
        return null;
      }

      const footerBottom = footer.offsetTop + footer.offsetHeight;
      return Math.max(0, footerBottom - window.innerHeight);
    };

    const returnToFooter = () => {
      const restY = getFooterRestY();
      if (restY === null || window.scrollY <= restY + 2) {
        return;
      }

      returnAnimationRef.current?.stop();
      isReturningRef.current = true;
      returnAnimationRef.current = animate(window.scrollY, restY, {
        type: "spring",
        stiffness: 780,
        damping: 23,
        mass: 0.28,
        velocity: -900,
        restDelta: 0.35,
        restSpeed: 14,
        onUpdate: (latest) => window.scrollTo(0, latest),
        onComplete: () => {
          isReturningRef.current = false;
        },
      });
    };

    const scheduleReturn = () => {
      window.clearTimeout(returnTimeoutRef.current);
      if (isReturningRef.current) {
        return;
      }

      returnTimeoutRef.current = window.setTimeout(returnToFooter, 420);
    };

    const handleScroll = () => {
      if (isReturningRef.current) {
        return;
      }

      const restY = getFooterRestY();
      if (restY !== null && window.scrollY > restY + 2) {
        scheduleReturn();
      }
    };

    const handleWheelIntent = (event: WheelEvent) => {
      const restY = getFooterRestY();
      if (restY !== null && window.scrollY > restY + 2) {
        if (event.deltaY < 0) {
          window.clearTimeout(returnTimeoutRef.current);
          returnToFooter();
          return;
        }

        scheduleReturn();
        return;
      }
    };

    const cancelReturn = () => {
      window.clearTimeout(returnTimeoutRef.current);
      if (isReturningRef.current) {
        returnAnimationRef.current?.stop();
        isReturningRef.current = false;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheelIntent, { passive: true });
    window.addEventListener("touchmove", cancelReturn, { passive: true });
    window.addEventListener("touchend", scheduleReturn, { passive: true });

    return () => {
      window.clearTimeout(returnTimeoutRef.current);
      returnAnimationRef.current?.stop();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheelIntent);
      window.removeEventListener("touchmove", cancelReturn);
      window.removeEventListener("touchend", scheduleReturn);
    };
  }, []);

  return (
    <>
      <footer
        ref={footerRef}
        className="relative border-t border-[#e5e2e1]/70 bg-white dark:border-white/10 dark:bg-[#13100f]"
      >
        <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:px-8 lg:py-12">
          <div className="text-center lg:text-left">
            <p className="font-serif text-xl italic text-[#1c1b1b] dark:text-[#f8f1ec]">Carole T.</p>
            <p className="mt-2 text-[12px] font-semibold uppercase tracking-[2px] text-[#5b4137] dark:text-[#cdb9ae]">
              © {year} {t("footer.signature")}
            </p>
          </div>

          <div className="flex justify-center gap-2">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => setLang(language.code)}
                className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[12px] font-semibold uppercase tracking-[1px] transition ${
                  lang === language.code
                    ? "border-[#854d63] bg-[#ffd9e4]/70 text-[#854d63] dark:border-[#f0adc4]/60 dark:bg-[#854d63]/30 dark:text-[#f8d7e3]"
                    : "border-[#e5e2e1] text-[#5b4137] hover:border-[#854d63]/40 hover:text-[#854d63] dark:border-white/15 dark:text-[#cdb9ae] dark:hover:border-[#f0adc4]/50 dark:hover:text-[#f0adc4]"
                }`}
                aria-label={`${t("footer.language")} ${langLabels[language.code]}`}
              >
                {language.flag}
                <span className="hidden sm:inline">{langLabels[language.code]}</span>
                <span
                  className="t-icon-swap size-4"
                  data-state={lang === language.code ? "b" : "a"}
                  aria-hidden="true"
                >
                  <span className="t-icon size-4" data-icon="a" />
                  <CheckIcon className="t-icon size-4" data-icon="b" />
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-nowrap justify-center gap-6 whitespace-nowrap lg:justify-end">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
                className="text-[12px] font-semibold uppercase tracking-[2px] text-[#5b4137] transition hover:text-[#854d63] dark:text-[#cdb9ae] dark:hover:text-[#f0adc4]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <section
        aria-hidden="true"
        className="relative h-[clamp(18rem,42vh,31rem)] overflow-hidden bg-white dark:bg-[#13100f]"
      >
        <div className="absolute inset-x-0 top-0 z-10 h-28 bg-[linear-gradient(180deg,#ffffff_0%,rgba(255,255,255,0.84)_34%,rgba(255,255,255,0)_100%)] dark:bg-[linear-gradient(180deg,#13100f_0%,rgba(19,16,15,0.86)_34%,rgba(19,16,15,0)_100%)]" />
        <motion.div
          animate={{ x: ["-2.5%", "2.5%", "-2.5%"] }}
          transition={{ duration: 8.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            clipPath:
              "polygon(0 38%, 8% 34%, 17% 31%, 27% 27%, 38% 24%, 50% 22%, 62% 24%, 73% 28%, 84% 31%, 93% 35%, 100% 39%, 100% 100%, 0 100%)",
          }}
          className="absolute inset-x-[-8%] bottom-[-22%] h-[116%] bg-[linear-gradient(104deg,rgba(255,217,228,0)_0%,rgba(255,217,228,0.72)_19%,rgba(255,220,189,0.78)_37%,rgba(240,173,196,0.82)_55%,rgba(133,77,99,0.78)_73%,rgba(205,185,174,0.64)_100%)] blur-[8px] dark:bg-[linear-gradient(104deg,rgba(19,16,15,0)_0%,rgba(240,173,196,0.3)_22%,rgba(255,220,189,0.36)_42%,rgba(133,77,99,0.62)_67%,rgba(91,65,55,0.7)_100%)]"
        />
        <motion.div
          animate={{ x: ["3.5%", "-3.5%", "3.5%"] }}
          transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            clipPath:
              "polygon(0 49%, 9% 46%, 19% 42%, 31% 39%, 43% 36%, 55% 36%, 66% 39%, 78% 43%, 89% 46%, 100% 48%, 100% 100%, 0 100%)",
          }}
          className="absolute inset-x-[-10%] bottom-[-28%] h-[116%] bg-[repeating-linear-gradient(115deg,rgba(255,255,255,0.16)_0_18px,rgba(255,255,255,0)_18px_50px),linear-gradient(96deg,rgba(255,217,228,0)_0%,rgba(255,220,189,0.48)_21%,rgba(240,173,196,0.5)_43%,rgba(133,77,99,0.48)_66%,rgba(236,214,151,0.36)_84%,rgba(255,255,255,0.2)_100%)] blur-[4px] dark:bg-[repeating-linear-gradient(115deg,rgba(248,241,236,0.09)_0_18px,rgba(248,241,236,0)_18px_50px),linear-gradient(96deg,rgba(19,16,15,0)_0%,rgba(255,220,189,0.24)_25%,rgba(240,173,196,0.28)_48%,rgba(133,77,99,0.5)_72%,rgba(236,214,151,0.18)_100%)]"
        />
      </section>
    </>
  );
}
