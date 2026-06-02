import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";

/** Server-side admin UI language — English-only (Phase 13B). */
export async function getAdminLang(): Promise<AdminLang> {
  return "en";
}

export type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
export { adminTr, adminMessages } from "@/app/admin/_lib/adminStrings";
