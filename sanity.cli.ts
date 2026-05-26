import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "vo8cimnh",
    dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  },
  deployment: {
    appId: "e30pbcgtyw67ud5vgr7c05kc",
  },
});
