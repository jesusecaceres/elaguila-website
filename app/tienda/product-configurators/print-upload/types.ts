/**
 * Print-upload configurator — job/document model + validation.
 */

export type AcceptedMime =
  | "application/pdf"
  | "image/tiff"
  | "image/png"
  | "image/jpeg"
  | "application/postscript";

export type UploadValidationCode =
  | "LOW_RESOLUTION"
  | "MISSING_BLEED"
  | "MISSING_FONTS"
  | "RGB_INSTEAD_OF_CMYK"
  | "DIMENSION_MISMATCH"
  | "FILE_TOO_LARGE";

export type UploadValidationFinding = {
  code: UploadValidationCode;
  severity: "info" | "warning" | "blocking";
  messageKey: string;
};

export type OriginalFilePolicy = {
  preserveOriginal: true;
  generatePreviewDerivative: boolean;
};

export type CustomerAgreementRequirement = {
  id: "print-as-submitted";
  labelKey: string;
  required: true;
};

export type PrintUploadJobSpec = {
  id: string;
  acceptedTypes: AcceptedMime[];
  maxFileMb: number;
  sidedness: "one-sided" | "two-sided" | "unknown";
  agreements: CustomerAgreementRequirement[];
  policy: OriginalFilePolicy;
  futureChecks: readonly UploadValidationCode[];
};

/** Supported product slugs for this configurator */
export type PrintUploadProductSlug =
  | "flyers-standard"
  | "brochures-standard"
  | "retractable-banners"
  | "yard-signs"
  | "stickers-standard";

export type PrintUploadFileSlot = "front" | "back";

export type PrintUploadFile = {
  /** Stable id for React keys */
  id: string;
  slot: PrintUploadFileSlot;
  /** Original file — preserved for future pipeline */
  file: File;
  previewUrl: string | null;
  mime: string;
  sizeBytes: number;
  name: string;
  widthPx: number | null;
  heightPx: number | null;
};

export type PrintUploadSpecSelection = {
  quantity: number;
  sizeId: string;
  stockId: string;
  sidesId: string;
  /** brochures */
  foldId?: string;
  /** stickers / banners / signs */
  materialId?: string;
  finishId?: string;
  shapeId?: string;
};

export type PrintUploadApprovalChecks = {
  reviewedSpecsAndFile: boolean;
  printAsSubmitted: boolean;
  noLeonixLiabilityForArtwork: boolean;
  willContactForDesignHelp: boolean;
};

export type PrintUploadDocument = {
  id: string;
  version: 1;
  productSlug: PrintUploadProductSlug;
  categorySlug: string;
  specs: PrintUploadSpecSelection;
  /** One-sided: only `front`. Two-sided: both required for continue. */
  frontFile: PrintUploadFile | null;
  backFile: PrintUploadFile | null;
  approval: PrintUploadApprovalChecks;
};

export type PrintUploadValidationSeverity = "hard" | "soft";

export type PrintUploadValidationItem = {
  id: string;
  severity: PrintUploadValidationSeverity;
  messageEs: string;
  messageEn: string;
};

export type PrintUploadValidationResult = {
  items: PrintUploadValidationItem[];
  hardCount: number;
  softCount: number;
  hasBlockingIssues: boolean;
  approvalComplete: boolean;
  canContinue: boolean;
};

export type SpecOptionSize = {
  id: string;
  labelEs: string;
  labelEn: string;
  /** Nominal trim in inches for resolution proxy */
  widthIn: number;
  heightIn: number;
};

export type SpecOption = {
  id: string;
  labelEs: string;
  labelEn: string;
  noteEs?: string;
  noteEn?: string;
};

/** Single PDF vs separate front/back when customer picks two-sided */
export type PrintUploadSideUploadMode = "single-file-only" | "second-when-two-sided";

export type PrintUploadProductConfig = {
  slug: PrintUploadProductSlug;
  categorySlug: string;
  sideUploadMode: PrintUploadSideUploadMode;
  defaults: PrintUploadSpecSelection;
  quantities: number[];
  sizes: SpecOptionSize[];
  stocks: SpecOption[];
  sides: SpecOption[];
  folds?: SpecOption[];
  materials?: SpecOption[];
  finishes?: SpecOption[];
  shapes?: SpecOption[];
  /** Summary line shown under product title */
  specSimplificationNote: { es: string; en: string };
};
