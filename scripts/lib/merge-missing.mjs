function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isMissingValue(value) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

export function mergeMissing(current, source) {
  if (isMissingValue(current)) return structuredClone(source);
  if (isMissingValue(source)) return structuredClone(current);

  if (Array.isArray(current) && Array.isArray(source)) {
    const length = Math.max(current.length, source.length);
    return Array.from({ length }, (_, index) => {
      if (index >= current.length) return structuredClone(source[index]);
      if (index >= source.length) return structuredClone(current[index]);
      return mergeMissing(current[index], source[index]);
    });
  }

  if (isPlainObject(current) && isPlainObject(source)) {
    const result = structuredClone(current);
    for (const [key, value] of Object.entries(source)) {
      result[key] = key in result ? mergeMissing(result[key], value) : structuredClone(value);
    }
    return result;
  }

  return structuredClone(current);
}
