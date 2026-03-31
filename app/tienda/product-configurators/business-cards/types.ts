/**
 * Leonix business card builder — document model + validation types.
 */

export type BusinessCardSide = "front" | "back";

export type BusinessCardProductSlug =
  | "standard-business-cards"
  | "two-sided-business-cards";

export type CanvasBleedPt = {
  bleedPt: number;
  safeInsetPt: number;
  trimWidthPt: number;
  trimHeightPt: number;
};

export type TextFieldRole =
  | "personName"
  | "title"
  | "company"
  | "phone"
  | "email"
  | "website"
  | "address"
  | "tagline";

export type LayoutPreset =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ScalePreset = "sm" | "md" | "lg";

export type BusinessCardTextFields = Record<TextFieldRole, string>;

export type BusinessCardTextLayout = {
  groupPosition: LayoutPreset;
  groupScale: ScalePreset;
  /** Per-line visibility on this side */
  lineVisible: Record<TextFieldRole, boolean>;
};

export type BusinessCardImageBlock = {
  id: "logo";
  visible: boolean;
  position: LayoutPreset;
  scale: ScalePreset;
  /** Original file for future upload pipeline */
  file: File | null;
  /** objectURL for preview */
  previewUrl: string | null;
  naturalWidth: number | null;
  naturalHeight: number | null;
};

/** Standard trim-relative placement (0–100, center-based for blocks). */
export type BusinessCardCanvasBackground =
  | { kind: "solid"; color: string }
  | { kind: "preset"; id: "linen" | "pearl" | "graphite" | "sand" };

export type BusinessCardBlockRole = TextFieldRole | "custom";

export type BusinessCardTextBlock = {
  id: string;
  role: BusinessCardBlockRole;
  text: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  color: string;
  textAlign: "left" | "center" | "right";
  zIndex: number;
};

export type BusinessCardLogoGeom = {
  xPct: number;
  yPct: number;
  widthPct: number;
  zIndex: number;
};

export type BusinessCardSideState = {
  fields: BusinessCardTextFields;
  textLayout: BusinessCardTextLayout;
  logo: BusinessCardImageBlock;
  /** V3+ freeform; when non-empty, preview + export use these positions */
  textBlocks: BusinessCardTextBlock[];
  logoGeom: BusinessCardLogoGeom;
};

export type BusinessCardSidedness = "one-sided" | "two-sided";

export type BusinessCardApprovalChecks = {
  spellingReviewed: boolean;
  layoutReviewed: boolean;
  printAsApproved: boolean;
  noRedesignExpectation: boolean;
};

export type BusinessCardDocument = {
  id: string;
  /** 2 = legacy preset-only session; 3 = freeform + canvas */
  version: 2 | 3;
  productSlug: BusinessCardProductSlug;
  sidedness: BusinessCardSidedness;
  activeSide: BusinessCardSide;
  guidesVisible: boolean;
  canvasBackground: BusinessCardCanvasBackground;
  /** Fine nudge -1..1 as % of card width applied to text group (legacy stack mode) */
  textNudgeX: number;
  textNudgeY: number;
  logoNudgeX: number;
  logoNudgeY: number;
  front: BusinessCardSideState;
  back: BusinessCardSideState;
  approval: BusinessCardApprovalChecks;
};

/** @deprecated legacy mock shape — kept for reference */
export type BusinessCardBuilderDocument = {
  id: string;
  version: 1;
  activeSide: BusinessCardSide;
  canvas: CanvasBleedPt;
  textBlocks: Array<{
    id: string;
    role: "name" | "title" | "company" | "phone" | "email" | "website" | "address" | "tagline" | "custom";
    labelKey: string;
    maxChars?: number;
    required?: boolean;
  }>;
  imageBlocks: Array<{
    id: string;
    role: "logo" | "photo" | "qr" | "custom";
    maxMb?: number;
    required?: boolean;
  }>;
  guidesVisible: boolean;
  approval: {
    requiresCustomerApproval: true;
    requiresLeonixApproval?: boolean;
    confirmationLabels: readonly string[];
  };
};

export type ValidationSeverity = "hard" | "soft";

export type BusinessCardValidationItem = {
  id: string;
  severity: ValidationSeverity;
  messageEs: string;
  messageEn: string;
};

export type BusinessCardValidationResult = {
  items: BusinessCardValidationItem[];
  hardCount: number;
  softCount: number;
  hasBlockingContentIssues: boolean;
  approvalComplete: boolean;
  /** Ready for “save / continue” — no content blocks + all approval checks */
  canContinue: boolean;
};
