export type AutosAnuncioLang = "es" | "en";

export type AutosAnuncioFactPair = { label: string; value: string };

export type AutosAnuncioListingLike = {
  id: string;
  category: string;
  title?: Record<AutosAnuncioLang, string>;
  blurb?: Record<AutosAnuncioLang, string>;
  priceLabel?: Record<AutosAnuncioLang, string>;
  detailPairs?: AutosAnuncioFactPair[];
  detail_pairs?: AutosAnuncioFactPair[];
};
