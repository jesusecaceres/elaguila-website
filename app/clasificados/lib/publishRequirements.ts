/**
 * Publish wizard: readiness flags derived from `PublishDraftSnapshot` (same source as preview/insert).
 */

import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import { computeBienesRaicesPublishMetaOk } from "@/app/clasificados/bienes-raices/shared/publish/computeBienesRaicesPublishMetaOk";
import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";
import { computeRentasPublishMetaOk } from "@/app/clasificados/rentas/publish/computeRentasPublishMetaOk";

function normalizeCategory(raw: string): CategoryKey | "" {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  const mapped = v === "viajes" ? "travel" : v;
  const keys = Object.keys(categoryConfig) as CategoryKey[];
  return keys.includes(mapped as CategoryKey) ? (mapped as CategoryKey) : "";
}

function getPhoneDigits(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 10);
}

export type PublishRequirements = {
  categoryOk: boolean;
  titleOk: boolean;
  descOk: boolean;
  cityOk: boolean;
  priceOk: boolean;
  imagesOk: boolean;
  phoneOk: boolean;
  emailOk: boolean;
  contactOk: boolean;
  /** En Venta marketplace subcategoría / artículo / condición. */
  ventaMarketplaceMetaOk: boolean;
  rentasMetaOk: boolean;
  bienesRaicesMetaOk: boolean;
  allOk: boolean;
};

/** Validation from snapshot so we validate what preview/insert use. */
export function computePublishRequirements(s: PublishDraftSnapshot): PublishRequirements {
  const categoryOk = !!normalizeCategory(s.category);
  const titleOk = s.title.length >= 5;
  const descOk = s.description.length >= 5;
  const cityOk = Boolean(s.cityCanonical);
  const priceNum = (s.priceRaw ?? "").replace(/[^0-9.]/g, "");
  const priceOk =
    s.category === "rentas" || s.category === "bienes-raices"
      ? priceNum !== "" && Number.isFinite(Number(priceNum)) && Number(priceNum) >= 0
      : s.isFree || (priceNum !== "" && Number.isFinite(Number(priceNum)) && Number(priceNum) >= 0);
  const imagesOk = s.images.length >= 1;
  const bienesRaicesBranchEarly = (s.details.bienesRaicesBranch ?? "").trim().toLowerCase();
  const isBienesRaicesNegocioContact = s.category === "bienes-raices" && bienesRaicesBranchEarly === "negocio";
  const brNegocioOfficeDigits = (s.details.negocioTelOficina ?? "").replace(/\D/g, "").slice(0, 10);
  const brNegocioBizEmailOk = /.+@.+\..+/.test((s.details.negocioEmail ?? "").trim());
  const phoneDigits = getPhoneDigits(s.contactPhone);
  const phoneOk =
    s.contactMethod === "email"
      ? true
      : phoneDigits.length === 10 || (isBienesRaicesNegocioContact && brNegocioOfficeDigits.length === 10);
  const emailOk =
    s.contactMethod === "phone"
      ? true
      : /.+@.+\..+/.test(s.contactEmail.trim()) || (isBienesRaicesNegocioContact && brNegocioBizEmailOk);
  const contactOk =
    phoneDigits.length === 10 ||
    /.+@.+\..+/.test(s.contactEmail.trim()) ||
    (isBienesRaicesNegocioContact && (brNegocioOfficeDigits.length === 10 || brNegocioBizEmailOk));

  /** En Venta publish is gated (coming soon); keep snapshot validation permissive if category slips through. */
  const ventaMarketplaceMetaOk =
    s.category !== "en-venta" ||
    (!!(s.details.rama ?? "").trim() &&
      !!(s.details.itemType ?? "").trim() &&
      !!(s.details.condition ?? "").trim());
  const rentasMetaOk = computeRentasPublishMetaOk(s, contactOk);
  const bienesRaicesMetaOk = computeBienesRaicesPublishMetaOk(s);

  return {
    categoryOk,
    titleOk,
    descOk,
    cityOk,
    priceOk,
    imagesOk,
    phoneOk,
    emailOk,
    contactOk,
    ventaMarketplaceMetaOk,
    rentasMetaOk,
    bienesRaicesMetaOk,
    allOk:
      categoryOk &&
      titleOk &&
      descOk &&
      cityOk &&
      priceOk &&
      imagesOk &&
      contactOk &&
      phoneOk &&
      emailOk &&
      ventaMarketplaceMetaOk &&
      rentasMetaOk &&
      bienesRaicesMetaOk,
  };
}
