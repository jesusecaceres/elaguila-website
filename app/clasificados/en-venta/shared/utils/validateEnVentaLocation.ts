export type EnVentaLocationValidation =
  | {
      ok: true;
      code: "ok";
      messageEs: "";
      messageEn: "";
    }
  | {
      ok: false;
      code: "incomplete_zip" | "bad_zip" | "bad_city" | "mismatch" | "missing_both";
      messageEs: string;
      messageEn: string;
    };

export function validateEnVentaLocation(city: string, zip: string): EnVentaLocationValidation {
  const c = city.trim();
  const z = zip.trim().replace(/\D/g, "");
  if (!c && !z) {
    return { ok: true, code: "ok", messageEs: "", messageEn: "" };
  }
  if (z && z.length > 0 && z.length < 5) {
    return {
      ok: false,
      code: "incomplete_zip",
      messageEs: "El código postal debe tener 5 dígitos.",
      messageEn: "ZIP must be 5 digits.",
    };
  }
  return { ok: true, code: "ok", messageEs: "", messageEn: "" };
}
