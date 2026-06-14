import type { ReactNode } from "react";

type SectionEyebrowProps = {
  children: ReactNode;
  /** `accent` — portfolio plum; `muted` — carnet / document tone */
  tone?: "accent" | "muted";
  className?: string;
};

export function SectionEyebrow({
  children,
  tone = "accent",
  className = "",
}: SectionEyebrowProps) {
  const toneClass =
    tone === "accent" ? "text-text-accent" : "text-text-muted";

  return (
    <p
      className={`text-[12px] font-semibold uppercase tracking-[3px] ${toneClass} ${className}`.trim()}
    >
      {children}
    </p>
  );
}
