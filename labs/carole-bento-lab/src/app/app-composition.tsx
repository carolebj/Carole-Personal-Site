import {
  createToolcraftPngExportCanvas,
  shouldIncludeToolcraftPreviewBackground,
} from "@/toolcraft/runtime";
import type {
  ToolcraftAppComposition,
  ToolcraftPanelActionHandler,
} from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { BentoCanvas } from "./bento-canvas";
import { renderBentoPng } from "./bento-export";
import {
  bentoPresetSpans,
  bentoServices,
  buildExportPayload,
  moveOrderItem,
  randomizeSpans,
  serializeOrder,
  shuffleOrder,
} from "./bento-model";

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("The Bento Lab export did not produce image bytes."));
      },
      type,
      quality,
    );
  });
}

const onPanelAction: ToolcraftPanelActionHandler = async ({
  action,
  dispatch,
  reportProgress,
  state,
}) => {
  if (action.value.startsWith("preset.rows.")) {
    const rows = Number(action.value.replace("preset.rows.", ""));
    const spans = bentoPresetSpans[rows] ?? bentoPresetSpans[3] ?? [];
    spans.forEach((span, index) => {
      dispatch({
        historyGroup: "bento-preset",
        label: `${rows} row preset`,
        target: `layout.span.${index}`,
        type: "controls.setValue",
        value: span,
      });
    });
    return;
  }

  if (action.value === "layout.randomize") {
    randomizeSpans().forEach((span, index) => {
      dispatch({
        historyGroup: "bento-randomize",
        label: "Randomize widths",
        target: `layout.span.${index}`,
        type: "controls.setValue",
        value: span,
      });
    });
    dispatch({
      historyGroup: "bento-randomize",
      label: "Randomize order",
      target: "layout.order",
      type: "controls.setValue",
      value: serializeOrder(shuffleOrder()),
    });
    return;
  }

  const orderMatch = /^order\.(\d+)\.(up|down)$/.exec(action.value);
  if (orderMatch) {
    const serviceIndex = Number(orderMatch[1]);
    const direction = orderMatch[2] === "up" ? -1 : 1;
    dispatch({
      label: `Move ${bentoServices[serviceIndex]?.title ?? "service"}`,
      target: "layout.order",
      type: "controls.setValue",
      value: moveOrderItem(state.values["layout.order"], serviceIndex, direction),
    });
    return;
  }

  if (action.value === "copy.json") {
    await navigator.clipboard.writeText(buildExportPayload(state.values));
    return;
  }

  if (action.value === "export.png") {
    reportProgress(0.2);
    const background =
      typeof state.values["appearance.background"] === "string"
        ? state.values["appearance.background"]
        : "#f6f3f2";
    const format = state.values["export.image.format"] === "jpg" ? "image/jpeg" : "image/png";
    const includeBackground = shouldIncludeToolcraftPreviewBackground({ state });
    const canvas = createToolcraftPngExportCanvas({
      background,
      includeBackground,
      render: (renderContext) => renderBentoPng(renderContext, state.values),
      resolution: String(state.values["export.image.resolution"] ?? "4k"),
      state,
    });
    reportProgress(0.7);
    const blob = await canvasToBlob(canvas, format, 0.92);
    downloadBlob(blob, `carole-bento-lab.${format === "image/jpeg" ? "jpg" : "png"}`);
    reportProgress(1);
  }
};

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <BentoCanvas />,
  onPanelAction,
  renderDefaultCanvasMedia: false,
  schema: appSchema,
};
