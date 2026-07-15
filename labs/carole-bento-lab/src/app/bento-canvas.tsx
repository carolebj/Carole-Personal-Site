import { shouldIncludeToolcraftPreviewBackground } from "@/toolcraft/runtime/export";
import { useToolcraft } from "@/toolcraft/runtime/react";
import { useState } from "react";

import {
  bentoHoverSpans,
  bentoServices,
  readBentoConfig,
} from "./bento-model";
import styles from "./bento-canvas.module.css";

export function BentoCanvas() {
  const { state } = useToolcraft();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const config = readBentoConfig(state.values);
  const background =
    typeof state.values["appearance.background"] === "string"
      ? state.values["appearance.background"]
      : "#f6f3f2";
  const includeBackground = shouldIncludeToolcraftPreviewBackground({ state });
  const hoverSpans = hoveredCard !== null ? bentoHoverSpans[hoveredCard] : null;

  return (
    <div
      className={styles.stage}
      data-toolcraft-product-output
      style={{ background: includeBackground ? background : "transparent" }}
    >
      <div className={styles.grid} style={{ gap: config.gap }}>
        {bentoServices.map((service, index) => {
          const orderPosition = config.order.indexOf(index);
          const span = hoverSpans?.[index] ?? config.spans[index] ?? 6;
          const isFocused = hoveredCard === index;

          return (
            <article
              className={styles.card}
              data-service-id={service.id}
              data-toolcraft-product-text
              key={service.id}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                gridColumn: `span ${span} / span ${span}`,
                minHeight: config.minHeight,
                order: orderPosition,
                transitionDuration: `${config.transitionMs}ms`,
                transform: isFocused ? `translateY(-${config.hoverLift}px)` : undefined,
              }}
            >
              <div className={styles.icon} aria-hidden="true">
                {index + 1}
              </div>
              <h2 className={styles.title}>
                {service.title}
                <span className={styles.accent}>{service.accent}</span>
              </h2>
              <p className={styles.description}>{service.description}</p>
              <p className={styles.meta}>
                span {span}/12 · position {orderPosition + 1}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
