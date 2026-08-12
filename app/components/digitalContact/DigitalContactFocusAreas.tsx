import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";

type Props = {
  profile: DigitalContactProfile;
  copy: DigitalContactCopy;
};

/** Gate 5 — premium Professional Focus cards, replacing the old cramped hero chip row. Reads the same real `trustChips` data, just given room to breathe. */
export function DigitalContactFocusAreas({ profile, copy }: Props) {
  if (profile.trustChips.length === 0) return null;

  return (
    <section aria-labelledby="dc-focus-title" className="mx-auto w-full max-w-2xl px-5 pt-12 sm:px-6 sm:pt-14">
      <h2 id="dc-focus-title" className="text-center font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
        {copy.focusTitle}
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {profile.trustChips.map((chip) => (
          <div
            key={chip}
            className="group flex flex-col items-center gap-2.5 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--dc-accent)] hover:shadow-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--dc-accent-soft)] text-[var(--dc-primary)] transition group-hover:bg-[var(--dc-button-primary)] group-hover:text-[#FFFCF7]">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
                <path d="M12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5Z" />
              </svg>
            </span>
            <span className="text-xs font-bold leading-snug text-[#1F241C] sm:text-sm">{chip}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
