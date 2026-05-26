import { createClient, type ClientConfig, type SanityClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined;
const dataset = (import.meta.env.VITE_SANITY_DATASET as string | undefined) ?? "production";
const apiVersion = (import.meta.env.VITE_SANITY_API_VERSION as string | undefined) ?? "2026-05-24";
const enableLocalFetch =
  (import.meta.env.VITE_SANITY_ENABLE_LOCAL_FETCH as string | undefined) === "true";
const isLocalHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

export const isSanityConfigured = Boolean(projectId && dataset && (!isLocalHost || enableLocalFetch));

const config: ClientConfig | null = isSanityConfigured && projectId
  ? {
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      perspective: "published",
    }
  : null;

let cachedClient: SanityClient | null = null;

export function getSanityClient() {
  if (!config) {
    return null;
  }

  cachedClient ??= createClient(config);
  return cachedClient;
}

export const imageBuilder = config ? createImageUrlBuilder(config) : null;

export function sanityImageUrl(source: unknown) {
  if (!imageBuilder || !source) {
    return null;
  }

  return imageBuilder.image(source);
}
