import { getPublicLeadErrorMessage, type LeadFormLang } from "@/app/lib/leonix/leadConfirmationCopy";

export type ContactFormLang = LeadFormLang;

export type ContactSubmitResult =
  | { ok: true; saved: boolean; emailSent: boolean; warning?: string }
  | { ok: false; message: string };

export async function submitContactForm(
  body: Record<string, unknown>,
  lang: ContactFormLang
): Promise<ContactSubmitResult> {
  try {
    const res = await fetch("/api/leads", {
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

    return { ok: false, message: getPublicLeadErrorMessage(lang) };
  } catch {
    return { ok: false, message: getPublicLeadErrorMessage(lang) };
  }
}
