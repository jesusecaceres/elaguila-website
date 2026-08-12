/**
 * Program 6, Gate 6C — ONE canonical deterministic print production spec registry.
 * All dimensions locked. Do not scatter through components.
 */

export type PrintFormatKey =
  | "FULL_BLEED"
  | "FULL_PAGE"
  | "HALF_HORIZONTAL"
  | "HALF_VERTICAL"
  | "QUARTER"
  | "SPREAD_TRIM"
  | "SPREAD_BLEED";

export interface PrintFormatSpec {
  readonly key: PrintFormatKey;
  readonly label: string;
  readonly trimWidthIn: number;
  readonly trimHeightIn: number;
  readonly bleedWidthIn: number;
  readonly bleedHeightIn: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  readonly isSpread: boolean;
  readonly isFullBleed: boolean;
}

export const PRINT_PPI = 300;

/**
 * Canonical Leonix Magazine geometry (locked source of truth).
 * FINAL TRIM: 8.5 x 11 in, portrait, US Letter proportion, 300 PPI working standard.
 * Printer-specific bleed/binding/creep/crop-mark/PDF/CMYK/ink/coating requirements
 * remain CONFIRM WITH PRINTER — never represented here as certified facts.
 */
export function inchesToPx(inches: number): number {
  return Math.round(inches * PRINT_PPI);
}

export const BLEED_INCHES = 0.125;
export const INTER_AD_GUTTER_INCHES = 0.25;
export const CRITICAL_SAFE_OFFSET_INCHES = 0.375;
export const MODULAR_CONTENT_SAFETY_INCHES = 0.25;

export const BINDING_MARGINS = {
  inside: 0.50,
  outside: 0.25,
  top: 0.375,
  bottom: 0.375,
} as const;

export const PRINT_RESOLUTION_TARGET = "300 PPI final placed size";
export const PRINT_EXPORT_TARGET = "PDF Print / CMYK";
export const DIGITAL_EXPORT_TARGET = "RGB / optimized PDF";

export const CONFIRM_WITH_PRINTER_ITEMS: readonly string[] = [
  "Printer-specific PDF standard",
  "CMYK profile",
  "Rich-black build",
  "Ink limit",
  "Crop mark requirement",
  "Creep settings",
  "Coating requirements",
  "Final bleed/binding creep",
];

// ─── Canonical Leonix Magazine trim / bleed / safe-area geometry ──────────

export const MAGAZINE_TRIM_IN = { widthIn: 8.5, heightIn: 11 } as const;
export const MAGAZINE_TRIM_PX = {
  pixelWidth: inchesToPx(MAGAZINE_TRIM_IN.widthIn),
  pixelHeight: inchesToPx(MAGAZINE_TRIM_IN.heightIn),
} as const;

export const MAGAZINE_BLEED_DOCUMENT_IN = {
  widthIn: MAGAZINE_TRIM_IN.widthIn + 2 * BLEED_INCHES,
  heightIn: MAGAZINE_TRIM_IN.heightIn + 2 * BLEED_INCHES,
} as const;
export const MAGAZINE_BLEED_PX = {
  pixelWidth: inchesToPx(MAGAZINE_BLEED_DOCUMENT_IN.widthIn),
  pixelHeight: inchesToPx(MAGAZINE_BLEED_DOCUMENT_IN.heightIn),
} as const;

export const MAGAZINE_SAFE_AREA_IN = {
  widthIn: MAGAZINE_TRIM_IN.widthIn - 2 * CRITICAL_SAFE_OFFSET_INCHES,
  heightIn: MAGAZINE_TRIM_IN.heightIn - 2 * CRITICAL_SAFE_OFFSET_INCHES,
} as const;
export const MAGAZINE_SAFE_PX = {
  pixelWidth: inchesToPx(MAGAZINE_SAFE_AREA_IN.widthIn),
  pixelHeight: inchesToPx(MAGAZINE_SAFE_AREA_IN.heightIn),
} as const;

export const MAGAZINE_SPREAD_TRIM_IN = {
  widthIn: MAGAZINE_TRIM_IN.widthIn * 2,
  heightIn: MAGAZINE_TRIM_IN.heightIn,
} as const;
export const MAGAZINE_SPREAD_TRIM_PX = {
  pixelWidth: inchesToPx(MAGAZINE_SPREAD_TRIM_IN.widthIn),
  pixelHeight: inchesToPx(MAGAZINE_SPREAD_TRIM_IN.heightIn),
} as const;

export const MAGAZINE_SPREAD_OUTER_BLEED_IN = {
  widthIn: MAGAZINE_SPREAD_TRIM_IN.widthIn + 2 * BLEED_INCHES,
  heightIn: MAGAZINE_SPREAD_TRIM_IN.heightIn + 2 * BLEED_INCHES,
} as const;
export const MAGAZINE_SPREAD_OUTER_BLEED_PX = {
  pixelWidth: inchesToPx(MAGAZINE_SPREAD_OUTER_BLEED_IN.widthIn),
  pixelHeight: inchesToPx(MAGAZINE_SPREAD_OUTER_BLEED_IN.heightIn),
} as const;

// ─── Modular ad geometry (derived from safe/live area + working gutter) ───

export const MAGAZINE_HALF_HORIZONTAL_IN = {
  widthIn: MAGAZINE_SAFE_AREA_IN.widthIn,
  heightIn: (MAGAZINE_SAFE_AREA_IN.heightIn - INTER_AD_GUTTER_INCHES) / 2,
} as const;

export const MAGAZINE_HALF_VERTICAL_IN = {
  widthIn: (MAGAZINE_SAFE_AREA_IN.widthIn - INTER_AD_GUTTER_INCHES) / 2,
  heightIn: MAGAZINE_SAFE_AREA_IN.heightIn,
} as const;

export const MAGAZINE_QUARTER_IN = {
  widthIn: MAGAZINE_HALF_VERTICAL_IN.widthIn,
  heightIn: MAGAZINE_HALF_HORIZONTAL_IN.heightIn,
} as const;

export const PRINT_FORMATS: Record<PrintFormatKey, PrintFormatSpec> = {
  FULL_BLEED: {
    key: "FULL_BLEED",
    label: "Full Page — Bleed",
    trimWidthIn: MAGAZINE_TRIM_IN.widthIn,
    trimHeightIn: MAGAZINE_TRIM_IN.heightIn,
    bleedWidthIn: MAGAZINE_BLEED_DOCUMENT_IN.widthIn,
    bleedHeightIn: MAGAZINE_BLEED_DOCUMENT_IN.heightIn,
    pixelWidth: MAGAZINE_BLEED_PX.pixelWidth,
    pixelHeight: MAGAZINE_BLEED_PX.pixelHeight,
    isSpread: false,
    isFullBleed: true,
  },
  FULL_PAGE: {
    key: "FULL_PAGE",
    label: "Full Page — Non-Bleed / Live",
    trimWidthIn: MAGAZINE_SAFE_AREA_IN.widthIn,
    trimHeightIn: MAGAZINE_SAFE_AREA_IN.heightIn,
    bleedWidthIn: MAGAZINE_SAFE_AREA_IN.widthIn,
    bleedHeightIn: MAGAZINE_SAFE_AREA_IN.heightIn,
    pixelWidth: MAGAZINE_SAFE_PX.pixelWidth,
    pixelHeight: MAGAZINE_SAFE_PX.pixelHeight,
    isSpread: false,
    isFullBleed: false,
  },
  HALF_HORIZONTAL: {
    key: "HALF_HORIZONTAL",
    label: "Half Page — Horizontal",
    trimWidthIn: MAGAZINE_HALF_HORIZONTAL_IN.widthIn,
    trimHeightIn: MAGAZINE_HALF_HORIZONTAL_IN.heightIn,
    bleedWidthIn: MAGAZINE_HALF_HORIZONTAL_IN.widthIn,
    bleedHeightIn: MAGAZINE_HALF_HORIZONTAL_IN.heightIn,
    pixelWidth: inchesToPx(MAGAZINE_HALF_HORIZONTAL_IN.widthIn),
    pixelHeight: inchesToPx(MAGAZINE_HALF_HORIZONTAL_IN.heightIn),
    isSpread: false,
    isFullBleed: false,
  },
  HALF_VERTICAL: {
    key: "HALF_VERTICAL",
    label: "Half Page — Vertical",
    trimWidthIn: MAGAZINE_HALF_VERTICAL_IN.widthIn,
    trimHeightIn: MAGAZINE_HALF_VERTICAL_IN.heightIn,
    bleedWidthIn: MAGAZINE_HALF_VERTICAL_IN.widthIn,
    bleedHeightIn: MAGAZINE_HALF_VERTICAL_IN.heightIn,
    pixelWidth: inchesToPx(MAGAZINE_HALF_VERTICAL_IN.widthIn),
    pixelHeight: inchesToPx(MAGAZINE_HALF_VERTICAL_IN.heightIn),
    isSpread: false,
    isFullBleed: false,
  },
  QUARTER: {
    key: "QUARTER",
    label: "Quarter Page",
    trimWidthIn: MAGAZINE_QUARTER_IN.widthIn,
    trimHeightIn: MAGAZINE_QUARTER_IN.heightIn,
    bleedWidthIn: MAGAZINE_QUARTER_IN.widthIn,
    bleedHeightIn: MAGAZINE_QUARTER_IN.heightIn,
    pixelWidth: inchesToPx(MAGAZINE_QUARTER_IN.widthIn),
    pixelHeight: inchesToPx(MAGAZINE_QUARTER_IN.heightIn),
    isSpread: false,
    isFullBleed: false,
  },
  SPREAD_TRIM: {
    key: "SPREAD_TRIM",
    label: "Two-Page Trim Spread",
    trimWidthIn: MAGAZINE_SPREAD_TRIM_IN.widthIn,
    trimHeightIn: MAGAZINE_SPREAD_TRIM_IN.heightIn,
    bleedWidthIn: MAGAZINE_SPREAD_TRIM_IN.widthIn,
    bleedHeightIn: MAGAZINE_SPREAD_TRIM_IN.heightIn,
    pixelWidth: MAGAZINE_SPREAD_TRIM_PX.pixelWidth,
    pixelHeight: MAGAZINE_SPREAD_TRIM_PX.pixelHeight,
    isSpread: true,
    isFullBleed: false,
  },
  SPREAD_BLEED: {
    key: "SPREAD_BLEED",
    label: "Two-Page Outer-Bleed Working Size",
    trimWidthIn: MAGAZINE_SPREAD_TRIM_IN.widthIn,
    trimHeightIn: MAGAZINE_SPREAD_TRIM_IN.heightIn,
    bleedWidthIn: MAGAZINE_SPREAD_OUTER_BLEED_IN.widthIn,
    bleedHeightIn: MAGAZINE_SPREAD_OUTER_BLEED_IN.heightIn,
    pixelWidth: MAGAZINE_SPREAD_OUTER_BLEED_PX.pixelWidth,
    pixelHeight: MAGAZINE_SPREAD_OUTER_BLEED_PX.pixelHeight,
    isSpread: true,
    isFullBleed: true,
  },
};

export function getPrintFormat(key: PrintFormatKey): PrintFormatSpec {
  return PRINT_FORMATS[key];
}

export function getAllPrintFormats(): readonly PrintFormatSpec[] {
  return Object.values(PRINT_FORMATS);
}

export function getMagazineAdFormats(): readonly PrintFormatSpec[] {
  return [
    PRINT_FORMATS.FULL_BLEED,
    PRINT_FORMATS.FULL_PAGE,
    PRINT_FORMATS.HALF_HORIZONTAL,
    PRINT_FORMATS.HALF_VERTICAL,
    PRINT_FORMATS.QUARTER,
    PRINT_FORMATS.SPREAD_BLEED,
  ];
}
