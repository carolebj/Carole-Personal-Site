import { useSpring, useInView, useMotionValue, motion, AnimatePresence } from "motion/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLang } from "../i18n/LanguageContext";

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent =
          Math.floor(latest).toLocaleString() + suffix;
      }
    });
  }, [springValue, suffix]);

  return (
    <span
      ref={ref}
      className="text-4xl md:text-5xl font-bold font-serif text-emerald-950 inline-block"
    />
  );
}

export default function Metrics() {
  const { t } = useTranslation();
  const { lang } = useLang();

  const metrics = [
    { label: t("metrics.audienceGrowth"), value: 1800, suffix: "%" },
    { label: t("metrics.organicTraffic"), value: 45, suffix: "%" },
    { label: t("metrics.campaigns"), value: 50, suffix: "+" },
    { label: t("metrics.events"), value: 25, suffix: "+" },
  ];

  return (
    <section className="py-20 bg-amber-400 text-emerald-950">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-emerald-950/20">
          {metrics.map((metric, index) => (
            <div key={index} className="px-4">
              <div className="mb-2">
                <Counter value={metric.value} suffix={metric.suffix} />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={lang + "-metric-" + index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-bold uppercase tracking-wider text-sm md:text-base text-emerald-900/80"
                >
                  {metric.label}
                </motion.p>
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
