import { RouterProvider } from "react-router";
import { router } from "./routes";

function RouteFallback() {
  return <div className="min-h-screen bg-[#fcf9f8] dark:bg-[#13100f]" />;
}

export default function App() {
  return <RouterProvider router={router} fallbackElement={<RouteFallback />} />;
}
