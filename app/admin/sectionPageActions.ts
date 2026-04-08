"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { upsertSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { CuponCardPayload, CuponesPagePayload, IglesiasPagePayload, NoticiasPagePayload } from "@/app/lib/siteSectionContent/payloadTypes";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

export async function saveNoticiasPageAction(formData: FormData) {
  await assertAdmin();
  const payload: NoticiasPagePayload = {
    pageTitle: { es: str(formData, "page_title_es"), en: str(formData, "page_title_en") },
    subtitle: { es: str(formData, "subtitle_es"), en: str(formData, "subtitle_en") },
    breakingLabel: { es: str(formData, "breaking_es"), en: str(formData, "breaking_en") },
  };
  const { error } = await upsertSiteSectionPayload("noticias_page", payload as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  revalidatePath("/noticias");
  redirect("/admin/workspace/noticias/content?saved=1");
}

export async function saveIglesiasPageAction(formData: FormData) {
  await assertAdmin();
  const payload: IglesiasPagePayload = {
    title: { es: str(formData, "title_es"), en: str(formData, "title_en") },
    subtitle: { es: str(formData, "subtitle_es"), en: str(formData, "subtitle_en") },
    note: { es: str(formData, "note_es"), en: str(formData, "note_en") },
    backCta: { es: str(formData, "back_es"), en: str(formData, "back_en") },
  };
  const { error } = await upsertSiteSectionPayload("iglesias_page", payload as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  revalidatePath("/iglesias");
  redirect("/admin/workspace/iglesias/content?saved=1");
}

function parseCouponsFromForm(formData: FormData): CuponCardPayload[] {
  const out: CuponCardPayload[] = [];
  for (let i = 1; i <= 8; i++) {
    const titleEs = str(formData, `c${i}_title_es`);
    const titleEn = str(formData, `c${i}_title_en`);
    if (!titleEs && !titleEn) continue;
    out.push({
      titleEs,
      titleEn,
      businessEs: str(formData, `c${i}_biz_es`),
      businessEn: str(formData, `c${i}_biz_en`),
      descriptionEs: str(formData, `c${i}_desc_es`),
      descriptionEn: str(formData, `c${i}_desc_en`),
      image: str(formData, `c${i}_img`) || "/coupons/detailing.jpg",
      expiresEs: str(formData, `c${i}_exp_es`),
      expiresEn: str(formData, `c${i}_exp_en`),
    });
  }
  return out;
}

export async function saveCuponesPageAction(formData: FormData) {
  await assertAdmin();
  const coupons = parseCouponsFromForm(formData);
  const payload: CuponesPagePayload = {
    pageTitle: { es: str(formData, "page_title_es"), en: str(formData, "page_title_en") },
    intro: { es: str(formData, "intro_es"), en: str(formData, "intro_en") },
    coupons: coupons.length ? coupons : undefined,
  };
  const { error } = await upsertSiteSectionPayload("cupones_page", payload as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  revalidatePath("/cupones");
  revalidatePath("/coupons");
  redirect("/admin/workspace/cupones/content?saved=1");
}
