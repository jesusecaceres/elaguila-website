import type {
  AutoDealerListing,
  MediaImageEntry,
  VehicleBadge,
} from "@/app/(site)/clasificados/autos/negocios/types/autoDealerListing";
import { buildVehicleTitle } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "./autosDealerInventoryPolicy";

export type AutosInventoryVehicleDraftStatus = "draft" | "ready_for_preview";

/** Vehicle-only fields stored for an additional inventory item (no dealer/business duplication). */
export type AutosInventoryVehicleFields = Pick<
  AutoDealerListing,
  | "vehicleTitle"
  | "year"
  | "make"
  | "model"
  | "trim"
  | "condition"
  | "price"
  | "monthlyEstimate"
  | "mileage"
  | "city"
  | "state"
  | "zip"
  | "vin"
  | "stockNumber"
  | "exteriorColor"
  | "exteriorColorCustom"
  | "interiorColor"
  | "interiorColorCustom"
  | "bodyStyle"
  | "bodyStyleCustom"
  | "drivetrain"
  | "drivetrainCustom"
  | "transmission"
  | "transmissionCustom"
  | "engine"
  | "engineNormalized"
  | "fuelType"
  | "fuelTypeCustom"
  | "mpgCity"
  | "mpgHighway"
  | "doors"
  | "seats"
  | "titleStatus"
  | "titleStatusCustom"
  | "badges"
  | "features"
  | "customEquipment"
  | "otherEquipmentDetails"
  | "mediaImages"
  | "heroImages"
  | "videoUrl"
  | "videoSourceType"
  | "videoFileDataUrl"
  | "videoFileName"
  | "videoUploadStatus"
  | "description"
>;

export type AutosAdditionalInventoryVehicleDraft = AutosInventoryVehicleFields & {
  id: string;
  inventoryRole: "additional";
  status: AutosInventoryVehicleDraftStatus;
  vehicleTitleOverride?: boolean;
  createdAt: string;
  updatedAt: string;
  /** @deprecated Migrated to mediaImages on load. */
  imageUrl?: string;
};

export function newAdditionalInventoryVehicleId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyInventoryVehicleDraft(id = newAdditionalInventoryVehicleId()): AutosAdditionalInventoryVehicleDraft {
  const now = new Date().toISOString();
  return {
    id,
    inventoryRole: "additional",
    status: "draft",
    vehicleTitleOverride: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function countApplicationInventoryVehicles(additionalCount: number): number {
  return 1 + Math.max(0, additionalCount);
}

export function applicationInventoryRemainingSlots(
  additionalCount: number,
  limit = STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
): number {
  return Math.max(0, limit - countApplicationInventoryVehicles(additionalCount));
}

export function applicationCanAddInventoryVehicle(
  additionalCount: number,
  limit = STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
): boolean {
  return countApplicationInventoryVehicles(additionalCount) < limit;
}

function strOrUndef(v: unknown): string | undefined {
  return typeof v === "string" ? v.trim() || undefined : undefined;
}

function numOrUndef(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function badgeArray(v: unknown): VehicleBadge[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.filter((x): x is VehicleBadge => typeof x === "string");
}

function mediaArray(v: unknown): MediaImageEntry[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: MediaImageEntry[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const m = item as Record<string, unknown>;
    const url = strOrUndef(m.url);
    const id = strOrUndef(m.id);
    if (!url || !id) continue;
    out.push({
      id,
      url,
      sourceType: m.sourceType === "file" ? "file" : "url",
      isPrimary: m.isPrimary === true,
      sortOrder: typeof m.sortOrder === "number" ? m.sortOrder : out.length,
    });
  }
  return out.length ? out : undefined;
}

function migrateLegacyImageUrl(o: Record<string, unknown>): MediaImageEntry[] | undefined {
  const existing = mediaArray(o.mediaImages);
  if (existing?.length) return existing;
  const legacy = strOrUndef(o.imageUrl);
  if (!legacy) return undefined;
  return [
    {
      id: newAdditionalInventoryVehicleId(),
      url: legacy,
      sourceType: "url",
      isPrimary: true,
      sortOrder: 0,
    },
  ];
}

function normalizeOneItem(raw: unknown): AutosAdditionalInventoryVehicleDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = strOrUndef(o.id) ?? newAdditionalInventoryVehicleId();
  const createdAt = strOrUndef(o.createdAt) ?? new Date().toISOString();
  const updatedAt = strOrUndef(o.updatedAt) ?? createdAt;
  const mediaImages = migrateLegacyImageUrl(o);
  const status: AutosInventoryVehicleDraftStatus =
    o.status === "ready_for_preview" ? "ready_for_preview" : "draft";

  const draft: AutosAdditionalInventoryVehicleDraft = {
    id,
    inventoryRole: "additional",
    status,
    vehicleTitleOverride: o.vehicleTitleOverride === true,
    createdAt,
    updatedAt,
    vehicleTitle: strOrUndef(o.vehicleTitle),
    year: numOrUndef(o.year),
    make: strOrUndef(o.make),
    model: strOrUndef(o.model),
    trim: strOrUndef(o.trim),
    condition:
      o.condition === "new" || o.condition === "used" || o.condition === "certified" ? o.condition : undefined,
    price: numOrUndef(o.price),
    monthlyEstimate: o.monthlyEstimate === null ? null : strOrUndef(o.monthlyEstimate) ?? undefined,
    mileage: numOrUndef(o.mileage),
    city: strOrUndef(o.city),
    state: strOrUndef(o.state),
    zip: strOrUndef(o.zip),
    vin: strOrUndef(o.vin),
    stockNumber: strOrUndef(o.stockNumber),
    exteriorColor: strOrUndef(o.exteriorColor),
    exteriorColorCustom: strOrUndef(o.exteriorColorCustom),
    interiorColor: strOrUndef(o.interiorColor),
    interiorColorCustom: strOrUndef(o.interiorColorCustom),
    bodyStyle: strOrUndef(o.bodyStyle),
    bodyStyleCustom: strOrUndef(o.bodyStyleCustom),
    drivetrain: strOrUndef(o.drivetrain),
    drivetrainCustom: strOrUndef(o.drivetrainCustom),
    transmission: strOrUndef(o.transmission),
    transmissionCustom: strOrUndef(o.transmissionCustom),
    engine: strOrUndef(o.engine),
    engineNormalized: strOrUndef(o.engineNormalized),
    fuelType: strOrUndef(o.fuelType),
    fuelTypeCustom: strOrUndef(o.fuelTypeCustom),
    mpgCity: o.mpgCity === null ? null : numOrUndef(o.mpgCity),
    mpgHighway: o.mpgHighway === null ? null : numOrUndef(o.mpgHighway),
    doors: numOrUndef(o.doors),
    seats: numOrUndef(o.seats),
    titleStatus: strOrUndef(o.titleStatus),
    titleStatusCustom: strOrUndef(o.titleStatusCustom),
    badges: badgeArray(o.badges),
    features: Array.isArray(o.features) ? o.features.filter((x): x is string => typeof x === "string") : undefined,
    customEquipment: Array.isArray(o.customEquipment)
      ? o.customEquipment.filter((x): x is string => typeof x === "string")
      : undefined,
    otherEquipmentDetails: o.otherEquipmentDetails === null ? null : strOrUndef(o.otherEquipmentDetails) ?? undefined,
    mediaImages,
    heroImages: Array.isArray(o.heroImages) ? o.heroImages.filter((x): x is string => typeof x === "string") : undefined,
    videoUrl: o.videoUrl === null ? null : strOrUndef(o.videoUrl) ?? undefined,
    videoSourceType:
      o.videoSourceType === "url" || o.videoSourceType === "file" ? o.videoSourceType : o.videoUrl ? "url" : null,
    videoFileDataUrl: o.videoFileDataUrl === null ? null : strOrUndef(o.videoFileDataUrl) ?? undefined,
    videoFileName: o.videoFileName === null ? null : strOrUndef(o.videoFileName) ?? undefined,
    videoUploadStatus:
      o.videoUploadStatus === "local_preview" ||
      o.videoUploadStatus === "pending_mux" ||
      o.videoUploadStatus === "ready" ||
      o.videoUploadStatus === "error"
        ? o.videoUploadStatus
        : null,
    description: strOrUndef(o.description),
  };

  return { ...draft, status: computeInventoryVehicleStatus(draft) };
}

export function normalizeAdditionalInventoryVehicles(raw: unknown): AutosAdditionalInventoryVehicleDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeOneItem).filter((x): x is AutosAdditionalInventoryVehicleDraft => x !== null);
}

export function computeInventoryVehicleStatus(
  draft: Pick<AutosAdditionalInventoryVehicleDraft, "year" | "make" | "model" | "price">,
): AutosInventoryVehicleDraftStatus {
  if (draft.year && draft.make?.trim() && draft.model?.trim() && draft.price !== undefined) {
    return "ready_for_preview";
  }
  return "draft";
}

export function validateInventoryVehicleDraftForSave(
  draft: AutosAdditionalInventoryVehicleDraft,
): boolean {
  return Boolean(draft.year || draft.make?.trim() || draft.model?.trim());
}

export function inventoryVehicleDraftToListingSlice(draft: AutosAdditionalInventoryVehicleDraft): AutoDealerListing {
  const { id: _id, inventoryRole: _r, status: _s, vehicleTitleOverride: _o, createdAt: _c, updatedAt: _u, imageUrl: _legacy, ...vehicle } =
    draft;
  return { autosLane: "negocios", ...vehicle };
}

export function applyVehicleTitleToDraft(
  draft: AutosAdditionalInventoryVehicleDraft,
  override: boolean,
): AutosAdditionalInventoryVehicleDraft {
  if (override) return draft;
  const t = buildVehicleTitle(draft.year, draft.make, draft.model, draft.trim);
  return { ...draft, vehicleTitle: t || undefined };
}

export function prepareInventoryVehicleForSave(
  draft: AutosAdditionalInventoryVehicleDraft,
): AutosAdditionalInventoryVehicleDraft {
  const withTitle = applyVehicleTitleToDraft(draft, draft.vehicleTitleOverride === true);
  const now = new Date().toISOString();
  return {
    ...withTitle,
    updatedAt: now,
    status: computeInventoryVehicleStatus(withTitle),
  };
}

export function inventoryVehicleCoverUrl(draft: AutosAdditionalInventoryVehicleDraft): string | null {
  const primary = draft.mediaImages?.find((m) => m.isPrimary)?.url ?? draft.mediaImages?.[0]?.url;
  if (primary?.trim()) return primary.trim();
  if (draft.imageUrl?.trim()) return draft.imageUrl.trim();
  return draft.heroImages?.[0]?.trim() || null;
}

export function inventoryVehiclePhotoCount(draft: AutosAdditionalInventoryVehicleDraft): number {
  return draft.mediaImages?.length ?? (draft.imageUrl ? 1 : 0);
}

export function additionalInventoryVehicleTitle(draft: AutosAdditionalInventoryVehicleDraft): string {
  if (draft.vehicleTitle?.trim()) return draft.vehicleTitle.trim();
  const built = buildVehicleTitle(draft.year, draft.make, draft.model, draft.trim);
  if (built) return built;
  const parts = [draft.year, draft.make, draft.model, draft.trim].filter(
    (x) => x !== undefined && String(x).trim() !== "",
  );
  return parts.map(String).join(" ").trim() || (draft.make ?? draft.model ?? "—");
}

/** Future analytics hooks — not wired in this gate. */
export const AUTOS_INVENTORY_ANALYTICS_EVENTS = [
  "add_inventory_clicked",
  "inventory_drawer_opened",
  "inventory_vehicle_step_completed",
  "inventory_vehicle_saved",
  "inventory_save_and_add_another",
  "inventory_vehicle_edited",
  "inventory_vehicle_removed",
  "inventory_preview_seen",
  "inventory_bundle_publish_started",
  "inventory_bundle_publish_completed",
  "result_card_click",
  "detail_view",
  "call_click",
  "message_click",
  "whatsapp_click",
  "email_click",
  "website_click",
  "directions_click",
  "google_review_click",
  "yelp_review_click",
  "social_click",
  "inventory_vehicle_click",
] as const;

/** Dealer/business fields that must never appear in the child vehicle drawer form. */
export const AUTOS_INVENTORY_DEALER_FIELD_BLOCKLIST = [
  "dealerName",
  "dealerLogo",
  "dealerPhoneOffice",
  "dealerWhatsapp",
  "dealerSmsPhone",
  "dealerEmail",
  "dealerWebsite",
  "dealerBookingUrl",
  "financeContactName",
  "googleReviewsUrl",
  "dealerCustomLinks",
  "dealerHours",
] as const;
