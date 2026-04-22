"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { AutosClassifiedsDashboardRow } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosClassifiedsListingStatus } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  autosListingStatusIsPrePublish,
  autosListingStatusLabelEn,
  autosListingStatusLabelEs,
} from "@/app/lib/clasificados/autos/autosClassifiedsVisibility";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

type Lang = "es" | "en";

export function DashboardAutosPaidDraftsBand({ lang }: { lang: Lang }) {
  const [rows, setRows] = useState<AutosClassifiedsDashboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setRows([]);
      setLoading(false);
      return;
    }
    const r = await fetch("/api/clasificados/autos/listings", { headers: { Authorization: `Bearer ${token}` } });
    const j = (await r.json()) as { ok?: boolean; listings?: AutosClassifiedsDashboardRow[] };
    if (r.ok && j.ok && Array.isArray(j.listings)) {
      setRows(j.listings.filter((x) => autosListingStatusIsPrePublish(x.status)));
    } else setRows([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const t =
    lang === "es"
      ? {
          title: "Autos Leonix (borrador / pago pendiente)",
          subtitle:
            "Estos anuncios viven en el sistema de pago de Autos, no en la cola genérica de borradores. Continúa en confirmar y publica.",
          loading: "Cargando…",
          laneNeg: "Negocios",
          lanePriv: "Privado",
          confirm: "Confirmar y publicar",
          updated: "Actualizado",
        }
      : {
          title: "Leonix Autos (draft / payment pending)",
          subtitle: "These listings use the paid Autos flow, not the generic drafts queue. Open confirm to finish publishing.",
          loading: "Loading…",
          laneNeg: "Business",
          lanePriv: "Private",
          confirm: "Confirm & publish",
          updated: "Updated",
        };

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-4 text-sm text-[#5C5346]">{t.loading}</div>
    );
  }

  if (rows.length === 0) return null;

  return (
    <section className="mt-8 rounded-3xl border border-[#C9B46A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>
      <p className="mt-1 text-sm text-[#5C5346]/95">{t.subtitle}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {rows.map((row) => {
          const base = row.lane === "negocios" ? "/publicar/autos/negocios" : "/publicar/autos/privado";
          const confirmHref = withLangParam(`${base}/confirm`, row.lang);
          const st = row.status as AutosClassifiedsListingStatus;
          const statusLine = lang === "es" ? autosListingStatusLabelEs(st) : autosListingStatusLabelEn(st);
          return (
            <li key={row.id} className="rounded-xl border border-[#E8DFD0]/90 bg-white/90 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-[#1E1810]">{row.title}</p>
                  <p className="mt-0.5 text-xs text-[#5C5346]">
                    {row.lane === "negocios" ? t.laneNeg : t.lanePriv} · {statusLine} · {row.city || "—"}
                  </p>
                  <p className="mt-1 text-[10px] text-[#7A7164]">
                    {t.updated}: {new Date(row.updated_at).toLocaleString(lang === "es" ? "es-US" : "en-US")}
                  </p>
                </div>
                <Link
                  href={confirmHref}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#2A2620] px-4 text-sm font-bold text-[#FAF7F2]"
                >
                  {t.confirm}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
