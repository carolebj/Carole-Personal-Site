import { createBrowserRouter, Navigate } from "react-router";
import Layout from "./Layout";
import ErrorPage from "./components/ErrorPage";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import Home from "./pages/Home";
import Services from "./pages/Services";
import {
  loadAboutPage,
  loadBlogArticlePage,
  loadBlogPage,
  loadContactPage,
  loadCvPage,
  loadClientBriefPage,
  loadNotFoundPage,
  loadProjectEstimatorPage,
  loadReadingsReferencesPage,
  loadServiceDetailPage,
  loadToolsInspirationsPage,
} from "./publicRouteModules";

function RouteHydrateFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh items-center justify-center bg-surface-page px-6 text-sm text-text-muted"
    >
      Chargement…
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    HydrateFallback: RouteHydrateFallback,
    ErrorBoundary: ErrorPage,
    children: [
      {
        index: true,
        Component: Home,
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "about",
        lazy: async () => ({ Component: (await loadAboutPage()).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "blog",
        lazy: async () => ({ Component: (await loadBlogPage()).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "blog/:slug",
        lazy: async () => ({ Component: (await loadBlogArticlePage()).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "carnet/outils-inspirations",
        lazy: async () => ({ Component: (await loadToolsInspirationsPage()).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "carnet/lectures-references",
        lazy: async () => ({ Component: (await loadReadingsReferencesPage()).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "cv",
        lazy: async () => ({ Component: (await loadCvPage()).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "contact",
        lazy: async () => ({ Component: (await loadContactPage()).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "estimer-mon-projet",
        lazy: async () => ({ Component: (await loadProjectEstimatorPage()).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "services",
        Component: Services,
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "services/brief-design",
        Component: () => <Navigate to="/services/identite-visuelle/brief-client" replace />,
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "services/:slug/brief-client",
        lazy: async () => ({ Component: (await loadClientBriefPage()).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "services/:slug",
        lazy: async () => ({ Component: (await loadServiceDetailPage()).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "*",
        lazy: async () => ({ Component: (await loadNotFoundPage()).default }),
      },
    ],
  },
  {
    path: "/dashboard/*",
    lazy: async () => ({ Component: (await import("../admin/AdminApp")).default }),
    HydrateFallback: RouteHydrateFallback,
    ErrorBoundary: RouteErrorBoundary,
  },
]);
