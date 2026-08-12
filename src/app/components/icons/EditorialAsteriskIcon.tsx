import type { SVGProps } from "react";

/**
 * Canonical public signature: D3-A “Équilibre éditorial”.
 * Keep these proportions centralized; do not replace it with SparklesIcon.
 */
export function EditorialAsteriskIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M11.8 3.1c.35 3 .25 5.9.15 8.85M5.1 7c2.35 1.55 4.7 3.15 6.85 4.95M18.85 7.35c-2.55 1.45-4.75 2.95-6.9 4.6M7.05 18.75c1.65-2.55 3.35-4.75 4.9-6.8M17.75 18.35c-1.95-2.35-3.85-4.45-5.8-6.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="11.95" cy="11.95" r="1.45" fill="currentColor" />
    </svg>
  );
}
