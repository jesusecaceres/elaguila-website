"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { formatServiciosInternalGroupForDiscovery } from "./lib/serviciosInternalGroupDisplay";
import { listLocalServiciosPublishSummaries } from "./lib/localServiciosPublishStorage";

export function ServiciosDirectoryLocalSection({
  lang,
  dbSlugs,
}: {
  lang: ServiciosLang;
  dbSlugs: string[];
}) {
  const [rows, setRows] = useState<
    { slug: string; businessName: string; city: string; publishedAt: string; internalGroup?: string }[]
  >([]);

  useEffect(() => {
    const dbSet = new Set(dbSlugs);
    const all = listLocalServiciosPublishSummaries();
    setRows(all.filter((r) => !dbSet.has(r.slug)));
  }, [dbSlugs]);

  if (rows.length === 0) return null;

  return (
    <section className="mt-10 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900/80">
        {lang === "en" ? "On this device" : "En este dispositivo"}
      </h2>
      <p className="mt-1 text-sm text-amber-950/70">
        {lang === "en"
          ? "Listings saved locally when cloud publish is unavailable. Other visitors won’t see them."
          : "Listados guardados en este navegador cuando la nube no está disponible. Otros visitantes no los verán."}
      </p>
      <ul className="mt-4 space-y-2">
        {rows.map((r) => {
          const groupLabel = formatServiciosInternalGroupForDiscovery(r.internalGroup, lang);
          return (
            <li key={r.slug}>
              <Link
                href={`/clasificados/servicios/${encodeURIComponent(r.slug)}?lang=${lang}`}
                className="flex flex-col rounded-xl border border-amber-200/70 bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#3B66AD]/40"
              >
                {groupLabel ? (
                  <span className="mb-1 w-fit rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950/80">
                    {groupLabel}
                  </span>
                ) : null}
                <span className="font-semibold text-neutral-900">{r.businessName}</span>
                <span className="text-xs text-neutral-500">
                  {r.city || (lang === "en" ? "City pending" : "Ciudad pendiente")} · {r.slug}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
