import { describe, expect, it } from "vitest";

import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

describe("appSchema", () => {
  it("publishes the Carole Bento Lab Toolcraft contract", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.toolbar).toEqual({
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    });
    expect(appSchema.assembly.components).toEqual([
      "canvas",
      "controlsPanel",
      "toolbar",
    ]);
  });

  it("exposes bento composition sections and sticky output actions", () => {
    const sectionTitles = appSchema.panels.controls?.sections.map((section) => section.title);
    expect(sectionTitles).toEqual([
      "Setup",
      "Order",
      "Widths",
      "Cards",
      "Hover",
      "Background",
      "Image Export",
      "Export",
    ]);
    const outputActions = appSchema.panels.controls?.sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.target === "actions.output");

    expect(outputActions).toMatchObject({
      target: "actions.output",
      type: "panelActions",
    });
  });

  it("keeps the app static and declares performance scenarios for visible controls", () => {
    expect(appSchema.assembly.capabilities).not.toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appPerformance.scenarios.length).toBeGreaterThan(10);
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.rendererStrategy).toBe("dom");
  });
});
