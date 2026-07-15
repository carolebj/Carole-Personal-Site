/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
/* Hallmark · component: full-viewport calculation interstitial · genre: editorial · theme: Carole Linen
 * states: calculating · finalising · revealing · reduced-motion
 * contrast: uses locked semantic tokens
 */
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { lockBodyScroll } from "../../estimator/bodyScrollLock";

export const ESTIMATE_CALCULATION_DURATION_MS = 3_600;
export const ESTIMATE_CALCULATION_REVEAL_MS = 520;

const PHASE_DELAYS_MS = [900, 1_900, 2_800] as const;
const PROGRESS_BY_PHASE = [22, 48, 74, 90] as const;

const GLINTS = [
  { left: "12%", top: "24%", delay: 0.62 },
  { left: "82%", top: "20%", delay: 1.62 },
  { left: "88%", top: "72%", delay: 2.62 },
] as const;

const LABELS = {
  fr: [
    "Lecture de votre contexte",
    "Mise en relation de vos réponses",
    "Construction de votre fourchette",
    "Dernières vérifications",
  ],
  en: [
    "Reading your context",
    "Connecting your answers",
    "Building your indicative range",
    "Final checks",
  ],
} as const;

type EstimateCalculationStageProps = {
  isEnglish: boolean;
  ready: boolean;
  onComplete: () => void;
};

function CalculationGlints() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {GLINTS.map((glint, index) => (
        <motion.svg
          key={`${glint.left}-${glint.top}`}
          viewBox="0 0 24 24"
          className={`absolute text-text-accent ${index === 1 ? "size-5" : "size-3.5"}`}
          style={{ left: glint.left, top: glint.top }}
          initial={{ opacity: 0, scale: 0.55, rotate: -14, filter: "blur(3px)" }}
          animate={{ opacity: [0, 0.72, 0], scale: [0.55, 1, 0.78], rotate: [-14, 0, 10], filter: ["blur(3px)", "blur(0px)", "blur(2px)"] }}
          transition={{ duration: 0.84, delay: glint.delay, ease: [0.22, 1, 0.36, 1] }}
        >
          <path fill="currentColor" d="M12 1.8c.34 5.75 4.45 9.86 10.2 10.2-5.75.34-9.86 4.45-10.2 10.2C11.66 16.45 7.55 12.34 1.8 12 7.55 11.66 11.66 7.55 12 1.8Z" />
        </motion.svg>
      ))}
    </div>
  );
}

export function EstimateCalculationStage({ isEnglish, ready, onComplete }: EstimateCalculationStageProps) {
  const shouldReduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion === true;
  const onCompleteRef = useRef(onComplete);
  const completionStartedRef = useRef(false);
  const [phase, setPhase] = useState(0);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const appRoot = document.getElementById("root");
    const wasInert = appRoot?.hasAttribute("inert") ?? false;
    const releaseScroll = lockBodyScroll();
    appRoot?.setAttribute("inert", "");
    return () => {
      releaseScroll();
      if (!wasInert) appRoot?.removeAttribute("inert");
    };
  }, []);

  useEffect(() => {
    const phaseTimers = reduced ? [] : PHASE_DELAYS_MS.map((delay, index) =>
      window.setTimeout(() => setPhase(index + 1), delay),
    );
    const completionTimer = window.setTimeout(
      () => setMinimumElapsed(true),
      reduced ? 700 : ESTIMATE_CALCULATION_DURATION_MS,
    );

    return () => {
      phaseTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(completionTimer);
    };
  }, [reduced]);

  useEffect(() => {
    if (!ready || !minimumElapsed || completionStartedRef.current) return;
    completionStartedRef.current = true;
    setRevealing(true);
    const timer = window.setTimeout(
      () => onCompleteRef.current(),
      reduced ? 80 : ESTIMATE_CALCULATION_REVEAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [minimumElapsed, ready, reduced]);

  if (typeof document === "undefined") return null;

  const labels = isEnglish ? LABELS.en : LABELS.fr;
  const progress = revealing ? 100 : PROGRESS_BY_PHASE[phase];

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] isolate flex min-h-dvh items-center justify-center overflow-hidden bg-surface-page px-5 py-12 text-text-primary sm:px-10"
      role="status"
      aria-live="polite"
      aria-busy={!ready}
      aria-labelledby="estimate-calculation-title"
      initial={reduced ? false : { opacity: 0 }}
      animate={revealing && !reduced ? { opacity: 0, filter: "blur(6px)" } : { opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: reduced ? 0 : revealing ? ESTIMATE_CALCULATION_REVEAL_MS / 1_000 : 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {!reduced ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <motion.div className="absolute -left-[12vw] top-[8vh] size-[48vw] rounded-full bg-surface-accent-muted blur-[90px]" animate={{ scale: [0.92, 1.05, 0.96], opacity: [0.55, 0.82, 0.62] }} transition={{ duration: 3.6, ease: "easeInOut" }} />
          <motion.div className="absolute -right-[14vw] bottom-[-18vh] size-[54vw] rounded-full bg-action-accent/10 blur-[110px]" animate={{ scale: [1.04, 0.94, 1], opacity: [0.28, 0.5, 0.34] }} transition={{ duration: 3.6, ease: "easeInOut" }} />
          <CalculationGlints />
        </div>
      ) : null}

      <div className="relative z-10 w-full max-w-[760px] text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[2.4px] text-text-accent">
          {isEnglish ? "CALCULATING YOUR ESTIMATE" : "CALCUL DE VOTRE ESTIMATION"}
        </p>
        <motion.h1
          id="estimate-calculation-title"
          initial={reduced ? false : { opacity: 0, filter: "blur(12px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: reduced ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-[680px] font-serif text-[clamp(2.7rem,6vw,5.4rem)] font-normal leading-[0.98] tracking-[-0.035em]"
        >
          {isEnglish ? "Your estimate is taking shape." : "Votre estimation prend forme."}
        </motion.h1>
        <p className="mx-auto mt-6 max-w-[54ch] text-[15px] leading-7 text-text-secondary sm:text-[16px]">
          {isEnglish
            ? "We are connecting the useful project markers before revealing the indicative range."
            : "Nous mettons en relation les repères utiles de votre projet avant de révéler la fourchette indicative."}
        </p>

        <div className="mx-auto mt-12 max-w-[560px] border-y border-border-subtle py-7 text-left">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
            <span className="font-serif text-4xl leading-none tabular-nums text-text-accent" aria-hidden="true">
              {String(Math.min(phase + 1, 4)).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <motion.p
                key={phase}
                initial={reduced ? false : { opacity: 0, y: 6, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="text-[14px] font-medium leading-6 text-text-primary sm:text-[15px]"
              >
                {reduced ? (isEnglish ? "Calculating the estimate" : "Calcul de l’estimation en cours") : labels[phase]}
              </motion.p>
              <p className="mt-1 text-[11px] leading-5 text-text-muted">
                {ready
                  ? (isEnglish ? "Verification complete" : "Vérification terminée")
                  : (isEnglish ? "The secure calculation is still running" : "Le calcul sécurisé se poursuit")}
              </p>
            </div>
          </div>

          <div className="mt-6 h-1 overflow-hidden rounded-full bg-border-subtle" aria-hidden="true">
            <motion.span
              className="block h-full origin-left rounded-full bg-action-accent"
              animate={{ width: `${progress}%` }}
              transition={{ duration: reduced ? 0 : revealing ? 0.28 : 0.68, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}
