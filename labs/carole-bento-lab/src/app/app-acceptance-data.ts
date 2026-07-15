import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";

import { bentoServices } from "./bento-model";

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
};

export const appProductReadiness: ToolcraftProductReadiness = {
  mode: "product",
  productName: "Carole Bento Lab",
  productSummary:
    "A Toolcraft composition lab for tuning the Services bento grid before baking values into the Carole portfolio.",
  requestedBehavior:
    "Users can test one-to-four-row bento presets, randomize card widths and order, manually move services, tune hover behavior, export PNG, and copy the final JSON.",
};

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Bento service order",
    groupingReason:
      "These controls change card sequence and variation presets for the same services grid.",
    targets: [
      "layout.variationActions",
      "layout.order",
      ...bentoServices.map((_, index) => `layout.orderAction.${index}`),
    ],
    title: "Order",
  },
  {
    entity: "Bento card widths",
    groupingReason:
      "Each slider edits one service column span in the same twelve-column grid.",
    targets: bentoServices.map((_, index) => `layout.span.${index}`),
    title: "Widths",
  },
  {
    entity: "Bento cards",
    groupingReason:
      "These controls tune shared card spacing and vertical size.",
    targets: ["layout.gap", "layout.cardHeight"],
    title: "Cards",
  },
  {
    entity: "Hover focus behavior",
    groupingReason:
      "These controls tune the optional focus behavior applied while hovering cards.",
    targets: [
      "hover.enabled",
      "hover.focusedSpan",
      "hover.compactSpan",
      "hover.lift",
      "hover.duration",
    ],
    title: "Hover",
  },
  {
    entity: "Output background",
    groupingReason:
      "These controls set preview and export background behavior.",
    targets: ["export.includeBackground", "appearance.background"],
    title: "Background",
  },
  {
    entity: "Image export settings",
    groupingReason:
      "These controls configure PNG/JPG output format and resolution.",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
  },
] as const;

function controlRow(
  target: string,
  componentType: string,
  expectedObservable = `${target} changes the bento preview.`,
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: `${target} changes product output`,
    browser: true,
    browserTestName: `browser: ${target} changes product output`,
    componentType,
    evidence: "product-output",
    expectedObservable,
    fixture: `${target} fixture`,
    id: target,
    kind: "control",
    target,
    userAction: `Change ${target}.`,
  };
}

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    ...controlRow("layout.variationActions", "actions", "Preset and randomize actions update service widths or order."),
    actionCoverage: [
      "preset.rows.1",
      "preset.rows.2",
      "preset.rows.3",
      "preset.rows.4",
      "layout.randomize",
    ],
    evidence: "command-side-effect",
  },
  controlRow("layout.order", "text", "Manual order text changes visible card positions."),
  ...bentoServices.map((_, index) => ({
    ...controlRow(`layout.orderAction.${index}`, "actions", "Up/Down actions change visible card order."),
    actionCoverage: [`order.${index}.up`, `order.${index}.down`],
    evidence: "command-side-effect" as const,
  })),
  ...bentoServices.map((_, index) =>
    controlRow(`layout.span.${index}`, "slider", "Changing a span changes the matching service card width."),
  ),
  controlRow("layout.gap", "slider", "Changing Gap changes spacing between cards."),
  controlRow("layout.cardHeight", "slider", "Changing Card height changes the visible card height."),
  controlRow("hover.enabled", "switch", "Turning Focus on reveals and enables hover tuning controls."),
  {
    ...controlRow("hover.focusedSpan", "slider", "Focused span is visible only when Focus is on."),
    visibilityCoverage: ["hidden", "visible"],
  },
  {
    ...controlRow("hover.compactSpan", "slider", "Other spans is visible only when Focus is on."),
    visibilityCoverage: ["hidden", "visible"],
  },
  {
    ...controlRow("hover.lift", "slider", "Lift is visible only when Focus is on."),
    visibilityCoverage: ["hidden", "visible"],
  },
  {
    ...controlRow("hover.duration", "slider", "Duration is visible only when Focus is on."),
    visibilityCoverage: ["hidden", "visible"],
  },
  {
    ...controlRow("export.includeBackground", "switch", "Include background controls preview and PNG background."),
    backgroundOutputCoverage: ["preview-hidden-when-excluded", "image-transparent-when-excluded"],
  },
  controlRow("appearance.background", "color", "Background color changes preview and export background."),
  {
    ...controlRow("export.image.format", "select", "Format changes exported image MIME type."),
    optionCoverage: ["png", "jpg"],
  },
  {
    ...controlRow("export.image.resolution", "select", "Resolution changes exported image dimensions."),
    optionCoverage: ["2k", "4k", "8k"],
  },
  {
    automated: true,
    automatedTestName: "actions.output exports and copies bento output",
    browser: true,
    browserTestName: "browser: actions.output exports and copies bento output",
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Copy JSON writes the bento config and Export PNG downloads non-empty image bytes.",
    fixture: "bento output fixture",
    id: "actions.output",
    kind: "control",
    target: "actions.output",
    userAction: "Click Copy JSON and Export PNG.",
    actionCoverage: ["copy.json", "export.png"],
  },
  {
    automated: true,
    automatedTestName: "bento settings persist after reload",
    browser: true,
    browserTestName: "browser: bento settings persist after reload",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable: "A changed bento setting is restored after page reload.",
    fixture: "bento persistence fixture",
    id: "persistence.values",
    kind: "runtime",
    persistenceCoverage: "reload",
    target: "layout.gap",
    userAction: "Change Gap, reload, and observe restored value.",
  },
];
