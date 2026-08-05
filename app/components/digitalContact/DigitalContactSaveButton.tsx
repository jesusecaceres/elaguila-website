"use client";

import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";

type Props = {
  profile: DigitalContactProfile;
  copy: DigitalContactCopy;
};

/** Save Contact — standards-compliant vCard download; identical link works on iPhone, Android, and desktop. */
export function DigitalContactSaveButton({ profile, copy }: Props) {
  return (
    <section aria-labelledby="dc-save-title" className="mx-auto w-full max-w-2xl px-5 pt-10 sm:px-6 sm:pt-12">
      <div className="rounded-3xl border border-[#C9A84A]/60 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-6 text-center shadow-sm sm:p-8">
        <h2 id="dc-save-title" className="font-serif text-xl font-bold text-[#1F241C] sm:text-2xl">
          {copy.saveTitle}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#3D3428]">{copy.saveBody}</p>
        <a
          href={`/api/digital-contact/vcf/${encodeURIComponent(profile.slug)}`}
          onClick={() => trackDigitalContactEvent(profile.slug, "vcf_download")}
          className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#7A1E2C] px-7 py-3 text-sm font-bold text-[#FFFDF7] shadow-md transition hover:bg-[#6B1A26] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF7]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
          </svg>
          {copy.saveButton}
        </a>
        <p className="mt-3 text-xs font-medium text-[#5F6258]">{copy.saveCompat}</p>
      </div>
    </section>
  );
}
