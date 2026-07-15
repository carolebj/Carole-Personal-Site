# Implementation Worklog

This file records product decisions and the evidence behind them. Keep it short, factual, and current.

## Status

Mode: product

Carole Bento Lab is a standalone Toolcraft app for composing the Services bento grid before values are baked into the Carole portfolio.

## Decision Trail

### Iteration 1 — Services Bento Lab

- Request: Build a Toolcraft-based environment for testing several bento grid variations, randomization, row counts, service ordering, hover behavior, and exported values.
- Task type: Generated Toolcraft product app with schema controls, DOM canvas output, copy/export actions, acceptance data, and performance matrix.
- User-visible result: The canvas renders the five real service cards; the controls panel exposes 1-4 row presets, Randomize, manual order, Up/Down actions per service, width sliders, card spacing/height, optional hover focus settings, background, image export, Copy JSON, and Export PNG.
- Source/reference checked: Existing Carole services content in the active portfolio thread and the generated Toolcraft local contracts.
- Reference inputs: User request in the current Codex task; no Figma URL, video, GIF, or uploaded media was used.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/setup-export.md`, `core/media-upload.md`, `core/performance.md`, `renderer-technique.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `performance.md`, `custom-controls.md`.
- Contract rules applied: Build through `defineToolcraft`; keep product output inside `canvasContent`; use schema controls before custom controls; keep product CSS in a module; keep layers/timeline disabled; expose background and image export sections; expose sticky product actions; keep persistence in runtime schema.
- Decision: Use DOM/CSS grid for the product preview and Canvas 2D only for PNG export generation. Use built-in schema controls and actions instead of a custom reorder control for the first working version.
- Alternatives rejected: Patching the portfolio tuning panel further was rejected because Toolcraft gives a cleaner isolated lab. A custom drag-and-drop reorder control was deferred because built-in actions plus an editable order field cover the current need with less Toolcraft surface risk.
- State/output mapping: `layout.order`, `layout.span.*`, `layout.gap`, `layout.cardHeight`, `hover.*`, `appearance.background`, and `export.*` live in Toolcraft runtime values. `BentoCanvas` reads those values and renders visible cards. Panel actions dispatch runtime `controls.setValue`, copy JSON from runtime values, or export PNG via `createToolcraftPngExportCanvas`.
- Files changed: `src/app/app-schema.ts`, `src/app/app-composition.tsx`, `src/app/bento-model.ts`, `src/app/bento-canvas.tsx`, `src/app/bento-canvas.module.css`, `src/app/bento-export.ts`, `src/app/app-acceptance-data.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `docs/toolcraft/agent-worklog.md`.
- Verification: `npm run typecheck` passed; `npm run build` passed; `npm run ai:check` passed. `npm run test` was attempted with escalation and is currently blocked by a generated protected script test that expects missing skills even though Toolcraft skills are installed. Product Vitest was run directly and used to identify remaining contract corrections.
- Skipped checks: `npm run verify:perf`, `npm run verify:final`, and browser Playwright gates are pending until the generated protected script test mismatch is resolved or bypassed by an upstream Toolcraft fix.
- Risks: Risk: generated Toolcraft test suite contains a protected check-ai-skills expectation that conflicts with installed local skills in this environment; do not patch protected framework tests inside the generated app.

## Decisions

### Renderer

- Decision: DOM/CSS grid preview with Canvas 2D PNG export.
- Reason: The product output is five low-count text/vector-like service cards; DOM preserves text fidelity and is sufficient for responsive tuning.
- Evidence: `src/app/bento-canvas.tsx`, `src/app/bento-canvas.module.css`, `src/app/bento-export.ts`, `npm run typecheck`, `npm run build`.

### Timeline

- Decision: No timeline.
- Reason: The lab tunes static layout and hover parameters; it does not create video or timeline animation.
- Evidence: `panels.timeline` omitted in `src/app/app-schema.ts`; `appTransferMode.animationIntent.mode` is `none`.

### Layers

- Decision: No layers.
- Reason: Service cards are fixed product entities tuned as a single output, not editable layer objects.
- Evidence: `panels.layers` omitted in `src/app/app-schema.ts`.

### Controls

- Decision: Built-in actions, text, sliders, switch, color, select, and panelActions.
- Reason: The required value models map cleanly to built-ins. Order is represented by an editable comma-separated field plus Up/Down actions to avoid a custom control in the first version.
- Evidence: `src/app/app-schema.ts`, `src/app/app-acceptance-data.ts`, `npm run typecheck`.

### Export

- Decision: Sticky Copy JSON and Export PNG.
- Reason: The immediate workflow is to transfer a JSON config back into the portfolio and optionally capture a visual proof.
- Evidence: `src/app/app-composition.tsx`, `src/app/bento-export.ts`, `npm run build`.

### Performance

- Decision: Lightweight responsiveness scenarios for visible controls; no full performance receipt yet.
- Reason: The app renders five static DOM cards and does not perform heavy pixel work. Full Toolcraft performance checkpoint remains required for final Toolcraft delivery but is blocked by the protected generated script issue noted above.
- Evidence: `src/app/app-performance.ts`, `npm run ai:check`, `npm run build`.

## Evidence

- Source reviewed: existing services content and local Toolcraft contracts.
- Contract applied: generated app product mode, runtime boundaries, schema-owned controls, local CSS modules, static no-timeline output.

## Verification

- Passed: `npm run typecheck`.
- Passed: `npm run build`.
- Passed: `npm run ai:check`.
- Attempted: `npm run test` with escalation; blocked by protected generated `check-ai-skills.test.mjs` mismatch after skills were installed.
- Pending: `pnpm verify:perf` equivalent for this npm project is `npm run verify:perf`; not run yet.
- Pending: `npm run verify:final`; blocked until the protected generated test mismatch is resolved.

## Risks

- Risk: Toolcraft generated protected tests may need an upstream fix for environments where optional skills are installed.
- Risk: First version uses Up/Down and order text instead of drag-and-drop ordering; this is sufficient for immediate composition but less tactile than a later custom reorder control.
