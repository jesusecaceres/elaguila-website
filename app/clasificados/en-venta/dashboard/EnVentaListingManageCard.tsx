"use client";

import Link from "next/link";

type Row = {
  id: string;
  title: unknown;
  price: unknown;
  city: unknown;
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
  row: Row;
  lang: "es" | "en";
  priceText: string;
  dateText: string;
  busy: boolean;
  onMarkSold: () => void;
  onMarkActive: () => void;
  onDelete: () => void;
  canEdit: boolean;
  editHref: string;
}) {
  const title =
    typeof row.title === "object" && row.title !== null && "es" in row.title && "en" in row.title
      ? String((row.title as Record<string, string>)[lang] ?? "")
      : String(row.title ?? "");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-[#F5F5F5] p-4 sm:flex-row sm:items-start">
      <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#E8E8E8]">
        {row.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.thumbUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-[#111111] line-clamp-2">{title}</div>
        <div className="mt-1 text-sm text-[#111111]/80">
          {priceText} · {String(row.city ?? "")}
        </div>
        <div className="mt-1 text-xs text-[#111111]/55">{dateText}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {canEdit ? (
            <Link href={editHref} className="rounded-lg bg-[#111111] px-3 py-1.5 text-xs font-semibold text-white">
              {lang === "es" ? "Editar" : "Edit"}
            </Link>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={onMarkSold}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold"
          >
            {lang === "es" ? "Marcar vendido" : "Mark sold"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onMarkActive}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold"
          >
            {lang === "es" ? "Activar" : "Activate"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-800"
          >
            {lang === "es" ? "Eliminar" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
