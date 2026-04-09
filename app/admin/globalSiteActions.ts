"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { upsertSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { GlobalSitePayload } from "@/app/lib/siteSectionContent/payloadTypes";

async function assertGlobalSiteAdmin(): Promise<void> {
  await requireLeonixAdminPermission("can_manage_website_content");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function on(f: FormData, k: string): boolean {
  return f.get(k) === "on";
}

export async function saveGlobalSiteAction(formData: FormData) {
  await assertGlobalSiteAdmin();
  const payload: GlobalSitePayload = {
    sitewideNotice: { es: str(formData, "notice_es"), en: str(formData, "notice_en") },
    globalPromoStrip: { es: str(formData, "promo_es"), en: str(formData, "promo_en") },
    toggles: {
      showSiteWideBanners: on(formData, "toggle_banner_region"),
      showSitewideNotice: on(formData, "toggle_notice"),
      showGlobalPromoStrip: on(formData, "toggle_promo"),
    },
  };
  const { error } = await upsertSiteSectionPayload("global_site", payload as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  auditAdminWrite("site_section_saved", "site_section", "global_site", {});
  revalidatePath("/", "layout");
  redirect("/admin/site-settings?saved=1");
}
