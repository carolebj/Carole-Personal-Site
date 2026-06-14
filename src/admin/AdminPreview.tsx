import type { AnyDoc } from "./store";
import type { ContentType, FieldDef } from "./schema";
import BlogPreview from "./BlogPreview";

type Locale = "fr" | "en";
type Localized = { fr?: string; en?: string };

function localized(value: unknown, locale: Locale) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const item = value as Localized;
    return item[locale] || item.fr || item.en || "";
  }
  return typeof value === "string" ? value : "";
}

function PreviewField({
  field,
  value,
  locale,
}: {
  field: FieldDef;
  value: unknown;
  locale: Locale;
}) {
  if (field.type === "group") {
    const group = (value as Record<string, unknown>) ?? {};
    return (
      <section className="rounded-lg border border-border-subtle bg-surface-panel p-5">
        <h3 className="font-serif text-xl text-text-primary">{field.label}</h3>
        <div className="mt-4 space-y-4">
          {field.fields?.map((child) => (
            <PreviewField key={child.name} field={child} value={group[child.name]} locale={locale} />
          ))}
        </div>
      </section>
    );
  }

  if (field.type === "image") {
    const image = value as { url?: string; alt?: Localized } | null;
    return image?.url ? (
      <figure>
        <img src={image.url} alt={localized(image.alt, locale)} className="max-h-72 w-full rounded-lg object-cover" />
        <figcaption className="mt-2 text-xs text-text-muted">{localized(image.alt, locale)}</figcaption>
      </figure>
    ) : null;
  }

  if (field.type === "localizedList") {
    const items = Array.isArray(value) ? value : [];
    return items.length ? (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{field.label}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
          {items.map((item, index) => <li key={index}>{localized(item, locale)}</li>)}
        </ul>
      </div>
    ) : null;
  }

  if (field.type.startsWith("localized")) {
    const text = localized(value, locale);
    return text ? (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{field.label}</p>
        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-text-primary">{text}</p>
      </div>
    ) : null;
  }

  if (field.type === "boolean" || field.type === "tags") return null;
  const text = typeof value === "string" ? value : "";
  return text ? (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{field.label}</p>
      <p className="mt-1 text-sm text-text-primary">{text}</p>
    </div>
  ) : null;
}

export default function AdminPreview({
  type,
  doc,
  locale,
}: {
  type: ContentType;
  doc: AnyDoc;
  locale: Locale;
}) {
  if (type.name === "blogPost") return <BlogPreview doc={doc} locale={locale} />;
  return (
    <div className="bg-surface-page p-6">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-accent">
          Aperçu {locale.toUpperCase()} · {type.labelSingular}
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {type.fields.map((field) => (
            <PreviewField key={field.name} field={field} value={doc[field.name]} locale={locale} />
          ))}
        </div>
      </div>
    </div>
  );
}
