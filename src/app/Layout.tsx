import { Outlet, ScrollRestoration } from "react-router";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./i18n/i18n";

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans antialiased selection:bg-amber-400 selection:text-emerald-950">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
