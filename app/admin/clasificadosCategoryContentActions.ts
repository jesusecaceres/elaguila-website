"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { getSiteSectionPayload, upsertSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { ClasificadosCategoryContentRootPayload } from "@/app/lib/clasificados/clasificadosCategoryContentTypes";
import { extractCategoryPatch, parseEnVentaPatch } from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import { buildEnVentaCategoryPatchFromForm } from "@/app/lib/clasificados/enVentaCategoryContentFormParse";

const SECTION = "clasificados_category_content" as const;
const EN_VENTA = "en-venta";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

export async function saveEnVentaCategoryContentAction(formData: FormData) {
  await assertAdmin();

  const { payload: existing } = await getSiteSectionPayload(SECTION);
  const root = (existing ?? {}) as unknown as ClasificadosCategoryContentRootPayload & Record<string, unknown>;
  const prev = parseEnVentaPatch(extractCategoryPatch(root, EN_VENTA));
  const merged = buildEnVentaCategoryPatchFromForm(prev, formData);

  const categories = {
    ...(typeof root.categories === "object" && root.categories && !Array.isArray(root.categories)
      ? (root.categories as Record<string, unknown>)
      : {}),
  };
  categories[EN_VENTA] = merged as unknown as Record<string, unknown>;

  const nextPayload = { ...root, categories };

  const { error } = await upsertSiteSectionPayload(SECTION, nextPayload as Record<string, unknown>);
  if (error) throw new Error(error);

  auditAdminWrite("site_section_saved", "site_section", SECTION, { category: EN_VENTA });
  revalidatePath("/clasificados/en-venta");
  revalidatePath("/clasificados/publicar/en-venta");
  revalidatePath("/admin/workspace/clasificados");
  revalidatePath("/admin/workspace/clasificados/category/en-venta");
  redirect("/admin/workspace/clasificados/category/en-venta?saved=1");
}
