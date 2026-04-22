"use client";

import Link from "next/link";

type Lang = "es" | "en";

export type AutosClassifiedManageAnalytics = {
  views: number;
  uniqueViews: number;
  messages: number;
  saves: number;
  shares: number;
  profileClicks: number;
  /** Future `listing_analytics` event types — scaffolded at 0 until DB + instrumentation. */
  whatsappClicks?: number;
  websiteClicks?: number;
  appointmentClicks?: number;
};

function MiniBars({ value, max }: { value: number; max: number }) {
  const m = Math.max(1, max);
  const seq = [0.35, 0.55, 0.45, 0.72, 0.5];
  return (
    <div className="flex h-10 items-end gap-0.5" aria-hidden>
      {seq.map((k, i) => {
        const h = Math.min(40, 8 + (value / m) * k * 36 + (i % 2) * 2);
        return <div key={i} className="w-1.5 rounded-sm bg-[#C9B46A]/85" style={{ height: `${h}px` }} />;
      })}
    </div>
  );
}

/**
 * Dashboard row for `listings.category === "autos"` — same analytics vocabulary as En Venta (`listing_analytics` rollup).
 * Contacts map to `message_sent` events; scaffold fields reserved for future WhatsApp / web / appointment clicks.
 */
export function AutosClassifiedListingManageCard({
  row,
  lang,
  priceText,
  dateText,
  busy,
  onDelete,
  analytics,
  maxViews,
  thumbUrl,
}: {
  row: {
    id: string;
    title?: string | null;
    price?: number | string | null;
    city?: string | null;
    status?: string | null;
    created_at?: string | null;
  };
  lang: Lang;
  priceText: string;
  dateText: string;
  busy: boolean;
  onDelete: () => void;
  analytics: AutosClassifiedManageAnalytics;
  maxViews: number;
  thumbUrl: string | null;
}) {
  const L =
    lang === "es"
      ? {
          autos: "Autos",
          active: "Activo",
          sold: "Vendido",
          view: "Ver anuncio",
          delete: "Eliminar",
          views: "Vistas",
          uniq: "Únicas",
          msg: "Contactos",
          saves: "Guardados",
          shares: "Compartidos",
          prof: "Perfil",
          perf: "Rendimiento",
          insights: "Misma métrica que en En Venta: vistas, guardados, compartidos y mensajes.",
          ctaFuture: "CTA (próx.)",
          wa: "WA",
          web: "Web",
          cita: "Cita",
        }
      : {
          autos: "Autos",
          active: "Active",
          sold: "Sold",
          view: "View listing",
          delete: "Delete",
          views: "Views",
          uniq: "Unique",
          msg: "Contacts",
          saves: "Saves",
          shares: "Shares",
          prof: "Profile",
          perf: "Performance",
          insights: "Same metrics as En Venta: views, saves, shares, and messages.",
          ctaFuture: "CTAs (soon)",
          wa: "WA",
          web: "Web",
          cita: "Appt",
        };

  const isSold = (row.status || "active").toLowerCase() === "sold";
  const v = analytics.views;

  return (
    <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-4 shadow-[0_10px_36px_-14px_rgba(42,36,22,0.12)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#E8DFD0] bg-[#EDE6DC] sm:h-28 sm:w-28">
            {thumbUrl ? (
               
              <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl text-[#2C2416]/25">🚗</div>
            )}
            <span className="absolute left-1 top-1 rounded-full bg-[#FBF7EF] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#5C4E2E] ring-1 ring-[#C9B46A]/40">
              {L.autos}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2">
              <h3 className="line-clamp-2 text-base font-bold text-[#1E1810] sm:text-lg">{row.title || "—"}</h3>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isSold ? "bg-[#E8DFD0] text-[#5C5346]" : "bg-emerald-100 text-emerald-900"
                }`}
              >
                {isSold ? L.sold : L.active}
              </span>
            </div>
            <p className="mt-1 text-lg font-bold text-[#1E1810]">{priceText}</p>
            <p className="mt-1 text-sm text-[#5C5346]/90">
              {(row.city || "").trim()}
              {dateText ? ` · ${dateText}` : ""}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[#5C5346]/90">
              <span className="font-bold text-[#3D3428]">{L.perf}:</span> {L.insights}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 border-t border-[#E8DFD0]/70 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <MiniBars value={v} max={maxViews} />
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#3D3428]">
              <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[#1E1810]">
                {L.views}: {v}
              </span>
              <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5">
                {L.msg}: {analytics.messages}
              </span>
              <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5">
                {L.saves}: {analytics.saves}
              </span>
              <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5">
                {L.shares}: {analytics.shares}
              </span>
              <span className="rounded-full border border-[#C9B46A]/35 bg-[#FFFCF7] px-2 py-0.5">
                {L.uniq}: {analytics.uniqueViews}
              </span>
              <span className="rounded-full border border-[#C9B46A]/35 bg-[#FFFCF7] px-2 py-0.5">
                {L.prof}: {analytics.profileClicks}
              </span>
            </div>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]/85">{L.ctaFuture}</p>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-[#5C5346]/95">
            <span className="rounded-md border border-[#E8DFD0]/80 bg-white/80 px-2 py-0.5">
              {L.wa}: {analytics.whatsappClicks ?? 0}
            </span>
            <span className="rounded-md border border-[#E8DFD0]/80 bg-white/80 px-2 py-0.5">
              {L.web}: {analytics.websiteClicks ?? 0}
            </span>
            <span className="rounded-md border border-[#E8DFD0]/80 bg-white/80 px-2 py-0.5">
              {L.cita}: {analytics.appointmentClicks ?? 0}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/clasificados/anuncio/${row.id}?lang=${lang}`}
              className="inline-flex rounded-xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E] shadow-sm hover:bg-[#F3EBDD]"
            >
              {L.view} →
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={onDelete}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 disabled:opacity-50"
            >
              {L.delete}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
