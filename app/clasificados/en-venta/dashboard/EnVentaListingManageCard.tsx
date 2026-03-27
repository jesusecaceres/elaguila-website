"use client";

import Link from "next/link";

type Lang = "es" | "en";
type ListingPlan = "free" | "pro";

export type EnVentaManageRow = {
  id: string;
  title?: string | null;
  price?: number | string | null;
  city?: string | null;
  status?: string | null;
  created_at?: string | null;
  thumbUrl?: string | null;
  views?: number;
  messages?: number;
  saves?: number;
};

export type EnVentaManageAnalytics = {
  views: number;
  uniqueViews: number;
  messages: number;
  saves: number;
  shares: number;
  profileClicks: number;
  dbViews: number;
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

export function EnVentaListingManageCard({
  row,
  lang,
  priceText,
  dateText,
  busy,
  onMarkSold,
  onMarkActive,
  onDelete,
  canEdit,
  editHref,
  listingPlan,
  boosted,
  analytics,
  maxViews,
  priceDropLabel,
  showDraftBadge,
}: {
  row: EnVentaManageRow;
  lang: Lang;
  priceText: string;
  dateText: string;
  busy: boolean;
  onMarkSold: () => void;
  onMarkActive: () => void;
  onDelete: () => void;
  canEdit: boolean;
  editHref: string;
  listingPlan: ListingPlan;
  boosted: boolean;
  analytics: EnVentaManageAnalytics;
  maxViews: number;
  /** When original/current prices support a reduced-price signal. */
  priceDropLabel?: string | null;
  /** True when listing exists but is not published to browse yet. */
  showDraftBadge?: boolean;
}) {
  const isPro = listingPlan === "pro";
  const isSold = (row.status || "active").toLowerCase() === "sold";
  const L =
    lang === "es"
      ? {
          view: "Ver anuncio",
          edit: "Editar",
          editLocked: "Editar (ventana corta)",
          sold: "Finalizar / vendido",
          active: "Reactivar",
          delete: "Eliminar",
          upgradeTitle: "Mejorar este anuncio a Pro",
          upgradeBullets: ["Más fotos y video", "Mayor visibilidad", "Analíticas e insights"],
          pro: "PRO",
          feat: "DESTACADO",
          activeSt: "Activo",
          soldSt: "Vendido",
          draft: "Borrador",
          views: "Vistas",
          uniq: "Únicas",
          msg: "Mensajes",
          saves: "Guardados",
          shares: "Compartidos",
          prof: "Clics perfil",
          details: "Ver detalles",
          perf: "Rendimiento",
          insights: "Revisa vistas y mensajes para afinar precio o fotos.",
        }
      : {
          view: "View listing",
          edit: "Edit",
          editLocked: "Edit (short window)",
          sold: "Mark sold",
          active: "Reactivate",
          delete: "Delete",
          upgradeTitle: "Upgrade this listing to Pro",
          upgradeBullets: ["More photos & video", "More visibility", "Analytics & insights"],
          pro: "PRO",
          feat: "FEATURED",
          activeSt: "Active",
          soldSt: "Sold",
          draft: "Draft",
          views: "Views",
          uniq: "Unique",
          msg: "Messages",
          saves: "Saves",
          shares: "Shares",
          prof: "Profile clicks",
          details: "View details",
          perf: "Performance",
          insights: "Compare views and messages to tune price or photos.",
        };

  const frame = isPro
    ? "rounded-3xl border-2 border-[#D4BC6A]/75 bg-gradient-to-br from-[#FFFCF7] via-[#FFFCF7] to-[#FAF4EA] shadow-[0_14px_44px_-12px_rgba(201,164,74,0.28)]"
    : "rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 shadow-[0_10px_36px_-14px_rgba(42,36,22,0.12)]";

  const v = analytics.views;

  return (
    <div className={`${frame} p-4 sm:p-5`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 gap-4">
          <div
            className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border sm:h-28 sm:w-28 ${
              isPro ? "border-[#C9B46A]/50 bg-gradient-to-br from-[#FAF4EA] to-[#EDE4D4]" : "border-[#E8DFD0] bg-[#EDE6DC]"
            }`}
          >
            {row.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.thumbUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl text-[#2C2416]/25">📦</div>
            )}
            {isPro ? (
              <span className="absolute left-1 top-1 rounded-full bg-gradient-to-r from-[#FBF7EF] to-[#F3EBDD] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#5C4E2E] ring-1 ring-[#C9B46A]/40">
                {L.pro}
              </span>
            ) : null}
            {boosted ? (
              <span className="absolute bottom-1 right-1 rounded-full bg-gradient-to-r from-[#E8D48A] to-[#C9A84A] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#1E1810]">
                {L.feat}
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2">
              <h3 className="line-clamp-2 text-base font-bold text-[#1E1810] sm:text-lg">{row.title || "—"}</h3>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isSold ? "bg-[#E8DFD0] text-[#5C5346]" : "bg-emerald-100 text-emerald-900"
                }`}
              >
                {isSold ? L.soldSt : L.activeSt}
              </span>
              {showDraftBadge ? (
                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                  {L.draft}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-lg font-bold text-[#1E1810]">{priceText}</p>
            {priceDropLabel ? (
              <p className="mt-1 inline-flex rounded-full border border-[#C9B46A]/40 bg-[#FBF7EF] px-2 py-0.5 text-[11px] font-bold text-[#5C4E2E]">
                {priceDropLabel}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-[#5C5346]/90">
              {(row.city || "").trim()}
              {dateText ? ` · ${dateText}` : ""}
            </p>

            {!isPro ? (
              <div className="mt-3 rounded-2xl border border-[#C9B46A]/30 bg-[#FBF7EF]/80 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B5B2E]">{L.upgradeTitle}</p>
                <ul className="mt-2 grid gap-1 text-xs text-[#5C5346]/95">{L.upgradeBullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-[#C9A84A]" aria-hidden>
                      ✦
                    </span>
                    <span>{b}</span>
                  </li>
                ))}</ul>
                <Link
                  href={`/clasificados/publicar/en-venta/pro?lang=${lang}`}
                  className="mt-2 inline-flex rounded-xl bg-[#2A2620] px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                >
                  {lang === "es" ? "Mejorar a Pro →" : "Upgrade to Pro →"}
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-[#5C5346]/90">
                <span className="font-bold text-[#3D3428]">{L.perf}:</span> {L.insights}
              </p>
            )}
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
              {isPro ? (
                <>
                  <span className="rounded-full border border-[#C9B46A]/35 bg-[#FFFCF7] px-2 py-0.5">
                    {L.uniq}: {analytics.uniqueViews}
                  </span>
                  <span className="rounded-full border border-[#C9B46A]/35 bg-[#FFFCF7] px-2 py-0.5">
                    {L.prof}: {analytics.profileClicks}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/clasificados/anuncio/${row.id}?lang=${lang}`}
              className="inline-flex rounded-xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E] shadow-sm hover:bg-[#F3EBDD]"
            >
              {L.details} →
            </Link>
            {canEdit ? (
              <Link href={editHref} className="inline-flex rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]">
                {L.edit}
              </Link>
            ) : (
              <span className="inline-flex rounded-xl border border-[#E8DFD0]/80 bg-[#FAF7F2]/80 px-4 py-2 text-sm font-semibold text-[#7A7164]" title={L.editLocked}>
                {L.editLocked}
              </span>
            )}
            {isSold ? (
              <button
                type="button"
                disabled={busy}
                onClick={onMarkActive}
                className="rounded-xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E] disabled:opacity-50"
              >
                {L.active}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={onMarkSold}
                className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416] disabled:opacity-50"
              >
                {L.sold}
              </button>
            )}
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
