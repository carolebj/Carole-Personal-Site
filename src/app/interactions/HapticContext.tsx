import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type HapticContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  unlockAudio: () => Promise<boolean>;
  play: (kind?: "hover" | "click") => void;
};

const STORAGE_KEY = "portfolio-haptics";
const HOVER_GAIN = 0.024;
const CLICK_GAIN = 0.046;
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
  const lastHoverRef = useRef<EventTarget | null>(null);

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
    if (!enabled || typeof window === "undefined") return;

    void resumeAudioContext().then((context) => {
      if (!context) return;
      playTone(context, kind);
    });
  };

  const setEnabled = (nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextEnabled ? "on" : "off");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const selector = "a, button, input, textarea, [role='button'], [data-haptic]";
    const isInSilentZone = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(SILENT_ZONE_SELECTOR));

    const handlePointerOver = (event: PointerEvent) => {
      if (isInSilentZone(event.target)) return;

      const target = event.target instanceof Element ? event.target.closest(selector) : null;
      if (!target || target === lastHoverRef.current) return;

      lastHoverRef.current = target;
      play("hover");
    };

    const handleClick = (event: MouseEvent) => {
      if (isInSilentZone(event.target)) return;

      const target = event.target instanceof Element ? event.target.closest(selector) : null;
      if (!target) return;

      play("click");
    };

    const handleActivation = () => {
      void unlockAudio();
    };

    document.addEventListener("pointerdown", handleActivation, { passive: true });
    document.addEventListener("keydown", handleActivation);
    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("click", handleClick, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", handleActivation);
      document.removeEventListener("keydown", handleActivation);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("click", handleClick);
    };
  }, [enabled]);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      toggleEnabled: () => setEnabled(!enabled),
      unlockAudio,
      play,
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

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
