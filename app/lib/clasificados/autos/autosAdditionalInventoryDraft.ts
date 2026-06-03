import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "./autosDealerInventoryPolicy";

/** Additional vehicle saved inside the same Autos Negocios application (not published alone). */
export type AutosAdditionalInventoryVehicleDraft = {
  id: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  price?: number;
  mileage?: number;
  imageUrl?: string;
  description?: string;
  status: "draft";
  createdAt: string;
  updatedAt: string;
};

export type AutosAdditionalInventoryVehicleInput = {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  price?: number;
  mileage?: number;
  imageUrl?: string;
  description?: string;
};

export function newAdditionalInventoryVehicleId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function countApplicationInventoryVehicles(additionalCount: number): number {
  return 1 + Math.max(0, additionalCount);
}

export function applicationInventoryRemainingSlots(additionalCount: number, limit = STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT): number {
  return Math.max(0, limit - countApplicationInventoryVehicles(additionalCount));
}

export function applicationCanAddInventoryVehicle(additionalCount: number, limit = STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT): boolean {
  return countApplicationInventoryVehicles(additionalCount) < limit;
}

export function normalizeAdditionalInventoryVehicles(raw: unknown): AutosAdditionalInventoryVehicleDraft[] {
  if (!Array.isArray(raw)) return [];
  const out: AutosAdditionalInventoryVehicleDraft[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : newAdditionalInventoryVehicleId();
    const createdAt = typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString();
    const updatedAt = typeof o.updatedAt === "string" ? o.updatedAt : createdAt;
    out.push({
      id,
      year: typeof o.year === "number" && Number.isFinite(o.year) ? o.year : undefined,
      make: typeof o.make === "string" ? o.make.trim() || undefined : undefined,
      model: typeof o.model === "string" ? o.model.trim() || undefined : undefined,
      trim: typeof o.trim === "string" ? o.trim.trim() || undefined : undefined,
      price: typeof o.price === "number" && Number.isFinite(o.price) ? o.price : undefined,
      mileage: typeof o.mileage === "number" && Number.isFinite(o.mileage) ? o.mileage : undefined,
      imageUrl: typeof o.imageUrl === "string" ? o.imageUrl.trim() || undefined : undefined,
      description: typeof o.description === "string" ? o.description.trim() || undefined : undefined,
      status: "draft",
      createdAt,
      updatedAt,
    });
  }
  return out;
}

export function buildAdditionalInventoryVehicle(
  input: AutosAdditionalInventoryVehicleInput,
): AutosAdditionalInventoryVehicleDraft | null {
  const make = input.make?.trim();
  const model = input.model?.trim();
  const year = input.year;
  if (!make && !model && year === undefined) return null;
  const now = new Date().toISOString();
  return {
    id: newAdditionalInventoryVehicleId(),
    year,
    make,
    model,
    trim: input.trim?.trim() || undefined,
    price: input.price,
    mileage: input.mileage,
    imageUrl: input.imageUrl?.trim() || undefined,
    description: input.description?.trim() || undefined,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

export function additionalInventoryVehicleTitle(v: AutosAdditionalInventoryVehicleDraft): string {
  const parts = [v.year, v.make, v.model, v.trim].filter((x) => x !== undefined && String(x).trim() !== "");
  return parts.map(String).join(" ").trim() || (v.make ?? v.model ?? "—");
}

/** Future analytics hooks — not wired in A5.QA-08A.1. */
export const AUTOS_INVENTORY_ANALYTICS_EVENTS = [
  "add_inventory_clicked",
  "inventory_drawer_opened",
  "inventory_draft_saved",
  "inventory_save_and_add_another",
  "inventory_vehicle_removed",
  "inventory_boost_clicked",
  "inventory_boost_prepare_clicked",
  "results_card_preview_seen",
] as const;
