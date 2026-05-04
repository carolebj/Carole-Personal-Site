import { createBrowserRouter } from "react-router";
import Layout from "./Layout";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import ServiceDetail from "./pages/ServiceDetail";
import ErrorPage from "./components/ErrorPage";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import NotFoundPage from "./components/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    ErrorBoundary: ErrorPage,
    children: [
      {
        index: true,
        Component: Home,
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "blog",
        Component: Blog,
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "services/:slug",
        Component: ServiceDetail,
        ErrorBoundary: RouteErrorBoundary,
      },
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
]);
