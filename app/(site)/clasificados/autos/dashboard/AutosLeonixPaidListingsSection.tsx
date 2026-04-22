"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import type { AutosClassifiedsDashboardRow } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosClassifiedsLane, AutosClassifiedsListingStatus } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  autosListingStatusLabelEn,
  autosListingStatusLabelEs,
} from "@/app/lib/clasificados/autos/autosClassifiedsVisibility";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

type Lang = "es" | "en";

function statusLabel(status: string, lang: Lang): string {
  const s = status as AutosClassifiedsListingStatus;
  return lang === "es" ? autosListingStatusLabelEs(s) : autosListingStatusLabelEn(s);
}

function laneLabel(lane: AutosClassifiedsLane, lang: Lang) {
  if (lane === "negocios") return lang === "es" ? "Negocios" : "Business";
  return lang === "es" ? "Privado" : "Private";
}

function formatUsd(n: number | null, lang: Lang) {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function AutosLeonixPaidListingsSection({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<AutosClassifiedsDashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setRows([]);
      setLoading(false);
      return;
    }
    const r = await fetch("/api/clasificados/autos/listings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = (await r.json()) as { ok?: boolean; listings?: AutosClassifiedsDashboardRow[] };
    if (r.ok && j.ok && Array.isArray(j.listings)) setRows(j.listings);
    else setRows([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const t =
    lang === "es"
      ? {
          title: "Autos Clasificados (Leonix)",
          subtitle: "Anuncios con pago y activación en `/clasificados/autos` (separado del catálogo genérico).",
          loading: "Cargando…",
          empty: "Aún no tienes anuncios de Autos guardados en el sistema de pago.",
          edit: "Editar",
          confirm: "Confirmar / pagar",
          viewLive: "Ver público",
          unpublish: "Retirar",
          updated: "Actualizado",
        }
      : {
          title: "Autos classifieds (Leonix)",
          subtitle: "Paid listings activated on `/clasificados/autos` (separate from the generic catalog).",
          loading: "Loading…",
          empty: "You do not have any Autos listings in the paid flow yet.",
          edit: "Edit",
          confirm: "Confirm / pay",
          viewLive: "View live",
          unpublish: "Unpublish",
          updated: "Updated",
        };

  async function unpublish(id: string) {
    if (!confirm(lang === "es" ? "¿Retirar este anuncio del público?" : "Remove this listing from public view?")) return;
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    setBusyId(id);
    await fetch(`/api/clasificados/autos/listings/${id}/unpublish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setBusyId(null);
    void load();
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-6 text-sm text-[#5C5346]">{t.loading}</div>
    );
  }

  if (rows.length === 0) {
    const emptyT =
      lang === "es"
        ? {
            title: "Sin anuncios de Autos (flujo de pago)",
            body: "Los anuncios de /publicar/autos se guardan aquí cuando inicias confirmación. Publica un vehículo (privado o negocio) para verlo en esta lista y en /clasificados/autos.",
            cta: "Publicar en Autos",
          }
        : {
            title: "No Leonix Autos paid listings yet",
            body: "Listings from /publicar/autos appear here once you start the confirm flow. Publish a vehicle (private or business) to see it here and on /clasificados/autos.",
            cta: "Publish in Autos",
          };
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-[#C9B46A]/45 bg-[#FFFCF7]/80 p-5 text-sm text-[#5C5346]">
        <p className="font-bold text-[#1E1810]">{emptyT.title}</p>
        <p className="mt-2 leading-relaxed">{emptyT.body}</p>
        <Link
          href={withLangParam("/publicar/autos", lang)}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#2A2620] px-4 text-sm font-bold text-[#FAF7F2]"
        >
          {emptyT.cta}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#C9B46A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#FAF7F2] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>
      <p className="mt-1 text-sm text-[#5C5346]/95">{t.subtitle}</p>
      <ul className="mt-4 flex flex-col gap-4">
        {rows.map((row) => {
          const editBase = row.lane === "negocios" ? "/publicar/autos/negocios" : "/publicar/autos/privado";
          const editHref = withLangParam(editBase, row.lang);
          const confirmHref = withLangParam(`${editBase}/confirm`, row.lang);
          const liveHref = `${autosLiveVehiclePath(row.id)}?lang=${row.lang}`;
          const busy = busyId === row.id;
          return (
            <li
              key={row.id}
              className="rounded-xl border border-[#E8DFD0]/90 bg-white/90 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E8DFD0] bg-[#EDE6DC]">
                    {row.thumbUrl ? (
                       
                      <img src={row.thumbUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl text-[#2C2416]/20">🚗</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-bold text-[#1E1810]">{row.title}</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#1E1810]">{formatUsd(row.priceUsd, lang)}</p>
                    <p className="mt-0.5 text-xs text-[#5C5346]">
                      {laneLabel(row.lane, lang)} · {statusLabel(row.status, lang)}
                      {row.city ? ` · ${row.city}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-[#7A7164]">
                      {t.updated}: {new Date(row.updated_at).toLocaleString(lang === "es" ? "es-US" : "en-US")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={editHref}
                    className="rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2 text-xs font-bold text-[#2C2416]"
                  >
                    {t.edit}
                  </Link>
                  {row.status === "draft" || row.status === "pending_payment" || row.status === "payment_failed" ? (
                    <Link href={confirmHref} className="rounded-lg bg-[#2A2620] px-3 py-2 text-xs font-bold text-[#FAF7F2]">
                      {t.confirm}
                    </Link>
                  ) : null}
                  {row.status === "active" ? (
                    <>
                      <Link
                        href={liveHref}
                        className="rounded-lg border border-[#C9B46A]/45 bg-[#FBF7EF] px-3 py-2 text-xs font-bold text-[#5C4E2E]"
                      >
                        {t.viewLive}
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void unpublish(row.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-900 disabled:opacity-50"
                      >
                        {t.unpublish}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
