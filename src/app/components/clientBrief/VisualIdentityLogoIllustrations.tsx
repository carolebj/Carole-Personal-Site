/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import { useState } from "react";

type LogoStyleIllustrationProps = {
  type: string;
  locale?: "fr" | "en";
};

type BrandReference = {
  brand: string;
  src: string;
  fit?: "wide" | "square";
};

const commonsFile = (filename: string) =>
  `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}`;

const brandReferences: Record<string, BrandReference> = {
  wordmark: {
    brand: "Google",
    src: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    fit: "wide",
  },
  pictorial: {
    brand: "Apple",
    src: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    fit: "square",
  },
  symbol: {
    brand: "Apple",
    src: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    fit: "square",
  },
  abstract: {
    brand: "Nike",
    src: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
    fit: "wide",
  },
  lettermark: {
    brand: "IBM",
    src: commonsFile("IBM logo.svg"),
    fit: "wide",
  },
  letterform: {
    brand: "McDonald’s",
    src: commonsFile("McDonald's Golden Arches.svg"),
    fit: "square",
  },
  monogram: {
    brand: "Louis Vuitton",
    src: commonsFile("Louis Vuitton Icon.svg"),
    fit: "square",
  },
  mascot: {
    brand: "KFC",
    src: "https://upload.wikimedia.org/wikipedia/en/5/57/KFC_logo-image.svg",
    fit: "square",
  },
  combination: {
    brand: "Amazon",
    src: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    fit: "wide",
  },
  emblem: {
    brand: "Starbucks",
    src: "https://upload.wikimedia.org/wikipedia/en/d/d3/Starbucks_Corporation_Logo_2011.svg",
    fit: "square",
  },
};

function BrandReferenceImage({ reference, locale }: { reference: BrandReference; locale: "fr" | "en" }) {
  const [failed, setFailed] = useState(false);
  const alt =
    locale === "fr"
      ? `Logo ${reference.brand}, présenté comme repère visuel`
      : `${reference.brand} logo, shown as a visual reference`;

  if (failed) {
    return (
      <span className="text-center text-[15px] font-semibold leading-5 text-text-primary" role="img" aria-label={alt}>
        {reference.brand}
      </span>
    );
  }

  return (
    <img
      src={reference.src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={reference.fit === "square" ? "h-16 w-20 object-contain" : "h-14 w-28 object-contain"}
    />
  );
}

export function VisualIdentityLogoIllustration({ type, locale = "fr" }: LogoStyleIllustrationProps) {
  const reference = brandReferences[type];

  if (reference) {
    return <BrandReferenceImage reference={reference} locale={locale} />;
  }

  return (
    <span className="max-w-28 text-center text-[12px] font-medium leading-5 text-text-secondary">
      {locale === "fr" ? "Carole vous guidera" : "Carole will guide you"}
    </span>
  );
}
