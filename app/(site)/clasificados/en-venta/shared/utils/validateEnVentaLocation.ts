import { getCanonicalCityName, getZipRecord } from "@/app/data/locations/californiaLocationHelpers";

export type EnVentaLocationIssueCode =
  | "missing_both"
  | "incomplete_zip"
  | "bad_city"
  | "bad_zip"
  | "mismatch";

export type EnVentaLocationValidation =
  | { ok: true; canonicalCity: string; zipNormalized: string }
  | {
      ok: false;
      code: EnVentaLocationIssueCode;
      messageEs: string;
      messageEn: string;
    };

function digitsOnly(raw: string): string {
  return (raw ?? "").replace(/\D/g, "");
}

/**
 * En Venta location rules: at least one of city or ZIP; if both, ZIP must map to same canonical city.
 * Uses shared California location foundation (no duplicate truth).
 */
export function validateEnVentaLocation(cityRaw: string, zipRaw: string): EnVentaLocationValidation {
  const cityTrim = cityRaw.trim();
  const digits = digitsOnly(zipRaw);
  const zip5 = digits.length >= 5 ? digits.slice(0, 5) : "";
  const incompleteZip = digits.length > 0 && digits.length < 5;

  if (!cityTrim && !digits) {
    return {
      ok: false,
      code: "missing_both",
      messageEs: "Agrega una ciudad o un ZIP.",
      messageEn: "Add a city or a ZIP code.",
    };
  }

  if (incompleteZip) {
    return {
      ok: false,
      code: "incomplete_zip",
      messageEs: "El ZIP debe tener 5 dígitos, o déjalo vacío.",
      messageEn: "Use a 5-digit ZIP, or leave ZIP blank.",
    };
  }

  if (cityTrim && !zip5) {
    const canonical = getCanonicalCityName(cityTrim);
    if (!canonical) {
      return {
        ok: false,
        code: "bad_city",
        messageEs: "Elige una ciudad válida de California en la lista.",
        messageEn: "Choose a valid California city from the list.",
      };
    }
    return { ok: true, canonicalCity: canonical, zipNormalized: "" };
  }

  if (!cityTrim && zip5) {
    const row = getZipRecord(zip5);
    if (!row) {
      return {
        ok: false,
        code: "bad_zip",
        messageEs: "No reconocemos ese ZIP. Verifica los 5 dígitos.",
        messageEn: "We don’t recognize that ZIP. Check the 5 digits.",
      };
    }
    return { ok: true, canonicalCity: row.city, zipNormalized: zip5 };
  }

  const canonicalFromCity = getCanonicalCityName(cityTrim);
  if (!canonicalFromCity) {
    return {
      ok: false,
      code: "bad_city",
      messageEs: "Elige una ciudad válida de California en la lista.",
      messageEn: "Choose a valid California city from the list.",
    };
  }

  const row = getZipRecord(zip5);
  if (!row) {
    return {
      ok: false,
      code: "bad_zip",
      messageEs: "No reconocemos ese ZIP. Verifica los 5 dígitos.",
      messageEn: "We don’t recognize that ZIP. Check the 5 digits.",
    };
  }

  if (canonicalFromCity !== row.city) {
    return {
      ok: false,
      code: "mismatch",
      messageEs: "Ese ZIP no coincide con la ciudad seleccionada. Revisa uno de los dos.",
      messageEn: "That ZIP doesn’t match the selected city. Fix one of them.",
    };
  }

  return { ok: true, canonicalCity: canonicalFromCity, zipNormalized: zip5 };
}
