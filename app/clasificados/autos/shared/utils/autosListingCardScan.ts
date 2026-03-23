import { parseAutoFromTitle } from "./parseAutoFromTitle";

export type AutosCardLang = "es" | "en";

export type AutosCardListingInput = {
  title: Record<AutosCardLang, string>;
  year?: number;
  make?: string;
  model?: string;
  mileage?: number | string;
};

/**
 * Unified year/make/model/mileage lines for grid + row lista cards.
 */
export function buildAutosListingCardScan(x: AutosCardListingInput, lang: AutosCardLang) {
  const parsed = parseAutoFromTitle(x.title[lang] ?? "");
  const specFromFields = [x.year ? String(x.year) : null, x.make ?? null, x.model ?? null].filter(Boolean).join(" • ");
  const autosSpec = specFromFields || parsed.specLabel || null;

  let autosMileage: string | null = null;
  if (typeof x.mileage === "number") {
    autosMileage = `${x.mileage.toLocaleString()} mi`;
  } else if (typeof x.mileage === "string" && x.mileage.trim()) {
    autosMileage = x.mileage.trim();
  } else {
    autosMileage = parsed.mileageLabel;
  }

  return { autosSpec, autosMileage };
}
