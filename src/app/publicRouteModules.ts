export const loadAboutPage = () => import("./pages/About");
export const loadBlogPage = () => import("./pages/Blog");
export const loadBlogArticlePage = () => import("./pages/BlogArticle");
export const loadToolsInspirationsPage = () => import("./pages/ToolsInspirations");
export const loadReadingsReferencesPage = () => import("./pages/ReadingsReferences");
export const loadCvPage = () => import("./pages/Cv");
export const loadContactPage = () => import("./pages/Contact");
export const loadClientBriefPage = () => import("./pages/ClientBrief");
export const loadProjectEstimatorPage = () => import("./pages/ProjectEstimator");
export const loadServiceDetailPage = () => import("./pages/ServiceDetail");
export const loadNotFoundPage = () => import("./components/NotFoundPage");

const lightweightPublicRoutes = [
  loadAboutPage,
  loadBlogPage,
  loadBlogArticlePage,
  loadToolsInspirationsPage,
  loadReadingsReferencesPage,
  loadCvPage,
  loadContactPage,
  loadProjectEstimatorPage,
  loadClientBriefPage,
  loadServiceDetailPage,
];

export function preloadPublicRoutes() {
  return Promise.allSettled(lightweightPublicRoutes.map((loadRoute) => loadRoute()));
}
