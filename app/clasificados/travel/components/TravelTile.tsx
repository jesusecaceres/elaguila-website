type TravelTileProps = {
  title: string;
  desc: string;
  href: string;
  badge?: string;
  comingSoon?: boolean;
};

export function TravelTile({
  title,
  desc,
  href,
  badge,
  comingSoon,
}: TravelTileProps) {
  return (
    <a
      href={href}
      className={`group relative overflow-hidden rounded-2xl border border-yellow-500/35 bg-black/35 p-5 text-left shadow-lg transition hover:bg-black/45 ${
        comingSoon ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-extrabold text-yellow-200">{title}</div>
            {badge ? (
              <span className="inline-flex items-center rounded-full border border-yellow-400/25 bg-[#F2EFE8] px-2 py-0.5 text-[11px] font-semibold text-yellow-200">
                {badge}
              </span>
            ) : null}
            {comingSoon ? (
              <span className="inline-flex items-center rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] font-semibold text-[#111111]">
                Coming soon
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-sm text-[#111111]">{desc}</div>
        </div>
        <div className="mt-0.5 shrink-0 rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 text-xs font-semibold text-[#111111] group-hover:bg-white/10">
          Ver
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#F2EFE8] blur-3xl" />
      </div>
    </a>
  );
}
