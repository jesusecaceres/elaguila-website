/**
 * Publish wizard: requirement checklist rows, missing-text helpers, and basics-step navigation
 * derived from `PublishRequirements` (same flags as preview/insert validation).
 */

import type { PublishRequirements } from "./publishRequirements";

export type PublishLang = "es" | "en";

/** Wizard steps used by checklist rows (subset of full publish step union). */
export type PublishChecklistStep = "category" | "basics" | "media";

export type PublishRequirementChecklistItem = {
  key: string;
  label: string;
  ok: boolean;
  step: PublishChecklistStep;
};

export function buildPublishRequirementItems(params: {
  requirements: PublishRequirements;
  lang: PublishLang;
  isFree: boolean;
  contactMethod: "phone" | "email" | "both";
  categoryFromUrl: string;
  rentasBranch: string;
}): PublishRequirementChecklistItem[] {
  const { requirements, lang, isFree, contactMethod, categoryFromUrl, rentasBranch } = params;
  const items: PublishRequirementChecklistItem[] = [
    {
      key: "category",
      label: lang === "es" ? "Categoría" : "Category",
      ok: requirements.categoryOk,
      step: "category",
    },
    {
      key: "title",
      label: lang === "es" ? "Título" : "Title",
      ok: requirements.titleOk,
      step: "basics",
    },
    {
      key: "desc",
      label: lang === "es" ? "Descripción" : "Description",
      ok: requirements.descOk,
      step: "basics",
    },
    {
      key: "price",
      label:
        categoryFromUrl === "rentas"
          ? lang === "es"
            ? "Renta mensual"
            : "Monthly rent"
          : lang === "es"
            ? (isFree ? "Gratis" : "Precio")
            : (isFree ? "Free" : "Price"),
      ok: requirements.priceOk,
      step: "basics",
    },
    {
      key: "city",
      label: lang === "es" ? "Ciudad válida" : "Valid city",
      ok: requirements.cityOk,
      step: "basics",
    },
    ...(categoryFromUrl === "rentas"
        ? [
            {
              key: "rentasDetails" as const,
              label:
                lang === "es"
                  ? "Subcategoría, tipo, rama, fecha disponible" + (rentasBranch === "negocio" ? ", plan y nombre del negocio" : "")
                  : "Subcategory, type, branch, availability" + (rentasBranch === "negocio" ? ", plan & business name" : ""),
              ok: requirements.rentasMetaOk,
              step: "basics" as const,
            },
          ]
        : categoryFromUrl === "bienes-raices"
          ? [
              {
                key: "bienesRaicesSubcat" as const,
                label: lang === "es"
                  ? "Datos de propiedad (tipo, recámaras, baños, pies², descripción)"
                  : "Property data (type, beds, baths, sq ft, description)",
                ok: requirements.bienesRaicesMetaOk,
                step: "basics" as const,
              },
            ]
          : []),
    {
      key: "images",
      label: lang === "es" ? "1+ foto" : "1+ photo",
      ok: requirements.imagesOk,
      step: "media",
    },
    ...(contactMethod === "both"
      ? [
          {
            key: "contactPhone",
            label: lang === "es" ? "Teléfono válido (10 dígitos)" : "Valid phone (10 digits)",
            ok: requirements.phoneOk,
            step: "media" as const,
          },
          {
            key: "contactEmail",
            label: lang === "es" ? "Email válido" : "Valid email",
            ok: requirements.emailOk,
            step: "media" as const,
          },
        ]
      : contactMethod === "phone"
        ? [
            {
              key: "contact",
              label: lang === "es" ? "Contacto válido (teléfono)" : "Valid contact (phone)",
              ok: requirements.phoneOk,
              step: "media" as const,
            },
          ]
        : [
            {
              key: "contact",
              label: lang === "es" ? "Contacto válido (email)" : "Valid contact (email)",
              ok: requirements.emailOk,
              step: "media" as const,
            },
          ]),
  ];
  return items;
}

export function buildMissingRequirementsText(
  items: PublishRequirementChecklistItem[],
  lang: PublishLang
): string {
  const missing = items.filter((i) => !i.ok).map((i) => i.label);
  if (missing.length === 0) return "";
  const prefix = lang === "es" ? "Falta:" : "Missing:";
  return `${prefix} ${missing.join(" · ")}`;
}

export function buildMissingBasicsRequirementsText(
  items: PublishRequirementChecklistItem[],
  lang: PublishLang
): string {
  const missing = items.filter((i) => i.step === "basics" && !i.ok).map((i) => i.label);
  if (missing.length === 0) return "";
  const prefix = lang === "es" ? "Falta:" : "Missing:";
  return `${prefix} ${missing.join(" · ")}`;
}

export function computeBasicsOk(categoryFromUrl: string, requirements: PublishRequirements): boolean {
  return categoryFromUrl === "rentas"
      ? requirements.rentasMetaOk &&
        requirements.titleOk &&
        requirements.descOk &&
        requirements.priceOk &&
        requirements.cityOk
      : categoryFromUrl === "bienes-raices"
        ? requirements.bienesRaicesMetaOk &&
          requirements.titleOk &&
          requirements.descOk &&
          requirements.priceOk &&
          requirements.cityOk
        : requirements.titleOk && requirements.descOk && requirements.priceOk && requirements.cityOk;
}

/** First invalid basics section for scroll-into-view after failed “Siguiente”. */
export function getFirstBasicsInvalidElementId(
  categoryFromUrl: string,
  requirements: PublishRequirements
): string | null {
  if (computeBasicsOk(categoryFromUrl, requirements)) return null;
  if (categoryFromUrl === "rentas") {
    if (!requirements.rentasMetaOk) return "publish-basics-rentas-meta";
    if (!requirements.titleOk) return "publish-basics-title";
    if (!requirements.descOk) return "publish-basics-desc";
    if (!requirements.priceOk) return "publish-basics-price";
    if (!requirements.cityOk) return "publish-basics-city";
    return null;
  }
  if (categoryFromUrl === "bienes-raices") {
    if (!requirements.bienesRaicesMetaOk) return "publish-basics-br-meta";
    if (!requirements.titleOk) return "publish-basics-title";
    if (!requirements.descOk) return "publish-basics-desc";
    if (!requirements.priceOk) return "publish-basics-price";
    if (!requirements.cityOk) return "publish-basics-city";
    return null;
  }
  if (!requirements.titleOk) return "publish-basics-title";
  if (!requirements.descOk) return "publish-basics-desc";
  if (!requirements.priceOk) return "publish-basics-price";
  if (!requirements.cityOk) return "publish-basics-city";
  return null;
}
