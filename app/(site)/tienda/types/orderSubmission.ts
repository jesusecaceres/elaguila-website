/**
 * Tienda order submission contract — email MVP, future Stripe/DB compatible.
 */

import type { Lang } from "./tienda";
import type {
  TiendaAssetSummaryKind,
  TiendaFulfillmentPreference,
  TiendaLocalizedLine,
  TiendaOrderSource,
  TiendaCustomerDetails,
} from "./orderHandoff";
import type { TiendaOrderAssetReference } from "./tiendaStoredAssets";

export type TiendaOrderSubmissionStatus = "received" | "failed";

/** Customer block — alias of handoff customer for a stable submission contract name. */
export type TiendaOrderCustomerDetails = TiendaCustomerDetails;

export type TiendaOrderAssetSummary = {
  id: string;
  kind: TiendaAssetSummaryKind;
  labelEs: string;
  labelEn: string;
  metaLinesEs: string[];
  metaLinesEn: string[];
  /** Browser session had a data URL preview; file bytes are never sent to the API. */
  hadInlinePreviewHint: boolean;
};

export type BusinessCardSubmissionExtra = {
  creationMode: "design-online" | "upload-existing";
  sidedness: "one-sided" | "two-sided";
  /** Present for design-online: template-first path vs LEO vs full custom builder. */
  designIntake?: "template" | "custom" | "leo" | "refresh";
  /** Leonix template slug when designIntake is template or leo. */
  templateSlug?: string;
  /** LEO intake notes when `designIntake` is `leo`. */
  leoProfession?: string;
  leoPreferredStyle?: string;
  leoEmphasis?: string;
  leoBackStyle?: string;
  leoColorsNote?: string;
  templateTitleEs?: string;
  templateTitleEn?: string;
  frontFieldLinesEs: string[];
  frontFieldLinesEn: string[];
  backFieldLinesEs: string[];
  backFieldLinesEn: string[];
  frontLogoVisible: boolean;
  backLogoVisible: boolean;
  frontLogoHasDataUrl: boolean;
  backLogoHasDataUrl: boolean;
  approval: {
    spellingReviewed: boolean;
    layoutReviewed: boolean;
    printAsApproved: boolean;
    noRedesignExpectation: boolean;
  };
  /** Present when customers upload press-ready artwork instead of using the online builder. */
  uploadArtwork?: {
    front: {
      name: string;
      mime: string;
      sizeBytes: number;
      widthPx: number | null;
      heightPx: number | null;
      sessionHadInlinePreview: boolean;
    };
    back: null | {
      name: string;
      mime: string;
      sizeBytes: number;
      widthPx: number | null;
      heightPx: number | null;
      sessionHadInlinePreview: boolean;
    };
  };
  rawValidationSnapshot?: Array<{ severity: string; messageEs: string; messageEn: string }>;
  /** Set for design-online orders: PNG export scale from the builder (reference raster only). */
  designOnlineExportPixelRatio?: number;
};

export type PrintUploadSubmissionExtra = {
  front: {
    name: string;
    mime: string;
    sizeBytes: number;
    widthPx: number | null;
    heightPx: number | null;
    sessionHadInlinePreview: boolean;
  };
  back: null | {
    name: string;
    mime: string;
    sizeBytes: number;
    widthPx: number | null;
    heightPx: number | null;
    sessionHadInlinePreview: boolean;
  };
  rawValidationSnapshot: Array<{ severity: string; messageEs: string; messageEn: string }>;
};

/** JSON body from the browser — orderId from POST /api/tienda/orders/prepare after durable uploads. */
export type TiendaOrderSubmissionPayload = {
  v: 2;
  orderId: string;
  source: TiendaOrderSource;
  productSlug: string;
  productTitleEs: string;
  productTitleEn: string;
  categorySlug: string;
  specLines: TiendaLocalizedLine[];
  sidednessSummary: TiendaLocalizedLine;
  assets: TiendaOrderAssetSummary[];
  customer: TiendaOrderCustomerDetails;
  fulfillment: TiendaFulfillmentPreference;
  approvalStatus: TiendaLocalizedLine;
  approvalDetails: TiendaLocalizedLine[];
  warnings: TiendaLocalizedLine[];
  builderSavedAt: string | null;
  businessCardExtra?: BusinessCardSubmissionExtra;
  printUploadExtra?: PrintUploadSubmissionExtra;
  preferredLang: Lang;
};

/** Persistable snapshot after acceptance (e.g. future queue/DB). */
export type TiendaOrderSubmission = {
  submissionVersion: 2;
  orderId: string;
  status: TiendaOrderSubmissionStatus;
  createdAtIso: string;
  payload: TiendaOrderSubmissionPayload;
};

export type TiendaOrderSubmissionResult =
  | {
      ok: true;
      orderId: string;
      submittedAt: string;
      durableAssets?: TiendaOrderAssetReference[];
      /** False when the order was stored but Resend failed — staff still see it in admin. */
      emailDelivered?: boolean;
      emailError?: string;
    }
  | { ok: false; error: string; code?: string };
