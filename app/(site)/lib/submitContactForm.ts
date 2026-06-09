import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";

export type ContactFormLang = "es" | "en";

const ERROR_MSG: Record<ContactFormLang, string> = {
  es: `No pudimos enviar tu información. Intenta de nuevo o escríbenos a ${LEONIX_GLOBAL_EMAIL}.`,
  en: `We could not submit your information. Please try again or email ${LEONIX_GLOBAL_EMAIL}.`,
};

export type ContactSubmitResult =
  | { ok: true; saved: boolean; emailSent: boolean; warning?: string }
  | { ok: false; message: string };

export async function submitContactForm(
  body: Record<string, unknown>,
  lang: ContactFormLang
): Promise<ContactSubmitResult> {
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, lang }),
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

    const detail = typeof data.error === "string" ? data.error : ERROR_MSG[lang];
    return { ok: false, message: detail };
  } catch {
    return { ok: false, message: ERROR_MSG[lang] };
  }
}
