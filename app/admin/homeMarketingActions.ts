"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { upsertSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { HomeMarketingPayload } from "@/app/lib/siteSectionContent/payloadTypes";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
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
  };
  const { error } = await upsertSiteSectionPayload("home_marketing", payload as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  revalidatePath("/home");
  redirect("/admin/workspace/home/content?saved=1");
}
