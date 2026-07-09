/**
 * Published Autos Negocio dealer listing → application draft (dashboard edit hydration).
 * Gate AUTOS-DEALER-INVENTORY-ADDON-PARITY-01
 */

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { saveAutosNegociosDraftResolved } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftStorage";
import { resolveAutosNegociosDraftNamespace } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftNamespace";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { AutosClassifiedsDashboardRow } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import {
  createEmptyInventoryVehicleDraft,
  normalizeAdditionalInventoryVehicles,
  type AutosAdditionalInventoryVehicleDraft,
} from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { coerceAutosVehicleMediaImageEntries } from "@/app/lib/clasificados/autos/autosVehicleMediaDraft";

export type AutosDashboardHydrationResult = { ok: true } | { ok: false; userMessage: string };

function durableHttpUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    let url = "";
    if (typeof item === "string") url = item.trim();
    else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      url = String(o.url ?? o.src ?? o.path ?? "").trim();
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) continue;
    if (!out.includes(url)) out.push(url);
  }
  return out;
}

function mapChildListingPayloadToDraft(
  row: AutosClassifiedsDashboardRow,
  listing: AutoDealerListing,
): AutosAdditionalInventoryVehicleDraft {
  const draft = createEmptyInventoryVehicleDraft(`autos-db-child-${row.id}`);
  const mediaImages = coerceAutosVehicleMediaImageEntries(listing.mediaImages);
  const durableImages = mediaImages.filter((m) => {
    const u = String(m.url ?? "").trim();
    return u.startsWith("http://") || u.startsWith("https://");
  });
  const videoUrls = Array.isArray(listing.videoUrls)
    ? listing.videoUrls.filter((v) => typeof v === "string" && /^https?:\/\//i.test(v.trim()))
    : [];

  return {
    ...draft,
    id: row.id,
    status: row.status === "active" ? "ready_for_preview" : "draft",
    vehicleTitle: listing.vehicleTitle,
    year: listing.year,
    make: listing.make,
    model: listing.model,
    trim: listing.trim,
    version: listing.version,
    trim2: listing.trim2,
    series: listing.series,
    series2: listing.series2,
    vinDetectedTrim: listing.vinDetectedTrim,
    condition: listing.condition,
    price: listing.price,
    monthlyEstimate: listing.monthlyEstimate,
    mileage: listing.mileage,
    city: listing.city,
    state: listing.state,
    zip: listing.zip,
    vin: listing.vin,
    stockNumber: listing.stockNumber,
    motor: listing.motor,
    engineCylinders: listing.engineCylinders,
    displacementL: listing.displacementL,
    displacementCC: listing.displacementCC,
    displacementCI: listing.displacementCI,
    engineModel: listing.engineModel,
    engineManufacturer: listing.engineManufacturer,
    engineConfiguration: listing.engineConfiguration,
    engineHP: listing.engineHP,
    engineKW: listing.engineKW,
    turbo: listing.turbo,
    valveTrain: listing.valveTrain,
    vehicleType: listing.vehicleType,
    vehicleDescriptor: listing.vehicleDescriptor,
    bodyClass: listing.bodyClass,
    driveType: listing.driveType,
    transmissionStyle: listing.transmissionStyle,
    transmissionSpeeds: listing.transmissionSpeeds,
    fuelTypePrimary: listing.fuelTypePrimary,
    fuelTypeSecondary: listing.fuelTypeSecondary,
    electrificationLevel: listing.electrificationLevel,
    cabType: listing.cabType,
    bedType: listing.bedType,
    bedLength: listing.bedLength,
    gvwr: listing.gvwr,
    manufacturer: listing.manufacturer,
    manufacturerId: listing.manufacturerId,
    plantCountry: listing.plantCountry,
    plantState: listing.plantState,
    plantCity: listing.plantCity,
    plantCompanyName: listing.plantCompanyName,
    safetyFeatures: listing.safetyFeatures,
    nhtsaDecode: listing.nhtsaDecode,
    exteriorColor: listing.exteriorColor,
    exteriorColorCustom: listing.exteriorColorCustom,
    interiorColor: listing.interiorColor,
    interiorColorCustom: listing.interiorColorCustom,
    bodyStyle: listing.bodyStyle,
    bodyStyleCustom: listing.bodyStyleCustom,
    drivetrain: listing.drivetrain,
    drivetrainCustom: listing.drivetrainCustom,
    transmission: listing.transmission,
    transmissionCustom: listing.transmissionCustom,
    engine: listing.engine,
    engineNormalized: listing.engineNormalized,
    fuelType: listing.fuelType,
    fuelTypeCustom: listing.fuelTypeCustom,
    badges: listing.badges,
    description: listing.description,
    mediaImages: durableImages,
    videoUrls,
  };
}

export async function hydrateAutosDealerListingForDashboardEdit(input: {
  listingId: string;
  lang: "es" | "en";
  focusInventory?: boolean;
}): Promise<AutosDashboardHydrationResult> {
  const listingId = input.listingId.trim();
  if (!listingId) {
    return {
      ok: false,
      userMessage: input.lang === "es" ? "No se encontró el anuncio de Autos." : "Autos listing not found.",
    };
  }

  try {
    const sb = createSupabaseBrowserClient();
    const { data: auth, error: authError } = await sb.auth.getSession();
    const token = auth.session?.access_token;
    if (authError || !token?.trim()) {
      return {
        ok: false,
        userMessage:
          input.lang === "es"
            ? "Inicia sesión para editar tu anuncio de Autos."
            : "Sign in to edit your Autos listing.",
      };
    }

    const parentRes = await fetch(`/api/clasificados/autos/listings/${encodeURIComponent(listingId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const parentJson = (await parentRes.json()) as {
      ok?: boolean;
      lane?: string;
      listing?: AutoDealerListing;
      error?: string;
    };
    if (!parentRes.ok || !parentJson.ok || !parentJson.listing) {
      return {
        ok: false,
        userMessage:
          input.lang === "es"
            ? "No se pudo cargar el anuncio dealer para editar."
            : "Could not load the dealer listing for editing.",
      };
    }
    if (parentJson.lane === "privado") {
      return {
        ok: false,
        userMessage:
          input.lang === "es"
            ? "El inventario dealer no aplica a anuncios privados."
            : "Dealer inventory does not apply to private listings.",
      };
    }

    const allRes = await fetch("/api/clasificados/autos/listings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const allJson = (await allRes.json()) as {
      ok?: boolean;
      listings?: AutosClassifiedsDashboardRow[];
    };
    const allRows = allRes.ok && allJson.ok && Array.isArray(allJson.listings) ? allJson.listings : [];
    const groupId =
      allRows.find((r) => r.id === listingId)?.dealer_inventory_group_id?.trim() ||
      allRows.find((r) => r.id === listingId)?.id;

    const childRows = allRows.filter((r) => {
      if (r.lane !== "negocios" || r.inventory_role !== "inventory_vehicle") return false;
      if (r.dealer_inventory_parent_listing_id === listingId) return true;
      if (groupId && r.dealer_inventory_group_id === groupId && r.id !== listingId) return true;
      return false;
    });

    const childListings = await Promise.all(
      childRows.map(async (row) => {
        const childRes = await fetch(`/api/clasificados/autos/listings/${encodeURIComponent(row.id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const childJson = (await childRes.json()) as { ok?: boolean; listing?: AutoDealerListing };
        if (!childRes.ok || !childJson.ok || !childJson.listing) return null;
        return mapChildListingPayloadToDraft(row, normalizeLoadedListing(childJson.listing));
      }),
    );
    const children = childListings.filter((c): c is AutosAdditionalInventoryVehicleDraft => c != null);

    const parentListing = normalizeLoadedListing(parentJson.listing);
    const namespace = await resolveAutosNegociosDraftNamespace();

    await saveAutosNegociosDraftResolved(namespace, {
      v: 1,
      vehicleTitleOverride: Boolean(parentListing.vehicleTitle?.trim()),
      listing: parentListing,
      editorStep: input.focusInventory ? 6 : 0,
      editorMaxReached: input.focusInventory ? 6 : 0,
      additionalInventoryVehicles: normalizeAdditionalInventoryVehicles(children),
      inProgressInventoryVehicleDraft: null,
      inventoryDrawerEditingId: null,
      inventoryDrawerOpen: false,
    });

    return { ok: true };
  } catch {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "No se pudo cargar el anuncio para editar."
          : "Could not load the listing for editing.",
    };
  }
}
