"use client";

import type { SnapGuideState } from "../../product-configurators/business-cards/preview/alignmentSnap";

/** Ephemeral alignment lines while snapping (trim-relative %). */
export function BusinessCardSnapGuidesOverlay(props: { guides: SnapGuideState }) {
  const { vertical, horizontal } = props.guides;
  if (vertical == null && horizontal == null) return null;
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[25] h-full w-full overflow-visible"
      aria-hidden
    >
      {vertical != null ? (
        <line
          x1={`${vertical}%`}
          y1="0%"
          x2={`${vertical}%`}
          y2="100%"
          stroke="rgba(201, 168, 74, 0.95)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {horizontal != null ? (
        <line
          x1="0%"
          y1={`${horizontal}%`}
          x2="100%"
          y2={`${horizontal}%`}
          stroke="rgba(201, 168, 74, 0.95)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}
