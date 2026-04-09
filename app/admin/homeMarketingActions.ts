"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { upsertSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { HomeFeaturedCallout, HomeMarketingPayload } from "@/app/lib/siteSectionContent/payloadTypes";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function on(f: FormData, k: string): boolean {
  return f.get(k) === "on";
}

function parseCallouts(f: FormData): HomeFeaturedCallout[] {
  const out: HomeFeaturedCallout[] = [];
  for (let i = 1; i <= 5; i++) {
    const labelEs = str(f, `callout_${i}_es`);
    const labelEn = str(f, `callout_${i}_en`);
    const href = str(f, `callout_${i}_href`);
    if (labelEs || labelEn || href) {
      out.push({ labelEs, labelEn, href });
    }
  }
  return out.slice(0, 5);
}

export async function saveHomeMarketingAction(formData: FormData) {
  await assertAdmin();
  const payload: HomeMarketingPayload = {
    title: { es: str(formData, "title_es"), en: str(formData, "title_en") },
    identity: { es: str(formData, "identity_es"), en: str(formData, "identity_en") },
    precedent: { es: str(formData, "precedent_es"), en: str(formData, "precedent_en") },
    ctaPrimary: { es: str(formData, "cta_primary_es"), en: str(formData, "cta_primary_en") },
    ctaSecondary: { es: str(formData, "cta_secondary_es"), en: str(formData, "cta_secondary_en") },
    coverAlt: { es: str(formData, "cover_alt_es"), en: str(formData, "cover_alt_en") },
    coverImageSrc: str(formData, "cover_image_src") || undefined,
    announcementBar: { es: str(formData, "announce_es"), en: str(formData, "announce_en") },
    promoStrip: { es: str(formData, "promo_es"), en: str(formData, "promo_en") },
    ctaPrimaryHref: str(formData, "cta_primary_href") || undefined,
    ctaSecondaryHref: str(formData, "cta_secondary_href") || undefined,
    modules: {
      showAnnouncement: on(formData, "mod_ann"),
      showHeroImage: on(formData, "mod_hero_img"),
      showSecondaryLine: on(formData, "mod_secondary"),
      showCallouts: on(formData, "mod_callouts"),
    },
    calloutsPlacement: str(formData, "callouts_placement") === "below_title" ? "below_title" : "below_precedent",
    featuredCallouts: parseCallouts(formData),
  };
  const { error } = await upsertSiteSectionPayload("home_marketing", payload as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  auditAdminWrite("site_section_saved", "site_section", "home_marketing", {});
  revalidatePath("/home");
  redirect("/admin/workspace/home/content?saved=1");
}
