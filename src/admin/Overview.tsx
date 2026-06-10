import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  NewspaperIcon,
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { contentTypes, type ContentType } from "./schema";
import { TypeIcon } from "./iconMap";
import type { AnyDoc, ContentStore } from "./store";
import { documentCompleteness } from "./validation";

function asArray(value: AnyDoc | AnyDoc[] | undefined): AnyDoc[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function count(content: ContentStore, name: string) {
  return asArray(content[name]).length;
}

function shortLabel(type: ContentType) {
  return type.label.replace("Carnet · ", "").replace(" & inspirations", "").replace(
    "Lectures & références",
    "Lectures",
  );
}

const palette = ["#854d63", "#d79caf", "#ffcf99", "#e08a76", "#b06a86", "#6a364b"];

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-panel p-4 shadow-[var(--shadow-panel)]">
      <span className="flex size-10 items-center justify-center rounded-lg bg-surface-accent-muted text-text-accent">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-semibold leading-none text-text-primary">{value}</p>
        <p className="mt-1 text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function Overview({
  email,
  content,
  onOpen,
  trashCount,
}: {
  email: string;
  content: ContentStore;
  onOpen: (type: ContentType) => void;
  trashCount: number;
}) {
  const firstName = email.split("@")[0];

  const collections = useMemo(
    () => contentTypes.filter((t) => t.kind === "collection"),
    [],
  );

  const barData = useMemo(
    () =>
      collections.map((type) => ({
        name: shortLabel(type),
        value: count(content, type.name),
      })),
    [collections, content],
  );

  const totalItems = useMemo(
    () => collections.reduce((sum, type) => sum + count(content, type.name), 0),
    [collections, content],
  );

  const featuredCount = useMemo(
    () => asArray(content.blogPost).filter((d) => Boolean(d.featured)).length,
    [content],
  );

  const allDocuments = useMemo(
    () => contentTypes.flatMap((type) => asArray(content[type.name]).map((doc) => ({ type, doc }))),
    [content],
  );
  const draftCount = allDocuments.filter(({ doc }) => doc.status !== "published").length;
  const incompleteCount = allDocuments.filter(({ type, doc }) => {
    const quality = documentCompleteness(type, doc);
    return quality.errors > 0 || quality.warnings > 0;
  }).length;

  const carnetData = useMemo(
    () => [
      { name: "Ressources", value: count(content, "resource") },
      { name: "Communautés", value: count(content, "community") },
      { name: "Ouvrages", value: count(content, "book") },
      { name: "Articles & newsletters", value: count(content, "reference") },
    ],
    [content],
  );
  const carnetTotal = carnetData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="font-serif text-3xl text-text-primary">Bonjour {firstName}</h1>
      <p className="mt-2 text-sm text-text-muted">Vue d'ensemble du contenu du site.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-5">
        <Kpi icon={<Squares2X2Icon className="size-5" />} label="Éléments au total" value={totalItems} />
        <Kpi icon={<NewspaperIcon className="size-5" />} label="Brouillons / à republier" value={draftCount} />
        <Kpi
          icon={<ChatBubbleLeftRightIcon className="size-5" />}
          label="Contenus incomplets"
          value={incompleteCount}
        />
        <Kpi icon={<StarIcon className="size-5" />} label="Articles en avant" value={featuredCount} />
        <Kpi icon={<BookOpenIcon className="size-5" />} label="Dans la corbeille" value={trashCount} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-border-subtle bg-surface-panel p-5 shadow-[var(--shadow-panel)]">
          <h2 className="text-sm font-semibold text-text-primary">Contenu par rubrique</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={14}
                  height={36}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--surface-accent-muted)" }}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--border-subtle)",
                    background: "var(--surface-panel)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#854d63" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-panel p-5 shadow-[var(--shadow-panel)]">
          <h2 className="text-sm font-semibold text-text-primary">Composition du Carnet</h2>
          {carnetTotal === 0 ? (
            <p className="mt-10 text-center text-sm text-text-muted">Aucun élément de carnet.</p>
          ) : (
            <>
              <div className="mt-2 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={carnetData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={64}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {carnetData.map((_, i) => (
                        <Cell key={i} fill={palette[i % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--border-subtle)",
                        background: "var(--surface-panel)",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-2">
                {carnetData.map((d, i) => (
                  <li key={d.name} className="flex items-center gap-2 text-xs text-text-secondary">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: palette[i % palette.length] }}
                    />
                    {d.name}
                    <span className="ml-auto font-medium text-text-primary">{d.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-text-muted">Accès rapide</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {contentTypes.map((type) => (
          <button
            key={type.name}
            onClick={() => onOpen(type)}
            className="group flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-panel p-4 text-left transition-colors hover:border-border-accent"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-accent-muted text-text-accent">
              <TypeIcon icon={type.icon} className="size-4" />
            </span>
            <span className="min-w-0 text-sm font-medium leading-snug text-text-primary">
              {shortLabel(type)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
