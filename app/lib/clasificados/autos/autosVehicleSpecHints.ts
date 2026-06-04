import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  resolveStructuredEngineOption,
  resolveStructuredTrimOption,
} from "./autosVehicleStructuredSeed";

export type AutosVehicleSpecHints = {
  transmission?: string;
  drivetrain?: string;
  fuelType?: string;
  bodyStyle?: string;
};

export function getAutosVehicleSpecHints(input: {
  make?: string;
  model?: string;
  trim?: string;
  engine?: string;
  engineNormalized?: string;
}): AutosVehicleSpecHints {
  const trimOpt = resolveStructuredTrimOption(input.make, input.model, input.trim);
  const engineLabel = input.engineNormalized?.trim() || input.engine?.trim();
  const engineOpt = resolveStructuredEngineOption(input.make, input.model, input.trim, engineLabel);

  const hints: AutosVehicleSpecHints = {};

  const transmission =
    engineOpt?.transmissions?.[0] ?? trimOpt?.transmissions?.[0];
  const drivetrain = engineOpt?.drivetrains?.[0] ?? trimOpt?.drivetrains?.[0];
  const bodyStyle = engineOpt?.bodyStyles?.[0] ?? trimOpt?.bodyStyles?.[0];
  let fuelType = engineOpt?.fuelType ?? trimOpt?.fuelTypes?.[0];
  if (!fuelType && engineOpt?.hybridOrEv) {
    fuelType = engineOpt.fuelType ?? "electric";
  }

  if (transmission) hints.transmission = transmission;
  if (drivetrain) hints.drivetrain = drivetrain;
  if (bodyStyle) hints.bodyStyle = bodyStyle;
  if (fuelType) hints.fuelType = fuelType;

  return hints;
}

/** Fill only empty spec fields — never overwrite user-entered values. */
export function buildSafeAutosVehicleSpecHintPatch(
  listing: Pick<
    AutoDealerListing,
    "transmission" | "drivetrain" | "fuelType" | "bodyStyle" | "transmissionCustom" | "fuelTypeCustom" | "bodyStyleCustom"
  >,
  hints: AutosVehicleSpecHints,
): Partial<AutoDealerListing> {
  const patch: Partial<AutoDealerListing> = {};

  if (hints.transmission && !listing.transmission?.trim() && !listing.transmissionCustom?.trim()) {
    patch.transmission = hints.transmission;
  }
  if (hints.drivetrain && !listing.drivetrain?.trim()) {
    patch.drivetrain = hints.drivetrain;
  }
  if (hints.fuelType && !listing.fuelType?.trim() && !listing.fuelTypeCustom?.trim()) {
    patch.fuelType = hints.fuelType;
  }
  if (hints.bodyStyle && !listing.bodyStyle?.trim() && !listing.bodyStyleCustom?.trim()) {
    patch.bodyStyle = hints.bodyStyle;
  }

  return patch;
}

export function autosVehicleSpecAdjustHelper(lang: "es" | "en"): string {
  return lang === "es"
    ? "Puedes ajustar estos datos si tu vehículo tiene una configuración diferente."
    : "You can adjust these details if your vehicle has a different configuration.";
}
