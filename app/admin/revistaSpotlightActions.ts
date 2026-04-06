"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { upsertSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { RevistaSpotlightPayload } from "@/app/lib/siteSectionContent/payloadTypes";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

export async function saveRevistaSpotlightAction(formData: FormData) {
  await assertAdmin();
  const payload: RevistaSpotlightPayload = {
    workspaceNoteEs: str(formData, "note_es") || undefined,
    workspaceNoteEn: str(formData, "note_en") || undefined,
    archiveBlurbEs: str(formData, "archive_es") || undefined,
    archiveBlurbEn: str(formData, "archive_en") || undefined,
  };
  const { error } = await upsertSiteSectionPayload("revista_spotlight", payload as unknown as Record<string, unknown>);
  if (error) throw new Error(error);
  revalidatePath("/admin/workspace/revista");
  redirect("/admin/workspace/revista?saved=1");
}
