"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { upsertSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { NosotrosPayload } from "@/app/lib/siteSectionContent/payloadTypes";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

export async function saveNosotrosSectionAction(formData: FormData) {
  await assertAdmin();
  const payload: NosotrosPayload = {
    heroTitle: { es: str(formData, "hero_title_es"), en: str(formData, "hero_title_en") },
    lead: { es: str(formData, "lead_es"), en: str(formData, "lead_en") },
    mission: { es: str(formData, "mission_es"), en: str(formData, "mission_en") },
    vision: { es: str(formData, "vision_es"), en: str(formData, "vision_en") },
    values: { es: str(formData, "values_es"), en: str(formData, "values_en") },
    mediaImageSrc: str(formData, "media_src") || undefined,
    mediaImageAlt: { es: str(formData, "media_alt_es"), en: str(formData, "media_alt_en") },
    ctaPrimary: { es: str(formData, "cta_primary_es"), en: str(formData, "cta_primary_en") },
    ctaSecondary: { es: str(formData, "cta_secondary_es"), en: str(formData, "cta_secondary_en") },
    ctaPrimaryHref: str(formData, "cta_primary_href") || undefined,
    ctaSecondaryHref: str(formData, "cta_secondary_href") || undefined,
  };
  const { error } = await upsertSiteSectionPayload("nosotros", payload as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  revalidatePath("/about");
  redirect("/admin/workspace/nosotros/content?saved=1");
}
