import type { CSSProperties } from "react";
import type { BusinessCardDesignerV2NativeImage } from "../../types";
import {
  clampNativeCornerRadiusPx,
  clampNativeImageOpacity,
  clampNativeObjectPositionPct,
} from "./geometryClamp";

/** How the bitmap fills the placement box (CSS `object-fit`). */
export type NativeImageObjectFit = "contain" | "cover" | "fill";

/** Clip shape for the placement box. */
export type NativeImageClip = "rect" | "roundRect" | "circle";

export function resolveNativeImageObjectFit(fit: NativeImageObjectFit | undefined): "contain" | "cover" | "fill" {
  return fit ?? "contain";
}

export function nativeImageWrapperStyle(img: BusinessCardDesignerV2NativeImage): CSSProperties {
  const clip = img.imageClip ?? "roundRect";
  let borderRadius: string;
  if (clip === "circle") {
    borderRadius = "50%";
  } else if (clip === "rect") {
    borderRadius = "0";
  } else {
    borderRadius = `${clampNativeCornerRadiusPx(img.cornerRadiusPx ?? 0)}px`;
  }
  return {
    borderRadius,
    overflow: "hidden",
    width: "100%",
    height: "100%",
    opacity: clampNativeImageOpacity(img.imageOpacity ?? 1),
  };
}

export function nativeImageImgStyle(img: BusinessCardDesignerV2NativeImage): CSSProperties {
  const fit = resolveNativeImageObjectFit(img.objectFit);
  return {
    width: "100%",
    height: "100%",
    objectFit: fit,
    objectPosition: `${clampNativeObjectPositionPct(img.objectPositionXPct ?? 50)}% ${clampNativeObjectPositionPct(
      img.objectPositionYPct ?? 50
    )}%`,
    pointerEvents: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
  };
}
