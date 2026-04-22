"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { upsertSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { TiendaStorefrontPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { TIENDA_CATEGORY_SLUGS } from "@/app/tienda/data/tiendaCategories";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function optionalUrl(s: string): string | undefined {
  if (!s) return undefined;
  if (s.startsWith("https://") || s.startsWith("/")) return s;
  return undefined;
}

function bi(es: string, en: string): { es: string; en: string } {
  return { es, en };
}

/** Full snapshot from form — empty strings clear overrides for that field in DB via merge-on-read. */
function formDataToPayload(formData: FormData): TiendaStorefrontPayload {
  const payload: TiendaStorefrontPayload = {
    hero: {
      eyebrow: bi(str(formData, "hero_eyebrow_es"), str(formData, "hero_eyebrow_en")),
      headline: bi(str(formData, "hero_headline_es"), str(formData, "hero_headline_en")),
      subhead: bi(str(formData, "hero_subhead_es"), str(formData, "hero_subhead_en")),
      ctaPrimary: bi(str(formData, "hero_cta_primary_es"), str(formData, "hero_cta_primary_en")),
      ctaSecondary: bi(str(formData, "hero_cta_secondary_es"), str(formData, "hero_cta_secondary_en")),
      supportingLine: bi(str(formData, "hero_supporting_es"), str(formData, "hero_supporting_en")),
    },
    categoriesSection: {
      eyebrow: bi(str(formData, "cat_eyebrow_es"), str(formData, "cat_eyebrow_en")),
      title: bi(str(formData, "cat_title_es"), str(formData, "cat_title_en")),
      description: bi(str(formData, "cat_desc_es"), str(formData, "cat_desc_en")),
    },
    featuredSection: {
      eyebrow: bi(str(formData, "feat_eyebrow_es"), str(formData, "feat_eyebrow_en")),
      title: bi(str(formData, "feat_title_es"), str(formData, "feat_title_en")),
      description: bi(str(formData, "feat_desc_es"), str(formData, "feat_desc_en")),
    },
    howItWorks: {
      eyebrow: bi(str(formData, "hiw_eyebrow_es"), str(formData, "hiw_eyebrow_en")),
      title: bi(str(formData, "hiw_title_es"), str(formData, "hiw_title_en")),
      description: bi(str(formData, "hiw_desc_es"), str(formData, "hiw_desc_en")),
      note: bi(str(formData, "hiw_note_es"), str(formData, "hiw_note_en")),
    },
    trust: {
      eyebrow: bi(str(formData, "trust_eyebrow_es"), str(formData, "trust_eyebrow_en")),
      title: bi(str(formData, "trust_title_es"), str(formData, "trust_title_en")),
      items: {
        es: str(formData, "trust_items_es")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        en: str(formData, "trust_items_en")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      },
    },
    finalCta: {
      title: bi(str(formData, "fc_title_es"), str(formData, "fc_title_en")),
      body: bi(str(formData, "fc_body_es"), str(formData, "fc_body_en")),
      primary: bi(str(formData, "fc_primary_es"), str(formData, "fc_primary_en")),
      secondary: bi(str(formData, "fc_secondary_es"), str(formData, "fc_secondary_en")),
    },
  };

  const tiles: NonNullable<TiendaStorefrontPayload["heroTileImages"]> = {};
  const tileKeys = [
    "businessCards",
    "bannersSigns",
    "printWorkflow",
    "thumbFlyers",
    "thumbBrochures",
    "thumbStickers",
    "thumbPromo",
  ] as const;
  for (const k of tileKeys) {
    const u = optionalUrl(str(formData, `tile_${k}`));
    if (u) tiles[k] = u;
  }
  if (Object.keys(tiles).length) payload.heroTileImages = tiles;

  const covers: Record<string, string> = {};
  for (const slug of TIENDA_CATEGORY_SLUGS) {
    const field = `cover_${slug.replace(/-/g, "__")}`;
    const u = optionalUrl(str(formData, field));
    if (u) covers[slug] = u;
  }
  if (Object.keys(covers).length) payload.categoryCardCoverUrls = covers;

  const adv = str(formData, "category_copy_json");
  if (adv.trim()) {
    try {
      const parsed = JSON.parse(adv) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        payload.categoryCardCopy = parsed as TiendaStorefrontPayload["categoryCardCopy"];
      }
    } catch {
      /* invalid JSON: omit */
    }
  }

  const orderRaw = str(formData, "homepage_category_order");
  if (orderRaw) {
    payload.homepageCategorySlugs = orderRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const promoEs = str(formData, "storefront_promo_es");
  const promoEn = str(formData, "storefront_promo_en");
  if (promoEs || promoEn) {
    payload.storefrontPromoStrip = { es: promoEs, en: promoEn };
  }

  return payload;
}

export async function saveTiendaStorefrontFormAction(formData: FormData) {
  await assertAdmin();
  const next = formDataToPayload(formData);
  const { error } = await upsertSiteSectionPayload("tienda_storefront", next as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  auditAdminWrite("site_section_saved", "site_section", "tienda_storefront", {});
  revalidatePath("/tienda");
  revalidatePath("/admin/workspace/tienda/storefront");
  redirect("/admin/workspace/tienda/storefront?saved=1");
}
