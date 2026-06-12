import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { buildVehicleTitle } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { deriveHeroImageUrls } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import { hasListingVideo } from "@/app/clasificados/autos/negocios/lib/autoDealerVideo";
import {
  formatCityStateZipLine,
  formatMiles,
  formatMpgPair,
  formatUsd,
  polishMonthlyEstimateDisplay,
} from "@/app/clasificados/autos/negocios/components/autoDealerFormatters";
import {
  resolveBodyStyle,
  resolveDrivetrain,
  resolveExteriorColor,
  resolveFuelType,
  resolveInteriorColor,
  resolveTitleStatus,
  resolveTransmission,
} from "@/app/clasificados/autos/negocios/lib/autoDealerSelectResolve";
import { mapAutosDealerToBusinessHubContact } from "@/app/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact";
import type { AutosAdditionalInventoryVehicleDraft } from "./autosAdditionalInventoryDraft";
import {
  additionalInventoryVehicleTitle,
  inventoryVehicleCoverUrl,
} from "./autosAdditionalInventoryDraft";
import { resolveEngineForDisplay } from "./autosVehicleEngineOptions";
import { autosResultsCardLeonixIdNote } from "./autosNegociosInventoryBundleCopy";

function nonEmpty(s: string | undefined | null): string | undefined {
  const t = typeof s === "string" ? s.trim() : "";
  return t.length > 0 ? t : undefined;
}

export type AutosNegociosBuyerPreviewInventoryCard = {
  id: string;
  title: string;
  coverUrl: string | null;
  price: string | null;
  mileage: string | null;
  location: string | null;
  specLine: string | null;
  draftNote: string;
};

export type AutosNegociosBuyerPreviewViewModel = {
  listing: AutoDealerListing;
  lang: AutosNegociosLang;
  title: string;
  price: string | null;
  monthlyEstimate: string | null;
  locationLine: string | null;
  mileage: string | null;
  galleryUrls: string[];
  coverUrl: string | null;
  hasVideo: boolean;
  description: string | null;
  equipment: string[];
  heroSpecItems: Array<{ key: string; label: string; value: string }>;
  businessHub: ReturnType<typeof mapAutosDealerToBusinessHubContact>;
  additionalInventory: AutosNegociosBuyerPreviewInventoryCard[];
  draftIdNote: string;
};

function heroSpecItemsFromListing(data: AutoDealerListing, lang: AutosNegociosLang): AutosNegociosBuyerPreviewViewModel["heroSpecItems"] {
  const labels =
    lang === "es"
      ? { year: "Año", make: "Marca", model: "Modelo", trim: "Versión", trans: "Transmisión", fuel: "Combustible", drive: "Tracción", mi: "Millas", body: "Carrocería" }
      : { year: "Year", make: "Make", model: "Model", trim: "Trim", trans: "Transmission", fuel: "Fuel", drive: "Drivetrain", mi: "Mileage", body: "Body" };

  const items: Array<{ key: string; label: string; value: string }> = [];
  const push = (key: string, label: string, value: string | undefined) => {
    const v = nonEmpty(value);
    if (v) items.push({ key, label, value: v });
  };

  if (data.year !== undefined && Number.isFinite(data.year)) push("year", labels.year, String(Math.round(data.year)));
  push("make", labels.make, data.make);
  push("model", labels.model, data.model);
  push("trim", labels.trim, data.trim);
  push("trans", labels.trans, resolveTransmission(data));
  push("fuel", labels.fuel, resolveFuelType(data));
  push("drive", labels.drive, resolveDrivetrain(data));
  if (data.mileage !== undefined && Number.isFinite(data.mileage)) push("mi", labels.mi, formatMiles(data.mileage));
  push("body", labels.body, resolveBodyStyle(data));

  void resolveExteriorColor(data);
  void resolveInteriorColor(data);
  void resolveTitleStatus(data);
  void formatMpgPair(data.mpgCity ?? undefined, data.mpgHighway ?? undefined);
  void resolveEngineForDisplay(data);

  return items;
}

export function mapAutosNegociosBuyerPreviewViewModel(
  listing: AutoDealerListing,
  additionalInventoryVehicles: AutosAdditionalInventoryVehicleDraft[],
  lang: AutosNegociosLang,
): AutosNegociosBuyerPreviewViewModel {
  const title =
    nonEmpty(listing.vehicleTitle) ??
    buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim) ??
    (lang === "es" ? "Vehículo" : "Vehicle");

  const galleryUrls = deriveHeroImageUrls(listing);
  const price =
    listing.price !== undefined && Number.isFinite(listing.price) ? formatUsd(listing.price) : null;
  const monthlyEstimate = nonEmpty(polishMonthlyEstimateDisplay(listing.monthlyEstimate ?? undefined)) ?? null;
  const locationLine = nonEmpty(formatCityStateZipLine(listing.city, listing.state, listing.zip)) ?? null;
  const mileage =
    listing.mileage !== undefined && Number.isFinite(listing.mileage) ? formatMiles(listing.mileage) : null;

  const additionalInventory: AutosNegociosBuyerPreviewInventoryCard[] = additionalInventoryVehicles.map((v) => {
    const specParts = [v.transmission, v.drivetrain, v.fuelType].map((x) => nonEmpty(x)).filter(Boolean);
    const loc = nonEmpty(formatCityStateZipLine(v.city ?? listing.city, v.state ?? listing.state, v.zip ?? listing.zip)) ?? null;
    const priceRaw =
      v.price !== undefined && Number.isFinite(v.price) ? formatUsd(v.price) : null;
    const mileageRaw =
      v.mileage !== undefined && Number.isFinite(v.mileage) ? formatMiles(v.mileage) : null;
    return {
      id: v.id,
      title: additionalInventoryVehicleTitle(v),
      coverUrl: inventoryVehicleCoverUrl(v),
      price: priceRaw,
      mileage: mileageRaw,
      location: loc,
      specLine: specParts.length > 0 ? specParts.join(" · ") : null,
      draftNote: autosResultsCardLeonixIdNote(lang),
    };
  });

  return {
    listing,
    lang,
    title,
    price,
    monthlyEstimate,
    locationLine,
    mileage,
    galleryUrls,
    coverUrl: galleryUrls[0] ?? null,
    hasVideo: hasListingVideo(listing),
    description: nonEmpty(listing.description) ?? null,
    equipment: [...(listing.features ?? []), ...(listing.customEquipment ?? [])].map((x) => x.trim()).filter(Boolean),
    heroSpecItems: heroSpecItemsFromListing(listing, lang),
    businessHub: mapAutosDealerToBusinessHubContact(listing, lang),
    additionalInventory,
    draftIdNote: autosResultsCardLeonixIdNote(lang),
  };
}
