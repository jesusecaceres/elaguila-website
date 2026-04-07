import type { PrintUploadProductConfig, PrintUploadProductSlug, PrintUploadSpecSelection } from "./types";

const NOTE_OPTIONS: { es: string; en: string } = {
  es: "Opciones representativas; ajustes finos y cotización especial con Leonix.",
  en: "Representative options—fine‑tuning and special quotes available with Leonix.",
};

export const PRINT_UPLOAD_PRODUCT_SLUGS: PrintUploadProductSlug[] = [
  "flyers-standard",
  "brochures-standard",
  "retractable-banners",
  "yard-signs",
  "stickers-standard",
];

export const printUploadProductConfigs: PrintUploadProductConfig[] = [
  {
    slug: "flyers-standard",
    categorySlug: "flyers",
    sideUploadMode: "second-when-two-sided",
    specSimplificationNote: NOTE_OPTIONS,
    defaults: {
      quantity: 500,
      sizeId: "flyer-4x6",
      stockId: "stock-gloss-100",
      sidesId: "two-sided",
      finishId: "finish-none",
    },
    quantities: [250, 500, 1000, 2500],
    sizes: [
      { id: "flyer-4x6", labelEs: '4" × 6"', labelEn: '4" × 6"', widthIn: 4, heightIn: 6 },
      { id: "flyer-5x7", labelEs: '5" × 7"', labelEn: '5" × 7"', widthIn: 5, heightIn: 7 },
      { id: "flyer-5p5x8p5", labelEs: '5.5" × 8.5" (media carta)', labelEn: '5.5" × 8.5" (half‑letter)', widthIn: 5.5, heightIn: 8.5 },
    ],
    stocks: [
      { id: "stock-gloss-100", labelEs: "Estucado brillante 100#", labelEn: "100# gloss cover" },
      { id: "stock-matte-100", labelEs: "Estucado mate 100#", labelEn: "100# matte cover" },
      { id: "stock-uncoated-100", labelEs: "Bond sin recubrir 100#", labelEn: "100# uncoated" },
    ],
    sides: [
      { id: "one-sided", labelEs: "Un lado", labelEn: "One‑sided" },
      { id: "two-sided", labelEs: "Dos lados", labelEn: "Two‑sided" },
    ],
    finishes: [
      { id: "finish-none", labelEs: "Sin coating extra", labelEn: "No extra coating" },
      { id: "finish-aq", labelEs: "Barniz acuoso (MVP)", labelEn: "Aqueous coat (MVP)" },
    ],
  },
  {
    slug: "brochures-standard",
    categorySlug: "brochures",
    sideUploadMode: "single-file-only",
    specSimplificationNote: NOTE_OPTIONS,
    defaults: {
      quantity: 250,
      sizeId: "broch-8p5x11",
      stockId: "bro-stock-100",
      sidesId: "multi-panel",
      foldId: "fold-trifold",
    },
    quantities: [100, 250, 500, 1000],
    sizes: [
      { id: "broch-8p5x11", labelEs: '8.5" × 11" (plegado)', labelEn: '8.5" × 11" (folded flat)', widthIn: 8.5, heightIn: 11 },
      { id: "broch-11x17", labelEs: '11" × 17" (plegado)', labelEn: '11" × 17" (folded flat)', widthIn: 11, heightIn: 17 },
    ],
    stocks: [
      { id: "bro-stock-100", labelEs: "Estucado 100# texto", labelEn: "100# text gloss" },
      { id: "bro-stock-80", labelEs: "Estucado 80# texto", labelEn: "80# text gloss" },
    ],
    sides: [
      { id: "multi-panel", labelEs: "Varias caras (un PDF)", labelEn: "Multi‑panel (single PDF)" },
    ],
    folds: [
      { id: "fold-trifold", labelEs: "Tríptico (MVP)", labelEn: "Tri‑fold (MVP)" },
      { id: "fold-bifold", labelEs: "Díptico (MVP)", labelEn: "Bi‑fold (MVP)" },
    ],
  },
  {
    slug: "retractable-banners",
    categorySlug: "banners",
    sideUploadMode: "single-file-only",
    specSimplificationNote: NOTE_OPTIONS,
    defaults: {
      quantity: 1,
      sizeId: "retract-33x80",
      stockId: "banner-pvc",
      sidesId: "one-sided",
    },
    quantities: [1, 2, 3, 5],
    sizes: [
      { id: "retract-33x80", labelEs: "33\" × 80\"", labelEn: '33" × 80"', widthIn: 33, heightIn: 80 },
      { id: "retract-24x60", labelEs: "24\" × 60\"", labelEn: '24" × 60"', widthIn: 24, heightIn: 60 },
    ],
    stocks: [
      { id: "banner-pvc", labelEs: "Vinilo PVC retráctil", labelEn: "Retractable PVC vinyl" },
    ],
    sides: [{ id: "one-sided", labelEs: "Un lado", labelEn: "One‑sided" }],
  },
  {
    slug: "yard-signs",
    categorySlug: "signs",
    sideUploadMode: "second-when-two-sided",
    specSimplificationNote: NOTE_OPTIONS,
    defaults: {
      quantity: 1,
      sizeId: "yard-18x24",
      stockId: "coro-4mm",
      sidesId: "one-sided",
    },
    quantities: [1, 5, 10, 25],
    sizes: [
      { id: "yard-18x24", labelEs: '18" × 24"', labelEn: '18" × 24"', widthIn: 18, heightIn: 24 },
      { id: "yard-24x18", labelEs: '24" × 18"', labelEn: '24" × 18"', widthIn: 24, heightIn: 18 },
    ],
    stocks: [
      { id: "coro-4mm", labelEs: "Coroplast 4mm", labelEn: "4mm coroplast" },
      { id: "coro-6mm", labelEs: "Coroplast 6mm", labelEn: "6mm coroplast" },
    ],
    sides: [
      { id: "one-sided", labelEs: "Un lado", labelEn: "One‑sided" },
      { id: "two-sided", labelEs: "Dos lados (según archivo)", labelEn: "Two‑sided (per file)" },
    ],
  },
  {
    slug: "stickers-standard",
    categorySlug: "stickers-labels",
    sideUploadMode: "single-file-only",
    specSimplificationNote: NOTE_OPTIONS,
    defaults: {
      quantity: 250,
      sizeId: "sticker-3circle",
      stockId: "vinyl-white",
      sidesId: "one-sided",
      shapeId: "shape-round",
      finishId: "finish-gloss",
    },
    quantities: [100, 250, 500, 1000],
    sizes: [
      { id: "sticker-3circle", labelEs: '3" círculo', labelEn: '3" circle', widthIn: 3, heightIn: 3 },
      { id: "sticker-4x4", labelEs: '4" × 4"', labelEn: '4" × 4"', widthIn: 4, heightIn: 4 },
      { id: "sticker-2x6", labelEs: '2" × 6"', labelEn: '2" × 6"', widthIn: 2, heightIn: 6 },
    ],
    stocks: [
      { id: "vinyl-white", labelEs: "Vinilo blanco", labelEn: "White vinyl" },
      { id: "vinyl-clear", labelEs: "Vinilo transparente", labelEn: "Clear vinyl" },
    ],
    sides: [{ id: "one-sided", labelEs: "Un lado", labelEn: "One‑sided" }],
    shapes: [
      { id: "shape-round", labelEs: "Círculo", labelEn: "Round" },
      { id: "shape-square", labelEs: "Cuadrado", labelEn: "Square" },
      { id: "shape-custom", labelEs: "Troquel (MVP / cotizar)", labelEn: "Die‑cut (MVP / quote)" },
    ],
    finishes: [
      { id: "finish-gloss", labelEs: "Brillante", labelEn: "Gloss" },
      { id: "finish-matte", labelEs: "Mate", labelEn: "Matte" },
    ],
  },
];

export const printUploadConfigBySlug = Object.fromEntries(
  printUploadProductConfigs.map((c) => [c.slug, c])
) as Record<PrintUploadProductSlug, PrintUploadProductConfig>;

export function getPrintUploadConfig(slug: string): PrintUploadProductConfig | undefined {
  return printUploadConfigBySlug[slug as PrintUploadProductSlug];
}

export function isPrintUploadProductSlug(s: string): s is PrintUploadProductSlug {
  return PRINT_UPLOAD_PRODUCT_SLUGS.includes(s as PrintUploadProductSlug);
}

export function needsSeparateBackFile(cfg: PrintUploadProductConfig, specs: PrintUploadSpecSelection): boolean {
  return cfg.sideUploadMode === "second-when-two-sided" && specs.sidesId === "two-sided";
}
