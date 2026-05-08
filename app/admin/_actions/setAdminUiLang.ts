"use server";

import { cookies } from "next/headers";
import { ADMIN_UI_LANG_COOKIE, type AdminLang } from "@/app/admin/_lib/adminI18nCookie";

export async function setAdminUiLang(lang: AdminLang) {
  const jar = await cookies();
  jar.set(ADMIN_UI_LANG_COOKIE, lang, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}
