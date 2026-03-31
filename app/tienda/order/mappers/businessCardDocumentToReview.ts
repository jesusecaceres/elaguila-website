import type { TextFieldRole } from "../../product-configurators/business-cards/types";
import type { TiendaOrderReviewSummary, TiendaLocalizedLine } from "../../types/orderHandoff";
import type { BusinessCardSubmissionExtra } from "../../types/orderSubmission";
import { tiendaProductFamilies } from "../../data/tiendaProductFamilies";

const BC_SESSION_KEY_PREFIX = "leonix-bc-draft-";

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
  textLayout: import("../../product-configurators/business-cards/types").BusinessCardTextLayout;
  logo: StoredLogo;
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
  approval: {
    spellingReviewed: boolean;
    layoutReviewed: boolean;
    printAsApproved: boolean;
    noRedesignExpectation: boolean;
  };
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

export function isBusinessCardSessionPayloadV2(x: unknown): x is BusinessCardSessionPayloadV2 {
  if (!x || typeof x !== "object") return false;
  const o = x as BusinessCardSessionPayloadV2;
  return o.v === 2 && typeof o.productSlug === "string" && (o.sidedness === "one-sided" || o.sidedness === "two-sided");
}

function fieldRoles(): TextFieldRole[] {
  return ["personName", "title", "company", "phone", "email", "website", "address", "tagline"];
}

function sideTextSummary(side: StoredSidePayload, sideLabel: TiendaLocalizedLine): TiendaLocalizedLine[] {
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

export function mapBusinessCardSessionToReview(
  expectedSlug: string,
  raw: unknown
): TiendaOrderReviewSummary | null {
  if (!isBusinessCardSessionPayloadV2(raw)) return null;
  if (raw.productSlug !== expectedSlug) return null;

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
    assetItems.push({
      id: "bc-back",
      kind: "design-side",
      label: { es: "Diseño — reverso", en: "Design — back" },
      thumbnailUrl: raw.back.logo?.previewUrl ?? null,
      metaLines: backMeta,
    });
  }

  const approvalAll =
    raw.approval.spellingReviewed &&
    raw.approval.layoutReviewed &&
    raw.approval.printAsApproved &&
    raw.approval.noRedesignExpectation;

  const approvalDetails: TiendaLocalizedLine[] = [
    {
      es: raw.approval.spellingReviewed ? "Ortografía revisada" : "Ortografía: pendiente en guardado",
      en: raw.approval.spellingReviewed ? "Spelling reviewed" : "Spelling: pending at save",
    },
    {
      es: raw.approval.layoutReviewed ? "Diseño revisado" : "Diseño: pendiente en guardado",
      en: raw.approval.layoutReviewed ? "Layout reviewed" : "Layout: pending at save",
    },
    {
      es: raw.approval.printAsApproved ? "Impresión según aprobado" : "Impresión: pendiente en guardado",
      en: raw.approval.printAsApproved ? "Print as approved" : "Print: pending at save",
    },
    {
      es: raw.approval.noRedesignExpectation ? "Sin rediseño incluido" : "Expectativas: pendiente en guardado",
      en: raw.approval.noRedesignExpectation ? "No redesign included" : "Expectations: pending at save",
    },
  ];

  const companyHint =
    String(raw.front.fields?.company ?? "")
      .trim() ||
    String(raw.back.fields?.company ?? "")
      .trim() ||
    null;

  return {
    source: "business-cards",
    productSlug: expectedSlug,
    productTitle: { es: family.title.es, en: family.title.en },
    categorySlug: family.categorySlug,
    sidednessSummary,
    specLines,
    assets: assetItems,
    approvalStatus: approvalAll
      ? { es: "Aprobación del constructor completa", en: "Builder approval complete" }
      : { es: "Revisa el constructor: aprobación incompleta al guardar", en: "Return to builder: approval incomplete at save" },
    approvalDetails,
    warnings: [],
    builderSavedAt: raw.savedAt ?? null,
    prefillBusinessName: companyHint,
  };
}

export function extractBusinessCardSubmissionExtra(
  expectedSlug: string,
  raw: unknown
): BusinessCardSubmissionExtra | null {
  if (!isBusinessCardSessionPayloadV2(raw)) return null;
  if (raw.productSlug !== expectedSlug) return null;

  const frontLabel: TiendaLocalizedLine = { es: "Frente", en: "Front" };
  const backLabel: TiendaLocalizedLine = { es: "Reverso", en: "Back" };

  const frontLines = sideTextSummary(raw.front, frontLabel);
  const backLines = raw.sidedness === "two-sided" ? sideTextSummary(raw.back, backLabel) : [];

  return {
    sidedness: raw.sidedness,
    frontFieldLinesEs: frontLines.map((l) => l.es),
    frontFieldLinesEn: frontLines.map((l) => l.en),
    backFieldLinesEs: backLines.map((l) => l.es),
    backFieldLinesEn: backLines.map((l) => l.en),
    frontLogoVisible: !!raw.front.logo?.visible,
    backLogoVisible: !!raw.back.logo?.visible,
    frontLogoHasDataUrl: !!(raw.front.logo?.previewUrl && String(raw.front.logo.previewUrl).startsWith("data:")),
    backLogoHasDataUrl: !!(raw.back.logo?.previewUrl && String(raw.back.logo.previewUrl).startsWith("data:")),
    approval: { ...raw.approval },
  };
}
