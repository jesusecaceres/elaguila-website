/**
 * Future Leonix business card builder — types only (no live editor in this pass).
 */

export type BusinessCardSide = "front" | "back";

export type CanvasBleedPt = {
  /** Bleed in points (1/72 inch) */
  bleedPt: number;
  /** Safe inset from trim */
  safeInsetPt: number;
  trimWidthPt: number;
  trimHeightPt: number;
};

export type TextFieldRole =
  | "name"
  | "title"
  | "company"
  | "phone"
  | "email"
  | "website"
  | "address"
  | "tagline"
  | "custom";

export type TextBlockDefinition = {
  id: string;
  role: TextFieldRole;
  labelKey: string;
  maxChars?: number;
  required?: boolean;
};

export type ImageBlockRole = "logo" | "photo" | "qr" | "custom";

export type ImageBlockDefinition = {
  id: string;
  role: ImageBlockRole;
  /** Max upload size hint (MB) — enforcement comes later */
  maxMb?: number;
  required?: boolean;
};

export type ApprovalGate = {
  requiresCustomerApproval: true;
  requiresLeonixApproval?: boolean;
  /** Customer must confirm spelling, colors, trim */
  confirmationLabels: readonly string[];
};

export type BusinessCardBuilderDocument = {
  id: string;
  version: 1;
  activeSide: BusinessCardSide;
  canvas: CanvasBleedPt;
  textBlocks: TextBlockDefinition[];
  imageBlocks: ImageBlockDefinition[];
  guidesVisible: boolean;
  approval: ApprovalGate;
};
