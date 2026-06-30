"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

import { LeonixDashboardShell } from "../components/LeonixDashboardShell";

type Lang = "es" | "en";

type Row = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  lifecycle_status: string;
  lane: string;
  updated_at: string;
};

export default function EmpleosEmployerDashboardPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = "/dashboard/empleos";
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Mis vacantes — Empleos",
            subtitle: "Tus anuncios de empleo publicados o en revisión en Leonix. Debes iniciar sesión.",
            loading: "Cargando…",
            login: "Inicia sesión para ver tus vacantes.",
            empty: "Aún no tienes vacantes en esta cuenta.",
            publish: "Publicar vacante",
            manage: "Gestionar",
            edit: "Editar en formulario",
            public: "Ver público",
            colTitle: "Título",
            colStatus: "Estado",
            colLane: "Producto",
          }
        : {
            title: "My job listings — Empleos",
            subtitle: "Your job ads published or under review on Leonix. You must be signed in.",
            loading: "Loading…",
            login: "Sign in to view your job listings.",
            empty: "No job listings for this account yet.",
            publish: "Post a job",
            manage: "Manage",
            edit: "Edit in form",
            public: "Public view",
            colTitle: "Title",
            colStatus: "Status",
            colLane: "Product",
          },
    [lang],
  );

  const laneLabel = (lane: string) => {
    if (lane === "quick") return lang === "es" ? "Empleo local" : "Local job ad";
    if (lane === "premium") return lang === "es" ? "Preservado (premium)" : "Preserved (premium)";
    if (lane === "feria") return lang === "es" ? "Feria de empleo" : "Job fair";
    return lane;
  };

  const [authLoading, setAuthLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        const redirect = encodeURIComponent(`${pathname}${typeof window !== "undefined" ? window.location.search || "" : ""}`);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }
      const { data, error } = await supabase
        .from("empleos_public_listings")
        .select("id, slug, title, company_name, lifecycle_status, lane, updated_at")
        .eq("owner_user_id", userData.user.id)
        .order("updated_at", { ascending: false });
      if (!cancelled) {
        setAuthLoading(false);
        if (!error && data) setRows(data as Row[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (authLoading) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null}>
        <p className="text-sm text-[#5C5346]">{t.loading}</p>
      </LeonixDashboardShell>
    );
  }

  return (
    <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1810] sm:text-3xl">{t.title}</h1>
          <p className="mt-2 text-sm text-[#5C5346]">{t.subtitle}</p>
        </div>
        <Link
          href={appendLangToPath("/clasificados/publicar/empleos", lang)}
          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810]"
        >
          {t.publish}
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="mt-10 text-[#5C5346]">{t.empty}</p>
      ) : (
        <>
          <ul className="mt-8 space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-4">
                <p className="text-base font-bold text-[#1E1810]">{r.title}</p>
                <p className="mt-1 text-xs text-[#7A7164]">{r.company_name}</p>
                <p className="mt-2 text-xs text-[#5C5346]">
                  {t.colLane}: {laneLabel(r.lane)} · {t.colStatus}: {r.lifecycle_status}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/dashboard/empleos/${r.id}?${q}`} className="rounded-xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold text-[#5C4E2E]">
                    {t.manage}
                  </Link>
                  {r.lane === "quick" ? (
                    <Link href={`/publicar/empleos/quick?edit=${r.id}&${q}`} className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold text-[#2C2416]">
                      {t.edit}
                    </Link>
                  ) : null}
                  {r.lane === "premium" ? (
                    <Link href={`/publicar/empleos/premium?edit=${r.id}&${q}`} className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold text-[#2C2416]">
                      {t.edit}
                    </Link>
                  ) : null}
                  {r.lane === "feria" ? (
                    <Link href={`/publicar/empleos/feria?edit=${r.id}&${q}`} className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold text-[#2C2416]">
                      {t.edit}
                    </Link>
                  ) : null}
                  {r.lifecycle_status === "published" ? (
                    <Link href={appendLangToPath(`/clasificados/empleos/${r.slug}`, lang)} className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold text-[#2C2416]">
                      {t.public}
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 md:block">
            <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-xs font-bold uppercase text-[#7A7164]">
              <tr>
                <th className="px-4 py-3">{t.colTitle}</th>
                <th className="px-4 py-3">{t.colLane}</th>
                <th className="px-4 py-3">{t.colStatus}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[#E8DFD0]/80 last:border-0">
                  <td className="px-4 py-3 font-semibold text-[#1E1810]">
                    <div className="max-w-[220px] truncate">{r.title}</div>
                    <div className="text-xs font-normal text-[#7A7164]">{r.company_name}</div>
                  </td>
                  <td className="px-4 py-3">{laneLabel(r.lane)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#E8DFD0]/90 px-2 py-0.5 text-xs font-bold">{r.lifecycle_status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-xs font-semibold sm:flex-row sm:gap-3">
                      <Link href={`/dashboard/empleos/${r.id}?${q}`} className="text-[#B8954A] underline">
                        {t.manage}
                      </Link>
                      {r.lane === "quick" ? (
                        <Link href={`/publicar/empleos/quick?edit=${r.id}&${q}`} className="text-[#4A6B82] underline">
                          {t.edit}
                        </Link>
                      ) : null}
                      {r.lane === "premium" ? (
                        <Link href={`/publicar/empleos/premium?edit=${r.id}&${q}`} className="text-[#4A6B82] underline">
                          {t.edit}
                        </Link>
                      ) : null}
                      {r.lane === "feria" ? (
                        <Link href={`/publicar/empleos/feria?edit=${r.id}&${q}`} className="text-[#4A6B82] underline">
                          {t.edit}
                        </Link>
                      ) : null}
                      {r.lifecycle_status === "published" ? (
                        <Link href={appendLangToPath(`/clasificados/empleos/${r.slug}`, lang)} className="text-[#2A2620] underline">
                          {t.public}
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </>
      )}

      <Link href={`/dashboard?${q}`} className="mt-10 inline-flex text-sm font-semibold text-[#2A2620] underline">
        ← {lang === "es" ? "Volver al resumen" : "Back to overview"}
      </Link>
    </LeonixDashboardShell>
  );
}
