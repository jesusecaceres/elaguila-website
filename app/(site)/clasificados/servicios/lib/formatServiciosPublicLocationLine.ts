import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { formatLeonixLbPublicLocationLine } from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";

/** Public card/landing location from row + profile contact fields. */
export function formatServiciosPublicLocationLine(row: ServiciosPublicListingRow): string {
  const contact = row.profile_json.contact;
  const city = (row.city || contact?.physicalCity || "").trim();
  const state = (contact?.physicalRegion || "").trim();
  const zip = (contact?.physicalPostalCode || "").trim();
  return formatLeonixLbPublicLocationLine({ city, state, zip });
}
