import { getCanonicalCityName, getZipRecord } from "@/app/data/locations/californiaLocationHelpers";

export type EnVentaLocationIssueCode = "missing_city" | "incomplete_zip";

export type EnVentaLocationValidation =
  | {
      ok: true;
      canonicalCity: string;
      zipNormalized: string;
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
 * Any city text is accepted; known California cities normalize to canonical names.
 */
export function validateEnVentaLocation(cityRaw: string, zipRaw: string): EnVentaLocationValidation {
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

  return {
    ok: true,
    canonicalCity: storedCity,
    zipNormalized: zip5,
    ...(warningEs ? { warningEs, warningEn } : {}),
  };
}
