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

export const BLEED_INCHES = 0.125;
export const INTER_AD_GUTTER_INCHES = 0.25;
export const CRITICAL_SAFE_OFFSET_INCHES = 0.375;
export const MODULAR_CONTENT_SAFETY_INCHES = 0.25;
export const PRINT_PPI = 300;

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
];

export const PRINT_FORMATS: Record<PrintFormatKey, PrintFormatSpec> = {
  FULL_BLEED: {
    key: "FULL_BLEED",
    label: "Full Bleed",
    trimWidthIn: 8.00,
    trimHeightIn: 11.50,
    bleedWidthIn: 8.25,
    bleedHeightIn: 11.75,
    pixelWidth: 2475,
    pixelHeight: 3525,
    isSpread: false,
    isFullBleed: true,
  },
  FULL_PAGE: {
    key: "FULL_PAGE",
    label: "Full Page (Non-Bleed)",
    trimWidthIn: 8.00,
    trimHeightIn: 11.50,
    bleedWidthIn: 8.00,
    bleedHeightIn: 11.50,
    pixelWidth: 2175,
    pixelHeight: 3225,
    isSpread: false,
    isFullBleed: false,
  },
  HALF_HORIZONTAL: {
    key: "HALF_HORIZONTAL",
    label: "Half Horizontal",
    trimWidthIn: 7.25,
    trimHeightIn: 5.25,
    bleedWidthIn: 7.25,
    bleedHeightIn: 5.25,
    pixelWidth: 2175,
    pixelHeight: 1575,
    isSpread: false,
    isFullBleed: false,
  },
  HALF_VERTICAL: {
    key: "HALF_VERTICAL",
    label: "Half Vertical",
    trimWidthIn: 3.50,
    trimHeightIn: 10.75,
    bleedWidthIn: 3.50,
    bleedHeightIn: 10.75,
    pixelWidth: 1050,
    pixelHeight: 3225,
    isSpread: false,
    isFullBleed: false,
  },
  QUARTER: {
    key: "QUARTER",
    label: "Quarter Page",
    trimWidthIn: 3.50,
    trimHeightIn: 5.25,
    bleedWidthIn: 3.50,
    bleedHeightIn: 5.25,
    pixelWidth: 1050,
    pixelHeight: 1575,
    isSpread: false,
    isFullBleed: false,
  },
  SPREAD_TRIM: {
    key: "SPREAD_TRIM",
    label: "Two-Page Trim Spread",
    trimWidthIn: 16.00,
    trimHeightIn: 11.50,
    bleedWidthIn: 16.00,
    bleedHeightIn: 11.50,
    pixelWidth: 4800,
    pixelHeight: 3450,
    isSpread: true,
    isFullBleed: false,
  },
  SPREAD_BLEED: {
    key: "SPREAD_BLEED",
    label: "Two-Page Bleed Spread",
    trimWidthIn: 16.00,
    trimHeightIn: 11.50,
    bleedWidthIn: 16.25,
    bleedHeightIn: 11.75,
    pixelWidth: 4875,
    pixelHeight: 3525,
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
