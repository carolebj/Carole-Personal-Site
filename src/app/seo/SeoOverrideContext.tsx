import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router";

export type SeoOverride = {
  title?: string;
  description?: string;
  image?: string;
  ogType?: string;
};

type SeoOverrideContextValue = {
  override: SeoOverride | null;
  setOverride: (value: SeoOverride | null) => void;
};

const SeoOverrideContext = createContext<SeoOverrideContextValue | null>(null);

export function SeoOverrideProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [override, setOverride] = useState<SeoOverride | null>(null);

  useEffect(() => {
    setOverride(null);
  }, [pathname]);

  const value = useMemo(() => ({ override, setOverride }), [override]);

  return <SeoOverrideContext.Provider value={value}>{children}</SeoOverrideContext.Provider>;
}

export function useSeoOverride(meta: SeoOverride | null) {
  const context = useContext(SeoOverrideContext);
  if (!context) {
    throw new Error("useSeoOverride must be used within SeoOverrideProvider");
  }

  const { setOverride } = context;

  useEffect(() => {
    setOverride(meta);
    return () => setOverride(null);
  }, [meta, setOverride]);
}

export function useSeoOverrideState() {
  const context = useContext(SeoOverrideContext);
  return context?.override ?? null;
}
