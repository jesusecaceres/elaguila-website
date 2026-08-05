"use client";

import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";

type Props = {
  profileSlug: string;
  copy: DigitalContactCopy;
};

/** Closing CTA — funnels to the Lead Exchange form (kept as one CRM-ready intake, not a second form). */
export function DigitalContactClosingCta({ profileSlug, copy }: Props) {
  return (
    <section className="mx-auto w-full max-w-2xl px-5 pt-12 sm:px-6 sm:pt-14">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--dc-primary)] to-[var(--dc-secondary)] p-8 text-center shadow-lg sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,var(--dc-accent-soft),transparent_60%)]"
        />
        <h2 className="relative font-serif text-2xl font-bold text-[#FFFDF7] sm:text-3xl">{copy.closingTitle}</h2>
        <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#F8F4EA]/90">{copy.closingBody}</p>
        <a
          href="#lead-exchange"
          onClick={() => trackDigitalContactEvent(profileSlug, "closing_cta_click")}
          className="relative mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--dc-badge)] px-8 py-3 text-sm font-bold text-[var(--dc-badge-text)] shadow-md transition hover:bg-[var(--dc-badge-hover)] active:scale-[0.99]"
        >
          {copy.closingCta}
        </a>
      </div>
    </section>
  );
}
