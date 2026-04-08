"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

const OPS = new Set(["live", "staged", "coming_soon", "hidden"]);
const VIS = new Set(["public", "hidden"]);

export async function saveSiteCategoryConfigRowAction(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect("/admin/categories?cat_error=1");

  const operational_status = str(formData, "operational_status");
  const visibility = str(formData, "visibility");
  const sort_order = Number(str(formData, "sort_order") || "0") || 0;
  const highlight = formData.get("highlight") === "on" || formData.get("highlight") === "true";
  const notes = str(formData, "notes") || null;

  if (!OPS.has(operational_status) || !VIS.has(visibility)) {
    redirect("/admin/categories?cat_error=1");
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase.from("site_category_config").upsert(
    {
      slug,
      operational_status,
      visibility,
      sort_order,
      highlight,
      notes,
      updated_at: now,
    },
    { onConflict: "slug" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  redirect("/admin/categories?cat_saved=1");
}
