import { BeakerIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export type DemoScenario = {
  id: string;
  title: string;
  description: string;
};

type DemoScenarioFabProps = {
  scenarios: readonly DemoScenario[];
  onApply: (id: string) => void;
  onExit?: () => void;
  isEnglish?: boolean;
  position?: "default" | "above-summary";
};

export function DemoScenarioFab({ scenarios, onApply, onExit, isEnglish = false, position = "default" }: DemoScenarioFabProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_SCENARIOS === "true";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close);
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  if (!enabled) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed right-5 z-40 inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full bg-action-accent px-5 text-[12px] font-semibold text-text-on-strong shadow-panel transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-action-accent-hover active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none ${position === "above-summary" ? "bottom-[5.25rem] xl:bottom-5" : "bottom-5"}`}
        aria-expanded={open}
        aria-controls="demo-scenarios"
      >
        <BeakerIcon className="size-5" />
        {isEnglish ? "Demo" : "Mode démo"}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[70]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-text-primary/35 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
              aria-label={isEnglish ? "Close demo scenarios" : "Fermer les scénarios de démonstration"}
            />
            <motion.section
              id="demo-scenarios"
              role="dialog"
              aria-modal="true"
              aria-labelledby="demo-title"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 right-0 max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-surface-panel p-6 shadow-panel sm:bottom-5 sm:right-5 sm:w-[420px] sm:rounded-3xl"
            >
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[2px] text-text-accent">{isEnglish ? "TEST SHORTCUTS" : "RACCOURCIS DE TEST"}</p>
                  <h2 id="demo-title" className="mt-2 font-serif text-3xl font-normal">{isEnglish ? "Demo scenarios" : "Scénarios de démonstration"}</h2>
                  <p className="mt-2 max-w-[54ch] text-[12px] leading-5 text-text-muted">{isEnglish ? "Load a fictional state without answering every question." : "Chargez un état fictif sans devoir répondre à toutes les questions."}</p>
                </div>
                <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-panel transition-[border-color,background-color] hover:border-border-accent hover:bg-surface-page-muted" aria-label={isEnglish ? "Close" : "Fermer"}>
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                {scenarios.map((scenario, index) => (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => {
                      onApply(scenario.id);
                      setOpen(false);
                    }}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-2xl border border-border-subtle bg-surface-page p-4 text-left transition-[border-color,background-color] hover:border-border-accent hover:bg-surface-accent-muted active:bg-surface-page-muted"
                  >
                    <span className="font-serif text-2xl leading-none text-text-accent" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0"><span className="block text-[13px] font-semibold text-text-primary">{scenario.title}</span><span className="mt-1 block text-[11px] leading-5 text-text-muted">{scenario.description}</span></span>
                  </button>
                ))}
              </div>

              {onExit ? (
                <button type="button" onClick={() => { onExit(); setOpen(false); }} className="mt-5 min-h-11 w-full whitespace-nowrap rounded-full border border-border-subtle px-5 py-3 text-[12px] font-semibold text-text-secondary transition-[border-color,background-color] hover:border-border-accent hover:bg-surface-page-muted">
                  {isEnglish ? "Exit demo mode" : "Quitter le mode démo"}
                </button>
              ) : null}
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
