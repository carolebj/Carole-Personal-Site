import { useReducedMotion } from "motion/react";

/** Respects `prefers-reduced-motion` for Framer/Motion animations site-wide. */
export function useMotionSafe() {
  const reduceMotion = useReducedMotion() ?? false;

  return {
    reduceMotion,
    /** Standard section entrance — skipped when user prefers reduced motion. */
    entranceTransition: reduceMotion
      ? { duration: 0 }
      : { duration: 0.45, ease: "easeOut" as const },
    /** Carousel / panel cross-fade — skipped when reduced motion. */
    crossfadeTransition: reduceMotion
      ? { duration: 0 }
      : { duration: 0.3, ease: "easeInOut" as const },
  };
}
