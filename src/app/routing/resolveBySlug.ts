/**
 * Resolve a collection item by URL slug without falling back to the first item.
 * Unknown or empty slugs return undefined so callers can render NotFound.
 */

export const SERVICE_SLUG_ALIASES: Record<string, string> = {
  "direction-social-media": "communication-digitale",
  "social-media-direction": "digital-communication",
  "creation-contenu": "creation-contenus",
  "content-creation": "creation-contenus",
  "audit-conseil": "audit-consulting",
  "graphic-design": "identite-visuelle",
  "visual-identity": "identite-visuelle",
  "design-graphique": "identite-visuelle",
};

export function normalizeSlug(
  slug: string | undefined,
  aliases?: Record<string, string>,
): string | undefined {
  if (!slug) return undefined;
  return aliases?.[slug] ?? slug;
}

export function resolveBySlug<T extends { slug: string }>(
  items: readonly T[],
  slug: string | undefined,
  aliases?: Record<string, string>,
): T | undefined {
  const normalized = normalizeSlug(slug, aliases);
  if (!normalized) return undefined;
  return items.find((item) => item.slug === normalized);
}
