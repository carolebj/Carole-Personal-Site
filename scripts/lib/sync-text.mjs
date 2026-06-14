export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Normalise les objets localisés et l'ordre des clés (jsonb Postgres). */
export function normalizeCmsData(value) {
  if (Array.isArray(value)) return value.map(normalizeCmsData);
  if (!isPlainObject(value)) return value;

  if ("fr" in value || "en" in value) {
    return { fr: value.fr ?? "", en: value.en ?? "" };
  }

  const out = {};
  for (const key of Object.keys(value).sort()) {
    out[key] = normalizeCmsData(value[key]);
  }
  return out;
}

export function cmsDataEqual(a, b) {
  return JSON.stringify(normalizeCmsData(a)) === JSON.stringify(normalizeCmsData(b));
}

/** Remplace le texte canonique ; conserve images / URLs déjà présentes (valeurs null ignorées). */
export function syncTextFromCanonical(existing, canonical) {
  if (Array.isArray(canonical)) return structuredClone(canonical);
  if (!isPlainObject(canonical)) return canonical === null ? existing : structuredClone(canonical);

  const base = isPlainObject(existing) ? structuredClone(existing) : {};
  for (const [key, value] of Object.entries(canonical)) {
    if (key === "id") continue;
    if (value === null) continue;
    if (isPlainObject(value)) {
      base[key] = syncTextFromCanonical(base[key], value);
    } else {
      base[key] = structuredClone(value);
    }
  }
  return base;
}
