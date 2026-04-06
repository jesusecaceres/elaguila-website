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

/** Persists copy for a future public /nosotros route. */
export async function saveNosotrosSectionAction(formData: FormData) {
  await assertAdmin();
  const payload: NosotrosPayload = {
    heroTitle: { es: str(formData, "hero_title_es"), en: str(formData, "hero_title_en") },
    lead: { es: str(formData, "lead_es"), en: str(formData, "lead_en") },
    mission: { es: str(formData, "mission_es"), en: str(formData, "mission_en") },
    ctaPrimary: { es: str(formData, "cta_es"), en: str(formData, "cta_en") },
  };
  const { error } = await upsertSiteSectionPayload("nosotros", payload as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  revalidatePath("/admin/workspace/nosotros/content");
  redirect("/admin/workspace/nosotros/content?saved=1");
}
