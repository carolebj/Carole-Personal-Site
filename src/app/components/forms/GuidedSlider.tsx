import { useEffect, useId, useMemo, useState } from "react";

import { Slider } from "../ui/slider";

type RangeLabels = {
  minimum: string;
  maximum: string;
  range: string;
};

type GuidedRangeSliderProps = {
  values: readonly number[];
  value: readonly [number, number];
  labels: RangeLabels;
  formatValue: (value: number) => string;
  onValueChange: (value: [number, number]) => void;
};

function closestIndex(values: readonly number[], candidate: number) {
  return values.reduce((bestIndex, value, index) => (
    Math.abs(value - candidate) < Math.abs(values[bestIndex] - candidate) ? index : bestIndex
  ), 0);
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function GuidedRangeSlider({ values, value, labels, formatValue, onValueChange }: GuidedRangeSliderProps) {
  const minimumId = useId();
  const maximumId = useId();
  const minimumIndex = Math.max(0, values.indexOf(value[0]));
  const maximumIndex = Math.max(minimumIndex + 1, values.indexOf(value[1]));
  const [minimumInput, setMinimumInput] = useState(String(value[0]));
  const [maximumInput, setMaximumInput] = useState(String(value[1]));

  useEffect(() => setMinimumInput(String(value[0])), [value[0]]);
  useEffect(() => setMaximumInput(String(value[1])), [value[1]]);

  const majorTicks = useMemo(() => {
    const lastIndex = values.length - 1;
    return new Set([0, Math.round(lastIndex / 2), lastIndex]);
  }, [values.length]);

  const commitInput = (position: "minimum" | "maximum") => {
    const parsed = parseNumber(position === "minimum" ? minimumInput : maximumInput);
    if (parsed === null) {
      setMinimumInput(String(value[0]));
      setMaximumInput(String(value[1]));
      return;
    }
    if (position === "minimum") {
      const nextIndex = Math.min(closestIndex(values, parsed), maximumIndex - 1);
      onValueChange([values[nextIndex], values[maximumIndex]]);
      return;
    }
    const nextIndex = Math.max(closestIndex(values, parsed), minimumIndex + 1);
    onValueChange([values[minimumIndex], values[nextIndex]]);
  };

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3">
        <label className="grid min-w-0 gap-2 text-[11px] font-medium text-text-secondary" htmlFor={minimumId}>
          {labels.minimum}
          <span className="relative">
            <input
              id={minimumId}
              type="text"
              inputMode="numeric"
              value={minimumInput}
              onChange={(event) => setMinimumInput(event.currentTarget.value)}
              onBlur={() => commitInput("minimum")}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="h-12 w-full min-w-0 rounded-lg border border-border-subtle bg-surface-panel px-3 pr-12 text-[13px] text-text-primary outline-2 outline-transparent transition-[border-color,background-color] hover:border-border-accent focus-visible:border-border-accent focus-visible:outline focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-semibold text-text-muted">XOF</span>
          </span>
        </label>
        <label className="grid min-w-0 gap-2 text-[11px] font-medium text-text-secondary" htmlFor={maximumId}>
          {labels.maximum}
          <span className="relative">
            <input
              id={maximumId}
              type="text"
              inputMode="numeric"
              value={maximumInput}
              onChange={(event) => setMaximumInput(event.currentTarget.value)}
              onBlur={() => commitInput("maximum")}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="h-12 w-full min-w-0 rounded-lg border border-border-subtle bg-surface-panel px-3 pr-12 text-[13px] text-text-primary outline-2 outline-transparent transition-[border-color,background-color] hover:border-border-accent focus-visible:border-border-accent focus-visible:outline focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-semibold text-text-muted">XOF</span>
          </span>
        </label>
      </div>

      <div>
        <Slider
          value={[minimumIndex, maximumIndex]}
          min={0}
          max={values.length - 1}
          step={1}
          minStepsBetweenThumbs={1}
          onValueChange={(next) => {
            if (next.length !== 2) return;
            onValueChange([values[next[0]], values[next[1]]]);
          }}
          aria-label={labels.range}
        />
        <div className="mt-3 grid w-full items-start px-2 text-[10px] font-medium text-text-muted" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }} aria-hidden="true">
          {values.map((tick, index) => (
            <span key={tick} className="flex min-w-0 flex-col items-center gap-2">
              <span className={`w-px bg-border-accent ${majorTicks.has(index) ? "h-2" : "h-1"}`} />
              <span className={majorTicks.has(index) ? "whitespace-nowrap" : "sr-only"}>{formatValue(tick)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

type TickOption = {
  value: string;
  label: string;
  shortLabel?: string;
};

type GuidedTickSliderProps = {
  options: readonly TickOption[];
  value?: string;
  label: string;
  onValueChange: (value: string) => void;
};

export function GuidedTickSlider({ options, value, label, onValueChange }: GuidedTickSliderProps) {
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  if (options.length < 2) return null;

  return (
    <div className="grid gap-4">
      <p className="min-h-[1lh] text-center text-[12px] font-medium text-text-accent" aria-live="polite">
        {value ? options[selectedIndex].label : label}
      </p>
      <Slider
        value={[selectedIndex]}
        min={0}
        max={options.length - 1}
        step={1}
        onValueChange={(next) => {
          const option = options[next[0]];
          if (option) onValueChange(option.value);
        }}
        aria-label={label}
      />
      <div className="grid w-full items-start px-2 text-[10px] font-medium leading-4 text-text-muted" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} aria-hidden="true">
        {options.map((option) => (
          <span key={option.value} className="flex min-w-0 flex-col items-center gap-2 text-center">
            <span className="h-2 w-px bg-border-accent" />
            <span className="max-w-16 [overflow-wrap:anywhere]">{option.shortLabel ?? option.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
