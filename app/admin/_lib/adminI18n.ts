import { cookies } from "next/headers";
import { resolveAdminLangFromCookieJar, type AdminLang } from "@/app/admin/_lib/adminI18nCookie";

/** Server-side: read persisted admin UI language (middleware syncs `?lang=` into the cookie). */
export async function getAdminLang(): Promise<AdminLang> {
  const jar = await cookies();
  return resolveAdminLangFromCookieJar(jar);
}

export type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
export { adminTr, adminMessages } from "@/app/admin/_lib/adminStrings";
