# 001 — Smooth Service Bento Hover

- **Status**: DONE
- **Commit**: db1a96b
- **Severity**: HIGH
- **Category**: Easing & duration, Performance, Accessibility
- **Estimated scope**: 2 files, small focused change

## Implementation Note

Implemented with two explicit bento rows and per-row `grid-template-columns` interpolation. The earlier single-grid `grid-template-columns` approach was rejected because it collapsed the bento into five fixed columns, and the Motion FLIP wrapper was rejected because it visually scaled text during layout changes.

## Problem

The Services bento now uses the correct resting and hover layouts, but the layout change is not smooth because the card widths are controlled by Tailwind `lg:col-span-*` classes. A `grid-column` span change is discrete; the browser cannot interpolate it into a fluid width morph.

```tsx
// src/app/pages/Home.tsx:107-124 — current validated layout data
const DEFAULT_SERVICE_BENTO_TUNING: ServiceBentoTuning = {
  spans: [6, 6, 3, 5, 4],
  order: [0, 1, 2, 3, 4],
  hoverFocus: false,
  hoverSpan: 8,
  compactSpan: 4,
  hoverLift: 4,
  transitionMs: 420,
  minHeight: 272,
  gap: 16,
};
const SERVICE_BENTO_HOVER_SPANS: Record<number, number[]> = {
  0: [8, 4, 4, 4, 4],
  1: [4, 8, 4, 4, 4],
  2: [6, 6, 6, 3, 3],
  3: [6, 6, 3, 6, 3],
  4: [6, 6, 3, 3, 6],
};
```

```tsx
// src/app/pages/Home.tsx:1731-1759 — current
<div
  className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12 lg:[grid-auto-flow:dense]"
  style={{ gap: `${serviceBentoTuning.gap}px` }}
>
  {services.map((service, index) => {
    const icon = serviceIcons[index] ?? brandFlagIcon;
    const accent = homeServiceAccents[index] ?? homeServiceAccents[0];
    const isFocusedService = focusedServiceIndex === index;
    const hoverSpans = focusedServiceIndex !== null ? SERVICE_BENTO_HOVER_SPANS[focusedServiceIndex] : null;
    const span = hoverSpans?.[index] ?? serviceBentoTuning.spans[index] ?? 6;
    const spanClass = serviceBentoSpanClasses[span] ?? serviceBentoSpanClasses[6];
    return (
      <Link
        to={`/services/${service.slug}`}
        key={`${service.title}-${service.accent}`}
        onMouseEnter={() => setFocusedServiceIndex(index)}
        onMouseLeave={() => setFocusedServiceIndex(null)}
        onFocus={() => setFocusedServiceIndex(index)}
        onBlur={() => setFocusedServiceIndex(null)}
        className={`t-resize group relative overflow-hidden rounded-lg border border-border-accent/25 bg-white p-6 text-left no-underline shadow-[0_1px_2px_rgba(28,27,27,0.04)] transition-[transform,box-shadow,border-color] ease-[cubic-bezier(.2,.8,.2,1)] hover:shadow-[0_18px_42px_rgba(28,27,27,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#854d63] dark:border-[#d8a4c7]/16 dark:bg-surface-panel dark:hover:border-[#d8a4c7]/28 dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:p-7 ${spanClass}`}
        style={{
          minHeight: `${serviceBentoTuning.minHeight}px`,
          transitionDuration: `${serviceBentoTuning.transitionMs}ms`,
          transform:
            focusedServiceIndex !== null && isFocusedService
              ? `translateY(-${serviceBentoTuning.hoverLift}px)`
              : undefined,
          order: serviceBentoTuning.order.indexOf(index),
        }}
      >
```

The current `420ms` transition is also above the UI budget from the animation audit rules. This hover is a frequent interaction; it should be responsive and under 300ms. The existing code animates transform and shadow, but the main visual change still jumps because width is not animated.

## Target

Keep the exact validated layouts:

- resting spans: `[6, 6, 3, 5, 4]`
- hover Strategy: `[8, 4, 4, 4, 4]`
- hover Communication: `[4, 8, 4, 4, 4]`
- hover Creation: `[6, 6, 6, 3, 3]`
- hover Audit: `[6, 6, 3, 6, 3]`
- hover Identity: `[6, 6, 3, 3, 6]`

Change the desktop bento from a 12-column span grid to a 5-track interpolated grid:

```tsx
// target behavior
const activeServiceBentoSpans =
  focusedServiceIndex !== null
    ? SERVICE_BENTO_HOVER_SPANS[focusedServiceIndex]
    : serviceBentoTuning.spans;

const serviceBentoGridTemplateColumns = activeServiceBentoSpans
  .map((span) => `${span}fr`)
  .join(" ");
```

Use these exact motion values:

```css
--service-bento-layout-dur: 260ms;
--service-bento-layout-ease: cubic-bezier(0.77, 0, 0.175, 1);
--service-bento-hover-dur: 180ms;
--service-bento-hover-ease: cubic-bezier(0.23, 1, 0.32, 1);
```

At desktop size, the grid container should animate `grid-template-columns`:

```tsx
style={{
  gap: `${serviceBentoTuning.gap}px`,
  transition: reduceMotion
    ? "none"
    : "grid-template-columns var(--service-bento-layout-dur) var(--service-bento-layout-ease)",
  gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
}}
```

Because inline styles cannot express media queries, add a CSS class in `src/styles/global.css` or another existing global stylesheet:

```css
@media (min-width: 1024px) {
  .service-bento-grid {
    grid-template-columns: var(--service-bento-columns);
    transition: grid-template-columns var(--service-bento-layout-dur) var(--service-bento-layout-ease);
  }
}

@media (prefers-reduced-motion: reduce) {
  .service-bento-grid {
    transition: none;
  }
}
```

Then set the dynamic columns through a CSS variable:

```tsx
style={{
  "--service-bento-columns": serviceBentoGridTemplateColumns,
  gap: `${serviceBentoTuning.gap}px`,
} as React.CSSProperties}
```

Each card should always occupy one track on desktop instead of changing `lg:col-span-*`:

```tsx
className="t-resize group relative overflow-hidden rounded-lg ... lg:col-span-1"
```

Use the shorter hover transform/shadow duration:

```tsx
style={{
  minHeight: `${serviceBentoTuning.minHeight}px`,
  transitionDuration: "var(--service-bento-hover-dur)",
  transitionTimingFunction: "var(--service-bento-hover-ease)",
  transform:
    !reduceMotion && focusedServiceIndex !== null && isFocusedService
      ? `translateY(-${serviceBentoTuning.hoverLift}px)`
      : undefined,
  order: serviceBentoTuning.order.indexOf(index),
}}
```

## Repo conventions to follow

- Motion tokens already live in `src/styles/tokens.css`.
- Existing transition tokens use CSS custom properties in `:root`, for example:

```css
/* src/styles/tokens.css:23-25 */
/* Card resize */
--resize-dur: 300ms;
--resize-ease: cubic-bezier(0.22, 1, 0.36, 1);
```

- The Home page already has access to `reduceMotion` via `useReducedMotion()` and uses inline style branches for motion-sensitive output.
- The codebase uses Tailwind utility classes for layout and only uses global CSS tokens where the motion needs to be shared or media-query driven.

## Steps

1. In `src/styles/tokens.css`, add these variables inside `:root`, near the existing card resize tokens:

```css
/* Service bento hover layout */
--service-bento-layout-dur: 260ms;
--service-bento-layout-ease: cubic-bezier(0.77, 0, 0.175, 1);
--service-bento-hover-dur: 180ms;
--service-bento-hover-ease: cubic-bezier(0.23, 1, 0.32, 1);
```

2. In `src/styles/global.css`, add the desktop/reduced-motion rules. If this file already has a utilities layer, place the rules in that layer; otherwise append near related component-level rules:

```css
@media (min-width: 1024px) {
  .service-bento-grid {
    grid-template-columns: var(--service-bento-columns);
    transition: grid-template-columns var(--service-bento-layout-dur) var(--service-bento-layout-ease);
  }
}

@media (prefers-reduced-motion: reduce) {
  .service-bento-grid {
    transition: none;
  }
}
```

3. In `src/app/pages/Home.tsx`, before the `return`, compute the active column template after the service handlers:

```tsx
const activeServiceBentoSpans =
  focusedServiceIndex !== null
    ? SERVICE_BENTO_HOVER_SPANS[focusedServiceIndex]
    : serviceBentoTuning.spans;
const serviceBentoGridTemplateColumns = activeServiceBentoSpans
  .map((span) => `${span}fr`)
  .join(" ");
```

4. In `src/app/pages/Home.tsx`, update the Services grid wrapper from:

```tsx
className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12 lg:[grid-auto-flow:dense]"
style={{ gap: `${serviceBentoTuning.gap}px` }}
```

to:

```tsx
className="service-bento-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-none"
style={{
  "--service-bento-columns": serviceBentoGridTemplateColumns,
  gap: `${serviceBentoTuning.gap}px`,
} as React.CSSProperties}
```

5. In the `services.map` block, remove `hoverSpans`, `span`, `spanClass`, and the `serviceBentoSpanClasses` dependency from the card class. The card width should be controlled by the grid track it occupies, not by `lg:col-span-*`.

6. Still in the card class, add `lg:col-span-1`. Keep the existing visual classes, shadow classes, focus classes, and dark-mode classes unchanged.

7. In the card inline style, replace the transition fields with:

```tsx
transitionDuration: "var(--service-bento-hover-dur)",
transitionTimingFunction: "var(--service-bento-hover-ease)",
transform:
  !reduceMotion && focusedServiceIndex !== null && isFocusedService
    ? `translateY(-${serviceBentoTuning.hoverLift}px)`
    : undefined,
```

Keep:

```tsx
minHeight: `${serviceBentoTuning.minHeight}px`,
order: serviceBentoTuning.order.indexOf(index),
```

8. Remove `serviceBentoSpanClasses` if it is no longer referenced. Do not remove `SERVICE_BENTO_HOVER_SPANS` or the validated spans.

9. Optional but recommended: update the Toolcraft lab canvas with the same track-template approach so future tuning previews match the site. Scope this to:

- `labs/carole-bento-lab/src/app/bento-canvas.tsx`
- `labs/carole-bento-lab/src/app/bento-canvas.module.css`

Use the same duration/ease values and keep the same layout JSON.

## Boundaries

- Do NOT change the validated resting or hover span arrays.
- Do NOT change service copy, service order, links, icons, colors, shadows, or card content.
- Do NOT touch testimonial behavior.
- Do NOT re-enable the in-site tuning panel; Toolcraft remains the tuning environment.
- Do NOT add a new animation library or dependency.
- If `src/app/pages/Home.tsx` has drifted and the Services block no longer matches the excerpts above, STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - Run `git diff --check -- src/app/pages/Home.tsx src/styles/tokens.css src/styles/global.css`.
  - Run `npm run typecheck`. If it still fails on unrelated `src/app/pages/ClientBrief.tsx(326,36): Cannot find name 'confirmPrefill'`, record that as unrelated and continue with the targeted checks.
  - If the Toolcraft lab is touched, run `npm run typecheck` and `npm run build` in `labs/carole-bento-lab`.

- **Feel check**:
  - Open the site at the current local preview.
  - Hover each service card slowly. Confirm the exact validated layouts appear, but widths glide instead of snapping.
  - Move the pointer quickly across several cards. Confirm the animation retargets from the current position and does not restart with a visible jump.
  - In browser DevTools, set animation playback to 10 percent. Confirm the grid columns morph continuously between span ratios.
  - Toggle `prefers-reduced-motion: reduce` in DevTools Rendering. Confirm the vertical lift is removed and the layout no longer performs a visible movement transition.

- **Done when**:
  - The five hover layouts are unchanged.
  - The grid width changes feel continuous on desktop.
  - Mobile and tablet layouts remain one/two columns without the custom desktop bento interpolation.
  - Reduced motion removes movement while preserving readable hover/focus feedback.
