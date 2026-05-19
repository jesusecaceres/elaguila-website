import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { stripLeonixPublishedDescriptionBody } from "@/app/(site)/clasificados/lib/leonixListingGalleryMarker";
import { resolveBuscoTypePublicLabel } from "@/app/(site)/clasificados/busco/shared/buscoPublicLabel";

import type { BuscoListingBrowseRow } from "./loadBuscoListings";
import { detailPairsToMap, type BuscoListingPairMap } from "./buscoListingDetailPairs";

const CONTACT_SEARCH = {
  es: {
    phone: "teléfono whatsapp llamar texto",
    email: "correo email electrónico",
    any: "contacto teléfono correo email whatsapp",
  },
  en: {
    phone: "phone whatsapp call text",
    email: "email mail",
    any: "contact phone email whatsapp",
  },
} as const;

export function buscoRowHasPhone(row: BuscoListingBrowseRow, pairs: BuscoListingPairMap): boolean {
  const fromCol = String(row.contact_phone ?? "").replace(/\D/g, "");
  if (fromCol.length >= 10) return true;
  const fromPair = (pairs["Leonix:phoneDigits"] ?? "").replace(/\D/g, "");
  if (fromPair.length >= 10) return true;
  return pairs["Leonix:buscoContactPhoneAvailable"] === "1";
}

export function buscoRowHasEmail(row: BuscoListingBrowseRow, pairs: BuscoListingPairMap): boolean {
  if (String(row.contact_email ?? "").trim()) return true;
  return pairs["Leonix:buscoContactEmailAvailable"] === "1";
}

export function buildBuscoSearchBlob(row: BuscoListingBrowseRow, pairs: BuscoListingPairMap, lang: Lang): string {
  const title = String(row.title ?? "");
  const desc = stripLeonixPublishedDescriptionBody(String(row.description ?? "")) || String(row.description ?? "");
  const typeSlug = pairs["Leonix:buscoType"] ?? "";
  const typeCustom = pairs["Leonix:buscoTypeCustom"] ?? "";
  const typeLabel = resolveBuscoTypePublicLabel(typeSlug, typeCustom, lang);
  const city = String(row.city ?? "");
  const zone = pairs["Leonix:buscoZone"] ?? "";
  const budget = pairs["Leonix:buscoBudget"] ?? "";
  const contactBits = CONTACT_SEARCH[lang];
  const contact =
    buscoRowHasPhone(row, pairs) && buscoRowHasEmail(row, pairs)
      ? `${contactBits.any} ${contactBits.phone} ${contactBits.email}`
      : buscoRowHasPhone(row, pairs)
        ? contactBits.phone
        : buscoRowHasEmail(row, pairs)
          ? contactBits.email
          : "";
  return `${title} ${desc} ${typeLabel} ${typeCustom} ${typeSlug} ${city} ${zone} ${budget} ${contact}`.toLowerCase();
}
