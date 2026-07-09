import type {
  AutoDealerListing,
  MediaImageEntry,
  VehicleBadge,
} from "@/app/(site)/clasificados/autos/negocios/types/autoDealerListing";
import { buildVehicleTitle } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { normalizeMediaImagesOrder } from "@/app/(site)/clasificados/autos/negocios/lib/autoDealerHeroImages";
import { normalizeAutosVehicleMediaDraft, coerceAutosVehicleMediaImageEntries, expandAutosVehicleMediaSourceFields } from "./autosVehicleMediaDraft";
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
  | "version"
  | "trim2"
  | "series"
  | "series2"
  | "vinDetectedTrim"
  | "condition"
  | "price"
  | "monthlyEstimate"
  | "mileage"
  | "city"
  | "state"
  | "zip"
  | "country"
  | "vin"
  | "stockNumber"
  | "motor"
  | "engineCylinders"
  | "displacementL"
  | "displacementCC"
  | "displacementCI"
  | "engineModel"
  | "engineManufacturer"
  | "engineConfiguration"
  | "engineHP"
  | "engineKW"
  | "turbo"
  | "valveTrain"
  | "vehicleType"
  | "vehicleDescriptor"
  | "bodyClass"
  | "driveType"
  | "transmissionStyle"
  | "transmissionSpeeds"
  | "fuelTypePrimary"
  | "fuelTypeSecondary"
  | "electrificationLevel"
  | "cabType"
  | "bedType"
  | "bedLength"
  | "gvwr"
  | "manufacturer"
  | "manufacturerId"
  | "plantCountry"
  | "plantState"
  | "plantCity"
  | "plantCompanyName"
  | "safetyFeatures"
  | "nhtsaDecode"
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
  | "videoUrls"
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
  /** @deprecated Session/API alias — canonical field is mediaImages (Fotos y medios editor). */
  photos?: MediaImageEntry[];
  /** @deprecated Session/API alias — canonical field is videoUrls (video URL editor). */
  videoLinks?: string[];
  /** @deprecated Session/API alias — use `id` for saved child lookup. */
  childId?: string;
};

/** Resolve stable saved-child id from canonical or alias fields. */
export function resolveAdditionalInventoryVehicleId(
  vehicle: { id?: string; childId?: string } | null | undefined,
): string | null {
  if (!vehicle) return null;
  const id = vehicle.id?.trim() || vehicle.childId?.trim();
  return id || null;
}

export function newAdditionalInventoryVehicleId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Same lookup used by Step 7 card, child preview, and editor hydrate. */
export function findSavedAdditionalInventoryVehicle(
  additional: AutosAdditionalInventoryVehicleDraft[] | null | undefined,
  childId: string | null | undefined,
): AutosAdditionalInventoryVehicleDraft | null {
  const id = childId?.trim();
  if (!id || !additional?.length) return null;
  return additional.find((v) => resolveAdditionalInventoryVehicleId(v) === id) ?? null;
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
  const ordered = coerceAutosVehicleMediaImageEntries(v);
  return ordered.length ? ordered : undefined;
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
  const id = strOrUndef(o.id) ?? strOrUndef(o.childId) ?? newAdditionalInventoryVehicleId();
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
    country: strOrUndef(o.country),
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
    videoUrls: undefined,
    videoUrl: undefined,
    videoSourceType: null,
    videoFileDataUrl: undefined,
    videoFileName: undefined,
    videoUploadStatus: null,
    description: strOrUndef(o.description),
  };

  const media = normalizeAutosVehicleMediaDraft({ ...draft, ...o });
  const withMedia: AutosAdditionalInventoryVehicleDraft = {
    ...draft,
    mediaImages: media.mediaImages,
    heroImages: media.heroImages,
    videoUrls: media.videoUrls,
    videoUrl: media.videoUrl,
    videoSourceType: media.videoSourceType,
    videoFileDataUrl: media.videoFileDataUrl,
    videoFileName: media.videoFileName,
    videoUploadStatus: media.videoUploadStatus,
    photos: media.mediaImages,
    videoLinks: media.videoUrls,
  };
  return hydrateChildInventoryEditorDraft(withMedia);
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
  const expanded = expandAutosVehicleMediaSourceFields(draft) as AutosAdditionalInventoryVehicleDraft;
  const withTitle = applyVehicleTitleToDraft(expanded, expanded.vehicleTitleOverride === true);
  const media = normalizeAutosVehicleMediaDraft(withTitle);
  const now = new Date().toISOString();
  const id = resolveAdditionalInventoryVehicleId(withTitle) ?? newAdditionalInventoryVehicleId();
  return {
    ...withTitle,
    ...media,
    id,
    childId: id,
    inventoryRole: "additional",
    photos: media.mediaImages,
    videoLinks: media.videoUrls,
    updatedAt: now,
    status: computeInventoryVehicleStatus(withTitle),
  };
}

function inventoryDraftContentFingerprint(v: AutosAdditionalInventoryVehicleDraft): string {
  const { updatedAt, createdAt, status, ...rest } = v;
  void updatedAt;
  void createdAt;
  void status;
  return JSON.stringify(rest);
}

/** Hydrate editor form state with canonical child media/video fields (same shape as card + preview). */
export function hydrateChildInventoryEditorDraft(
  draft: AutosAdditionalInventoryVehicleDraft,
): AutosAdditionalInventoryVehicleDraft {
  const expanded = expandAutosVehicleMediaSourceFields(draft) as AutosAdditionalInventoryVehicleDraft;
  const media = normalizeAutosVehicleMediaDraft(expanded);
  const id = resolveAdditionalInventoryVehicleId(expanded) ?? expanded.id;
  return {
    ...draft,
    ...expanded,
    ...media,
    id,
    childId: id,
    inventoryRole: "additional",
    photos: media.mediaImages,
    videoLinks: media.videoUrls,
    status: computeInventoryVehicleStatus({ ...draft, ...media }),
  };
}

/** Alias export for child editor hydrator (Gemini / gate naming). */
export function hydrateChildVehicle(draft: AutosAdditionalInventoryVehicleDraft): AutosAdditionalInventoryVehicleDraft {
  return hydrateChildInventoryEditorDraft(draft);
}

/** Merge saved child with incoming save payload without letting empty partial paths wipe media/video. */
export function mergeFullInventoryVehicle(
  existing: AutosAdditionalInventoryVehicleDraft,
  incoming: AutosAdditionalInventoryVehicleDraft,
): AutosAdditionalInventoryVehicleDraft {
  const existingHydrated = hydrateChildInventoryEditorDraft(existing);
  const incomingHydrated = hydrateChildInventoryEditorDraft(incoming);
  const existingMedia = normalizeAutosVehicleMediaDraft(existingHydrated);
  const incomingMedia = normalizeAutosVehicleMediaDraft(incomingHydrated);
  const incomingHasMedia =
    (incomingMedia.mediaImages?.length ?? 0) > 0 || (incomingMedia.videoUrls?.length ?? 0) > 0;
  const existingHasMedia =
    (existingMedia.mediaImages?.length ?? 0) > 0 || (existingMedia.videoUrls?.length ?? 0) > 0;
  const media = incomingHasMedia ? incomingMedia : existingHasMedia ? existingMedia : incomingMedia;
  const id = resolveAdditionalInventoryVehicleId(existingHydrated) ?? existingHydrated.id;
  return hydrateChildInventoryEditorDraft({
    ...existingHydrated,
    ...incomingHydrated,
    ...media,
    id,
    childId: id,
    inventoryRole: "additional",
    createdAt: existingHydrated.createdAt,
  });
}

/** Dedupe, hydrate, and preserve full saved-child rows for editable draft storage. */
export function sanitizeAdditionalInventoryVehiclesForDraft(
  raw: AutosAdditionalInventoryVehicleDraft[] | null | undefined,
): AutosAdditionalInventoryVehicleDraft[] {
  if (!raw?.length) return [];
  const out: AutosAdditionalInventoryVehicleDraft[] = [];
  const indexById = new Map<string, number>();

  for (const item of raw) {
    const hydrated = hydrateChildInventoryEditorDraft({ ...item, inventoryRole: "additional" });
    const id = resolveAdditionalInventoryVehicleId(hydrated);
    if (!id) continue;
    const normalized = { ...hydrated, id, childId: id, inventoryRole: "additional" as const };
    const existingIdx = indexById.get(id);
    if (existingIdx === undefined) {
      indexById.set(id, out.length);
      out.push(normalized);
      continue;
    }
    out[existingIdx] = mergeFullInventoryVehicle(out[existingIdx]!, normalized);
  }

  return out;
}

/** Update one child by id and preserve siblings — never replace the whole array on normal save. */
export function upsertAdditionalInventoryVehicleInArray(
  prev: AutosAdditionalInventoryVehicleDraft[],
  vehicle: AutosAdditionalInventoryVehicleDraft,
): { next: AutosAdditionalInventoryVehicleDraft[]; ok: boolean } {
  if (!validateInventoryVehicleDraftForSave(vehicle)) return { next: prev, ok: false };
  const prepared = prepareInventoryVehicleForSave(vehicle);
  const preparedId = resolveAdditionalInventoryVehicleId(prepared);
  if (!preparedId) return { next: prev, ok: false };

  const existsIdx = prev.findIndex((v) => resolveAdditionalInventoryVehicleId(v) === preparedId);
  if (existsIdx < 0 && !applicationCanAddInventoryVehicle(prev.length)) return { next: prev, ok: false };

  const next =
    existsIdx >= 0
      ? prev.map((v, j) => (j === existsIdx ? mergeFullInventoryVehicle(v, prepared) : v))
      : [...prev, prepared];

  return { next: sanitizeAdditionalInventoryVehiclesForDraft(next), ok: true };
}

/** True when saved child has media/video but in-progress draft lost them (smoke escape). */
export function inProgressChildMediaIsStaleVsSaved(
  saved: AutosAdditionalInventoryVehicleDraft,
  inProgress: AutosAdditionalInventoryVehicleDraft,
): boolean {
  const savedMedia = normalizeAutosVehicleMediaDraft(saved);
  const inProgressMedia = normalizeAutosVehicleMediaDraft(inProgress);
  const savedPhotos = savedMedia.mediaImages?.length ?? 0;
  const progPhotos = inProgressMedia.mediaImages?.length ?? 0;
  const savedVideos = savedMedia.videoUrls?.length ?? 0;
  const progVideos = inProgressMedia.videoUrls?.length ?? 0;
  return (savedPhotos > 0 && progPhotos === 0) || (savedVideos > 0 && progVideos === 0);
}

/** Overlay in-progress scalar edits on saved child; keep saved media unless in-progress has richer media. */
export function mergeSavedChildInventoryWithInProgress(
  saved: AutosAdditionalInventoryVehicleDraft,
  inProgress: AutosAdditionalInventoryVehicleDraft,
): AutosAdditionalInventoryVehicleDraft {
  const savedHydrated = hydrateChildInventoryEditorDraft(saved);
  const savedMedia = normalizeAutosVehicleMediaDraft(savedHydrated);
  const inProgressMedia = normalizeAutosVehicleMediaDraft(inProgress);
  const useInProgressMedia =
    (inProgressMedia.mediaImages?.length ?? 0) > (savedMedia.mediaImages?.length ?? 0) ||
    (inProgressMedia.videoUrls?.length ?? 0) > (savedMedia.videoUrls?.length ?? 0);
  const media = useInProgressMedia ? inProgressMedia : savedMedia;
  return hydrateChildInventoryEditorDraft({
    ...savedHydrated,
    ...inProgress,
    ...media,
    id: savedHydrated.id,
    inventoryRole: "additional",
    createdAt: savedHydrated.createdAt,
  });
}

export function inventoryDraftHasUserEditsBeyondSaved(
  inProgress: AutosAdditionalInventoryVehicleDraft,
  saved: AutosAdditionalInventoryVehicleDraft,
): boolean {
  return inventoryDraftContentFingerprint(inProgress) !== inventoryDraftContentFingerprint(saved);
}

/**
 * Single resolver for child editor open: card, preview, session, and editor must share this shape.
 */
export function resolveCanonicalChildInventoryEditorDraft(
  editingVehicle: AutosAdditionalInventoryVehicleDraft | null,
  inProgressDraft: AutosAdditionalInventoryVehicleDraft | null,
  drawerEditingId: string | null,
  additionalVehicles: AutosAdditionalInventoryVehicleDraft[] = [],
): AutosAdditionalInventoryVehicleDraft {
  const savedFromBundle =
    editingVehicle ?? findSavedAdditionalInventoryVehicle(additionalVehicles, drawerEditingId);

  if (!savedFromBundle) {
    if (drawerEditingId?.trim()) {
      if (
        inProgressDraft &&
        resolveAdditionalInventoryVehicleId(inProgressDraft) === drawerEditingId.trim()
      ) {
        return hydrateChildInventoryEditorDraft(inProgressDraft);
      }
      return createEmptyInventoryVehicleDraft(drawerEditingId.trim());
    }
    if (inProgressDraft) {
      return hydrateChildInventoryEditorDraft(inProgressDraft);
    }
    return createEmptyInventoryVehicleDraft();
  }

  const saved = hydrateChildInventoryEditorDraft(savedFromBundle);
  const savedId = resolveAdditionalInventoryVehicleId(saved);
  if (
    !inProgressDraft ||
    resolveAdditionalInventoryVehicleId(inProgressDraft) !== savedId ||
    drawerEditingId?.trim() !== savedId
  ) {
    return saved;
  }

  if (!inventoryDraftHasUserEditsBeyondSaved(inProgressDraft, saved)) {
    return saved;
  }

  if (inProgressChildMediaIsStaleVsSaved(saved, inProgressDraft)) {
    return mergeSavedChildInventoryWithInProgress(saved, inProgressDraft);
  }

  return hydrateChildInventoryEditorDraft(inProgressDraft);
}

/** Reconcile session in-progress draft against saved additionalInventoryVehicles after hydrate/rehydrate. */
export function reconcileInProgressInventoryWithSavedChildren(
  additional: AutosAdditionalInventoryVehicleDraft[],
  inProgress: AutosAdditionalInventoryVehicleDraft | null,
  drawerEditingId: string | null,
): AutosAdditionalInventoryVehicleDraft | null {
  if (!inProgress) return null;
  if (!drawerEditingId || resolveAdditionalInventoryVehicleId(inProgress) !== drawerEditingId) {
    return hydrateChildInventoryEditorDraft(inProgress);
  }
  const saved = additional.find((v) => resolveAdditionalInventoryVehicleId(v) === drawerEditingId);
  if (!saved) return hydrateChildInventoryEditorDraft(inProgress);
  if (inProgressChildMediaIsStaleVsSaved(saved, inProgress)) {
    return mergeSavedChildInventoryWithInProgress(saved, inProgress);
  }
  return hydrateChildInventoryEditorDraft(inProgress);
}

export function summarizeChildInventoryMediaDraft(
  draft: AutosAdditionalInventoryVehicleDraft | null | undefined,
): {
  id: string | null;
  mediaImagesCount: number;
  videoUrlsCount: number;
  coverId: string | null;
  hasUrlImages: boolean;
} {
  if (!draft) {
    return { id: null, mediaImagesCount: 0, videoUrlsCount: 0, coverId: null, hasUrlImages: false };
  }
  const media = normalizeAutosVehicleMediaDraft(draft);
  const images = media.mediaImages ?? [];
  const videos = media.videoUrls ?? [];
  const cover = images.find((m) => m.isPrimary) ?? images[0];
  return {
    id: draft.id,
    mediaImagesCount: images.length,
    videoUrlsCount: videos.length,
    coverId: cover?.id ?? null,
    hasUrlImages: images.some((m) => m.sourceType === "url"),
  };
}

export function inventoryVehicleCoverUrl(draft: AutosAdditionalInventoryVehicleDraft): string | null {
  const ordered = normalizeMediaImagesOrder(draft.mediaImages ?? []);
  const cover = ordered.find((m) => m.isPrimary) ?? ordered[0];
  const primary = cover?.url;
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
  "googleBusinessUrl",
  "dealerCustomLinks",
  "dealerLanguages",
  "dealerHours",
] as const;
