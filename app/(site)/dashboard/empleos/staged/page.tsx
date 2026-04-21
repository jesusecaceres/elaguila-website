"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { EmpleosCanonicalListing } from "@/app/clasificados/empleos/lib/staged/empleosCanonicalListing";
import { empleosStagedListingUrls } from "@/app/clasificados/empleos/lib/staged/empleosCanonicalListing";
import { getEmpleosStagedOwnerId } from "@/app/clasificados/empleos/lib/staged/empleosStagedIdentity";
import { EMPLEOS_STAGED_REGISTRY_EVENT, listEmpleosCanonicalByOwner } from "@/app/clasificados/empleos/lib/staged/empleosStagedStorage";

import { LeonixDashboardShell } from "../../components/LeonixDashboardShell";

type Lang = "es" | "en";

function loadRows(ownerId: string): EmpleosCanonicalListing[] {
  return listEmpleosCanonicalByOwner(ownerId).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export default function EmpleosStagedDashboardPage() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Empleos — mis publicaciones (demo)",
            subtitle:
              "Listados guardados en este navegador (localStorage). Misma capa que resultados públicos y moderación admin en modo demostración.",
            empty: "Aún no hay vacantes publicadas desde este dispositivo.",
            publish: "Publicar otra vacante",
            results: "Ver resultados",
            admin: "Vista admin (demo)",
            colTitle: "Título",
            colStatus: "Estado",
            colLane: "Formato",
            colManage: "Gestionar",
            colPublic: "Público",
          }
        : {
            title: "Jobs — my listings (demo)",
            subtitle:
              "Listings stored in this browser (localStorage). Same layer as public results and admin moderation in demo mode.",
            empty: "No job listings from this device yet.",
            publish: "Post another job",
            results: "Browse results",
            admin: "Admin view (demo)",
            colTitle: "Title",
            colStatus: "Status",
            colLane: "Lane",
            colManage: "Manage",
            colPublic: "Public",
          },
    [lang],
  );

  const [rows, setRows] = useState<EmpleosCanonicalListing[]>([]);

  useEffect(() => {
    const ownerId = getEmpleosStagedOwnerId();
    setRows(loadRows(ownerId));
    const on = () => setRows(loadRows(getEmpleosStagedOwnerId()));
    window.addEventListener(EMPLEOS_STAGED_REGISTRY_EVENT, on);
    return () => window.removeEventListener(EMPLEOS_STAGED_REGISTRY_EVENT, on);
  }, []);

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="listings"
      plan="free"
      userName={null}
      email={null}
      accountRef="DEMO"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#5C5346]/95">{t.subtitle}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link
            href={appendLangToPath("/clasificados/publicar/empleos", lang)}
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
          >
            {t.publish}
          </Link>
          <Link
            href={appendLangToPath("/clasificados/empleos/resultados", lang)}
            className="text-center text-sm font-semibold text-[#2A2620] underline"
          >
            {t.results}
          </Link>
          <Link href={`/admin/workspace/clasificados/staged-empleos?${q}`} className="text-center text-sm font-semibold text-[#6B5B2E] underline">
            {t.admin}
          </Link>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-8 text-center text-[#5C5346]">
          <p>{t.empty}</p>
          <Link
            href={appendLangToPath("/clasificados/publicar/empleos", lang)}
            className="mt-4 inline-flex rounded-2xl bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2]"
          >
            {t.publish}
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-xs font-bold uppercase tracking-wide text-[#7A7164]">
              <tr>
                <th className="px-4 py-3">{t.colTitle}</th>
                <th className="px-4 py-3">{t.colLane}</th>
                <th className="px-4 py-3">{t.colStatus}</th>
                <th className="px-4 py-3">{t.colManage}</th>
                <th className="px-4 py-3">{t.colPublic}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const urls = empleosStagedListingUrls(r.listingId, r.slug);
                return (
                  <tr key={r.listingId} className="border-b border-[#E8DFD0]/80 last:border-0">
                    <td className="px-4 py-3 font-semibold text-[#1E1810]">
                      <div className="max-w-[220px] truncate">{r.title}</div>
                      <div className="text-xs font-normal text-[#7A7164]">{r.company}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-[#5C5346]">{r.lane}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#E8DFD0]/90 px-2 py-0.5 text-xs font-bold text-[#3D3428]">{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={appendLangToPath(urls.dashboardUrl, lang)} className="font-semibold text-[#B8954A] underline">
                        {t.colManage}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "published" ? (
                        <Link href={appendLangToPath(urls.anuncioUrl, lang)} className="font-semibold text-[#2A2620] underline">
                          {t.colPublic}
                        </Link>
                      ) : (
                        <span className="text-xs text-[#7A7164]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Link href={`/dashboard?${q}`} className="mt-10 inline-flex text-sm font-semibold text-[#2A2620] underline">
        ← {lang === "es" ? "Volver al resumen" : "Back to overview"}
      </Link>
    </LeonixDashboardShell>
  );
}
