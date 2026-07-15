import {
  defineToolcraftPerformance,
  type ToolcraftPerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { bentoServices } from "./bento-model";

const responsiveTargets = [
  ["layout.variationActions", "Variations"],
  ["layout.order", "Order"],
  ...bentoServices.flatMap((service, index) => [
    [`layout.orderAction.${index}`, `${service.title} ${service.accent}`],
    [`layout.span.${index}`, `${service.title} ${service.accent}`],
  ]),
  ["layout.gap", "Gap"],
  ["layout.cardHeight", "Card height"],
  ["hover.enabled", "Focus"],
  ["hover.focusedSpan", "Focused span"],
  ["hover.compactSpan", "Other spans"],
  ["hover.lift", "Lift"],
  ["hover.duration", "Duration"],
  ["export.includeBackground", "Include"],
  ["appearance.background", "Background"],
  ["export.image.format", "Format"],
  ["export.image.resolution", "Resolution"],
] as const;

const responsivenessScenarios: ToolcraftPerformanceScenario[] = responsiveTargets.map(
  ([target, label]) => {
    const isSlider =
      target.startsWith("layout.span.") ||
      target === "layout.gap" ||
      target === "layout.cardHeight" ||
      target === "hover.focusedSpan" ||
      target === "hover.compactSpan" ||
      target === "hover.lift" ||
      target === "hover.duration";
    const isResolution = target === "export.image.resolution";

    return {
      automated: true,
      automatedTestName: `perf: ${target} responds quickly`,
      browser: true,
      browserTestName: `browser perf: ${target} responds quickly`,
      budget: { maxFrameGapMs: 80, maxInteractionMs: 400 },
      controlLabel: label,
      expectedObservable: `${target} updates the Bento Lab without freezing the controls or canvas.`,
      fixture: `${target} responsiveness fixture`,
      id: `${target.replaceAll(".", "-")}-responsiveness`,
      interaction: isSlider ? "control-drag" : "control-change",
      stressFixture: isResolution
        ? {
            kind: "custom",
            reason:
              "The 8K option is the heaviest export setting exposed by the Bento Lab.",
            value: { preset: "8k" },
          }
        : undefined,
      target,
      values: isResolution ? { default: "4k", max: "8k", min: "2k" } : undefined,
      workload: isResolution,
    };
  },
);

export const appPerformance: ToolcraftPerformanceConfig = defineToolcraftPerformance({
  browserCheckPolicy: {
    fallbackRunner: "playwright",
    fallbackWhen: ["agent-browser-unavailable", "ci"],
    preferredRunner: "agent-browser",
  },
  rendererPipeline: {
    interactionInvalidation: [
      {
        interaction: "control-change",
        invalidates: ["dom-preview"],
        targets: [
          "layout.variationActions",
          "layout.order",
          ...bentoServices.map((_, index) => `layout.orderAction.${index}`),
          "hover.enabled",
          "export.includeBackground",
          "appearance.background",
          "export.image.format",
          "export.image.resolution",
        ],
      },
      {
        interaction: "control-drag",
        invalidates: ["dom-preview"],
        targets: [
          ...bentoServices.map((_, index) => `layout.span.${index}`),
          "layout.gap",
          "layout.cardHeight",
          "hover.focusedSpan",
          "hover.compactSpan",
          "hover.lift",
          "hover.duration",
        ],
      },
      {
        interaction: "export",
        invalidates: ["image-export"],
        targets: ["actions.output", "export.image.format", "export.image.resolution"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: ["dom-preview", "image-export"],
        targets: ["canvas.zoom"],
      },
    ],
    passes: [
      {
        cacheKey: [
          "layout.order",
          "layout.span.*",
          "layout.gap",
          "layout.cardHeight",
          "hover.*",
          "appearance.background",
          "export.includeBackground",
        ],
        id: "dom-preview",
        inputs: ["bentoServices", "runtime.values"],
        invalidatedBy: [
          "layout.order",
          "layout.span.*",
          "layout.gap",
          "layout.cardHeight",
          "hover.*",
          "appearance.background",
          "export.includeBackground",
        ],
        kind: "composite",
        output: "preview",
        quality: "full",
        runsOn: "main",
      },
      {
        cacheKey: ["runtime.values", "export.image.format", "export.image.resolution"],
        id: "image-export",
        inputs: ["bentoServices", "runtime.values", "export.image.*"],
        invalidatedBy: ["actions.output", "export.image.format", "export.image.resolution"],
        kind: "export",
        output: "export",
        quality: "export",
        runsOn: "export-only",
      },
    ],
  },
  rendererStrategy: "dom",
  rendererTechnique: {
    exportRenderer: "canvas-2d",
    fidelityRisks: [
      "PNG/JPG export uses Canvas 2D and may not match browser font metrics pixel-for-pixel.",
    ],
    layers: [
      {
        content: ["text", "geometry"],
        exportMode: "included",
        id: "service-cards",
        kind: "product-foreground",
        primitiveCount: "low",
        renderer: "dom",
        uiSelector: "[data-toolcraft-product-output]",
      },
    ],
    performanceRisks: [
      "Hover focus reflows CSS grid columns, so slider drag and hover duration must stay responsive.",
      "8K image export increases output work and is tracked as the app workload target.",
    ],
    previewExportDifferenceReason:
      "The interactive preview is semantic DOM for editable text and hover behavior; image export is rendered to Canvas 2D only when the export action runs.",
    previewRenderer: "dom",
    productRepresentation: "mixed",
    rendererStrategy: "dom",
    rendererWorkload: "simple-composition",
    sourceRepresentation: "dom-text",
    whyNotAlternativeStrategies: [
      "SVG would add custom text wrapping without improving the tuning controls.",
      "Canvas 2D would make the preview less inspectable and less faithful for live text layout.",
      "WebGL/WebGPU are disproportionate for five static service cards and semantic text.",
    ],
  },
  rendererWorkload: "simple-composition",
  scenarios: [
    ...responsivenessScenarios,
    {
      automated: true,
      automatedTestName: "perf: bento preview renders quickly",
      browser: true,
      browserTestName: "browser perf: bento preview renders quickly",
      budget: { maxFrameGapMs: 80, maxLongTaskMs: 80, maxPreviewMs: 250 },
      expectedObservable:
        "The five-card DOM bento preview renders without long main-thread pauses.",
      fixture: "default five-service bento preview",
      id: "bento-preview-render",
      interaction: "preview-render",
      target: "layout.span.0",
      workload: false,
    },
    {
      automated: true,
      automatedTestName: "perf: canvas viewport stays stable",
      browser: true,
      browserTestName: "browser perf: canvas viewport stays stable",
      budget: { maxFrameGapMs: 80, maxInteractionMs: 300 },
      expectedObservable:
        "Zooming or moving the Toolcraft viewport does not recompose the bento cards.",
      fixture: "default viewport stability fixture",
      id: "bento-viewport-stability",
      interaction: "viewport-stability",
      target: "canvas.zoom",
      workload: false,
    },
    {
      actionValue: "copy.json",
      automated: true,
      automatedTestName: "perf: copy json completes quickly",
      browser: true,
      browserTestName: "browser perf: copy json completes quickly",
      budget: { maxExportMs: 350, maxInteractionMs: 350 },
      completionEvidence: "clipboard",
      controlLabel: "Copy JSON",
      expectedObservable: "Copy JSON writes the current bento configuration to the clipboard.",
      fixture: "bento copy fixture",
      id: "copy-json",
      interaction: "export-copy",
      target: "actions.output",
      values: { default: "copy.json", max: "copy.json", min: "copy.json" },
      workload: false,
    },
  ],
  usesCustomRenderer: true,
  workloadTargets: ["export.image.resolution"],
});
