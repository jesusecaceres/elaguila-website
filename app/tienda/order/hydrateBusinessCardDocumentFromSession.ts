import {
  DEFAULT_BUSINESS_CARD_TEMPLATE_ID,
  isBusinessCardTemplateId,
} from "../product-configurators/business-cards/businessCardTemplateCatalog";
import { isBusinessCardLeoSnapshot } from "../product-configurators/business-cards/businessCardLeoTypes";
import type {
  BusinessCardDesignIntake,
  BusinessCardDocument,
  BusinessCardProductSlug,
  BusinessCardSideState,
  BusinessCardTextFields,
} from "../product-configurators/business-cards/types";
import { migrateBusinessCardV2SessionToDocument } from "../product-configurators/business-cards/migrateSession";
import {
  isBusinessCardSessionDesign,
  isBusinessCardSessionPayloadV2,
  type BusinessCardSessionPayloadV3Design,
} from "./mappers/businessCardDocumentToReview";
import type { Lang } from "../types/tienda";

const EMPTY_FIELDS: BusinessCardTextFields = {
  personName: "",
  title: "",
  company: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  tagline: "",
};

function mergeFields(partial: Record<string, string>): BusinessCardTextFields {
  return { ...EMPTY_FIELDS, ...partial };
}

function toSideV3(stored: BusinessCardSessionPayloadV3Design["front"]): BusinessCardSideState {
  const logo = stored.logo;
  return {
    fields: mergeFields(stored.fields ?? {}),
    textLayout: stored.textLayout,
    logo: {
      id: "logo",
      visible: logo?.visible ?? false,
      position: logo?.position ?? "top-center",
      scale: logo?.scale ?? "md",
      file: null,
      previewUrl: logo?.previewUrl ?? null,
      naturalWidth: logo?.naturalWidth ?? null,
      naturalHeight: logo?.naturalHeight ?? null,
    },
    textBlocks: stored.textBlocks ?? [],
    logoGeom: stored.logoGeom ?? { xPct: 50, yPct: 28, widthPct: 20, zIndex: 4 },
    designerV2NativeObjects: Array.isArray(stored.designerV2NativeObjects)
      ? stored.designerV2NativeObjects
      : [],
  };
}

function normalizeDesignIntake(raw: BusinessCardSessionPayloadV3Design["designIntake"]): BusinessCardDesignIntake {
  if (raw === "custom") return "custom";
  if (raw === "leo") return "leo";
  return "template";
}

function documentFromV3Design(slug: string, raw: BusinessCardSessionPayloadV3Design): BusinessCardDocument {
  const tid =
    raw.selectedTemplateId && isBusinessCardTemplateId(raw.selectedTemplateId)
      ? raw.selectedTemplateId
      : DEFAULT_BUSINESS_CARD_TEMPLATE_ID;
  return {
    id: `tienda-session-${slug}`,
    version: 3,
    productSlug: raw.productSlug as BusinessCardProductSlug,
    sidedness: raw.sidedness,
    designIntake: normalizeDesignIntake(raw.designIntake),
    leoSnapshot: isBusinessCardLeoSnapshot(raw.leoSnapshot) ? raw.leoSnapshot : undefined,
    selectedTemplateId: tid,
    activeSide: "front",
    guidesVisible: false,
    canvasBackground: raw.canvasBackground,
    textNudgeX: raw.textNudgeX ?? 0,
    textNudgeY: raw.textNudgeY ?? 0,
    logoNudgeX: raw.logoNudgeX ?? 0,
    logoNudgeY: raw.logoNudgeY ?? 0,
    front: toSideV3(raw.front),
    back: toSideV3(raw.back),
    approval: raw.approval,
  };
}

/** Rehydrates the online builder document from session storage (design paths only). */
export function hydrateBusinessCardDocumentFromSession(slug: string, raw: unknown, lang: Lang): BusinessCardDocument | null {
  if (isBusinessCardSessionDesign(raw)) {
    return documentFromV3Design(slug, raw);
  }
  if (isBusinessCardSessionPayloadV2(raw)) {
    return migrateBusinessCardV2SessionToDocument(raw, lang);
  }
  return null;
}
