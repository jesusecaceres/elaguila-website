import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";

export type ServiciosResultsFilterQuery = {
  city?: string;
  group?: string;
  whatsapp?: "1" | "0";
  promo?: "1" | "0";
  call?: "1" | "0";
};

function normalize(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/**
 * Server-side filter on listing rows using the same resolved profile shape as preview/live.
 */
export function filterServiciosPublicListingRows(
  rows: ServiciosPublicListingRow[],
  lang: ServiciosLang,
  q: ServiciosResultsFilterQuery,
): ServiciosPublicListingRow[] {
  const cityQ = normalize(q.city);
  const groupQ = normalize(q.group);
  const wantWa = q.whatsapp === "1";
  const wantPromo = q.promo === "1";
  const wantCall = q.call === "1";

  if (!cityQ && !groupQ && !wantWa && !wantPromo && !wantCall) return rows;

  return rows.filter((row) => {
    if (groupQ && normalize(row.internal_group ?? "") !== groupQ) return false;
    if (cityQ && !normalize(row.city).includes(cityQ)) return false;

    if (wantWa || wantPromo || wantCall) {
      const wire = { ...row.profile_json };
      wire.identity = { ...wire.identity, leonixVerified: row.leonix_verified === true };
      const profile = resolveServiciosProfile(wire, lang);
      if (wantWa && !profile.contact.socialLinks?.whatsapp) return false;
      if (wantPromo && !profile.promo?.headline?.trim()) return false;
      if (wantCall && !(profile.contact.phoneDisplay && profile.contact.phoneTelHref)) return false;
    }

    return true;
  });
}
