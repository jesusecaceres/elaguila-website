"use client";

type Props = {
  initials: string;
  name: string;
  subline: string;
  viewProfileLabel: string;
};

export function EnVentaPreviewSellerCard({ initials, name, subline, viewProfileLabel }: Props) {
  return (
    <aside className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#111111]">{name}</p>
          <p className="mt-0.5 text-xs text-[#111111]/55">{subline}</p>
        </div>
      </div>
      <div
        className="mt-4 w-full rounded-xl border border-[#2563EB]/40 bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#2563EB]/50"
        role="presentation"
      >
        {viewProfileLabel}
      </div>
    </aside>
  );
}
