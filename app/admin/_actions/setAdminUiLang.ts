"use server";

import { cookies } from "next/headers";
import { ADMIN_UI_LANG_COOKIE } from "@/app/admin/_lib/adminI18nCookie";

/** No-op: admin UI is English-only; cookie is forced to `en` if set. */
export async function setAdminUiLang(_lang: "en" | "es") {
  const jar = await cookies();
  jar.set(ADMIN_UI_LANG_COOKIE, "en", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}
