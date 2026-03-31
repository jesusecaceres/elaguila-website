import type {
  BusinessCardDocument,
  BusinessCardProductSlug,
  BusinessCardSideState,
  BusinessCardTextFields,
  LayoutPreset,
  ScalePreset,
} from "../product-configurators/business-cards/types";
import { isBusinessCardSessionPayloadV2, type BusinessCardSessionPayloadV2 } from "./mappers/businessCardDocumentToReview";

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

function toSide(stored: BusinessCardSessionPayloadV2["front"]): BusinessCardSideState {
  const logo = stored.logo;
  return {
    fields: mergeFields(stored.fields ?? {}),
    textLayout: stored.textLayout,
    logo: {
      id: "logo",
      visible: logo?.visible ?? false,
      position: (logo?.position ?? "top-center") as LayoutPreset,
      scale: (logo?.scale ?? "md") as ScalePreset,
      file: null,
      previewUrl: logo?.previewUrl ?? null,
      naturalWidth: logo?.naturalWidth ?? null,
      naturalHeight: logo?.naturalHeight ?? null,
    },
  };
}

export function hydrateBusinessCardDocumentFromSession(slug: string, raw: unknown): BusinessCardDocument | null {
  if (!isBusinessCardSessionPayloadV2(raw)) return null;
  if (raw.productSlug !== slug) return null;

  return {
    id: `tienda-session-${slug}`,
    version: 2,
    productSlug: raw.productSlug as BusinessCardProductSlug,
    sidedness: raw.sidedness,
    activeSide: "front",
    guidesVisible: false,
    textNudgeX: raw.textNudgeX ?? 0,
    textNudgeY: raw.textNudgeY ?? 0,
    logoNudgeX: raw.logoNudgeX ?? 0,
    logoNudgeY: raw.logoNudgeY ?? 0,
    front: toSide(raw.front),
    back: toSide(raw.back),
    approval: raw.approval,
  };
}
