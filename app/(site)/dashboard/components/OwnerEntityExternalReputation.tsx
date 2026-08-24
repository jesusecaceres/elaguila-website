"use client";

/**
 * Owner Command Center — Package 3, Gate 3A. External reputation (Google/Yelp) presentation.
 *
 * Real provider links only. Never renders an owner-entered score or a manufactured rating —
 * this is deliberately separate from Leonix Community Trust (see OwnerEntityCommunityTrust)
 * and must never be merged with it. If no real external link exists, render nothing.
 */
export type OwnerExternalReviewLink = { provider: "google" | "yelp" | "other"; label: string; href: string };

export function OwnerEntityExternalReputation({ title, links }: { title: string; links: OwnerExternalReviewLink[] }) {
  if (links.length === 0) return null;
  return (
    <section aria-label={title}>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] px-4 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
          >
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}
