/**
 * Gemini native bbox helpers — [ymin, xmin, ymax, xmax] on 0–1000 scale (Gate OFERTAS-REVIEW-CROP-1).
 */

import type { OfertaLocalSourceBoundingBox } from "./ofertasLocalesTypes";

export type GeminiSourceBbox = [number, number, number, number];

export type ValidatedGeminiBbox = {
  geminiBbox: GeminiSourceBbox;
  normalized: OfertaLocalSourceBoundingBox;
};

export type PixelCropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const MIN_BBOX_SPAN = 12;
const MIN_AREA_FRACTION = 0.0008;

function clamp1000(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1000, Math.round(n)));
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Parse and validate Gemini source_bbox [ymin, xmin, ymax, xmax]. */
export function validateGeminiSourceBbox(raw: unknown): ValidatedGeminiBbox | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  const nums = raw.map((v) => (typeof v === "number" ? v : Number.parseFloat(String(v ?? ""))));
  if (!nums.every(isNumber)) return null;

  let [ymin, xmin, ymax, xmax] = nums.map(clamp1000) as GeminiSourceBbox;
  if (ymin > ymax) [ymin, ymax] = [ymax, ymin];
  if (xmin > xmax) [xmin, xmax] = [xmax, xmin];

  const ySpan = ymax - ymin;
  const xSpan = xmax - xmin;
  if (ySpan < MIN_BBOX_SPAN || xSpan < MIN_BBOX_SPAN) return null;

  const area = (ySpan / 1000) * (xSpan / 1000);
  if (area < MIN_AREA_FRACTION) return null;

  return {
    geminiBbox: [ymin, xmin, ymax, xmax],
    normalized: {
      yMin: ymin / 1000,
      xMin: xmin / 1000,
      yMax: ymax / 1000,
      xMax: xmax / 1000,
    },
  };
}

/** Convert Gemini 0–1000 bbox to pixel crop rect with padding (default 8%). */
export function geminiBboxToPixelCropRect(params: {
  bbox: GeminiSourceBbox;
  imageWidth: number;
  imageHeight: number;
  paddingFraction?: number;
}): PixelCropRect | null {
  const { bbox, imageWidth, imageHeight } = params;
  const paddingFraction = params.paddingFraction ?? 0.08;
  if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth < 1 || imageHeight < 1) {
    return null;
  }

  const [ymin, xmin, ymax, xmax] = bbox;
  const rawLeft = (xmin / 1000) * imageWidth;
  const rawTop = (ymin / 1000) * imageHeight;
  const rawWidth = ((xmax - xmin) / 1000) * imageWidth;
  const rawHeight = ((ymax - ymin) / 1000) * imageHeight;

  const padX = rawWidth * paddingFraction;
  const padY = rawHeight * paddingFraction;

  let left = Math.floor(rawLeft - padX);
  let top = Math.floor(rawTop - padY);
  let width = Math.ceil(rawWidth + padX * 2);
  let height = Math.ceil(rawHeight + padY * 2);

  left = Math.max(0, left);
  top = Math.max(0, top);
  if (left + width > imageWidth) width = imageWidth - left;
  if (top + height > imageHeight) height = imageHeight - top;

  if (width < 8 || height < 8) return null;

  return { left, top, width, height };
}
