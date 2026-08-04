import type { ViajesOfferKind } from "./viajesOfferModelV2";

/** Map legacy publisher offerType strings → canonical V2 offerKind. */
export function mapLegacyOfferTypeToViajesOfferKind(raw: string | null | undefined): ViajesOfferKind {
  const t = String(raw ?? "").trim().toLowerCase();
  if (!t) return "other";
  const table: Record<string, ViajesOfferKind> = {
    paquete: "vacation_package",
    tour: "tour_excursion",
    crucero: "cruise",
    cruise: "cruise",
    resort: "resort_hotel",
    escapada: "weekend_getaway",
    weekend: "weekend_getaway",
    day_trip: "day_trip",
    daytrip: "day_trip",
    activity: "day_activity",
    excursion: "tour_excursion",
    transport: "transportation_transfer",
    transportation: "transportation_transfer",
    car_rental: "car_rental",
    rental: "vacation_rental",
    vacation_rental: "vacation_rental",
    group: "group_trip",
    other: "other",
  };
  if (table[t]) return table[t];
  if ((Object.values(table) as string[]).includes(t)) return t as ViajesOfferKind;
  return "other";
}

export function viajesOfferKindToLegacyTripKeys(kind: ViajesOfferKind): string[] {
  switch (kind) {
    case "day_activity":
      return ["actividades", "dia"];
    case "day_trip":
      return ["dia"];
    case "weekend_getaway":
      return ["fin-de-semana", "escapada"];
    case "tour_excursion":
      return ["tours", "tour"];
    case "cruise":
      return ["cruceros", "crucero"];
    case "resort_hotel":
      return ["resorts", "resort"];
    case "vacation_rental":
      return ["rentas", "vacation-rental"];
    case "vacation_package":
      return ["tours", "paquete"];
    case "group_trip":
      return ["grupos", "tours"];
    case "transportation_transfer":
      return ["transporte", "traslados"];
    case "flight_inclusive_package":
      return ["paquete", "vuelos"];
    case "car_rental":
      return ["autos", "transporte", "car-rental"];
    default:
      return ["tours"];
  }
}
