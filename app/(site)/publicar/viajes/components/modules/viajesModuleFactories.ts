import type {
  ViajesTravelModule,
  ViajesItineraryItem,
} from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { newViajesStableId } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2Defaults";

export type ViajesModuleKind = ViajesTravelModule["kind"];

export const VIAJES_MODULE_KINDS: ViajesModuleKind[] = [
  "accommodation",
  "transportation",
  "food",
  "activity",
  "cruise",
  "flight",
  "vacation_rental",
  "car_rental",
  "addon",
];

export function viajesModuleKindLabel(kind: ViajesModuleKind, lang: "es" | "en" = "es"): string {
  const es: Record<ViajesModuleKind, string> = {
    accommodation: "Hospedaje",
    transportation: "Transporte",
    food: "Comidas",
    activity: "Actividad",
    cruise: "Crucero",
    flight: "Vuelo",
    vacation_rental: "Renta vacacional",
    car_rental: "Renta de auto",
    addon: "Extra / addon",
  };
  const en: Record<ViajesModuleKind, string> = {
    accommodation: "Accommodation",
    transportation: "Transportation",
    food: "Food",
    activity: "Activity",
    cruise: "Cruise",
    flight: "Flight",
    vacation_rental: "Vacation rental",
    car_rental: "Car rental",
    addon: "Add-on",
  };
  return (lang === "en" ? en : es)[kind];
}

export function createEmptyViajesModule(kind: ViajesModuleKind): ViajesTravelModule {
  const id = newViajesStableId("mod");
  const base = { id, imageId: null as string | null, description: "" };
  switch (kind) {
    case "accommodation":
      return { ...base, kind, propertyType: "", roomOrOccupancy: "", nights: "" };
    case "transportation":
      return { ...base, kind, mode: "", provider: "", origin: "", destination: "" };
    case "food":
      return { ...base, kind, mealPlanOrName: "", quantityOrFrequency: "", dietaryNote: "" };
    case "activity":
      return {
        ...base,
        kind,
        activityName: "",
        venue: "",
        duration: "",
        dateTime: "",
        locationLabel: "",
      };
    case "cruise":
      return {
        ...base,
        kind,
        ship: "",
        departurePort: "",
        returnPort: "",
        nights: "",
        cabinNote: "",
        portsStops: "",
      };
    case "flight":
      return {
        ...base,
        kind,
        airline: "",
        origin: "",
        destination: "",
        cabinBaggageNote: "",
        connectionNote: "",
      };
    case "vacation_rental":
      return {
        ...base,
        kind,
        propertyType: "",
        capacity: "",
        bedrooms: "",
        baths: "",
        amenitiesNote: "",
      };
    case "car_rental":
      return {
        ...base,
        kind,
        pickupLocation: "",
        dropoffLocation: "",
        dateWindow: "",
        vehicleClass: "",
        capacity: "",
        provider: "",
        startingPrice: "",
        mileageSummary: "",
        fuelSummary: "",
        ageRequirement: "",
        depositSummary: "",
        providerCtaUrl: "",
      };
    case "addon":
      return { ...base, kind, name: "", priceOrIncluded: "" };
  }
}

export function createEmptyViajesItineraryItem(): ViajesItineraryItem {
  return {
    id: newViajesStableId("day"),
    dayLabel: "",
    title: "",
    description: "",
    locationLabel: "",
    imageId: null,
  };
}
