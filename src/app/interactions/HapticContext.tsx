import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { scheduleSound, soundPalette, type SoundCue } from "./soundPalette";

type HapticContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  unlockAudio: () => Promise<boolean>;
  play: (kind?: "hover" | "click") => void;
  transition: (id: string, open: boolean) => void;
};

const STORAGE_KEY = "portfolio-haptics";
// Listening comparison B approved: +2 dB, with the original timbre and envelope.
const FEEDBACK_GAIN_MULTIPLIER = 10 ** (2 / 20);
const HOVER_GAIN = 0.024 * FEEDBACK_GAIN_MULTIPLIER;
const CLICK_GAIN = 0.046 * FEEDBACK_GAIN_MULTIPLIER;
const SILENT_ZONE_SELECTOR = "[data-haptic-silent]";
const HapticContext = createContext<HapticContextValue | null>(null);

function readStoredPreference() {
  if (typeof window === "undefined") return true;

  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function HapticProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(readStoredPreference);
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(enabled);
  const activeSoundsRef = useRef(new Set<() => void>());
  const requestRef = useRef(0);
  const nextSoundAtRef = useRef(0);
  const activatedRef = useRef(false);
  const suppressedCloseRef = useRef(new Map<string, number>());
  const pendingTransitionsRef = useRef<Array<{ open: boolean }>>([]);
  const transitionFlushRef = useRef(false);

  const getAudioContext = () => {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    const context = audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = context;

    return context;
  };

  const playTone = (context: AudioContext, kind: "hover" | "click") => {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(kind === "click" ? 540 : 760, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "click" ? 360 : 620, now + 0.055);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "click" ? CLICK_GAIN : HOVER_GAIN, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "click" ? 0.085 : 0.045));

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  };

  const resumeAudioContext = async () => {
    if (typeof window === "undefined") return null;

    const context = getAudioContext();
    if (!context) return null;

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return null;
      }
    }

    return context.state === "running" ? context : null;
  };

  const unlockAudio = async () => {
    if (!enabled) return false;
    return (await resumeAudioContext()) !== null;
  };

  const play = (kind: "hover" | "click" = "hover") => {
    if (!enabledRef.current || typeof window === "undefined") return;

    void resumeAudioContext().then((context) => {
      if (!context || !enabledRef.current) return;
      playTone(context, kind);
    });
  };

  const setEnabled = (nextEnabled: boolean) => {
    enabledRef.current = nextEnabled;
    requestRef.current++;
    for (const stop of activeSoundsRef.current) stop();
    activeSoundsRef.current.clear();
    nextSoundAtRef.current = 0;
    pendingTransitionsRef.current = [];
    setEnabledState(nextEnabled);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextEnabled ? "on" : "off");
    } catch {
      // ignore
    }
    if (nextEnabled) playCue("on");
  };

  const playCue = (cue: SoundCue) => {
    if (!activatedRef.current || !enabledRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const request = requestRef.current;
    void resumeAudioContext().then((context) => {
      if (!context || !enabledRef.current || request !== requestRef.current) return;
      const start = Math.max(context.currentTime, nextSoundAtRef.current);
      nextSoundAtRef.current = start + soundPalette[cue].duration;
      const stop = scheduleSound(context, cue, start);
      activeSoundsRef.current.add(stop);
      window.setTimeout(() => activeSoundsRef.current.delete(stop), (start - context.currentTime + soundPalette[cue].duration + .05) * 1000);
    });
  };

  const transition = (id: string, open: boolean) => {
    const suppressedAt = suppressedCloseRef.current.get(id);
    if (!open && suppressedAt !== undefined) {
      suppressedCloseRef.current.delete(id);
      if (performance.now() - suppressedAt < 250) return;
    }
    pendingTransitionsRef.current.push({ open });
    if (transitionFlushRef.current) return;
    transitionFlushRef.current = true;
    queueMicrotask(() => {
      transitionFlushRef.current = false;
      const pending = pendingTransitionsRef.current.splice(0);
      // Switching menus closes the old surface before opening the new one.
      pending.sort((a, b) => Number(a.open) - Number(b.open));
      for (const item of pending) playCue(item.open ? "open" : "close");
    });
  };

  useEffect(() => {
    const selector = "a[href], button, summary, input[type='checkbox'], input[type='radio'], [role='button'], [role='radio'], [role='switch'], [role='tab'], [data-haptic]";
    const isInSilentZone = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(SILENT_ZONE_SELECTOR));

    const handleClick = (event: MouseEvent) => {
      if (isInSilentZone(event.target)) return;

      const target = event.target instanceof Element ? event.target.closest(selector) : null;
      if (!target) return;

      if (target.closest(":disabled, [aria-disabled='true'], [inert]")) return;
      // The existing WOW badge owns a separate long-press sound.
      if (target.hasAttribute("aria-describedby") && target.getAttribute("aria-describedby") === "hero-wow-hint") return;
      if (target.querySelector("[data-wow-progress]")) return;
      // State transitions own dropdown triggers, never an additional click cue.
      if ((target.hasAttribute("aria-expanded") && target.closest("[data-sound-dropdown]")) || target.hasAttribute("data-sound-trigger")) return;
      activatedRef.current = true;
      const explicit = target.getAttribute("data-sound");
      const selection = Boolean(target.closest("[data-sound-dropdown], [data-sound-selections]")) && target.matches("a[href], [role='radio'], [role='tab'], [role='option']");
      if (target.matches("[role='radio'][aria-checked='true'], [role='tab'][aria-selected='true']")) return;
      const languageChoice = target.matches("footer button[aria-pressed]");
      if (languageChoice && target.getAttribute("aria-pressed") === "true") return;
      if (selection) {
        let scope = target.closest("[data-sound-dropdown]");
        while (scope) {
          suppressedCloseRef.current.set(scope.getAttribute("data-sound-dropdown")!, performance.now());
          scope = scope.parentElement?.closest("[data-sound-dropdown]") ?? null;
        }
      }
      if (explicit === "primary" || explicit === "select") playCue(explicit);
      else if (selection) playCue("select");
      else if (target.matches("[role='switch'], input[type='checkbox']")) {
        const current = target instanceof HTMLInputElement ? target.checked : target.getAttribute("aria-checked") !== "true";
        playCue(current ? "on" : "off");
      } else if (target.hasAttribute("aria-pressed") && !languageChoice) {
        playCue(target.getAttribute("aria-pressed") === "true" ? "off" : "on");
      } else if (languageChoice || target.matches("[role='radio'], input[type='radio']")) playCue("select");
      else playCue("secondary");
    };

    const handleActivation = () => {
      activatedRef.current = true;
      // A subsequent independent action must never inherit a selection's close suppression.
      suppressedCloseRef.current.clear();
      void unlockAudio();
    };

    document.addEventListener("pointerdown", handleActivation, { passive: true });
    document.addEventListener("keydown", handleActivation);
    // One closest activatable control per native click; keyboard clicks share this path.
    document.addEventListener("click", handleClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", handleActivation);
      document.removeEventListener("keydown", handleActivation);
      document.removeEventListener("click", handleClick, true);
    };
  }, [enabled]);

  useEffect(() => () => {
    requestRef.current++;
    pendingTransitionsRef.current = [];
    for (const stop of activeSoundsRef.current) stop();
    activeSoundsRef.current.clear();
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      toggleEnabled: () => setEnabled(!enabled),
      unlockAudio,
      play,
      transition,
    }),
    [enabled]
  );

  return <HapticContext.Provider value={value}>{children}</HapticContext.Provider>;
}

export function useHaptics() {
  const context = useContext(HapticContext);
  if (!context) {
    throw new Error("useHaptics must be used within HapticProvider");
  }

  return context;
}

/** Observe actual React state changes, not incidental pointer movement. */
export function useDropdownSound(id: string, open: boolean) {
  const { transition } = useHaptics();
  const previous = useRef(open);
  useEffect(() => {
    if (previous.current !== open) {
      previous.current = open;
      transition(id, open);
    }
  }, [id, open, transition]);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
