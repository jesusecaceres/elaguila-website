import type { Lang } from "../../types/tienda";
import type { BusinessCardDocument, BusinessCardImageBlock } from "./types";
import type { BusinessCardSessionPayloadV2 } from "../../order/mappers/businessCardDocumentToReview";
import { createInitialBusinessCardDocument } from "./documentFactory";
import { syncFieldsFromBlocks, syncSideBlocksFromFields } from "./templates";

function mapLogo(stored: BusinessCardSessionPayloadV2["front"]["logo"], fallback: BusinessCardImageBlock): BusinessCardImageBlock {
  return {
    ...fallback,
    visible: stored.visible,
    position: stored.position,
    scale: stored.scale,
    previewUrl: stored.previewUrl,
    naturalWidth: stored.naturalWidth,
    naturalHeight: stored.naturalHeight,
  };
}

/** Upgrades v2 session to v3 document: keeps “modern-centered” block geometry, restores saved text + logos. */
export function migrateBusinessCardV2SessionToDocument(raw: BusinessCardSessionPayloadV2, lang: Lang): BusinessCardDocument {
  const doc = createInitialBusinessCardDocument(raw.productSlug as BusinessCardDocument["productSlug"], lang);
  const front = syncFieldsFromBlocks(
    syncSideBlocksFromFields({
      ...doc.front,
      fields: raw.front.fields as BusinessCardDocument["front"]["fields"],
      textLayout: raw.front.textLayout,
      logo: mapLogo(raw.front.logo, doc.front.logo),
      textBlocks: doc.front.textBlocks.map((b) =>
        b.role !== "custom"
          ? { ...b, text: String(raw.front.fields[b.role as keyof typeof raw.front.fields] ?? "") }
          : b
      ),
    })
  );
  const back = syncFieldsFromBlocks(
    syncSideBlocksFromFields({
      ...doc.back,
      fields: raw.back.fields as BusinessCardDocument["back"]["fields"],
      textLayout: raw.back.textLayout,
      logo: mapLogo(raw.back.logo, doc.back.logo),
      textBlocks: doc.back.textBlocks.map((b) =>
        b.role !== "custom"
          ? { ...b, text: String(raw.back.fields[b.role as keyof typeof raw.back.fields] ?? "") }
          : b
      ),
    })
  );
  return {
    ...doc,
    version: 3,
    textNudgeX: raw.textNudgeX ?? 0,
    textNudgeY: raw.textNudgeY ?? 0,
    logoNudgeX: raw.logoNudgeX ?? 0,
    logoNudgeY: raw.logoNudgeY ?? 0,
    front,
    back,
    approval: raw.approval,
  };
}
