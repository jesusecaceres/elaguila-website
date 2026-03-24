/**
 * Maps publish-wizard snapshot fields to the lista card shape used in the preview step.
 * Keeps preview logic category-owned (EnVentaListaCard contract).
 */

export type EnVentaPreviewListaCardModel = {
  id: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  hasImage: boolean;
  images: string[];
  evDept: string;
  evSub: string;
  itemType: string;
  conditionKey: string;
};

export function buildEnVentaPreviewModel(input: {
  title: string;
  priceLabel: string;
  city: string;
  filePreviews: string[];
  rama: string;
  evSub: string;
  itemType: string;
  condition: string;
}): EnVentaPreviewListaCardModel {
  const { title, priceLabel, city, filePreviews, rama, evSub, itemType, condition } = input;
  return {
    id: "preview",
    title: { es: title, en: title },
    priceLabel: { es: priceLabel, en: priceLabel },
    city: city || "—",
    postedAgo: { es: "hoy", en: "today" },
    hasImage: filePreviews.length > 0,
    images: filePreviews,
    evDept: rama,
    evSub,
    itemType,
    conditionKey: condition,
  };
}
