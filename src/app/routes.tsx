import { createBrowserRouter } from "react-router";
import Layout from "./Layout";
import Home from "./pages/Home";
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
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
]);