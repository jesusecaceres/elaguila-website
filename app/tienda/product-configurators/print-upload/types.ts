/**
 * Future print-ready upload pipeline — types only.
 */

export type AcceptedMime =
  | "application/pdf"
  | "image/tiff"
  | "image/png"
  | "image/jpeg"
  | "application/postscript";

export type Sidedness = "one-sided" | "two-sided" | "unknown";

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
  /** Store original uploads for re-output / disputes */
  preserveOriginal: true;
  /** Separate lo-res preview for UI vs print master */
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
  sidedness: Sidedness;
  agreements: CustomerAgreementRequirement[];
  policy: OriginalFilePolicy;
  /** Server-side checks to implement later */
  futureChecks: readonly UploadValidationCode[];
};
