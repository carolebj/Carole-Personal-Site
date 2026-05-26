import { Outlet, ScrollRestoration } from "react-router";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Seo from "./components/Seo";
import { HapticProvider } from "./interactions/HapticContext";
import { ThemeProvider } from "./theme/ThemeContext";
import "./i18n/i18n";

export default function Layout() {
  return (
    <ThemeProvider>
      <HapticProvider>
        <div className="min-h-screen bg-[#fcf9f8] font-sans text-[#1c1b1b] antialiased selection:bg-[#ffd9e4] selection:text-[#4a1c30] dark:bg-[#13100f] dark:text-[#f8f1ec] dark:selection:bg-[#854d63] dark:selection:text-white">
          <Seo />
          <Navbar />
          <main>
            <Outlet />
          </main>
          <Footer />
          <ScrollRestoration />
        </div>
      </HapticProvider>
    </ThemeProvider>
  );
}
