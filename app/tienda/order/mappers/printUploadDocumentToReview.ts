import type { PrintUploadProductConfig, PrintUploadSpecSelection } from "../../product-configurators/print-upload/types";
import { getPrintUploadConfig } from "../../product-configurators/print-upload/productConfigs";
import type { TiendaOrderReviewSummary, TiendaLocalizedLine } from "../../types/orderHandoff";
import { tiendaProductFamilies } from "../../data/tiendaProductFamilies";

const PU_SESSION_KEY_PREFIX = "leonix-pu-draft-";

export type PrintUploadSessionPayloadV1 = {
  v: 1;
  savedAt?: string;
  productSlug: string;
  specs: PrintUploadSpecSelection;
  approval: {
    reviewedSpecsAndFile: boolean;
    printAsSubmitted: boolean;
    noLeonixLiabilityForArtwork: boolean;
    willContactForDesignHelp: boolean;
  };
  frontMeta: {
    name: string;
    mime: string;
    sizeBytes: number;
    widthPx: number | null;
    heightPx: number | null;
    dataUrl: string | null;
  } | null;
  backMeta: {
    name: string;
    mime: string;
    sizeBytes: number;
    widthPx: number | null;
    heightPx: number | null;
    dataUrl: string | null;
  } | null;
  validationSnapshot?: Array<{
    severity: string;
    messageEs: string;
    messageEn: string;
  }>;
};

function formatBytes(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function assetKindFromMime(mime: string): "pdf" | "image" {
  return mime === "application/pdf" ? "pdf" : "image";
}

function buildPuSpecLines(cfg: PrintUploadProductConfig, specs: PrintUploadSpecSelection): TiendaLocalizedLine[] {
  const lines: TiendaLocalizedLine[] = [
    { es: `Cantidad: ${specs.quantity}`, en: `Quantity: ${specs.quantity}` },
  ];

  const size = cfg.sizes.find((s) => s.id === specs.sizeId);
  if (size) lines.push({ es: `Tamaño: ${size.labelEs}`, en: `Size: ${size.labelEn}` });

  const stock = cfg.stocks.find((s) => s.id === specs.stockId);
  if (stock) lines.push({ es: `Material: ${stock.labelEs}`, en: `Stock: ${stock.labelEn}` });

  const side = cfg.sides.find((s) => s.id === specs.sidesId);
  if (side) lines.push({ es: `Lados: ${side.labelEs}`, en: `Sides: ${side.labelEn}` });

  if (specs.foldId && cfg.folds) {
    const fold = cfg.folds.find((f) => f.id === specs.foldId);
    if (fold) lines.push({ es: `Plegado: ${fold.labelEs}`, en: `Fold: ${fold.labelEn}` });
  }
  if (specs.materialId && cfg.materials) {
    const m = cfg.materials.find((x) => x.id === specs.materialId);
    if (m) lines.push({ es: `Sustrato: ${m.labelEs}`, en: `Material: ${m.labelEn}` });
  }
  if (specs.finishId && cfg.finishes) {
    const f = cfg.finishes.find((x) => x.id === specs.finishId);
    if (f) lines.push({ es: `Acabado: ${f.labelEs}`, en: `Finish: ${f.labelEn}` });
  }
  if (specs.shapeId && cfg.shapes) {
    const sh = cfg.shapes.find((x) => x.id === specs.shapeId);
    if (sh) lines.push({ es: `Forma: ${sh.labelEs}`, en: `Shape: ${sh.labelEn}` });
  }

  return lines;
}

function metaToAsset(
  id: string,
  label: TiendaLocalizedLine,
  meta: NonNullable<PrintUploadSessionPayloadV1["frontMeta"]>
): TiendaOrderReviewSummary["assets"][number] {
  const kind = assetKindFromMime(meta.mime);
  const dim =
    meta.widthPx != null && meta.heightPx != null
      ? { es: `${meta.widthPx}×${meta.heightPx} px`, en: `${meta.widthPx}×${meta.heightPx} px` }
      : { es: "Dimensiones px: no disponibles", en: "Pixel dimensions: n/a" };
  const metaLines: TiendaLocalizedLine[] = [
    { es: `Archivo: ${meta.name}`, en: `File: ${meta.name}` },
    { es: `Tipo: ${meta.mime}`, en: `Type: ${meta.mime}` },
    { es: `Tamaño: ${formatBytes(meta.sizeBytes)}`, en: `Size: ${formatBytes(meta.sizeBytes)}` },
    dim,
  ];
  const thumb = kind === "image" && meta.dataUrl ? meta.dataUrl : null;
  return {
    id,
    kind,
    label,
    thumbnailUrl: thumb,
    metaLines,
  };
}

export function readPrintUploadSessionRaw(productSlug: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PU_SESSION_KEY_PREFIX}${productSlug}`);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isPayloadV1(x: unknown): x is PrintUploadSessionPayloadV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as PrintUploadSessionPayloadV1;
  return o.v === 1 && typeof o.productSlug === "string" && o.specs != null && typeof o.specs === "object";
}

export function mapPrintUploadSessionToReview(
  expectedSlug: string,
  raw: unknown
): TiendaOrderReviewSummary | null {
  if (!isPayloadV1(raw)) return null;
  if (raw.productSlug !== expectedSlug) return null;
  if (!raw.frontMeta) return null;

  const cfg = getPrintUploadConfig(expectedSlug);
  if (!cfg) return null;

  const family = tiendaProductFamilies.find((p) => p.slug === expectedSlug);
  if (!family) return null;

  const specLines = buildPuSpecLines(cfg, raw.specs);

  const sidednessSummary: TiendaLocalizedLine =
    cfg.sideUploadMode === "single-file-only"
      ? { es: "Archivo único (según producto)", en: "Single file (per product)" }
      : raw.specs.sidesId === "two-sided"
        ? { es: "Dos lados — archivos separados", en: "Two-sided — separate files" }
        : { es: "Un lado", en: "One-sided" };

  const assets: TiendaOrderReviewSummary["assets"] = [];
  assets.push(metaToAsset("pu-front", { es: "Archivo principal", en: "Primary file" }, raw.frontMeta));
  if (raw.backMeta) {
    assets.push(metaToAsset("pu-back", { es: "Archivo reverso", en: "Back file" }, raw.backMeta));
  }

  const approvalAll =
    raw.approval.reviewedSpecsAndFile &&
    raw.approval.printAsSubmitted &&
    raw.approval.noLeonixLiabilityForArtwork &&
    raw.approval.willContactForDesignHelp;

  const approvalDetails: TiendaLocalizedLine[] = [
    {
      es: raw.approval.reviewedSpecsAndFile ? "Archivo y opciones revisadas" : "Archivo/opciones: pendiente al guardar",
      en: raw.approval.reviewedSpecsAndFile ? "File and specs reviewed" : "File/specs: pending at save",
    },
    {
      es: raw.approval.printAsSubmitted ? "Impresión según aprobado" : "Impresión: pendiente al guardar",
      en: raw.approval.printAsSubmitted ? "Print as submitted" : "Print: pending at save",
    },
    {
      es: raw.approval.noLeonixLiabilityForArtwork ? "Responsabilidad del arte aceptada" : "Responsabilidad: pendiente",
      en: raw.approval.noLeonixLiabilityForArtwork ? "Artwork responsibility acknowledged" : "Responsibility: pending",
    },
    {
      es: raw.approval.willContactForDesignHelp ? "Ayuda de diseño si se necesita" : "Contacto diseño: pendiente",
      en: raw.approval.willContactForDesignHelp ? "Will reach out for design help if needed" : "Design help: pending",
    },
  ];

  const warnings: TiendaLocalizedLine[] = (raw.validationSnapshot ?? []).map((i) => {
    const prefixEs = i.severity === "hard" ? "Bloqueo: " : "Aviso: ";
    const prefixEn = i.severity === "hard" ? "Blocker: " : "Note: ";
    return { es: `${prefixEs}${i.messageEs}`, en: `${prefixEn}${i.messageEn}` };
  });

  return {
    source: "print-upload",
    productSlug: expectedSlug,
    productTitle: { es: family.title.es, en: family.title.en },
    categorySlug: family.categorySlug,
    sidednessSummary,
    specLines,
    assets,
    approvalStatus: approvalAll
      ? { es: "Aprobación del configurador completa", en: "Configurator approval complete" }
      : {
          es: "Revisa el configurador: aprobación incompleta al guardar",
          en: "Return to configurator: approval incomplete at save",
        },
    approvalDetails,
    warnings,
    builderSavedAt: raw.savedAt ?? null,
    prefillBusinessName: null,
  };
}
