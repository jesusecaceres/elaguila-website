import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";

export type LaunchFormLang = "es" | "en";

const ERROR_MSG: Record<LaunchFormLang, string> = {
  es: `No pudimos guardar tu registro. Intenta de nuevo o escríbenos a ${LEONIX_GLOBAL_EMAIL}.`,
  en: `We could not save your signup. Please try again or email ${LEONIX_GLOBAL_EMAIL}.`,
};

export type LaunchSubmitResult =
  | { ok: true; saved: boolean; emailSent: boolean; warning?: string }
  | { ok: false; message: string };

export async function submitLaunchSignupForm(
  body: Record<string, unknown>,
  lang: LaunchFormLang
): Promise<LaunchSubmitResult> {
  try {
    const res = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, lang, wantsLaunchUpdates: true }),
    });

    let data: {
      ok?: boolean;
      saved?: boolean;
      emailSent?: boolean;
      warning?: string;
      error?: string;
    } = {};

    try {
      data = (await res.json()) as typeof data;
    } catch {
      /* non-JSON */
    }

    if (res.ok && data.ok) {
      return {
        ok: true,
        saved: Boolean(data.saved),
        emailSent: Boolean(data.emailSent),
        warning: data.warning,
      };
    }

    return { ok: false, message: ERROR_MSG[lang] };
  } catch {
    return { ok: false, message: ERROR_MSG[lang] };
  }
}
