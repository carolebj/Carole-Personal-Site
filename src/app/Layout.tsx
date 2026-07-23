import { useEffect } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import EstimatorShell from "./components/EstimatorShell";
import Seo from "./components/Seo";
import { SeoOverrideProvider } from "./seo/SeoOverrideContext";
import { HapticProvider } from "./interactions/HapticContext";
import { ThemeProvider } from "./theme/ThemeContext";
import "./i18n/i18n";
import { preloadPublicRoutes } from "./publicRouteModules";

export default function Layout() {
  const { pathname } = useLocation();
  const isEstimatorRoute = pathname.replace(/\/+$/, "") === "/estimer-mon-projet";

  useEffect(() => {
    const preload = () => {
      void preloadPublicRoutes();
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(preload, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <ThemeProvider>
      <HapticProvider>
        <div className="min-h-screen bg-[#fcf9f8] font-sans text-[#1c1b1b] antialiased [-webkit-font-smoothing:antialiased] selection:bg-[#ffd9e4] selection:text-[#4a1c30] dark:bg-[#13100f] dark:text-[#f8f1ec] dark:selection:bg-[#854d63] dark:selection:text-white">
          <SeoOverrideProvider>
            <Seo />
            {isEstimatorRoute ? (
              <EstimatorShell>
                <Outlet />
              </EstimatorShell>
            ) : (
              <>
                <header>
                  <Navbar />
                </header>
                <main>
                  <Outlet />
                </main>
                <Footer />
              </>
            )}
            <ScrollRestoration />
          </SeoOverrideProvider>
        </div>
      </HapticProvider>
    </ThemeProvider>
  );
}
