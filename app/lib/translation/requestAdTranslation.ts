import type { TranslateAdProviderFn } from "@/app/lib/translation/provider";
import type { AdTranslationResult } from "@/app/lib/translation/types";

/** Client-only: POST masked fields to `/api/translate-ad` (no API keys in browser). */
export const requestAdTranslation: TranslateAdProviderFn = async (req) => {
  const res = await fetch("/api/translate-ad", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : "Translation request failed";
    throw new Error(message);
  }

  return body as AdTranslationResult;
};
