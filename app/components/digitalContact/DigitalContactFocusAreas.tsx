"use client";

import { useId, useState } from "react";
import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";

type Props = {
  profile: DigitalContactProfile;
  copy: DigitalContactCopy;
};

/**
 * Owner-approved detail copy for Chuy's 8 Professional Focus chips. Keyed by the exact
 * chip label so unrecognized/future chips (other executives, new specialties) gracefully
 * fall back to a plain, non-interactive card instead of showing a broken or fabricated
 * detail. English-only for now — no owner-approved Spanish translation exists yet for
 * this detail copy (the chip labels themselves are already shown as-is regardless of the
 * page's language toggle, so this matches existing behavior rather than introducing a
 * new inconsistency).
 */
const FOCUS_AREA_DETAILS: Record<string, string> = {
  "Business Development":
    "We help local businesses identify practical ways to strengthen operations, visibility, customer experience, and long-term growth. As Business Concierge evolves, these insights can become part of a more personalized business plan built around your goals and current needs.",
  "Artificial Intelligence":
    "Leonix uses AI as a support tool to research, organize information, create useful business materials, and help surface opportunities for human review. Our goal is not to replace judgment — it is to help business owners make clearer, better-informed decisions.",
  Technology:
    "We help businesses make technology easier to understand and more useful — from digital presence and business tools to practical automation. Business Concierge is being built to bring these tools into one connected experience.",
  Marketing:
    "We help businesses communicate what makes them valuable through stronger messaging, promotions, local visibility, and creative materials. Leonix focuses on recommendations that fit the business rather than pushing marketing simply for the sake of selling more.",
  Automation:
    "We look for repetitive tasks that technology can simplify while keeping important decisions in human hands. The goal is to save time and reduce friction — not automate things that require trust, judgment, or personal service.",
  "Brand Strategy":
    "We help businesses clarify how they want to be known — their story, audience, message, visual direction, and customer experience. That understanding can also guide future Leonix creative and Business Concierge recommendations.",
  "Website Development":
    "We help businesses plan clear, useful websites built around real customer needs, strong calls to action, and accurate business information. Leonix can also help organize the strategy, structure, content, and creative direction before development begins.",
  "Business Consulting":
    "We help owners step back, understand what is happening in their business, identify priorities, and decide what deserves attention next. That human-centered approach is the foundation of the Leonix Business Concierge.",
};

/** Gate 5 — premium Professional Focus cards, replacing the old cramped hero chip row. Reads the same real `trustChips` data, just given room to breathe. */
export function DigitalContactFocusAreas({ profile, copy }: Props) {
  const [openChip, setOpenChip] = useState<string | null>(null);
  const idBase = useId();

  if (profile.trustChips.length === 0) return null;

  return (
    <section aria-labelledby="dc-focus-title" className="mx-auto w-full max-w-2xl px-5 pt-12 sm:px-6 sm:pt-14">
      <h2 id="dc-focus-title" className="text-center font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
        {copy.focusTitle}
      </h2>
      <div className="mt-6 grid grid-cols-2 items-start gap-3 sm:grid-cols-4">
        {profile.trustChips.map((chip) => {
          const detail = FOCUS_AREA_DETAILS[chip];
          const panelId = `${idBase}-${chip.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
          const isOpen = openChip === chip;

          if (!detail) {
            return (
              <div
                key={chip}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--dc-accent)] hover:shadow-md"
              >
                <FocusIcon />
                <span className="text-xs font-bold leading-snug text-[#1F241C] sm:text-sm">{chip}</span>
              </div>
            );
          }

          return (
            <div
              key={chip}
              className={`overflow-hidden rounded-2xl border bg-[#FFFDF7] text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                isOpen ? "border-[var(--dc-accent)]" : "border-[#D6C7AD] hover:border-[var(--dc-accent)]"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenChip(isOpen ? null : chip)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full flex-col items-center gap-2 px-3 py-5 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent)]"
              >
                <FocusIcon active={isOpen} />
                <span className="text-xs font-bold leading-snug text-[#1F241C] sm:text-sm">{chip}</span>
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold leading-none transition-transform duration-200 ${
                    isOpen
                      ? "rotate-45 border-[var(--dc-accent)] bg-[var(--dc-accent-soft)] text-[var(--dc-primary)]"
                      : "border-[#D6C7AD] text-[#9A8E75]"
                  }`}
                >
                  +
                </span>
                <span className="sr-only">{copy.focusTapHint}</span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-hidden={!isOpen}
                className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-[#E8DCC5] px-3.5 py-3.5 text-left text-[11px] leading-relaxed text-[#3D3428] sm:text-xs">
                    {detail}
                  </p>
                  <button
                    type="button"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={() => setOpenChip(null)}
                    className="mb-3 ml-3.5 text-[10px] font-bold uppercase tracking-wide text-[#9A7B28] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent)]"
                  >
                    {copy.focusCloseLabel}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FocusIcon({ active }: { active?: boolean }) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
        active
          ? "bg-[var(--dc-button-primary)] text-[#FFFCF7]"
          : "bg-[var(--dc-accent-soft)] text-[var(--dc-primary)] group-hover:bg-[var(--dc-button-primary)] group-hover:text-[#FFFCF7]"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
        <path d="M12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5Z" />
      </svg>
    </span>
  );
}
