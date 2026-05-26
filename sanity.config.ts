import { buildLegacyTheme, defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./studio/schemas";
import { structure } from "./studio/structure";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? "vo8cimnh";
const dataset = process.env.SANITY_STUDIO_DATASET ?? "production";
const srcAlias = decodeURI(new URL("./src", import.meta.url).pathname);

export default defineConfig({
  name: "carole-portfolio",
  title: "Carole Portfolio — Administration des contenus",
  projectId,
  dataset,
  basePath: "/admin",
  theme: buildLegacyTheme({
    "--black": "#24212f",
    "--gray": "#6f6a7d",
    "--focus-color": "#7b4be8",
    "--brand-primary": "#7b4be8",
  }),
  releases: {
    enabled: true,
  },
  plugins: [
    structureTool({
      structure,
    }),
  ],
  schema: {
    types: schemaTypes,
  },
  vite: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "@": srcAlias,
      },
    },
  }),
});
