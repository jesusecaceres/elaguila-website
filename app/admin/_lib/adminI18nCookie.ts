/** Persisted UI language for /admin (non-httpOnly so middleware + Server Actions can align). */
export const ADMIN_UI_LANG_COOKIE = "leonix_admin_ui_lang";

export type AdminLang = "en" | "es";

export function parseAdminLang(v: string | undefined | null): AdminLang {
  return v === "es" ? "es" : "en";
}

type CookieGet = { get(name: string): { value: string } | undefined };

/** Read language from cookie jar (middleware syncs `?lang=` into this cookie on /admin requests). */
export function resolveAdminLangFromCookieJar(cookieStore: CookieGet): AdminLang {
  return parseAdminLang(cookieStore.get(ADMIN_UI_LANG_COOKIE)?.value);
}
