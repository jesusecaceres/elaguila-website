import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";

type Props = {
  copy: DigitalContactCopy;
};

/**
 * "Lo que viene" teaser — Business Concierge. Explicitly NOT the Business Hub (Business
 * Hub/Business Profile is part of the broader Leonix direction and is not presented as
 * Chuy's coming-soon item). No buttons, no navigation, no links to non-existent pages — a
 * single truthful "coming soon" badge and a plain-language explanation of what Business
 * Concierge is being built to do. Nothing here is clickable or implies the tool is live.
 */
export function DigitalContactBusinessConciergeTeaser({ copy }: Props) {
  return (
    <section aria-labelledby="dc-business-concierge-title" className="mx-auto w-full max-w-2xl px-5 pt-12 sm:px-6 sm:pt-14">
      <div className="relative overflow-hidden rounded-3xl border border-dashed border-[var(--dc-accent-border)] bg-[#FBF7EF] p-6 text-center sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dc-accent-border)] bg-[#FFFDF7] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#9A7B28]">
          {copy.businessConciergeKicker}
        </span>
        <h2 id="dc-business-concierge-title" className="mt-3 font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
          {copy.businessConciergeTitle}
        </h2>
        <p className="mx-auto mt-2.5 max-w-md font-serif text-base font-bold leading-snug text-[var(--dc-primary)] sm:text-lg">
          {copy.businessConciergeLead}
        </p>
        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-[#3D3428]">{copy.businessConciergeBody}</p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--dc-accent-soft)] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--dc-primary)]">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 7v5l3 3" />
          </svg>
          {copy.businessConciergeBadge}
        </span>
      </div>
    </section>
  );
}
