import type { SupportedLang } from "@/app/lib/language";

export type PublicContactHrefOpts = {
  lang: SupportedLang;
  sourcePage: string;
  sourceCta: string;
  inquiryType?: string;
};

/** Language-aware public contact form entry with source tracking. */
export function publicContactHref(opts: PublicContactHrefOpts): string {
  const params = new URLSearchParams({
    lang: opts.lang,
    sourcePage: opts.sourcePage,
    sourceCta: opts.sourceCta,
    inquiryType: opts.inquiryType ?? "general",
  });
  return `/contacto?${params.toString()}`;
}
