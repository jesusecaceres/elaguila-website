import type { CSSProperties } from "react";
import type { BusinessCardTextBlock } from "../types";
import { businessCardTextColorToHex } from "../textColorForPicker";
import { resolveTextBlockFontFamilyCss } from "../textFontPresets";

export function clampTextLetterSpacingEm(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(0.3, Math.max(0, v));
}

export function clampTextLineHeight(v: number): number {
  if (!Number.isFinite(v)) return 1.2;
  return Math.min(2.2, Math.max(1, v));
}

export function clampTextBackdropOpacity(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

export function clampTextZIndex(v: number): number {
  if (!Number.isFinite(v)) return 8;
  return Math.min(40, Math.max(1, Math.round(v)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = businessCardTextColorToHex(hex);
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h);
  if (!m) return { r: 10, g: 10, b: 8 };
  return { r: parseInt(m[1]!, 16), g: parseInt(m[2]!, 16), b: parseInt(m[3]!, 16) };
}

export function textBackdropBackground(block: BusinessCardTextBlock): string | undefined {
  if ((block.textBackdrop ?? "none") !== "soft") return undefined;
  const op = clampTextBackdropOpacity(block.textBackdropOpacity ?? 0.55);
  const { r, g, b } = hexToRgb(block.textBackdropColor ?? "#0c0a08");
  return `rgba(${r},${g},${b},${op})`;
}

/** Layout + font container (outer). */
export function textBlockOuterStyle(
  block: BusinessCardTextBlock,
  opts: {
    blockTextScaleMul: number;
    textColor: string;
    transform: string;
  }
): CSSProperties {
  const ff = resolveTextBlockFontFamilyCss(block.fontPreset);
  const lh = clampTextLineHeight(block.lineHeight ?? 1.2);
  const ls = block.letterSpacingEm != null ? clampTextLetterSpacingEm(block.letterSpacingEm) : undefined;
  const tt = block.textTransform === "uppercase" ? "uppercase" : "none";
  const shadow =
    block.textShadow === "subtle" ? "0 1px 2px rgba(0,0,0,0.4), 0 0 1px rgba(0,0,0,0.25)" : undefined;

  return {
    left: `${block.xPct}%`,
    top: `${block.yPct}%`,
    transform: opts.transform,
    width: `${block.widthPct}%`,
    zIndex: block.zIndex,
    fontSize: `clamp(7px, ${block.fontSize * opts.blockTextScaleMul * 0.092}rem, 22px)`,
    fontWeight: block.fontWeight,
    ...(ff ? { fontFamily: ff } : {}),
    color: block.color?.startsWith("var(") ? block.color : block.color || opts.textColor,
    textAlign: block.textAlign,
    lineHeight: lh,
    wordBreak: "break-word",
    ...(ls != null && ls > 0 ? { letterSpacing: `${ls}em` } : {}),
    textTransform: tt,
    ...(shadow ? { textShadow: shadow } : {}),
  };
}

/** Inner wrapper when soft backdrop — text shadow can live on inner if backdrop, else outer already has shadow */
export function textBlockInnerSpanStyle(block: BusinessCardTextBlock): CSSProperties {
  const backdrop = block.textBackdrop ?? "none";
  if (backdrop !== "soft") {
    return { display: "block" };
  }
  const bg = textBackdropBackground(block);
  return {
    display: "inline-block",
    maxWidth: "100%",
    padding: "0.2em 0.45em",
    borderRadius: "6px",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
    background: bg,
  };
}
