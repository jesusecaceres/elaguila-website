import type { AutosAnuncioFactPair, AutosAnuncioLang, AutosAnuncioListingLike } from "../types/autosAnuncioLiveTypes";

function normalizeLabel(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function factsFromTitleAndBlurb(listing: AutosAnuncioListingLike, lang: AutosAnuncioLang): AutosAnuncioFactPair[] {
  const title = listing.title?.[lang] ?? "";
  const blurb = listing.blurb?.[lang] ?? "";
  const blob = `${title} ${blurb} ${listing.priceLabel?.[lang] ?? ""}`.toLowerCase();

  const yearMatch = title.match(/(19\d{2}|20\d{2})/);
  const year = yearMatch ? yearMatch[1] : null;

  const mileageMatch =
    title.match(/(\d{2,3})\s*k\b/) ||
    title.match(/(\d{1,3}(?:,\d{3})+)\s*(?:miles|millas)\b/i);
  let mileage: string | null = null;
  if (mileageMatch) {
    mileage = mileageMatch[1].includes(",") ? mileageMatch[1] : `${mileageMatch[1]}k`;
    mileage = lang === "es" ? `${mileage} millas` : `${mileage} miles`;
  }

  const has = (re: RegExp) => re.test(blob);

  const facts: AutosAnuncioFactPair[] = [];

  if (year) facts.push({ label: lang === "es" ? "Año" : "Year", value: year });
  if (mileage) facts.push({ label: lang === "es" ? "Millaje" : "Mileage", value: mileage });

  if (has(/t[íi]tulo\s+limpio|clean\s+title/)) {
    facts.push({ label: lang === "es" ? "Título" : "Title", value: lang === "es" ? "Limpio" : "Clean" });
  } else if (has(/salvage|reconstru/)) {
    facts.push({ label: lang === "es" ? "Título" : "Title", value: lang === "es" ? "Salvage/Rebuild" : "Salvage/Rebuild" });
  }

  if (has(/financ|financing/)) {
    facts.push({ label: lang === "es" ? "Opciones" : "Options", value: lang === "es" ? "Financiamiento" : "Financing" });
  } else if (has(/cash\s+only|solo\s+efectivo/)) {
    facts.push({ label: lang === "es" ? "Opciones" : "Options", value: lang === "es" ? "Solo efectivo" : "Cash only" });
  }

  return facts;
}

function mergeDetailPairs(listing: AutosAnuncioListingLike, base: AutosAnuncioFactPair[]): AutosAnuncioFactPair[] {
  const pairs = (listing.detailPairs ?? listing.detail_pairs) as AutosAnuncioFactPair[] | undefined;
  if (!Array.isArray(pairs) || pairs.length === 0) return base;

  const seen = new Set(base.map((f) => normalizeLabel(f.label)));
  const out = [...base];

  for (const p of pairs) {
    if (!p?.label || p.value == null) continue;
    const n = normalizeLabel(p.label);
    if (seen.has(n)) continue;
    out.push({ label: p.label, value: String(p.value) });
    seen.add(n);
  }

  return out;
}

export function buildAutosAnuncioLiveFacts(
  listing: AutosAnuncioListingLike,
  lang: AutosAnuncioLang
): { facts: AutosAnuncioFactPair[] } | null {
  const inferred = factsFromTitleAndBlurb(listing, lang);
  const merged = mergeDetailPairs(listing, inferred);
  return merged.length ? { facts: merged } : null;
}
