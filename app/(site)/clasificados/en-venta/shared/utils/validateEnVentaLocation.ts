import { getCanonicalCityName, getZipRecord } from "@/app/data/locations/californiaLocationHelpers";
import {
  EN_VENTA_DEFAULT_COUNTRY,
  EN_VENTA_DEFAULT_STATE,
  normalizeEnVentaCountry,
  normalizeEnVentaStateCode,
} from "../constants/enVentaLocationContract";

export type EnVentaLocationIssueCode = "missing_city" | "incomplete_zip";

export type EnVentaLocationValidation =
  | {
      ok: true;
      canonicalCity: string;
      zipNormalized: string;
      stateNormalized: string;
      countryNormalized: string;
      warningEs?: string;
      warningEn?: string;
    }
  | {
      ok: false;
      code: EnVentaLocationIssueCode;
      messageEs: string;
      messageEn: string;
    };

function digitsOnly(raw: string): string {
  return (raw ?? "").replace(/\D/g, "");
}

/** Known CA/NorCal aliases → canonical; otherwise preserve trimmed user text (accents/capitalization). */
function resolveStoredCity(cityTrim: string): string {
  const canonical = getCanonicalCityName(cityTrim);
  return canonical || cityTrim;
}

/**
 * En Venta location: city required; ZIP optional (5-digit US when provided).
 * State defaults to CA; country defaults to United States when empty.
 */
export function validateEnVentaLocation(
  cityRaw: string,
  zipRaw: string,
  stateRaw?: string,
  countryRaw?: string
): EnVentaLocationValidation {
  const cityTrim = cityRaw.trim();
  const digits = digitsOnly(zipRaw);
  const zip5 = digits.length >= 5 ? digits.slice(0, 5) : "";
  const incompleteZip = digits.length > 0 && digits.length < 5;

  if (!cityTrim) {
    return {
      ok: false,
      code: "missing_city",
      messageEs: "Agrega una ciudad para ubicar tu anuncio.",
      messageEn: "Add a city to locate your listing.",
    };
  }

  if (incompleteZip) {
    return {
      ok: false,
      code: "incomplete_zip",
      messageEs: "Ingresa un ZIP válido de 5 dígitos o déjalo vacío.",
      messageEn: "Enter a valid 5-digit ZIP or leave it blank.",
    };
  }

  const storedCity = resolveStoredCity(cityTrim);
  let warningEs: string | undefined;
  let warningEn: string | undefined;

  if (zip5) {
    const zipRow = getZipRecord(zip5);
    if (zipRow) {
      const canonicalFromCity = getCanonicalCityName(cityTrim);
      if (canonicalFromCity && canonicalFromCity !== zipRow.city) {
        warningEs =
          "Revisa que la ciudad y el ZIP estén correctos para que los compradores encuentren tu anuncio.";
        warningEn = "Double-check city and ZIP so buyers can find your listing.";
      }
    }
  }

  const stateNormalized = normalizeEnVentaStateCode(stateRaw || EN_VENTA_DEFAULT_STATE);
  const countryNormalized = normalizeEnVentaCountry(countryRaw || EN_VENTA_DEFAULT_COUNTRY);

  return {
    ok: true,
    canonicalCity: storedCity,
    zipNormalized: zip5,
    stateNormalized,
    countryNormalized,
    ...(warningEs ? { warningEs, warningEn } : {}),
  };
}
