"use client";

import Link from "next/link";

type Lang = "es" | "en";

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
}) {
  const isSold = (row.status || "active").toLowerCase() === "sold";
  const L =
    lang === "es"
      ? {
          view: "Ver",
          edit: "Editar",
          editLocked: "Editar (ventana corta)",
          sold: "Marcar vendido",
          active: "Marcar activo",
          delete: "Eliminar",
          boost: "Impulsar (pronto)",
        }
      : {
          view: "View",
          edit: "Edit",
          editLocked: "Edit (short window)",
          sold: "Mark sold",
          active: "Mark active",
          delete: "Delete",
          boost: "Boost (soon)",
        };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 md:flex md:items-center md:justify-between md:gap-4">
      <div className="flex min-w-0 gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
          {row.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.thumbUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl text-white/30">📦</div>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-white">{row.title || "—"}</div>
          <div className="mt-1 text-sm text-emerald-200/90">{priceText}</div>
          <div className="mt-1 text-xs text-white/55">
            {(row.city || "").trim()}
            {dateText ? ` · ${dateText}` : ""}
          </div>
          <div className="mt-1 text-[11px] text-white/45">
            {typeof row.views === "number" ? `${lang === "es" ? "Vistas" : "Views"}: ${row.views}` : null}
            {typeof row.messages === "number" ? ` · ${lang === "es" ? "Mensajes" : "Messages"}: ${row.messages}` : null}
            {typeof row.saves === "number" ? ` · ${lang === "es" ? "Guardados" : "Saves"}: ${row.saves}` : null}
          </div>
          <button
            type="button"
            disabled
            className="mt-2 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-3 py-1 text-[11px] font-semibold text-yellow-100/80"
            title={L.boost}
          >
            {L.boost}
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 md:mt-0">
        <span
          className={
            "inline-flex rounded-full px-3 py-1 text-xs font-semibold " +
            (isSold ? "border border-white/10 bg-white/10 text-white/75" : "border border-emerald-400/30 bg-emerald-500/15 text-emerald-100")
          }
        >
          {isSold ? (lang === "es" ? "Vendido" : "Sold") : lang === "es" ? "Activo" : "Active"}
        </span>
        <Link
          href={`/clasificados/anuncio/${row.id}?lang=${lang}`}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          {L.view}
        </Link>
        {canEdit ? (
          <Link href={editHref} className="rounded-full border border-yellow-500/35 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-100 hover:bg-yellow-500/15">
            {L.edit}
          </Link>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/35" title={L.editLocked}>
            {L.editLocked}
          </span>
        )}
        {isSold ? (
          <button
            type="button"
            disabled={busy}
            onClick={onMarkActive}
            className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-100 disabled:opacity-50"
          >
            {L.active}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={onMarkSold}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {L.sold}
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="rounded-full border border-red-500/35 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 disabled:opacity-50"
        >
          {L.delete}
        </button>
      </div>
    </div>
  );
}
