"use client";

/**
 * Owner Command Center — Package 3, Gate 3A. Owner-facing Leonix Community Trust summary.
 *
 * READ ONLY. This component never writes a vote, never toggles anything, and never imports
 * the vote-write path (`toggleLeonixEndorsementVote`/`POST /api/leonix-endorsements`) — an
 * owner cannot vote on their own listing here, matching the self-vote doctrine already
 * enforced server-side for the public voting surface. `entries` must be fetched by the page
 * adapter using the existing, unmodified `GET /api/leonix-endorsements` read endpoint (the
 * same one the public `LeonixCommunityTrust.tsx` component calls) — this component performs
 * no fetch of its own so a workspace listing many rows never turns into one network request
 * per mounted card; the adapter fetches all rows' summaries once, concurrently, during its
 * existing load pass.
 *
 * Community Trust is not analytics, not external reviews, and not a star rating — never
 * render a numeric average here. Zero-vote keys still render (matches the public component's
 * "be among the first to endorse" doctrine) rather than hiding a category with no votes yet.
 */
export type OwnerCommunityTrustEntry = { key: string; label: string; count: number };

export function OwnerEntityCommunityTrust({
  title,
  helperText,
  entries,
}: {
  title: string;
  helperText: string;
  entries: OwnerCommunityTrustEntry[] | null;
}) {
  if (!entries || entries.length === 0) return null;
  return (
    <section aria-label={title}>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]">{title}</h3>
      <p className="mt-1 text-xs text-[#7A7164]">{helperText}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {entries.map((e) => (
          <li
            key={e.key}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D6C7AD]/70 bg-[#FBF7EF] px-2.5 py-1 text-[11px] font-semibold text-[#5C5346]"
          >
            <span aria-hidden="true">🦁</span>
            <span>{e.label}</span>
            <span className="tabular-nums text-[#1E1810]">{e.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
