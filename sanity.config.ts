import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./studio/schemas";
import { structure } from "./studio/structure";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? "replace-with-project-id";
const dataset = process.env.SANITY_STUDIO_DATASET ?? "production";
const srcAlias = decodeURI(new URL("./src", import.meta.url).pathname);

export default defineConfig({
  name: "carole-portfolio",
  title: "Carole Portfolio CMS",
  projectId,
  dataset,
  basePath: "/admin",
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
