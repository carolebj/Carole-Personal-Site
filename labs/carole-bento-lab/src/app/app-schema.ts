import {
  defineToolcraft,
  type ToolcraftControlSchema,
} from "@/toolcraft/runtime";

import {
  bentoPresetSpans,
  bentoRestingSpans,
  bentoServices,
  serializeOrder,
} from "./bento-model";

const spanControls = Object.fromEntries(
  bentoServices.map((service, index) => [
    `span${index}`,
    {
      defaultValue: bentoRestingSpans[index] ?? 6,
      label: `${service.title} ${service.accent}`,
      max: 12,
      min: 2,
      orderRole: "primary",
      performanceReason:
        "Changing a service span reflows the visible bento preview and must stay live while tuning.",
      performanceRole: "responsiveness",
      sliderValueKind: "discrete",
      step: 1,
      target: `layout.span.${index}`,
      type: "slider",
      unit: "cols",
      variant: "discrete",
    },
  ]),
) as Record<string, ToolcraftControlSchema>;

const serviceOrderActions = Object.fromEntries(
  bentoServices.map((service, index) => [
    `order${index}`,
    {
      actions: [
        {
          icon: "rotate-ccw",
          label: "Up",
          value: `order.${index}.up`,
        },
        {
          icon: "rotate-ccw",
          label: "Down",
          value: `order.${index}.down`,
        },
      ],
      label: `${service.title} ${service.accent}`,
      orderRole: "action",
      performanceReason:
        "Ordering changes the placement of the card in the product preview without changing renderer complexity.",
      performanceRole: "responsiveness",
      target: `layout.orderAction.${index}`,
      type: "actions",
    },
  ]),
) as Record<string, ToolcraftControlSchema>;

export const appSchema = defineToolcraft({
  canvas: {
    draggable: true,
    enabled: true,
    size: { height: 1080, unit: "px", width: 1920 },
    sizing: { mode: "editable-output" },
  },
  export: {
    png: { background: "transparent" },
  },
  panels: {
    controls: {
      sections: [
        {
          controls: {
            variations: {
              actions: [
                { icon: "wand-sparkles", label: "1 row", value: "preset.rows.1" },
                { icon: "wand-sparkles", label: "2 rows", value: "preset.rows.2" },
                { icon: "wand-sparkles", label: "3 rows", value: "preset.rows.3" },
                { icon: "wand-sparkles", label: "4 rows", value: "preset.rows.4" },
                { icon: "shuffle", label: "Randomize", value: "layout.randomize" },
              ],
              label: "Variations",
              orderRole: "action",
              performanceReason:
                "Variation actions update multiple layout values and immediately redraw the bento preview.",
              performanceRole: "responsiveness",
              target: "layout.variationActions",
              type: "actions",
            },
            order: {
              commitMode: "content",
              defaultValue: serializeOrder([0, 1, 2, 3, 4]),
              description:
                "Comma-separated service indexes. Use this for exact manual placement after trying Up/Down and Randomize.",
              label: "Order",
              orderRole: "input",
              performanceReason:
                "Manual order edits reorder product cards and must remain responsive for quick layout tests.",
              performanceRole: "responsiveness",
              target: "layout.order",
              textValueKind: "single-line",
              type: "text",
            },
            ...serviceOrderActions,
          },
          title: "Order",
        },
        {
          controls: spanControls,
          title: "Widths",
        },
        {
          controls: {
            gap: {
              defaultValue: 16,
              label: "Gap",
              max: 48,
              min: 8,
              orderRole: "spatial",
              performanceReason:
                "Gap changes preview layout density and should update during tuning without stutter.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: "layout.gap",
              type: "slider",
              unit: "px",
            },
            cardHeight: {
              defaultValue: 272,
              label: "Card height",
              max: 440,
              min: 160,
              orderRole: "spatial",
              performanceReason:
                "Card height changes the preview layout but keeps a small fixed card count.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 4,
              target: "layout.cardHeight",
              type: "slider",
              unit: "px",
            },
          },
          title: "Cards",
        },
        {
          controls: {
            enabled: {
              defaultValue: false,
              label: "Focus",
              orderRole: "mode",
              performanceReason:
                "Hover focus toggles the preview behavior and should not destabilize the canvas viewport.",
              performanceRole: "responsiveness",
              target: "hover.enabled",
              type: "switch",
            },
            focusedSpan: {
              defaultValue: 8,
              label: "Focused span",
              max: 12,
              min: 2,
              orderRole: "primary",
              performanceReason:
                "Focused span changes card widths when hover focus is enabled.",
              performanceRole: "responsiveness",
              sliderValueKind: "discrete",
              step: 1,
              target: "hover.focusedSpan",
              type: "slider",
              unit: "cols",
              variant: "discrete",
              visibleWhen: { equals: true, target: "hover.enabled" },
            },
            compactSpan: {
              defaultValue: 4,
              label: "Other spans",
              max: 12,
              min: 2,
              orderRole: "primary",
              performanceReason:
                "Compact span changes non-focused card widths when hover focus is enabled.",
              performanceRole: "responsiveness",
              sliderValueKind: "discrete",
              step: 1,
              target: "hover.compactSpan",
              type: "slider",
              unit: "cols",
              variant: "discrete",
              visibleWhen: { equals: true, target: "hover.enabled" },
            },
            lift: {
              defaultValue: 4,
              label: "Lift",
              max: 20,
              min: 0,
              orderRole: "spatial",
              performanceReason:
                "Lift controls hover translation and must remain smooth because it is a direct interaction tuning value.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: "hover.lift",
              type: "slider",
              unit: "px",
              visibleWhen: { equals: true, target: "hover.enabled" },
            },
            duration: {
              defaultValue: 420,
              label: "Duration",
              max: 900,
              min: 80,
              orderRole: "strength",
              performanceReason:
                "Duration affects CSS transitions only and should not block live tuning.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 20,
              target: "hover.duration",
              type: "slider",
              unit: "ms",
              visibleWhen: { equals: true, target: "hover.enabled" },
            },
          },
          title: "Hover",
        },
        {
          controls: {
            includeBackground: {
              defaultValue: true,
              label: "Include",
              orderRole: "mode",
              performanceReason:
                "Background inclusion changes preview/export compositing without renderer workload growth.",
              performanceRole: "responsiveness",
              target: "export.includeBackground",
              type: "switch",
            },
            background: {
              defaultValue: "#f6f3f2",
              label: false,
              orderRole: "color",
              performanceReason:
                "Background color updates the preview and export background.",
              performanceRole: "responsiveness",
              target: "appearance.background",
              type: "color",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["includeBackground", "background"],
              layout: "inline",
            },
          ],
          title: "Background",
        },
        {
          controls: {
            format: {
              defaultValue: "png",
              label: "Format",
              options: [
                { label: "PNG", value: "png" },
                { label: "JPG", value: "jpg" },
              ],
              orderRole: "mode",
              performanceReason:
                "Format changes the export command output type only.",
              performanceRole: "responsiveness",
              target: "export.image.format",
              type: "select",
            },
            resolution: {
              defaultValue: "4k",
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              orderRole: "mode",
              performanceReason:
                "Resolution changes export workload and is tested through the export path.",
              performanceRole: "workload",
              target: "export.image.resolution",
              type: "select",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["format", "resolution"],
              layout: "inline",
            },
          ],
          title: "Image Export",
        },
        {
          controls: {
            outputActions: {
              actions: [
                {
                  icon: "copy",
                  label: "Copy JSON",
                  role: "copy-output",
                  value: "copy.json",
                },
                {
                  icon: "upload-simple",
                  label: "Export PNG",
                  role: "export-image",
                  value: "export.png",
                },
              ],
              target: "actions.output",
              type: "panelActions",
            },
          },
          title: "Output",
        },
      ],
      title: "Bento Lab",
    },
  },
  persistence: {
    include: ["values", "canvas", "panels"],
    key: "toolcraft:carole-bento-lab:state:v2",
    storage: "localStorage",
    version: 2,
  },
  settingsTransfer: {
    appId: "carole-bento-lab",
    enabled: "auto",
    fileName: "carole-bento-lab-settings",
  },
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
