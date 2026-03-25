"use client";

type Props = {
  initials: string;
  name: string;
  subline: string;
  sellerKindLabel: string;
  viewProfileLabel: string;
  /** Buyer-facing Pro signal on published-style card (preview Pro plan). */
  showProBadge?: boolean;
};

export function EnVentaPreviewSellerCard({
  initials,
  name,
  subline,
  sellerKindLabel,
  viewProfileLabel,
  showProBadge = false,
}: Props) {
  return (
    <aside className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.14),inset_0_1px_0_rgba(255,255,255,0.85)]">
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] text-[13px] font-bold text-[#1E1810] shadow-[0_4px_14px_-4px_rgba(201,164,74,0.55)] ring-2 ring-white/90"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-bold tracking-tight text-[#1E1810]">{name}</p>
            {showProBadge ? (
              <span className="shrink-0 rounded-full border border-[#C9B46A]/45 bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5C4E2E]">
                Pro
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs font-medium text-[#5C5346]/90">{subline}</p>
          {sellerKindLabel ? (
            <span className="mt-2 inline-flex rounded-full border border-[#C9B46A]/35 bg-[#FBF7EF] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#5C4E2E]">
              {sellerKindLabel}
            </span>
          ) : null}
        </div>
      </div>
      <div
        className="mt-4 w-full rounded-2xl border border-[#C9B46A]/45 bg-white/70 px-4 py-2.5 text-center text-sm font-semibold text-[#6B5B2E]/70"
        role="presentation"
      >
        {viewProfileLabel}
      </div>
    </aside>
  );
}
