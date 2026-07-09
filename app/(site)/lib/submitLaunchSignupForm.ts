import { getPublicLeadErrorMessage, type LeadFormLang } from "@/app/lib/leonix/leadConfirmationCopy";

export type LaunchFormLang = LeadFormLang;

export type LaunchSubmitResult =
  | {
      ok: true;
      saved: boolean;
      emailSent: boolean;
      promoCodeEmailSent?: boolean;
      promoCodeEmailStatus?: string;
      warning?: string;
    }
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
      promoCodeEmailSent?: boolean;
      promoCodeEmailStatus?: string;
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
        promoCodeEmailSent: Boolean(data.promoCodeEmailSent),
        promoCodeEmailStatus: data.promoCodeEmailStatus,
        warning: data.warning,
      };
    }

    return { ok: false, message: getPublicLeadErrorMessage(lang) };
  } catch {
    return { ok: false, message: getPublicLeadErrorMessage(lang) };
  }
}
