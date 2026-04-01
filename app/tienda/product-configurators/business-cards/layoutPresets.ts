import type { CSSProperties } from "react";
import type { LayoutPreset, ScalePreset } from "./types";

/** Positions for the logo block inside trim box (percent of container) */
export function presetToLogoStyle(preset: LayoutPreset): Pick<CSSProperties, "top" | "left" | "transform" | "right" | "bottom"> {
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

/** Text stack anchor inside trim (same preset grid, content flows from anchor) */
export function presetToTextAnchorStyle(preset: LayoutPreset): Pick<CSSProperties, "top" | "left" | "right" | "bottom" | "transform" | "textAlign"> {
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

export function scaleToLogoPercent(scale: import("./types").ScalePreset): number {
  switch (scale) {
    case "sm":
      return 16;
    case "md":
      return 22;
    case "lg":
    default:
      return 28;
  }
}

export function scaleToTextRem(scale: import("./types").ScalePreset): number {
  switch (scale) {
    case "sm":
      return 0.55;
    case "md":
      return 0.65;
    case "lg":
    default:
      return 0.78;
  }
}

/**
 * Maps 9-point layout preset to trim-relative logo center (block-mode `logoGeom`).
 * Aligns with the same grid intent as `presetToLogoStyle` for the legacy path.
 */
export function layoutPresetToLogoGeomCenter(preset: LayoutPreset): { xPct: number; yPct: number } {
  const map: Record<LayoutPreset, { xPct: number; yPct: number }> = {
    "top-left": { xPct: 18, yPct: 20 },
    "top-center": { xPct: 50, yPct: 20 },
    "top-right": { xPct: 82, yPct: 20 },
    "center-left": { xPct: 18, yPct: 50 },
    center: { xPct: 50, yPct: 50 },
    "center-right": { xPct: 82, yPct: 50 },
    "bottom-left": { xPct: 18, yPct: 80 },
    "bottom-center": { xPct: 50, yPct: 80 },
    "bottom-right": { xPct: 82, yPct: 80 },
  };
  return map[preset];
}

/** Keep sm/md/lg buttons in sync when the user edits logo width % manually. */
export function widthPctToNearestLogoScale(widthPct: number): ScalePreset {
  const sm = scaleToLogoPercent("sm");
  const md = scaleToLogoPercent("md");
  const lg = scaleToLogoPercent("lg");
  const d = (a: number, b: number) => Math.abs(a - b);
  if (d(widthPct, sm) <= d(widthPct, md) && d(widthPct, sm) <= d(widthPct, lg)) return "sm";
  if (d(widthPct, md) <= d(widthPct, lg)) return "md";
  return "lg";
}
