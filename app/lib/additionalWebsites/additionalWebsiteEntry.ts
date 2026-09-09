/**
 * Shared Additional-Websites/Socials entry type.
 *
 * Both existing repeatable-Title+URL implementations (Restaurantes' `RestauranteAdditionalWebsite`
 * and Comida Local's `ComidaLocalAdditionalWebsite`) independently converged on this exact
 * `{ label, url }` shape — this module is that shape, generalized so a new adopter doesn't
 * reinvent it a third time. Both categories' own type aliases now re-export this one (see
 * restauranteListingApplicationModel.ts / comidaLocalTypes.ts), so this is a pure consolidation,
 * not a data-shape change — nothing about how either category stores or reads its own field
 * (still `additionalWebsites?: X[]` under its own existing field name) has changed.
 *
 * Ofertas Locales' fixed named-platform social fields are a different, deliberately narrower
 * shape (a handful of specific platforms, not a free-form repeatable list) and are out of scope
 * here — unifying Ofertas onto this type, and fixing its separate JSON-in-notes-field storage
 * defect, is follow-up adoption work, not a shared-primitive fix.
 */
export type AdditionalWebsiteEntry = {
  label: string;
  url: string;
};

/** Loose http(s) URL check — mirrors the validation both existing category forms already do
 * before accepting a row (no scheme-less bare domains, no javascript:/data: URLs). */
export function isValidAdditionalWebsiteUrl(raw: string): boolean {
  const t = String(raw ?? "").trim();
  if (!t) return false;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Trims and drops blank/invalid rows — the same "never persist a half-filled row" rule both
 * existing category forms already enforce at their own save boundary. */
export function sanitizeAdditionalWebsiteEntries(
  entries: AdditionalWebsiteEntry[] | null | undefined,
  maxEntries = 8,
): AdditionalWebsiteEntry[] {
  if (!Array.isArray(entries)) return [];
  const out: AdditionalWebsiteEntry[] = [];
  for (const e of entries) {
    const label = String(e?.label ?? "").trim();
    const url = String(e?.url ?? "").trim();
    if (!label || !isValidAdditionalWebsiteUrl(url)) continue;
    out.push({ label, url });
    if (out.length >= maxEntries) break;
  }
  return out;
}
