"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";

const MONTHS = new Set([
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
]);

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

export async function upsertMagazineIssueAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  const year = str(formData, "year");
  const monthSlug = str(formData, "month_slug").toLowerCase();
  const titleEs = str(formData, "title_es");
  const titleEn = str(formData, "title_en");
  const status = str(formData, "status") as "draft" | "published" | "archived";
  const coverUrl = str(formData, "cover_url") || null;
  const pdfUrl = str(formData, "pdf_url") || null;
  const flipbookUrl = str(formData, "flipbook_url") || null;
  const publishedAt = str(formData, "published_at") || null;
  const displayOrder = Number(str(formData, "display_order") || "0") || 0;
  const internalNotes = str(formData, "internal_notes") || null;

  if (!year || !monthSlug || !MONTHS.has(monthSlug)) {
    redirect("/admin/workspace/revista?issue_error=1");
  }
  if (!titleEs && !titleEn) {
    redirect("/admin/workspace/revista?issue_error=1");
  }
  if (!["draft", "published", "archived"].includes(status)) {
    redirect("/admin/workspace/revista?issue_error=1");
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const pubAt = publishedAt || (status === "published" ? now : null);

  const base = {
    year,
    month_slug: monthSlug,
    title_es: titleEs,
    title_en: titleEn,
    status,
    cover_url: coverUrl,
    pdf_url: pdfUrl,
    flipbook_url: flipbookUrl,
    published_at: pubAt,
    display_order: displayOrder,
    internal_notes: internalNotes,
    updated_at: now,
  };

  if (id) {
    const extra = status === "archived" ? { is_featured: false } : {};
    const { error } = await supabase
      .from("magazine_issues")
      .update({ ...base, ...extra })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("magazine_issues").upsert(
      {
        ...base,
        is_featured: false,
        created_at: now,
      },
      { onConflict: "year,month_slug" }
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/magazine");
  revalidatePath("/");
  redirect("/admin/workspace/revista?issue_saved=1");
}

export async function setMagazineCurrentIssueAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) redirect("/admin/workspace/revista?issue_error=1");
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data: row, error: gErr } = await supabase.from("magazine_issues").select("id,status").eq("id", id).maybeSingle();
  if (gErr || !row || row.status !== "published") {
    redirect("/admin/workspace/revista?issue_error=1");
  }

  const { data: prevFeatured } = await supabase
    .from("magazine_issues")
    .select("id")
    .eq("is_featured", true)
    .eq("status", "published")
    .neq("id", id);

  for (const p of prevFeatured ?? []) {
    const pid = (p as { id?: string }).id;
    if (!pid) continue;
    const { error: archErr } = await supabase
      .from("magazine_issues")
      .update({ status: "archived", is_featured: false, updated_at: now })
      .eq("id", pid);
    if (archErr) throw new Error(archErr.message);
  }

  await supabase.from("magazine_issues").update({ is_featured: false, updated_at: now }).eq("is_featured", true);

  const { error } = await supabase
    .from("magazine_issues")
    .update({ is_featured: true, updated_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/magazine");
  revalidatePath("/");
  redirect("/admin/workspace/revista?issue_saved=1");
}

export async function archiveMagazineIssueAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) redirect("/admin/workspace/revista?issue_error=1");
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("magazine_issues")
    .update({ status: "archived", is_featured: false, updated_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/magazine");
  revalidatePath("/");
  redirect("/admin/workspace/revista?issue_saved=1");
}

export async function publishMagazineIssueAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) redirect("/admin/workspace/revista?issue_error=1");
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data: cur, error: gErr } = await supabase.from("magazine_issues").select("published_at").eq("id", id).maybeSingle();
  if (gErr || !cur) redirect("/admin/workspace/revista?issue_error=1");

  const pubAt = cur.published_at || now;
  const { error } = await supabase
    .from("magazine_issues")
    .update({ status: "published", published_at: pubAt, updated_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/magazine");
  revalidatePath("/");
  redirect("/admin/workspace/revista?issue_saved=1");
}

export async function deleteMagazineDraftAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) redirect("/admin/workspace/revista?issue_error=1");
  const supabase = getAdminSupabase();
  const { data: cur, error: gErr } = await supabase.from("magazine_issues").select("status").eq("id", id).maybeSingle();
  if (gErr || !cur || cur.status !== "draft") {
    redirect("/admin/workspace/revista?issue_error=1");
  }
  const { error } = await supabase.from("magazine_issues").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/magazine");
  revalidatePath("/");
  redirect("/admin/workspace/revista?issue_saved=1");
}
