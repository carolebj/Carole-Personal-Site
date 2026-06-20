import { createBrowserRouter } from "react-router";
import Layout from "./Layout";
import ErrorPage from "./components/ErrorPage";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import Home from "./pages/Home";

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
        lazy: async () => ({ Component: (await import("./pages/About")).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "blog",
        lazy: async () => ({ Component: (await import("./pages/Blog")).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "blog/:slug",
        lazy: async () => ({ Component: (await import("./pages/BlogArticle")).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "carnet/outils-inspirations",
        lazy: async () => ({ Component: (await import("./pages/ToolsInspirations")).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "carnet/lectures-references",
        lazy: async () => ({ Component: (await import("./pages/ReadingsReferences")).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "cv",
        lazy: async () => ({ Component: (await import("./pages/Cv")).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "contact",
        lazy: async () => ({ Component: (await import("./pages/Contact")).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "services",
        lazy: async () => ({ Component: (await import("./pages/Services")).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "services/brief-design",
        lazy: async () => ({ Component: (await import("./pages/DesignBrief")).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "services/:slug",
        lazy: async () => ({ Component: (await import("./pages/ServiceDetail")).default }),
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "*",
        lazy: async () => ({ Component: (await import("./components/NotFoundPage")).default }),
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
