import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router";

export type SeoOverride = {
  title?: string;
  description?: string;
  image?: string;
  ogType?: string;
  /** e.g. "noindex, nofollow" for NotFound / soft-404 */
  robots?: string;
};

type SeoOverrideContextValue = {
  override: SeoOverride | null;
  setOverride: (value: SeoOverride | null) => void;
};

type PathScopedOverride = {
  path: string;
  meta: SeoOverride;
};

const SeoOverrideContext = createContext<SeoOverrideContextValue | null>(null);

/**
 * Path-scoped SEO overrides.
 *
 * Child routes set overrides via `useSeoOverride`. Overrides are keyed by
 * pathname so a previous route's cleanup cannot wipe the current route's meta,
 * and soft-404 title/description/robots stay stable for Seo's DOM effect.
 */
export function SeoOverrideProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [scoped, setScoped] = useState<PathScopedOverride | null>(null);

  const setOverride = useCallback((value: SeoOverride | null) => {
    setScoped((previous) => {
      if (value === null) {
        // Only clear when the stored override still belongs to this path.
        // A stale cleanup from the previous route must not erase the new route.
        if (previous?.path === pathname) return null;
        return previous;
      }
      if (
        previous?.path === pathname &&
        previous.meta === value
      ) {
        return previous;
      }
      return { path: pathname, meta: value };
    });
  }, [pathname]);

  const override = scoped?.path === pathname ? scoped.meta : null;

  const value = useMemo(() => ({ override, setOverride }), [override, setOverride]);

  return <SeoOverrideContext.Provider value={value}>{children}</SeoOverrideContext.Provider>;
}

export function useSeoOverride(meta: SeoOverride | null) {
  const context = useContext(SeoOverrideContext);
  if (!context) {
    throw new Error("useSeoOverride must be used within SeoOverrideProvider");
  }

  const { setOverride } = context;

  // Layout effect: apply before Seo's passive useEffect writes document.head,
  // so the first paint of title/robots already reflects soft-404 meta.
  useLayoutEffect(() => {
    setOverride(meta);
    return () => setOverride(null);
  }, [meta, setOverride]);
}

export function useSeoOverrideState() {
  const context = useContext(SeoOverrideContext);
  return context?.override ?? null;
}
