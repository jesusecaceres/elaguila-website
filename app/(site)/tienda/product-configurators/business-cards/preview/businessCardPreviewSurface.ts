import type { CSSProperties } from "react";
import type { BusinessCardDocument } from "../types";

export function trimSurfaceStyle(doc: BusinessCardDocument): CSSProperties {
  const bg = doc.canvasBackground;
  if (bg.kind === "solid") {
    return { backgroundColor: bg.color };
  }
  const gradients: Record<(typeof bg)["id"], string> = {
    linen: "linear-gradient(145deg,#fbf9f4 0%,#ebe4d8 100%)",
    pearl: "linear-gradient(160deg,#fffef9 0%,#f2ebe4 100%)",
    graphite: "linear-gradient(145deg,#2a2a2e 0%,#1a1a1d 100%)",
    sand: "linear-gradient(145deg,#f6efe6 0%,#e2d6ca 100%)",
  };
  return { background: gradients[bg.id] };
}

export function trimTextColor(doc: BusinessCardDocument): string {
  if (doc.canvasBackground.kind === "preset" && doc.canvasBackground.id === "graphite") {
    return "rgba(255,252,247,0.94)";
  }
  return "var(--lx-text)";
}
