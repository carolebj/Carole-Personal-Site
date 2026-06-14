import type { ReactNode } from "react";
import { SectionEyebrow } from "./SectionEyebrow";

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  eyebrowTone?: "accent" | "muted";
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export function PageHero({
  eyebrow,
  title,
  subtitle,
  align = "left",
  eyebrowTone = "accent",
  className = "",
  titleClassName = "",
  subtitleClassName = "",
}: PageHeroProps) {
  const alignClass = align === "center" ? "text-center" : "";

  return (
    <div className={`${alignClass} ${className}`.trim()}>
      <SectionEyebrow tone={eyebrowTone}>{eyebrow}</SectionEyebrow>
      <h1
        className={`mt-5 text-balance font-serif text-text-primary ${titleClassName}`.trim()}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={`mt-6 max-w-[640px] text-[18px] leading-8 text-text-secondary ${
            align === "center" ? "mx-auto" : ""
          } ${subtitleClassName}`.trim()}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
