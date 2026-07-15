import type { ToolcraftPngRenderContext } from "@/toolcraft/runtime/export";

import { bentoServices, readBentoConfig } from "./bento-model";

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = candidate;
    }
  }

  if (line) {
    context.fillText(line, x, currentY);
  }
}

export function renderBentoPng(context: ToolcraftPngRenderContext, values: Record<string, unknown>) {
  const config = readBentoConfig(values);
  const columns = 12;
  const padding = 56;
  const availableWidth = context.cssWidth - padding * 2;
  const columnGap = config.gap;
  const columnWidth = (availableWidth - columnGap * (columns - 1)) / columns;
  const rowHeights: number[] = [];
  const placements = bentoServices.map((service, index) => {
    const position = config.order.indexOf(index);
    const span = config.spans[index] ?? 6;
    const previous = bentoServices
      .map((_, previousIndex) => previousIndex)
      .filter((previousIndex) => config.order.indexOf(previousIndex) < position);
    let row = 0;
    let usedColumns = 0;

    for (const previousIndex of previous) {
      const previousSpan = config.spans[previousIndex] ?? 6;
      if (usedColumns + previousSpan > columns) {
        row += 1;
        usedColumns = 0;
      }
      usedColumns += previousSpan;
    }

    if (usedColumns + span > columns) {
      row += 1;
      usedColumns = 0;
    }

    rowHeights[row] = Math.max(rowHeights[row] ?? 0, config.minHeight);
    return {
      height: config.minHeight,
      index,
      row,
      service,
      span,
      x: padding + usedColumns * (columnWidth + columnGap),
      y: padding + row * (config.minHeight + columnGap),
      width: span * columnWidth + (span - 1) * columnGap,
    };
  });

  for (const placement of placements) {
    const { context: ctx } = context;
    ctx.save();
    ctx.fillStyle = "#fffdfa";
    ctx.strokeStyle = "rgba(133,77,99,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(placement.x, placement.y, placement.width, placement.height, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffd9e4";
    ctx.beginPath();
    ctx.arc(placement.x + 52, placement.y + 52, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#854d63";
    ctx.font = "700 18px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(placement.index + 1), placement.x + 52, placement.y + 52);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#1c1b1b";
    ctx.font = "42px Georgia, serif";
    ctx.fillText(placement.service.title, placement.x + 34, placement.y + 146);
    ctx.fillStyle = "#854d63";
    ctx.font = "italic 42px Georgia, serif";
    ctx.fillText(placement.service.accent, placement.x + 34, placement.y + 194);

    ctx.fillStyle = "#4f4a49";
    ctx.font = "22px Inter, system-ui, sans-serif";
    drawWrappedText(
      ctx,
      placement.service.description,
      placement.x + 34,
      placement.y + 256,
      placement.width - 68,
      34,
    );
    ctx.restore();
  }
}
