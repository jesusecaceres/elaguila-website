"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { getSiteSectionPayload, upsertSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { RevistaIssueRegistryPayload, RevistaPlannedIssue } from "@/app/lib/siteSectionContent/payloadTypes";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function statusFromForm(s: string): RevistaPlannedIssue["status"] {
  if (s === "scheduled" || s === "live" || s === "archived") return s;
  return "draft";
}

export async function appendRevistaIssueDraftAction(formData: FormData) {
  await assertAdmin();
  const { payload: prev } = await getSiteSectionPayload("revista_issue_registry");
  const reg = prev as unknown as RevistaIssueRegistryPayload;
  const list = [...(reg.plannedIssues ?? [])];
  const draft: RevistaPlannedIssue = {
    id: randomUUID(),
    titleEs: str(formData, "title_es"),
    titleEn: str(formData, "title_en"),
    year: str(formData, "year"),
    monthSlug: str(formData, "month_slug"),
    lang: str(formData, "lang") === "en" ? "en" : "es",
    coverUrl: str(formData, "cover_url"),
    fileUrl: str(formData, "file_url"),
    publishedAtIso: str(formData, "published_at_iso"),
    status: statusFromForm(str(formData, "status")),
    internalNotes: str(formData, "internal_notes") || undefined,
  };
  if (!draft.titleEs && !draft.titleEn) {
    redirect("/admin/workspace/revista?registry_error=1");
  }
  list.unshift(draft);
  const next: RevistaIssueRegistryPayload = { plannedIssues: list };
  const { error } = await upsertSiteSectionPayload("revista_issue_registry", next as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  auditAdminWrite("revista_issue_registry_appended", "revista_planned_issue", draft.id, {});
  revalidatePath("/admin/workspace/revista");
  redirect("/admin/workspace/revista?registry_saved=1");
}

export async function removeRevistaIssueDraftAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) redirect("/admin/workspace/revista?registry_error=1");
  const { payload: prev } = await getSiteSectionPayload("revista_issue_registry");
  const reg = prev as unknown as RevistaIssueRegistryPayload;
  const list = (reg.plannedIssues ?? []).filter((x) => x.id !== id);
  const next: RevistaIssueRegistryPayload = { plannedIssues: list };
  const { error } = await upsertSiteSectionPayload("revista_issue_registry", next as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  auditAdminWrite("revista_issue_registry_removed", "revista_planned_issue", id, {});
  revalidatePath("/admin/workspace/revista");
  redirect("/admin/workspace/revista?registry_saved=1");
}
