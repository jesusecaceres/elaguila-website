"use client";

type Lang = "es" | "en";

/** Decorative phone frame suggesting mobile listing management — metrics are illustrative or from first listing. */
export function DashboardMobilePreview({
  lang,
  title,
  priceLine,
  city,
  views,
  saves,
  messages,
}: {
  lang: Lang;
  title: string;
  priceLine: string;
  city: string;
  views: number;
  saves: number;
  messages: number;
}) {
  const L =
    lang === "es"
      ? {
          preview: "Vista móvil",
          views: "Visualizaciones",
          saves: "Favoritos",
          msgs: "Mensajes",
          hint: "Así ven tus compradores el anuncio en el teléfono.",
        }
      : {
          preview: "Mobile view",
          views: "Views",
          saves: "Favorites",
          msgs: "Messages",
          hint: "How buyers see your listing on mobile.",
        };

  return (
    <aside className="sticky top-24 rounded-[2rem] border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-4 shadow-[0_16px_48px_-18px_rgba(42,36,22,0.18)]">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A7164]">{L.preview}</p>
      <div
        className="relative mx-auto mt-3 w-full max-w-[260px] overflow-hidden rounded-[2rem] border-[10px] border-[#2A2620] bg-[#2A2620] shadow-xl"
        style={{ aspectRatio: "9/18" }}
      >
        <div className="absolute inset-0 flex flex-col bg-[#F3EBDD]">
          <div className="h-[42%] bg-gradient-to-br from-[#FAF4EA] to-[#EDE4D4]" />
          <div className="flex flex-1 flex-col gap-2 p-3">
            <p className="line-clamp-2 text-[13px] font-bold leading-tight text-[#1E1810]">{title}</p>
            <p className="text-[15px] font-bold text-[#1E1810]">{priceLine}</p>
            <p className="text-[11px] text-[#5C5346]">{city}</p>
            <div className="mt-auto grid grid-cols-3 gap-1 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-2 text-center">
              <div>
                <p className="text-[9px] font-semibold uppercase text-[#7A7164]">{L.views}</p>
                <p className="text-sm font-bold text-[#1E1810]">{views}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase text-[#7A7164]">{L.saves}</p>
                <p className="text-sm font-bold text-[#1E1810]">{saves}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase text-[#7A7164]">{L.msgs}</p>
                <p className="text-sm font-bold text-[#1E1810]">{messages}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] leading-snug text-[#7A7164]/95">{L.hint}</p>
    </aside>
  );
}
