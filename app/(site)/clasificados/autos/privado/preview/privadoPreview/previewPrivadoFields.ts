import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { deriveHeroImageUrls } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import { getListingVideoUrls, hasListingVideo } from "@/app/clasificados/autos/negocios/lib/autoDealerVideo";
import {
  resolveBodyStyle,
  resolveDrivetrain,
  resolveExteriorColor,
  resolveFuelType,
  resolveInteriorColor,
  resolveTitleStatus,
  resolveTransmission,
} from "@/app/clasificados/autos/negocios/lib/autoDealerSelectResolve";
import { resolveEngineForDisplay } from "@/app/lib/clasificados/autos/autosVehicleEngineOptions";
import { resolveDealerOfficePhone } from "@/app/clasificados/autos/negocios/lib/dealerContactResolve";
import { isPlausibleSellerEmail } from "@/app/clasificados/autos/privado/lib/privadoContactIntent";
import { buildVehicleTitle, normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { withNormalizedVehicleIdentityForDisplay } from "@/app/lib/clasificados/autos/autosListingDisplayIdentity";
import { previewPrivadoCopy, type PreviewPrivadoLang } from "./previewPrivadoCopy";

function nonEmpty(s: string | undefined | null): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatMiles(n: number, lang: PreviewPrivadoLang): string {
  const copy = previewPrivadoCopy(lang);
  return `${new Intl.NumberFormat("en-US").format(Math.round(n))} ${copy.milesSuffix}`;
}

function formatCityStateZip(city?: string, state?: string, zip?: string): string {
  const c = city?.trim();
  const st = state?.trim().toUpperCase();
  const z = zip?.replace(/\D/g, "").slice(0, 5) ?? "";
  const base = c && st ? `${c}, ${st}` : c || st || "";
  if (z) return base ? `${base} · ${z}` : z;
  return base;
}

function phoneDigits(input: string | undefined): string {
  const d = (input ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d;
  return d;
}

function formatUsPhone(input: string | undefined): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  const d = phoneDigits(raw);
  const core = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (core.length === 10) return `(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6)}`;
  return raw;
}

export type PreviewPrivadoSpecRow = { key: string; label: string; value: string };

export type PreviewPrivadoVm = {
  title: string;
  location: string;
  mileageLabel?: string;
  vin?: string;
  priceLabel?: string;
  conditionPill?: string;
  bodyPill?: string;
  photos: string[];
  videoUrls: string[];
  hasVideo: boolean;
  compactSpecs: PreviewPrivadoSpecRow[];
  specRows: PreviewPrivadoSpecRow[];
  features: string[];
  customEquipment: string[];
  description?: string;
  sellerName?: string;
  meetingNote?: string;
  phoneDisplay?: string;
  phoneDigits?: string;
  hasCall: boolean;
  hasSms: boolean;
  whatsappDisplay?: string;
  hasWhatsapp: boolean;
  email?: string;
  hasEmail: boolean;
};

export function buildPreviewPrivadoVm(raw: AutoDealerListing, lang: PreviewPrivadoLang): PreviewPrivadoVm {
  const data = withNormalizedVehicleIdentityForDisplay(raw);
  const copy = previewPrivadoCopy(lang);
  const labels = copy.specLabels;

  const title =
    buildVehicleTitle(data.year, data.make, data.model, data.trim).trim() ||
    data.vehicleTitle?.trim() ||
    "";

  const location = formatCityStateZip(data.city, data.state, data.zip);
  const priceOk = data.price !== undefined && Number.isFinite(data.price);
  const mileageOk = data.mileage !== undefined && Number.isFinite(data.mileage);
  const vin = nonEmpty(data.vin) ? data.vin.trim().toUpperCase() : undefined;

  let conditionPill: string | undefined;
  if (data.condition === "new") conditionPill = copy.condition.new;
  else if (data.condition === "used") conditionPill = copy.condition.used;
  else if (data.condition === "certified") conditionPill = copy.condition.certified;

  const bodyPill = resolveBodyStyle(data);
  const transmission = resolveTransmission(data);
  const drivetrain = resolveDrivetrain(data);
  const engine =
    resolveEngineForDisplay(data) ||
    (nonEmpty(data.motor) ? normalizeVehicleSegment(data.motor) ?? data.motor.trim() : undefined);
  const fuel = resolveFuelType(data);
  const exterior = resolveExteriorColor(data);
  const interior = resolveInteriorColor(data);
  const titleStatus = resolveTitleStatus(data);

  const compactSpecs: PreviewPrivadoSpecRow[] = [];
  if (transmission) compactSpecs.push({ key: "trans", label: copy.compactTransmission, value: transmission });
  if (drivetrain) compactSpecs.push({ key: "drive", label: copy.compactDrivetrain, value: drivetrain });
  if (engine) compactSpecs.push({ key: "eng", label: copy.compactEngine, value: engine });

  const specRows: PreviewPrivadoSpecRow[] = [];
  if (mileageOk) specRows.push({ key: "mi", label: labels.mileage, value: formatMiles(data.mileage as number, lang) });
  if (exterior) specRows.push({ key: "ex", label: labels.exterior, value: exterior });
  if (interior) specRows.push({ key: "in", label: labels.interior, value: interior });
  if (vin) specRows.push({ key: "vin", label: labels.vin, value: vin });
  if (titleStatus) specRows.push({ key: "title", label: labels.title, value: titleStatus });
  if (conditionPill) specRows.push({ key: "cond", label: labels.condition, value: conditionPill });
  if (bodyPill) specRows.push({ key: "body", label: labels.body, value: bodyPill });
  if (fuel) specRows.push({ key: "fuel", label: labels.fuel, value: fuel });
  if (engine) specRows.push({ key: "eng", label: labels.engine, value: engine });
  if (transmission) specRows.push({ key: "trans", label: labels.transmission, value: transmission });
  if (drivetrain) specRows.push({ key: "drive", label: labels.drivetrain, value: drivetrain });
  if (data.doors !== undefined && Number.isFinite(data.doors)) {
    specRows.push({ key: "doors", label: labels.doors, value: String(data.doors) });
  }
  if (data.seats !== undefined && Number.isFinite(data.seats)) {
    specRows.push({ key: "seats", label: labels.seats, value: String(data.seats) });
  }
  if (
    data.mpgCity !== undefined &&
    data.mpgCity !== null &&
    Number.isFinite(data.mpgCity) &&
    data.mpgHighway !== undefined &&
    data.mpgHighway !== null &&
    Number.isFinite(data.mpgHighway)
  ) {
    specRows.push({
      key: "mpg",
      label: labels.mpg,
      value: `${Math.round(data.mpgCity)} / ${Math.round(data.mpgHighway)} MPG`,
    });
  }

  const features = (data.features ?? []).map((f) => f.trim()).filter(Boolean);
  let customEquipment = (data.customEquipment ?? []).map((f) => f.trim()).filter(Boolean);
  if (customEquipment.length === 0 && nonEmpty(data.otherEquipmentDetails)) {
    customEquipment = data.otherEquipmentDetails
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const office = resolveDealerOfficePhone(data);
  const digits = phoneDigits(office);
  const hasCall = digits.length >= 10;
  const wa = data.dealerWhatsapp?.trim();
  const email = data.dealerEmail?.trim();
  const hasEmail = Boolean(email && isPlausibleSellerEmail(email));

  return {
    title,
    location,
    mileageLabel: mileageOk ? formatMiles(data.mileage as number, lang) : undefined,
    vin,
    priceLabel: priceOk ? formatUsd(data.price as number) : undefined,
    conditionPill,
    bodyPill,
    photos: deriveHeroImageUrls(data).filter(Boolean),
    videoUrls: getListingVideoUrls(data),
    hasVideo: hasListingVideo(data),
    compactSpecs,
    specRows,
    features,
    customEquipment,
    description: data.description?.trim() || undefined,
    sellerName: data.dealerName?.trim() || undefined,
    meetingNote: data.dealerAddress?.trim() || undefined,
    phoneDisplay: hasCall ? formatUsPhone(office) : undefined,
    phoneDigits: hasCall ? digits : undefined,
    hasCall,
    hasSms: hasCall,
    whatsappDisplay: nonEmpty(wa) ? formatUsPhone(wa) : undefined,
    hasWhatsapp: Boolean(wa),
    email: hasEmail ? email : undefined,
    hasEmail,
  };
}
