/**
 * Program 6, Gate 6G — Image asset + rights model types.
 * No creative job should treat a URL string as sufficient image truth.
 */

export type AssetKind =
  | "client_logo"
  | "client_photo"
  | "staff_portrait"
  | "product"
  | "food"
  | "building"
  | "service_work"
  | "licensed_stock"
  | "leonix_owned"
  | "creator_supplied"
  | "public_domain"
  | "ai_illustrative"
  | "other";

export type RightsSource =
  | "client_provided"
  | "licensed_stock"
  | "leonix_owned"
  | "creator_supplied"
  | "public_domain"
  | "ai_generated"
  | "unknown";

export type RightsStatus =
  | "verified"
  | "pending_review"
  | "unknown_rights"
  | "restricted"
  | "expired";

export type AuthenticityClassification =
  | "REAL_CLIENT"
  | "LICENSED_STOCK"
  | "AI_ILLUSTRATIVE"
  | "UNKNOWN";

export type AssetApprovalState =
  | "pending"
  | "approved"
  | "rejected";

export type ModelReleaseState = "not_required" | "obtained" | "not_obtained" | "unknown";
export type PropertyReleaseState = "not_required" | "obtained" | "not_obtained" | "unknown";

export interface BusinessCreativeAsset {
  id: string;
  businessId: string;
  jobId: string | null;
  assetKind: AssetKind;
  storageRef: string;
  originalFilename: string;
  mimeType: string;
  pixelWidth: number | null;
  pixelHeight: number | null;
  aspectRatio: number | null;
  fileSizeBytes: number | null;
  sourceUrl: string | null;
  rightsSource: RightsSource;
  rightsStatus: RightsStatus;
  permissionDate: string | null;
  permissionActorAuthUserId: string | null;
  modelReleaseState: ModelReleaseState;
  propertyReleaseState: PropertyReleaseState;
  allowedUses: readonly string[];
  expirationRestriction: string | null;
  authenticityClassification: AuthenticityClassification;
  approvalState: AssetApprovalState;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Rights truth rules ───────────────────────────────────────────────────

export const RIGHTS_TRUTH_RULES: readonly string[] = [
  "REAL_CLIENT: may represent business/product/staff when approved.",
  "LICENSED_STOCK: may be illustrative but must not falsely represent the actual business.",
  "AI_ILLUSTRATIVE: must never be represented as real client staff/location/product/service.",
  "UNKNOWN_RIGHTS: cannot reach APPROVED_FINAL print output.",
];

export function canAssetReachFinalApproval(asset: Pick<BusinessCreativeAsset, "rightsStatus" | "authenticityClassification" | "approvalState">): boolean {
  if (asset.rightsStatus === "unknown_rights") return false;
  if (asset.rightsStatus === "expired") return false;
  if (asset.rightsStatus === "restricted") return false;
  if (asset.approvalState !== "approved") return false;
  return true;
}

export function isAiIllustrativeAsset(asset: Pick<BusinessCreativeAsset, "authenticityClassification">): boolean {
  return asset.authenticityClassification === "AI_ILLUSTRATIVE";
}

export function isRealClientAsset(asset: Pick<BusinessCreativeAsset, "authenticityClassification">): boolean {
  return asset.authenticityClassification === "REAL_CLIENT";
}

// ─── AI illustrative truth rules (Blocker 7) ───────────────────────────────

export function isAiAssetConsistent(asset: Pick<BusinessCreativeAsset, "assetKind" | "rightsSource" | "authenticityClassification">): boolean {
  const isAiKind = asset.assetKind === "ai_illustrative";
  const isAiClass = asset.authenticityClassification === "AI_ILLUSTRATIVE";
  const isAiRights = asset.rightsSource === "ai_generated";

  // If any is AI, all must be AI.
  if (isAiKind || isAiClass) {
    return isAiKind && isAiClass && isAiRights;
  }

  // REAL_CLIENT must not be AI.
  if (asset.authenticityClassification === "REAL_CLIENT") {
    return !isAiKind && !isAiRights;
  }

  return true;
}

export function isAiAssetKindMismatch(asset: Pick<BusinessCreativeAsset, "assetKind" | "rightsSource" | "authenticityClassification">): string | null {
  const isAiKind = asset.assetKind === "ai_illustrative";
  const isAiClass = asset.authenticityClassification === "AI_ILLUSTRATIVE";
  const isAiRights = asset.rightsSource === "ai_generated";

  if (isAiKind && !isAiClass) {
    return "ai_illustrative asset_kind requires AI_ILLUSTRATIVE authenticity_classification";
  }
  if (isAiKind && !isAiRights) {
    return "ai_illustrative asset_kind requires ai_generated rights_source";
  }
  if (isAiClass && !isAiKind) {
    return "AI_ILLUSTRATIVE authenticity requires ai_illustrative asset_kind";
  }
  if (isAiClass && !isAiRights) {
    return "AI_ILLUSTRATIVE authenticity requires ai_generated rights_source";
  }
  if (asset.authenticityClassification === "REAL_CLIENT" && isAiKind) {
    return "REAL_CLIENT authenticity must not have ai_illustrative asset_kind";
  }
  if (asset.authenticityClassification === "REAL_CLIENT" && isAiRights) {
    return "REAL_CLIENT authenticity must not have ai_generated rights_source";
  }
  return null;
}
