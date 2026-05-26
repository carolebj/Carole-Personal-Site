import * as React from "react";

export const VIEWPORT_BREAKPOINTS = {
  mobileMax: 767,
  tabletMin: 768,
  desktopMin: 1024,
} as const;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${VIEWPORT_BREAKPOINTS.mobileMax}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth <= VIEWPORT_BREAKPOINTS.mobileMax);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth <= VIEWPORT_BREAKPOINTS.mobileMax);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
