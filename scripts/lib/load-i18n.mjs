import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, "../../src/app/i18n/locales");

/** Charge fr.tsx / en.tsx (objets purs, sans JSX) pour alimenter le CMS. */
export function loadLocale(name) {
  const src = readFileSync(join(LOCALES_DIR, `${name}.tsx`), "utf8")
    .replace(/^export default \w+;?\s*$/m, "")
    .replace(/ as const;/g, "");
  return new Function(`${src}; return ${name};`)();
}

let cached;
export function loadI18nPair() {
  if (!cached) {
    cached = { fr: loadLocale("fr"), en: loadLocale("en") };
  }
  return cached;
}
