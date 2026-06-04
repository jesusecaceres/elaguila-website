/** Build URL-safe slug segments (accent-stripped, hyphenated). */
export function slugifyComidaLocalSegment(raw: string, maxLen = 48): string {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
  return s;
}

/**
 * Base slug from vendor name + city (and optional food type disambiguation).
 */
export function buildComidaLocalSlugBase(input: {
  businessName: string;
  cityDisplay: string;
  cityCanonical?: string;
  foodType?: string;
}): string {
  const name = slugifyComidaLocalSegment(input.businessName, 40);
  const city = slugifyComidaLocalSegment(
    input.cityCanonical?.trim() || input.cityDisplay?.trim() || "",
    24
  );
  const food = input.foodType && input.foodType !== "otro" ? slugifyComidaLocalSegment(input.foodType, 16) : "";
  const parts = [name, city, food].filter(Boolean);
  const joined = parts.join("-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return joined.slice(0, 80) || "comida-local";
}
