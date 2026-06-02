/** Persisted UI language for /admin — English-only chrome (Phase 13B). */
export const ADMIN_UI_LANG_COOKIE = "leonix_admin_ui_lang";

export type AdminLang = "en" | "es";

/** Admin UI is English-only; legacy cookie values are ignored. */
export function parseAdminLang(_v: string | undefined | null): AdminLang {
  return "en";
}

type CookieGet = { get(name: string): { value: string } | undefined };

/** Admin chrome always resolves to English. */
export function resolveAdminLangFromCookieJar(_cookieStore: CookieGet): AdminLang {
  return "en";
}
