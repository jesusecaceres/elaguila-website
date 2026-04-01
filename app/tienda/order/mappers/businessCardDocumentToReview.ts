import { BUSINESS_CARD_PNG_EXPORT_PIXEL_RATIO } from "../../product-configurators/business-cards/constants";
import { getBusinessCardTemplateMeta, isBusinessCardTemplateId } from "../../product-configurators/business-cards/businessCardTemplateCatalog";
import type { BusinessCardDocument } from "../../product-configurators/business-cards/types";
import {
  isBusinessCardLeoSnapshot,
  type BusinessCardLeoSnapshot,
} from "../../product-configurators/business-cards/businessCardLeoTypes";
import type { BusinessCardCanvasBackground, BusinessCardTextLayout, TextFieldRole } from "../../product-configurators/business-cards/types";
import type { TiendaOrderReviewSummary, TiendaLocalizedLine } from "../../types/orderHandoff";
import type { BusinessCardSubmissionExtra } from "../../types/orderSubmission";
import { tiendaProductFamilies } from "../../data/tiendaProductFamilies";
import type { PrintUploadSessionPayloadV1 } from "./printUploadDocumentToReview";

const BC_SESSION_KEY_PREFIX = "leonix-bc-draft-";
export const BC_UPLOAD_DRAFT_PREFIX = "leonix-bc-upload-draft-";

type StoredLogo = {
  visible: boolean;
  position: import("../../product-configurators/business-cards/types").LayoutPreset;
  scale: import("../../product-configurators/business-cards/types").ScalePreset;
  previewUrl: string | null;
  naturalWidth: number | null;
  naturalHeight: number | null;
};

export type StoredSidePayload = {
  fields: Record<string, string>;
  textLayout: BusinessCardTextLayout;
  logo: StoredLogo;
};

export type StoredSidePayloadV3 = StoredSidePayload & {
  textBlocks: import("../../product-configurators/business-cards/types").BusinessCardTextBlock[];
  logoGeom: import("../../product-configurators/business-cards/types").BusinessCardLogoGeom;
  /** Designer V2 native layers — optional for backward compatibility with older saved drafts */
  designerV2NativeObjects?: import("../../product-configurators/business-cards/types").BusinessCardDesignerV2NativeObject[];
};

export type BusinessCardSessionPayloadV2 = {
  v: 2;
  savedAt?: string;
  productSlug: string;
  sidedness: "one-sided" | "two-sided";
  textNudgeX?: number;
  textNudgeY?: number;
  logoNudgeX?: number;
  logoNudgeY?: number;
  front: StoredSidePayload;
  back: StoredSidePayload;
  approval: BusinessCardApprovalSnapshot;
};

export type BusinessCardApprovalSnapshot = {
  spellingReviewed: boolean;
  layoutReviewed: boolean;
  printAsApproved: boolean;
  noRedesignExpectation: boolean;
};

/** Native studio image object ids offloaded to IndexedDB per side (session JSON keeps `previewUrl: null`). */
export type DraftStudioVault = { front?: string[]; back?: string[] };

export type BusinessCardSessionPayloadV3Design = {
  v: 3;
  mode: "design-online";
  savedAt?: string;
  productSlug: string;
  sidedness: "one-sided" | "two-sided";
  canvasBackground: BusinessCardCanvasBackground;
  /** Template-first vs advanced builder — used for fulfillment notes. */
  designIntake?: "template" | "custom" | "leo";
  selectedTemplateId?: string;
  /** LEO assistant snapshot when `designIntake` is `leo`. */
  leoSnapshot?: BusinessCardLeoSnapshot;
  /** Large logo previews stored in IndexedDB; hydrate merges after load. */
  draftLogoVault?: { front?: boolean; back?: boolean };
  /** Studio native image ids whose `previewUrl` was stored in IndexedDB (see `mergeVaultedStudioImagesIntoDocument`). */
  draftStudioVault?: DraftStudioVault;
  /** Optional filename hints from LEO / builder (not sent to print). */
  draftLogoMeta?: { frontFileName?: string; backFileName?: string };
  textNudgeX?: number;
  textNudgeY?: number;
  logoNudgeX?: number;
  logoNudgeY?: number;
  front: StoredSidePayloadV3;
  back: StoredSidePayloadV3;
  approval: BusinessCardApprovalSnapshot;
};

export type BusinessCardSessionPayloadV3Upload = {
  v: 3;
  mode: "upload-existing";
  savedAt?: string;
  productSlug: string;
  sidedness: "one-sided" | "two-sided";
  frontMeta: PrintUploadSessionPayloadV1["frontMeta"];
  backMeta: PrintUploadSessionPayloadV1["backMeta"];
  approval: BusinessCardApprovalSnapshot;
  validationSnapshot?: Array<{ severity: string; messageEs: string; messageEn: string }>;
};

export function readBusinessCardSessionRaw(productSlug: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${BC_SESSION_KEY_PREFIX}${productSlug}`);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Prefer upload-existing draft when present and valid (mutually exclusive with design draft at save time). */
export function readBusinessCardOrderSession(productSlug: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const rawUp = sessionStorage.getItem(`${BC_UPLOAD_DRAFT_PREFIX}${productSlug}`);
    if (rawUp) {
      const p = JSON.parse(rawUp) as unknown;
      if (isBusinessCardSessionUpload(p) && p.productSlug === productSlug) return p;
    }
  } catch {
    /* ignore */
  }
  return readBusinessCardSessionRaw(productSlug);
}

export function isBusinessCardSessionPayloadV2(x: unknown): x is BusinessCardSessionPayloadV2 {
  if (!x || typeof x !== "object") return false;
  const o = x as BusinessCardSessionPayloadV2;
  return o.v === 2 && typeof o.productSlug === "string" && (o.sidedness === "one-sided" || o.sidedness === "two-sided");
}

export function isBusinessCardSessionDesign(x: unknown): x is BusinessCardSessionPayloadV3Design {
  if (!x || typeof x !== "object") return false;
  const o = x as BusinessCardSessionPayloadV3Design;
  return o.v === 3 && o.mode === "design-online" && typeof o.productSlug === "string";
}

export function isBusinessCardSessionUpload(x: unknown): x is BusinessCardSessionPayloadV3Upload {
  if (!x || typeof x !== "object") return false;
  const o = x as BusinessCardSessionPayloadV3Upload;
  return o.v === 3 && o.mode === "upload-existing" && typeof o.productSlug === "string";
}

function fieldRoles(): TextFieldRole[] {
  return ["personName", "title", "company", "phone", "email", "website", "address", "tagline"];
}

function sideTextSummary(
  side: { fields?: Record<string, string>; textLayout?: BusinessCardTextLayout },
  sideLabel: TiendaLocalizedLine
): TiendaLocalizedLine[] {
  const lines: TiendaLocalizedLine[] = [];
  for (const role of fieldRoles()) {
    const visible = side.textLayout?.lineVisible?.[role] !== false;
    if (!visible) continue;
    const val = String(side.fields?.[role] ?? "").trim();
    if (!val) continue;
    const short = val.length > 48 ? `${val.slice(0, 45)}…` : val;
    lines.push({
      es: `${sideLabel.es} — ${role}: ${short}`,
      en: `${sideLabel.en} — ${role}: ${short}`,
    });
  }
  return lines;
}

function approvalDetailsFrom(approval: BusinessCardApprovalSnapshot): TiendaLocalizedLine[] {
  return [
    {
      es: approval.spellingReviewed ? "Ortografía revisada" : "Ortografía: pendiente en guardado",
      en: approval.spellingReviewed ? "Spelling reviewed" : "Spelling: pending at save",
    },
    {
      es: approval.layoutReviewed ? "Diseño revisado" : "Diseño: pendiente en guardado",
      en: approval.layoutReviewed ? "Layout reviewed" : "Layout: pending at save",
    },
    {
      es: approval.printAsApproved ? "Impresión según aprobado" : "Impresión: pendiente en guardado",
      en: approval.printAsApproved ? "Print as approved" : "Print: pending at save",
    },
    {
      es: approval.noRedesignExpectation ? "Sin rediseño incluido" : "Expectativas: pendiente en guardado",
      en: approval.noRedesignExpectation ? "No redesign included" : "Expectations: pending at save",
    },
  ];
}

function approvalAll(approval: BusinessCardApprovalSnapshot): boolean {
  return (
    approval.spellingReviewed &&
    approval.layoutReviewed &&
    approval.printAsApproved &&
    approval.noRedesignExpectation
  );
}

function assetKindFromMime(mime: string): "pdf" | "image" {
  return mime === "application/pdf" ? "pdf" : "image";
}

function metaToUploadAsset(
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
    dim,
    { es: "Modo: archivo original subido por el cliente", en: "Mode: customer-uploaded artwork (original file)" },
    {
      es: "Comprueba que la resolución encaje con el tamaño final (Leonix valida antes de imprimir).",
      en: "Confirm pixel size matches final trim (Leonix reviews before print).",
    },
  ];
  const thumb = meta.mime.startsWith("image/") && meta.dataUrl ? meta.dataUrl : null;
  return { id, kind, label, thumbnailUrl: thumb, metaLines };
}

function mapV2ToReview(expectedSlug: string, raw: BusinessCardSessionPayloadV2): TiendaOrderReviewSummary | null {
  const family = tiendaProductFamilies.find((p) => p.slug === expectedSlug);
  if (!family) return null;

  const sidednessSummary: TiendaLocalizedLine =
    raw.sidedness === "two-sided"
      ? { es: "Tarjeta a dos caras", en: "Two‑sided card" }
      : { es: "Tarjeta un lado", en: "One‑sided card" };

  const specLines: TiendaLocalizedLine[] = family.specs.map((s) => ({ es: s.es, en: s.en }));
  const frontLabel: TiendaLocalizedLine = { es: "Frente", en: "Front" };
  const backLabel: TiendaLocalizedLine = { es: "Reverso", en: "Back" };

  const frontMeta = [...sideTextSummary(raw.front, frontLabel)];
  frontMeta.push(
    raw.front.logo?.visible && raw.front.logo.previewUrl
      ? { es: "Logo en frente", en: "Logo on front" }
      : { es: "Sin logo al frente", en: "No logo on front" }
  );
  frontMeta.push({ es: "Origen: diseño en línea (constructor)", en: "Source: design online (builder)" });
  frontMeta.push({
    es: `Al enviar: PNG de referencia (~${BUSINESS_CARD_PNG_EXPORT_PIXEL_RATIO}× vista). No es PDF de prensa ni CMYK.`,
    en: `On submit: reference PNG (~${BUSINESS_CARD_PNG_EXPORT_PIXEL_RATIO}× preview). Not press-ready PDF/CMYK.`,
  });

  const assetItems: TiendaOrderReviewSummary["assets"] = [
    {
      id: "bc-front",
      kind: "design-side",
      label: { es: "Diseño — frente", en: "Design — front" },
      thumbnailUrl: raw.front.logo?.previewUrl ?? null,
      metaLines: frontMeta,
    },
  ];

  if (raw.sidedness === "two-sided") {
    const backMeta = [...sideTextSummary(raw.back, backLabel)];
    backMeta.push(
      raw.back.logo?.visible && raw.back.logo.previewUrl
        ? { es: "Logo en reverso", en: "Logo on back" }
        : { es: "Sin logo en reverso", en: "No logo on back" }
    );
    backMeta.push({ es: "Origen: diseño en línea", en: "Source: design online" });
    backMeta.push({
      es: `Reverso — PNG de referencia (~${BUSINESS_CARD_PNG_EXPORT_PIXEL_RATIO}× vista). No PDF de prensa.`,
      en: `Back — reference PNG (~${BUSINESS_CARD_PNG_EXPORT_PIXEL_RATIO}× preview). Not press PDF.`,
    });
    assetItems.push({
      id: "bc-back",
      kind: "design-side",
      label: { es: "Diseño — reverso", en: "Design — back" },
      thumbnailUrl: raw.back.logo?.previewUrl ?? null,
      metaLines: backMeta,
    });
  }

  const companyHint =
    String(raw.front.fields?.company ?? "").trim() ||
    String(raw.back.fields?.company ?? "").trim() ||
    null;

  return {
    source: "business-cards",
    productSlug: expectedSlug,
    productTitle: { es: family.title.es, en: family.title.en },
    categorySlug: family.categorySlug,
    sidednessSummary,
    specLines,
    assets: assetItems,
    approvalStatus: approvalAll(raw.approval)
      ? { es: "Aprobación del constructor completa", en: "Builder approval complete" }
      : { es: "Revisa el constructor: aprobación incompleta al guardar", en: "Return to builder: approval incomplete at save" },
    approvalDetails: approvalDetailsFrom(raw.approval),
    warnings: [],
    builderSavedAt: raw.savedAt ?? null,
    prefillBusinessName: companyHint,
    pricingInput: {
      productSlug: expectedSlug,
      quantity: 250,
      sidesKey: raw.sidedness === "two-sided" ? "two_sided" : "one_sided",
    },
  };
}

function mapV3DesignToReview(expectedSlug: string, raw: BusinessCardSessionPayloadV3Design): TiendaOrderReviewSummary | null {
  const family = tiendaProductFamilies.find((p) => p.slug === expectedSlug);
  if (!family) return null;

  const sidednessSummary: TiendaLocalizedLine =
    raw.sidedness === "two-sided"
      ? { es: "Tarjeta a dos caras", en: "Two‑sided card" }
      : { es: "Tarjeta un lado", en: "One‑sided card" };

  const specLines: TiendaLocalizedLine[] = family.specs.map((s) => ({ es: s.es, en: s.en }));
  const frontLabel: TiendaLocalizedLine = { es: "Frente", en: "Front" };
  const backLabel: TiendaLocalizedLine = { es: "Reverso", en: "Back" };

  const bgNote =
    raw.canvasBackground.kind === "solid"
      ? {
          es: `Fondo: color sólido (${raw.canvasBackground.color})`,
          en: `Background: solid (${raw.canvasBackground.color})`,
        }
      : {
          es: `Fondo: preset ${raw.canvasBackground.id}`,
          en: `Background: ${raw.canvasBackground.id} preset`,
        };

  const frontMeta = [...sideTextSummary(raw.front, frontLabel), bgNote];
  frontMeta.push(
    raw.front.logo?.visible && raw.front.logo.previewUrl
      ? { es: "Logo en frente", en: "Logo on front" }
      : { es: "Sin logo al frente", en: "No logo on front" }
  );
  const intake = raw.designIntake === "custom" ? "custom" : raw.designIntake === "leo" ? "leo" : "template";
  if (intake === "leo") {
    const snap = isBusinessCardLeoSnapshot(raw.leoSnapshot) ? raw.leoSnapshot : null;
    frontMeta.push({
      es: "Flujo: LEO (asistente guiado)",
      en: "Flow: LEO (guided assistant)",
    });
    if (raw.selectedTemplateId) {
      frontMeta.push({
        es: `Plantilla LEO: ${raw.selectedTemplateId}`,
        en: `LEO template: ${raw.selectedTemplateId}`,
      });
    }
    if (snap) {
      frontMeta.push({
        es: `LEO · oficio: ${snap.profession || "—"} · estilo: ${snap.preferredStyle}`,
        en: `LEO · profession: ${snap.profession || "—"} · style: ${snap.preferredStyle}`,
      });
    }
  } else if (intake === "template") {
    frontMeta.push(
      raw.selectedTemplateId
        ? {
            es: `Flujo: plantilla Leonix · ${raw.selectedTemplateId}`,
            en: `Flow: Leonix template · ${raw.selectedTemplateId}`,
          }
        : { es: "Flujo: plantilla Leonix", en: "Flow: Leonix template" }
    );
  } else {
    frontMeta.push({
      es: "Flujo: constructor avanzado (custom)",
      en: "Flow: advanced builder (custom)",
    });
  }
  frontMeta.push({ es: "Origen: diseño en línea (constructor v3)", en: "Source: design online (builder v3)" });
  frontMeta.push({
    es: `Al enviar: PNG de referencia (~${BUSINESS_CARD_PNG_EXPORT_PIXEL_RATIO}× vista). No es PDF de prensa ni CMYK.`,
    en: `On submit: reference PNG (~${BUSINESS_CARD_PNG_EXPORT_PIXEL_RATIO}× preview). Not press-ready PDF/CMYK.`,
  });

  const assetItems: TiendaOrderReviewSummary["assets"] = [
    {
      id: "bc-front",
      kind: "design-side",
      label: { es: "Diseño — frente", en: "Design — front" },
      thumbnailUrl: raw.front.logo?.previewUrl ?? null,
      metaLines: frontMeta,
    },
  ];

  if (raw.sidedness === "two-sided") {
    const backMeta = [...sideTextSummary(raw.back, backLabel), bgNote];
    backMeta.push(
      raw.back.logo?.visible && raw.back.logo.previewUrl
        ? { es: "Logo en reverso", en: "Logo on back" }
        : { es: "Sin logo en reverso", en: "No logo on back" }
    );
    backMeta.push({ es: "Origen: diseño en línea", en: "Source: design online" });
    backMeta.push({
      es: `Reverso — PNG de referencia (~${BUSINESS_CARD_PNG_EXPORT_PIXEL_RATIO}× vista). No PDF de prensa.`,
      en: `Back — reference PNG (~${BUSINESS_CARD_PNG_EXPORT_PIXEL_RATIO}× preview). Not press PDF.`,
    });
    assetItems.push({
      id: "bc-back",
      kind: "design-side",
      label: { es: "Diseño — reverso", en: "Design — back" },
      thumbnailUrl: raw.back.logo?.previewUrl ?? null,
      metaLines: backMeta,
    });
  }

  const companyHint =
    String(raw.front.fields?.company ?? "").trim() ||
    String(raw.back.fields?.company ?? "").trim() ||
    null;

  return {
    source: "business-cards",
    productSlug: expectedSlug,
    productTitle: { es: family.title.es, en: family.title.en },
    categorySlug: family.categorySlug,
    sidednessSummary,
    specLines,
    assets: assetItems,
    approvalStatus: approvalAll(raw.approval)
      ? { es: "Aprobación del constructor completa", en: "Builder approval complete" }
      : { es: "Revisa el constructor: aprobación incompleta al guardar", en: "Return to builder: approval incomplete at save" },
    approvalDetails: approvalDetailsFrom(raw.approval),
    warnings: [],
    builderSavedAt: raw.savedAt ?? null,
    prefillBusinessName: companyHint,
    pricingInput: {
      productSlug: expectedSlug,
      quantity: 250,
      sidesKey: raw.sidedness === "two-sided" ? "two_sided" : "one_sided",
    },
  };
}

function mapV3UploadToReview(expectedSlug: string, raw: BusinessCardSessionPayloadV3Upload): TiendaOrderReviewSummary | null {
  const family = tiendaProductFamilies.find((p) => p.slug === expectedSlug);
  if (!family) return null;
  if (!raw.frontMeta?.dataUrl) return null;
  if (raw.sidedness === "two-sided" && !raw.backMeta?.dataUrl) return null;

  const sidednessSummary: TiendaLocalizedLine =
    raw.sidedness === "two-sided"
      ? { es: "Tarjeta a dos caras", en: "Two‑sided card" }
      : { es: "Tarjeta un lado", en: "One‑sided card" };

  const specLines: TiendaLocalizedLine[] = family.specs.map((s) => ({ es: s.es, en: s.en }));

  const assetItems: TiendaOrderReviewSummary["assets"] = [
    metaToUploadAsset("bc-up-front", { es: "Arte subido — frente", en: "Uploaded artwork — front" }, raw.frontMeta),
  ];

  if (raw.sidedness === "two-sided" && raw.backMeta?.dataUrl) {
    assetItems.push(
      metaToUploadAsset("bc-up-back", { es: "Arte subido — reverso", en: "Uploaded artwork — back" }, raw.backMeta)
    );
  }

  const warnings: TiendaLocalizedLine[] = (raw.validationSnapshot ?? [])
    .filter((s) => s.severity === "soft")
    .map((s) => ({ es: s.messageEs, en: s.messageEn }));

  return {
    source: "business-cards",
    productSlug: expectedSlug,
    productTitle: { es: family.title.es, en: family.title.en },
    categorySlug: family.categorySlug,
    sidednessSummary,
    specLines,
    assets: assetItems,
    approvalStatus: approvalAll(raw.approval)
      ? { es: "Aprobación del constructor completa", en: "Builder approval complete" }
      : {
          es: "Revisa la carga: aprobación incompleta al guardar",
          en: "Return to upload flow: approval incomplete at save",
        },
    approvalDetails: approvalDetailsFrom(raw.approval),
    warnings,
    builderSavedAt: raw.savedAt ?? null,
    prefillBusinessName: null,
    pricingInput: {
      productSlug: expectedSlug,
      quantity: 250,
      sidesKey: raw.sidedness === "two-sided" ? "two_sided" : "one_sided",
    },
  };
}

export function mapBusinessCardSessionToReview(expectedSlug: string, raw: unknown): TiendaOrderReviewSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const slug = (raw as { productSlug?: string }).productSlug;
  if (slug !== expectedSlug) return null;

  if (isBusinessCardSessionUpload(raw)) return mapV3UploadToReview(expectedSlug, raw);
  if (isBusinessCardSessionDesign(raw)) return mapV3DesignToReview(expectedSlug, raw);
  if (isBusinessCardSessionPayloadV2(raw)) return mapV2ToReview(expectedSlug, raw);
  return null;
}

function extractExtraDesign(
  _expectedSlug: string,
  sidedness: "one-sided" | "two-sided",
  front: StoredSidePayload | StoredSidePayloadV3,
  back: StoredSidePayload | StoredSidePayloadV3,
  approval: BusinessCardApprovalSnapshot,
  designMeta?: {
    designIntake?: "template" | "custom" | "leo";
    selectedTemplateId?: string;
    leoSnapshot?: BusinessCardLeoSnapshot | null;
  }
): BusinessCardSubmissionExtra {
  const frontLabel: TiendaLocalizedLine = { es: "Frente", en: "Front" };
  const backLabel: TiendaLocalizedLine = { es: "Reverso", en: "Back" };
  const frontLines = sideTextSummary(front, frontLabel);
  const backLines = sidedness === "two-sided" ? sideTextSummary(back, backLabel) : [];

  const intake =
    designMeta?.designIntake === "custom" ? "custom" : designMeta?.designIntake === "leo" ? "leo" : "template";
  const slug = designMeta?.selectedTemplateId?.trim();
  const snap = designMeta?.leoSnapshot && isBusinessCardLeoSnapshot(designMeta.leoSnapshot) ? designMeta.leoSnapshot : null;

  let templateTitleEs: string | undefined;
  let templateTitleEn: string | undefined;
  if (slug && isBusinessCardTemplateId(slug)) {
    const m = getBusinessCardTemplateMeta(slug);
    templateTitleEs = m.title.es;
    templateTitleEn = m.title.en;
  }

  return {
    creationMode: "design-online",
    sidedness,
    designIntake: intake,
    templateSlug: (intake === "template" || intake === "leo") && slug ? slug : undefined,
    templateTitleEs,
    templateTitleEn,
    leoProfession: intake === "leo" && snap ? snap.profession : undefined,
    leoPreferredStyle: intake === "leo" && snap ? snap.preferredStyle : undefined,
    leoEmphasis: intake === "leo" && snap ? snap.emphasis : undefined,
    leoBackStyle: intake === "leo" && snap ? snap.backStyle : undefined,
    leoColorsNote: intake === "leo" && snap ? snap.preferredColorsNote : undefined,
    frontFieldLinesEs: frontLines.map((l) => l.es),
    frontFieldLinesEn: frontLines.map((l) => l.en),
    backFieldLinesEs: backLines.map((l) => l.es),
    backFieldLinesEn: backLines.map((l) => l.en),
    frontLogoVisible: !!front.logo?.visible,
    backLogoVisible: !!back.logo?.visible,
    frontLogoHasDataUrl: !!(front.logo?.previewUrl && String(front.logo.previewUrl).startsWith("data:")),
    backLogoHasDataUrl: !!(back.logo?.previewUrl && String(back.logo.previewUrl).startsWith("data:")),
    designOnlineExportPixelRatio: BUSINESS_CARD_PNG_EXPORT_PIXEL_RATIO,
    approval: { ...approval },
  };
}

/** Builds the v3 design-online session payload (logos already resolved to data URLs or other preview strings). */
export function toBusinessCardSessionPayloadV3Design(
  doc: BusinessCardDocument,
  resolvedLogos: { front: string | null; back: string | null },
  savedAt?: string
): BusinessCardSessionPayloadV3Design {
  return {
    v: 3,
    mode: "design-online",
    savedAt: savedAt ?? new Date().toISOString(),
    productSlug: doc.productSlug,
    sidedness: doc.sidedness,
    canvasBackground: doc.canvasBackground,
    designIntake: doc.designIntake,
    selectedTemplateId: doc.selectedTemplateId,
    leoSnapshot: doc.leoSnapshot && isBusinessCardLeoSnapshot(doc.leoSnapshot) ? doc.leoSnapshot : undefined,
    textNudgeX: doc.textNudgeX,
    textNudgeY: doc.textNudgeY,
    logoNudgeX: doc.logoNudgeX,
    logoNudgeY: doc.logoNudgeY,
    front: {
      fields: doc.front.fields,
      textLayout: doc.front.textLayout,
      logo: {
        visible: doc.front.logo.visible,
        position: doc.front.logo.position,
        scale: doc.front.logo.scale,
        previewUrl: resolvedLogos.front,
        naturalWidth: doc.front.logo.naturalWidth,
        naturalHeight: doc.front.logo.naturalHeight,
      },
      textBlocks: doc.front.textBlocks,
      logoGeom: doc.front.logoGeom,
      designerV2NativeObjects: doc.front.designerV2NativeObjects ?? [],
    },
    back: {
      fields: doc.back.fields,
      textLayout: doc.back.textLayout,
      logo: {
        visible: doc.back.logo.visible,
        position: doc.back.logo.position,
        scale: doc.back.logo.scale,
        previewUrl: resolvedLogos.back,
        naturalWidth: doc.back.logo.naturalWidth,
        naturalHeight: doc.back.logo.naturalHeight,
      },
      textBlocks: doc.back.textBlocks,
      logoGeom: doc.back.logoGeom,
      designerV2NativeObjects: doc.back.designerV2NativeObjects ?? [],
    },
    approval: doc.approval,
  };
}

export function extractBusinessCardSubmissionExtra(
  expectedSlug: string,
  raw: unknown
): BusinessCardSubmissionExtra | null {
  if (!raw || typeof raw !== "object") return null;
  if ((raw as { productSlug?: string }).productSlug !== expectedSlug) return null;

  if (isBusinessCardSessionUpload(raw)) {
    const fm = raw.frontMeta;
    if (!fm) return null;
    return {
      creationMode: "upload-existing",
      sidedness: raw.sidedness,
      frontFieldLinesEs: [],
      frontFieldLinesEn: [],
      backFieldLinesEs: [],
      backFieldLinesEn: [],
      frontLogoVisible: false,
      backLogoVisible: false,
      frontLogoHasDataUrl: false,
      backLogoHasDataUrl: false,
      approval: { ...raw.approval },
      uploadArtwork: {
        front: {
          name: fm.name,
          mime: fm.mime,
          sizeBytes: fm.sizeBytes,
          widthPx: fm.widthPx,
          heightPx: fm.heightPx,
          sessionHadInlinePreview: !!fm.dataUrl,
        },
        back:
          raw.sidedness === "two-sided" && raw.backMeta
            ? {
                name: raw.backMeta.name,
                mime: raw.backMeta.mime,
                sizeBytes: raw.backMeta.sizeBytes,
                widthPx: raw.backMeta.widthPx,
                heightPx: raw.backMeta.heightPx,
                sessionHadInlinePreview: !!raw.backMeta.dataUrl,
              }
            : null,
      },
      rawValidationSnapshot: raw.validationSnapshot ?? [],
    };
  }

  if (isBusinessCardSessionDesign(raw)) {
    return extractExtraDesign(expectedSlug, raw.sidedness, raw.front, raw.back, raw.approval, {
      designIntake: raw.designIntake,
      selectedTemplateId: raw.selectedTemplateId,
      leoSnapshot: isBusinessCardLeoSnapshot(raw.leoSnapshot) ? raw.leoSnapshot : null,
    });
  }

  if (isBusinessCardSessionPayloadV2(raw)) {
    return extractExtraDesign(expectedSlug, raw.sidedness, raw.front, raw.back, raw.approval);
  }

  return null;
}
