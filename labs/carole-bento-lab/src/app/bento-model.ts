export type BentoService = {
  accent: string;
  description: string;
  id: string;
  title: string;
};

export type BentoExportConfig = {
  compactSpan: number;
  gap: number;
  hoverFocus: boolean;
  hoverLift: number;
  hoverSpan: number;
  minHeight: number;
  order: number[];
  spans: number[];
  transitionMs: number;
};

export const bentoServices: readonly BentoService[] = [
  {
    accent: "Éditoriale",
    description:
      "Définition de votre ligne éditoriale, de vos piliers de contenu et de vos angles de prise de parole.",
    id: "strategie-editoriale",
    title: "Stratégie",
  },
  {
    accent: "Digitale",
    description:
      "Coordination de vos supports et actions pour renforcer votre présence et clarifier vos messages.",
    id: "communication-digitale",
    title: "Communication",
  },
  {
    accent: "Contenu",
    description:
      "Rédaction de posts à forte valeur ajoutée, conception de visuels percutants et formats adaptés à chaque plateforme.",
    id: "creation-contenu",
    title: "Création de",
  },
  {
    accent: "Conseil",
    description:
      "Analyse approfondie de l'existant et recommandations stratégiques pour optimiser vos performances.",
    id: "audit-conseil",
    title: "Audit &",
  },
  {
    accent: "Visuelle",
    description:
      "Création ou clarification de votre univers graphique : logo, charte, direction artistique et supports de marque.",
    id: "identite-visuelle",
    title: "Identité",
  },
];

export const defaultOrder = [0, 1, 2, 3, 4] as const;

export const bentoPresetSpans: Record<number, readonly number[]> = {
  1: [2, 2, 3, 2, 3],
  2: [7, 5, 4, 4, 4],
  3: [7, 5, 5, 7, 12],
  4: [12, 6, 6, 12, 12],
};

export const bentoRestingSpans = [6, 6, 3, 5, 4] as const;

export const bentoHoverSpans: Record<number, readonly number[]> = {
  0: [8, 4, 4, 4, 4],
  1: [4, 8, 4, 4, 4],
  2: [6, 6, 6, 3, 3],
  3: [6, 6, 3, 6, 3],
  4: [6, 6, 3, 3, 6],
};

export function clampSpan(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return 6;
  }

  return Math.max(2, Math.min(12, Math.round(numericValue)));
}

export function parseOrder(value: unknown) {
  const rawOrder =
    typeof value === "string"
      ? value.split(",").map((item) => Number(item.trim()))
      : Array.isArray(value)
        ? value.map((item) => Number(item))
        : [...defaultOrder];
  const valid = rawOrder.filter(
    (item, index, order) =>
      Number.isInteger(item) && item >= 0 && item < bentoServices.length && order.indexOf(item) === index,
  );
  return [
    ...valid,
    ...defaultOrder.filter((item) => !valid.includes(item)),
  ].slice(0, bentoServices.length);
}

export function serializeOrder(order: readonly number[]) {
  return order.join(",");
}

export function moveOrderItem(orderValue: unknown, serviceIndex: number, direction: -1 | 1) {
  const order = parseOrder(orderValue);
  const currentPosition = order.indexOf(serviceIndex);
  const nextPosition = currentPosition + direction;

  if (currentPosition < 0 || nextPosition < 0 || nextPosition >= order.length) {
    return serializeOrder(order);
  }

  [order[currentPosition], order[nextPosition]] = [order[nextPosition], order[currentPosition]];
  return serializeOrder(order);
}

export function shuffleOrder() {
  return [...defaultOrder]
    .map((value) => ({ sort: Math.random(), value }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export function randomizeSpans(targetRows = Math.ceil(Math.random() * 4)) {
  const preset = bentoPresetSpans[targetRows] ?? bentoPresetSpans[3];
  return preset.map((span) => clampSpan(span + Math.round(Math.random() * 4 - 2)));
}

export function readBentoConfig(values: Record<string, unknown>): BentoExportConfig {
  return {
    compactSpan: clampSpan(values["hover.compactSpan"]),
    gap: Math.max(8, Math.min(48, Math.round(Number(values["layout.gap"] ?? 16)))),
    hoverFocus: values["hover.enabled"] === true,
    hoverLift: Math.max(0, Math.min(20, Math.round(Number(values["hover.lift"] ?? 4)))),
    hoverSpan: clampSpan(values["hover.focusedSpan"]),
    minHeight: Math.max(160, Math.min(440, Math.round(Number(values["layout.cardHeight"] ?? 272)))),
    order: parseOrder(values["layout.order"]),
    spans: bentoServices.map((_, index) => clampSpan(values[`layout.span.${index}`] ?? bentoRestingSpans[index])),
    transitionMs: Math.max(80, Math.min(900, Math.round(Number(values["hover.duration"] ?? 420)))),
  };
}

export function buildExportPayload(values: Record<string, unknown>) {
  return JSON.stringify(readBentoConfig(values), null, 2);
}
