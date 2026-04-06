"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { upsertSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { ContactoPayload } from "@/app/lib/siteSectionContent/payloadTypes";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

export async function saveContactoSectionAction(formData: FormData) {
  await assertAdmin();
  const payload: ContactoPayload = {
    intro: { es: str(formData, "intro_es"), en: str(formData, "intro_en") },
    hours: { es: str(formData, "hours_es"), en: str(formData, "hours_en") },
    email: str(formData, "email") || undefined,
    phone: str(formData, "phone") || undefined,
    address: { es: str(formData, "address_es"), en: str(formData, "address_en") },
    noticeBanner: { es: str(formData, "notice_es"), en: str(formData, "notice_en") },
    mapUrl: str(formData, "map_url") || undefined,
  };
  const { error } = await upsertSiteSectionPayload("contacto", payload as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  revalidatePath("/contacto");
  redirect("/admin/workspace/contacto/content?saved=1");
}
