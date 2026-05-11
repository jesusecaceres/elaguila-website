/**
 * Single source of truth for **listing / ad plan** display (category rules).
 * Do not conflate with account membership (`profiles.membership_tier`).
 */

import { parseLeonixListingContract } from "@/app/(site)/clasificados/lib/leonixRealEstateListingContract";
import { listingPlanFromDetailPairs } from "@/app/(site)/dashboard/lib/dashboardListingMeta";
import type { AdminNormalizedAd } from "@/app/admin/_lib/adminAdIdentity";

/** Internal discriminator for analytics / filters (not always shown verbatim). */
export type ListingCategoryPlanKind =
  | "en_venta_free"
  | "en_venta_pro"
  | "restaurantes_paid_default"
  | "restaurantes_paid_package"
  | "bienes_raices_paid_private"
  | "bienes_raices_paid_business"
  | "rentas_paid_private"
  | "rentas_paid_business"
  | "clases_free"
  | "clases_paid"
  | "comunidad_free"
  | "empleos_paid"
  | "autos_paid_private"
  | "autos_paid_business"
  | "servicios_paid_business"
  | "viajes_paid"
  | "viajes_affiliate"
  | "unknown_from_row";

export type CategoryAdPlanDisplay = {
  key: ListingCategoryPlanKind;
  labelEn: string;
  labelEs: string;
  isPaid: boolean;
  isFree: boolean;
  isAffiliate: boolean;
  isBusiness: boolean;
  isPrivate: boolean;
  warning?: string;
};

export type CategoryAdPlanResolverInput = {
  category?: string | null;
  sourceTable?: string | null;
  packageTier?: string | null;
  plan?: string | null;
  tier?: string | null;
  sellerType?: string | null;
  rentasTier?: string | null;
  servicesTier?: string | null;
  businessRailTier?: string | null;
  price?: number | string | null;
  classPrice?: number | string | null;
  classTuition?: number | string | null;
  viajesLane?: string | null;
  isAffiliate?: boolean | null;
  listingKind?: string | null;
  autosLane?: string | null;
  detailPairs?: unknown;
  /** Last resort when category cannot be inferred; never substitute account plan. */
  fallbackPlanOrTier?: string | null;
  raw?: Record<string, unknown> | null;
};

export function listingPlanFieldLabel(lang: "en" | "es"): string {
  return lang === "es" ? "Plan del anuncio" : "Listing plan";
}

export function listingPlanFootnote(lang: "en" | "es"): string {
  return lang === "es"
    ? "El plan se calcula por categoría del anuncio, no por el plan de la cuenta."
    : "Plan is based on this listing’s category, not the account plan.";
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).replace(/[^0-9.-]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function isFreeLikePackageTier(raw: string | null | undefined): boolean {
  const t = (raw ?? "").trim().toLowerCase();
  return !t || t === "free" || t === "gratis" || t === "none" || t === "null" || t === "0";
}

function titleCasePackage(tier: string): string {
  const t = tier.trim();
  if (!t) return tier;
  return t
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function readViajesAffiliateFromRaw(raw: Record<string, unknown> | null | undefined): boolean {
  if (!raw) return false;
  const topAff =
    raw.is_affiliate === true ||
    raw.isAffiliate === true ||
    str(raw.listing_kind).toLowerCase() === "affiliate" ||
    str(raw.kind).toLowerCase() === "affiliate" ||
    str(raw.viajes_lane).toLowerCase() === "affiliate" ||
    str(raw.lane).toLowerCase() === "affiliate";
  if (topAff) return true;
  const lj = raw.listing_json;
  if (lj && typeof lj === "object") {
    const o = lj as Record<string, unknown>;
    const neg = o.negocios;
    if (neg && typeof neg === "object") {
      const p = (neg as Record<string, unknown>).partner;
      if (p && typeof p === "object" && (p as { isAffiliate?: unknown }).isAffiliate === true) return true;
    }
    const priv = o.privado;
    if (priv && typeof priv === "object") {
      const p = (priv as Record<string, unknown>).partner;
      if (p && typeof p === "object" && (p as { isAffiliate?: unknown }).isAffiliate === true) return true;
    }
  }
  return false;
}

function sellerIsBusiness(st: string | null | undefined): boolean {
  const t = (st ?? "").trim().toLowerCase();
  return t === "business" || t === "negocio" || t === "commercial";
}

function paidPrivateDisplay(): Pick<CategoryAdPlanDisplay, "labelEn" | "labelEs" | "isPaid" | "isFree" | "isAffiliate" | "isBusiness" | "isPrivate"> {
  return {
    labelEn: "Paid private",
    labelEs: "Privado pagado",
    isPaid: true,
    isFree: false,
    isAffiliate: false,
    isBusiness: false,
    isPrivate: true,
  };
}

function paidBusinessDisplay(): Pick<CategoryAdPlanDisplay, "labelEn" | "labelEs" | "isPaid" | "isFree" | "isAffiliate" | "isBusiness" | "isPrivate"> {
  return {
    labelEn: "Paid business",
    labelEs: "Negocio pagado",
    isPaid: true,
    isFree: false,
    isAffiliate: false,
    isBusiness: true,
    isPrivate: false,
  };
}

function finalize(
  key: ListingCategoryPlanKind,
  partial: Pick<CategoryAdPlanDisplay, "labelEn" | "labelEs" | "isPaid" | "isFree" | "isAffiliate" | "isBusiness" | "isPrivate">,
  warning?: string,
): CategoryAdPlanDisplay {
  return { key, ...partial, warning };
}

/**
 * Infer canonical listing category for plan rules from `category` slug and/or `sourceTable`.
 */
export function effectiveListingCategoryForPlan(input: CategoryAdPlanResolverInput): string {
  const st = str(input.sourceTable).toLowerCase();
  if (st.includes("restaurantes_public")) return "restaurantes";
  if (st.includes("servicios_public")) return "servicios";
  if (st.includes("empleos_public")) return "empleos";
  if (st.includes("autos_classifieds")) return "autos";
  if (st.includes("viajes_staged")) return "viajes";
  return str(input.category).toLowerCase() || "unknown";
}

export function resolveCategoryAdPlan(input: CategoryAdPlanResolverInput): CategoryAdPlanDisplay {
  const cat = effectiveListingCategoryForPlan(input);
  const raw = input.raw ?? undefined;

  if (cat === "restaurantes") {
    const pkg = str(input.packageTier) || (raw ? str(raw.package_tier) : "");
    if (!isFreeLikePackageTier(pkg)) {
      return finalize(
        "restaurantes_paid_package",
        {
          labelEn: `Paid restaurant · ${titleCasePackage(pkg)}`,
          labelEs: `Restaurante pagado · ${titleCasePackage(pkg)}`,
          isPaid: true,
          isFree: false,
          isAffiliate: false,
          isBusiness: false,
          isPrivate: false,
        },
      );
    }
    return finalize("restaurantes_paid_default", {
      labelEn: "Paid restaurant",
      labelEs: "Restaurante pagado",
      isPaid: true,
      isFree: false,
      isAffiliate: false,
      isBusiness: false,
      isPrivate: false,
    });
  }

  if (cat === "servicios") {
    return finalize("servicios_paid_business", {
      labelEn: "Paid business",
      labelEs: "Negocio pagado",
      isPaid: true,
      isFree: false,
      isAffiliate: false,
      isBusiness: true,
      isPrivate: false,
    });
  }

  if (cat === "empleos" || cat === "empleo") {
    return finalize("empleos_paid", {
      labelEn: "Paid job",
      labelEs: "Empleo pagado",
      isPaid: true,
      isFree: false,
      isAffiliate: false,
      isBusiness: true,
      isPrivate: false,
    });
  }

  if (cat === "comunidad") {
    return finalize("comunidad_free", {
      labelEn: "Free",
      labelEs: "Gratis",
      isPaid: false,
      isFree: true,
      isAffiliate: false,
      isBusiness: false,
      isPrivate: false,
    });
  }

  if (cat === "clases") {
    const p =
      toNum(input.classPrice) ??
      toNum(input.classTuition) ??
      toNum(input.price) ??
      (raw ? toNum(raw.price ?? raw.class_price ?? raw.tuition) : null);
    if (p != null && p > 0) {
      return finalize("clases_paid", {
        labelEn: "Paid class",
        labelEs: "Clase pagada",
        isPaid: true,
        isFree: false,
        isAffiliate: false,
        isBusiness: false,
        isPrivate: false,
      });
    }
    return finalize("clases_free", {
      labelEn: "Free class",
      labelEs: "Clase gratis",
      isPaid: false,
      isFree: true,
      isAffiliate: false,
      isBusiness: false,
      isPrivate: false,
    });
  }

  if (cat === "en-venta") {
    const fromPairs = listingPlanFromDetailPairs(input.detailPairs);
    const pro = fromPairs === "pro" || str(input.plan).toLowerCase().includes("pro") || str(input.tier).toLowerCase().includes("pro");
    if (pro) {
      return finalize("en_venta_pro", {
        labelEn: "Pro",
        labelEs: "Pro",
        isPaid: true,
        isFree: false,
        isAffiliate: false,
        isBusiness: false,
        isPrivate: false,
      });
    }
    return finalize("en_venta_free", {
      labelEn: "Free",
      labelEs: "Gratis",
      isPaid: false,
      isFree: true,
      isAffiliate: false,
      isBusiness: false,
      isPrivate: false,
    });
  }

  if (cat === "viajes" || cat === "travel") {
    const affiliate =
      input.isAffiliate === true ||
      str(input.listingKind).toLowerCase() === "affiliate" ||
      str(input.viajesLane).toLowerCase() === "affiliate" ||
      readViajesAffiliateFromRaw(raw);
    if (affiliate) {
      return finalize("viajes_affiliate", {
        labelEn: "Affiliate",
        labelEs: "Afiliado",
        isPaid: false,
        isFree: false,
        isAffiliate: true,
        isBusiness: false,
        isPrivate: false,
      });
    }
    return finalize("viajes_paid", {
      labelEn: "Paid travel",
      labelEs: "Viaje pagado",
      isPaid: true,
      isFree: false,
      isAffiliate: false,
      isBusiness: false,
      isPrivate: false,
    });
  }

  if (cat === "autos") {
    const lane = str(input.autosLane) || (raw ? str(raw.lane) : "");
    const st = str(input.sellerType) || (raw ? str(raw.seller_type) : "");
    if (lane === "negocios" || sellerIsBusiness(st)) {
      return finalize("autos_paid_business", paidBusinessDisplay());
    }
    return finalize("autos_paid_private", paidPrivateDisplay());
  }

  if (cat === "bienes-raices" || cat === "bienes_raices") {
    const lx = parseLeonixListingContract(input.detailPairs);
    const branch = lx.branch;
    if (branch === "bienes_raices_negocio") {
      return finalize("bienes_raices_paid_business", paidBusinessDisplay());
    }
    if (branch === "bienes_raices_privado") {
      return finalize("bienes_raices_paid_private", paidPrivateDisplay());
    }
    const st = str(input.sellerType) || (raw ? str(raw.seller_type) : "");
    if (sellerIsBusiness(st)) return finalize("bienes_raices_paid_business", paidBusinessDisplay());
    return finalize("bienes_raices_paid_private", paidPrivateDisplay());
  }

  if (cat === "rentas") {
    const lx = parseLeonixListingContract(input.detailPairs);
    const branch = lx.branch;
    if (branch === "rentas_negocio") {
      return finalize("rentas_paid_business", paidBusinessDisplay());
    }
    if (branch === "rentas_privado") {
      return finalize("rentas_paid_private", paidPrivateDisplay());
    }
    const st = str(input.sellerType) || (raw ? str(raw.seller_type) : "");
    if (sellerIsBusiness(st)) return finalize("rentas_paid_business", paidBusinessDisplay());
    return finalize("rentas_paid_private", paidPrivateDisplay());
  }

  const fb = str(input.fallbackPlanOrTier) || str(input.plan) || str(input.tier);
  const warn =
    "Category could not be matched to a known Leonix listing family; label is inferred only from row plan/tier fields (not account membership).";
  if (fb.toLowerCase().includes("pro") || fb.toLowerCase().includes("business") || fb.toLowerCase().includes("paid")) {
    return finalize(
      "unknown_from_row",
      {
        labelEn: titleCasePackage(fb) || "Paid (unspecified)",
        labelEs: titleCasePackage(fb) || "Pagado (sin categoría)",
        isPaid: true,
        isFree: false,
        isAffiliate: false,
        isBusiness: false,
        isPrivate: false,
      },
      warn,
    );
  }
  if (fb) {
    return finalize(
      "unknown_from_row",
      {
        labelEn: titleCasePackage(fb),
        labelEs: titleCasePackage(fb),
        isPaid: false,
        isFree: fb.toLowerCase().includes("free") || fb.toLowerCase().includes("gratis"),
        isAffiliate: false,
        isBusiness: false,
        isPrivate: false,
      },
      warn,
    );
  }
  return finalize(
    "unknown_from_row",
    {
      labelEn: "Unknown",
      labelEs: "Desconocido",
      isPaid: false,
      isFree: false,
      isAffiliate: false,
      isBusiness: false,
      isPrivate: false,
    },
    warn,
  );
}

export function categoryAdPlanDisplayLabel(display: CategoryAdPlanDisplay, lang: "en" | "es"): string {
  return lang === "es" ? display.labelEs : display.labelEn;
}

/** Build resolver input from a normalized admin ad row + optional generic listing fields in sourceMeta. */
export function resolveCategoryAdPlanFromAdminAd(ad: AdminNormalizedAd): CategoryAdPlanDisplay {
  const meta = ad.sourceMeta ?? {};
  const sellerType = str(meta.seller_type ?? meta.sellerType);
  const price = meta.price as number | string | null | undefined;
  const packageTier = str(meta.package_tier ?? meta.packageTier);
  const detailPairs = meta.detail_pairs ?? meta.detailPairs;
  const plan = str(meta.plan ?? meta.listing_plan);
  const tier = str(meta.tier);
  const autosLane = str(meta.lane);
  const isAffiliate = meta.is_affiliate === true || meta.isAffiliate === true;
  const listingKind = str(meta.listing_kind ?? meta.listingKind);

  const base: CategoryAdPlanResolverInput = {
    category: ad.categorySlug,
    sourceTable:
      ad.source === "generic"
        ? "listings"
        : ad.source === "restaurantes"
          ? "restaurantes_public_listings"
          : ad.source === "servicios"
            ? "servicios_public_listings"
            : ad.source === "empleos"
              ? "empleos_public_listings"
              : ad.source === "autos"
                ? "autos_classifieds_listings"
                : null,
    packageTier: packageTier || undefined,
    sellerType: sellerType || undefined,
    price: price ?? undefined,
    plan: plan || undefined,
    tier: tier || undefined,
    autosLane: ad.source === "autos" ? autosLane : undefined,
    viajesLane: str(meta.viajes_lane),
    isAffiliate,
    listingKind,
    detailPairs,
    fallbackPlanOrTier: plan || tier || undefined,
    raw: meta as Record<string, unknown>,
  };

  return resolveCategoryAdPlan(base);
}

/** Map unified dashboard inventory rows to the category plan resolver. */
export function resolveCategoryAdPlanFromDashboardInventoryItem(item: {
  source: string;
  category: string;
  packageTier?: string | null;
  sellerType?: string | null;
  price?: number | string | null;
  detailPairs?: unknown;
  autosLane?: string | null;
  viajesLane?: string | null;
  planRaw?: Record<string, unknown> | null;
}): CategoryAdPlanDisplay {
  const sourceTable =
    item.source === "listings"
      ? "listings"
      : item.source === "restaurantes_public_listings"
        ? "restaurantes_public_listings"
        : item.source === "empleos_public_listings"
          ? "empleos_public_listings"
          : item.source === "viajes_staged_listings"
            ? "viajes_staged_listings"
            : item.source === "autos_classifieds_listings"
              ? "autos_classifieds_listings"
              : item.source === "servicios_public_listings"
                ? "servicios_public_listings"
                : item.source;
  return resolveCategoryAdPlan({
    category: item.category,
    sourceTable,
    packageTier: item.packageTier ?? undefined,
    sellerType: item.sellerType ?? undefined,
    price: item.price ?? undefined,
    detailPairs: item.detailPairs,
    autosLane: item.autosLane ?? undefined,
    viajesLane: item.viajesLane ?? undefined,
    raw: item.planRaw ?? null,
  });
}
