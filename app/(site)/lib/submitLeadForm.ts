export type LeadFormLang = "es" | "en";

const GENERIC_ERROR: Record<LeadFormLang, string> = {
  es: "No pudimos guardar tu información. Inténtalo de nuevo.",
  en: "We couldn't save your information. Please try again.",
};

export async function submitLeadForm(
  url: string,
  body: Record<string, unknown>,
  lang: LeadFormLang
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data: { ok?: boolean } = {};
    try {
      data = (await res.json()) as { ok?: boolean };
    } catch {
      /* non-JSON */
    }
    if (res.ok && data.ok) {
      return { ok: true };
    }
    return { ok: false, message: GENERIC_ERROR[lang] };
  } catch {
    return { ok: false, message: GENERIC_ERROR[lang] };
  }
}
