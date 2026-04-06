"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { upsertSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { isSiteSectionKey, type SiteSectionKey } from "@/app/lib/siteSectionContent/sectionKeys";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const t = raw.trim();
  if (!t) return {};
  const v = JSON.parse(t) as unknown;
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Payload must be a JSON object");
  return v as Record<string, unknown>;
}

/** Generic save for advanced / bulk JSON editing (admin-only). */
export async function upsertSiteSectionJsonAction(sectionKey: string, payloadJson: string): Promise<void> {
  await assertAdmin();
  if (!isSiteSectionKey(sectionKey)) throw new Error("Invalid section key");
  let payload: Record<string, unknown>;
  try {
    payload = parseJsonObject(payloadJson);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Invalid JSON");
  }
  const { error } = await upsertSiteSectionPayload(sectionKey as SiteSectionKey, payload);
  if (error) throw new Error(error);

  if (sectionKey === "tienda_storefront") {
    revalidatePath("/tienda");
  }
  if (sectionKey === "home_marketing") {
    revalidatePath("/home");
  }
  if (sectionKey === "contacto") {
    revalidatePath("/contacto");
  }
}
