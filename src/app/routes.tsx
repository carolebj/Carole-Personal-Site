import { createBrowserRouter } from "react-router";
import Layout from "./Layout";
import ErrorPage from "./components/ErrorPage";
import RouteErrorBoundary from "./components/RouteErrorBoundary";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    ErrorBoundary: ErrorPage,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import("./pages/Home")).default }),
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
]);
