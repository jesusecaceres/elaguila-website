import type { CSSProperties } from "react";
import type { LayoutPreset } from "../types";

/**
 * Legacy stacked-field path only: maps 9-point presets to CSS for logo and text stack.
 * Block mode uses `logoGeom` + absolute `textBlocks` instead; see `layoutGeomAndScale.ts`.
 */
export function presetToLogoStyle(
  preset: LayoutPreset
): Pick<CSSProperties, "top" | "left" | "transform" | "right" | "bottom"> {
  const map: Record<LayoutPreset, Pick<CSSProperties, "top" | "left" | "right" | "bottom" | "transform">> = {
    "top-left": { top: "8%", left: "8%", transform: "translate(0,0)" },
    "top-center": { top: "8%", left: "50%", transform: "translate(-50%, 0)" },
    "top-right": { top: "8%", right: "8%", left: "auto", transform: "translate(0,0)" },
    "center-left": { top: "50%", left: "8%", transform: "translate(0, -50%)" },
    center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    "center-right": { top: "50%", right: "8%", left: "auto", transform: "translate(0, -50%)" },
    "bottom-left": { bottom: "8%", left: "8%", top: "auto", transform: "translate(0,0)" },
    "bottom-center": { bottom: "8%", left: "50%", top: "auto", transform: "translate(-50%, 0)" },
    "bottom-right": { bottom: "8%", right: "8%", left: "auto", top: "auto", transform: "translate(0,0)" },
  };
  return map[preset];
}

/** Text stack anchor inside trim (same preset grid, content flows from anchor). */
export function presetToTextAnchorStyle(
  preset: LayoutPreset
): Pick<CSSProperties, "top" | "left" | "right" | "bottom" | "transform" | "textAlign"> {
  const textAlign = ((): CSSProperties["textAlign"] => {
    if (preset.includes("left")) return "left";
    if (preset.includes("right")) return "right";
    return "center";
  })();

  const map: Record<LayoutPreset, Pick<CSSProperties, "top" | "left" | "right" | "bottom" | "transform">> = {
    "top-left": { top: "10%", left: "6%", transform: "translate(0,0)" },
    "top-center": { top: "10%", left: "50%", transform: "translate(-50%, 0)" },
    "top-right": { top: "10%", right: "6%", left: "auto", transform: "translate(0,0)" },
    "center-left": { top: "50%", left: "6%", transform: "translate(0, -50%)" },
    center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    "center-right": { top: "50%", right: "6%", left: "auto", transform: "translate(0, -50%)" },
    "bottom-left": { bottom: "10%", left: "6%", top: "auto", transform: "translate(0,0)" },
    "bottom-center": { bottom: "10%", left: "50%", top: "auto", transform: "translate(-50%, 0)" },
    "bottom-right": { bottom: "10%", right: "6%", left: "auto", top: "auto", transform: "translate(0,0)" },
  };

  return { ...map[preset], textAlign };
}
