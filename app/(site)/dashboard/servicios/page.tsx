"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { listLocalServiciosPublishSummaries } from "@/app/clasificados/servicios/lib/localServiciosPublishStorage";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";

type Lang = "es" | "en";
type Plan = "free" | "pro";

type MergedRow = {
  slug: string;
  businessName: string;
  city: string;
  publishedAt: string;
  source: "browser" | "dev_server";
};

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (v === "pro" || v === "business_lite" || v === "business_premium") return "pro";
  return "free";
}

export default function DashboardServiciosPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/servicios";
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Mis vitrinas Servicios",
            subtitle:
              "Listados publicados desde este navegador o el archivo de pruebas locales del proyecto (solo desarrollo). Para la nube completa configura Supabase.",
            loading: "Cargando…",
            empty: "Aún no hay vitrinas Servicios en esta vista de prueba.",
            slug: "Slug",
            city: "Ciudad",
            source: "Origen",
            sourceBrowser: "Navegador",
            sourceDev: "Archivo dev",
            view: "Ver vitrina",
            results: "Buscar en resultados",
            edit: "Seguir editando",
            publish: "Publicar otro",
            devHint: "Si usas `next dev`, las publicaciones sin base de datos pueden guardarse en `.servicios-dev-publishes.json` y aparecen aquí vía API.",
          }
        : {
            title: "My Servicios showcases",
            subtitle:
              "Listings published from this browser or the project’s local dev file (development only). Configure Supabase for full cloud persistence.",
            loading: "Loading…",
            empty: "No Servicios showcases in this test view yet.",
            slug: "Slug",
            city: "City",
            source: "Source",
            sourceBrowser: "Browser",
            sourceDev: "Dev file",
            view: "View showcase",
            results: "Search in results",
            edit: "Continue editing",
            publish: "Publish another",
            devHint: "With `next dev`, publishes without a database may be written to `.servicios-dev-publishes.json` and listed here via API.",
          },
    [lang],
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<MergedRow[]>([]);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let mounted = true;
    async function run() {
      const { data } = await sb.auth.getUser();
      if (!mounted) return;
      if (!data.user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      const u = data.user;
      setUserId(u.id);
      setEmail(u.email ?? null);
      setName(
        (u.user_metadata?.full_name as string | undefined) || (u.user_metadata?.name as string | undefined) || null,
      );
      try {
        const { data: p } = await sb.from("profiles").select("display_name, email, membership_tier").eq("id", u.id).maybeSingle();
        const row = p as { display_name?: string | null; email?: string | null; membership_tier?: string | null } | null;
        if (row?.display_name?.trim()) setName(row.display_name.trim());
        if (row?.email?.trim()) setEmail(row.email.trim());
        setPlan(normalizePlanFromMembershipTier(row?.membership_tier));
      } catch {
        /* ignore */
      }

      const local: MergedRow[] = listLocalServiciosPublishSummaries().map((e) => ({
        slug: e.slug,
        businessName: e.businessName,
        city: e.city,
        publishedAt: e.publishedAt,
        source: "browser" as const,
      }));

      let dev: MergedRow[] = [];
      try {
        const res = await fetch("/api/clasificados/servicios/dev-listings", { cache: "no-store" });
        const j = (await res.json()) as { listings?: { slug: string; business_name: string; city: string; published_at: string }[] };
        dev = (j.listings ?? []).map((r) => ({
          slug: r.slug,
          businessName: r.business_name,
          city: r.city,
          publishedAt: r.published_at,
          source: "dev_server" as const,
        }));
      } catch {
        dev = [];
      }

      const bySlug = new Map<string, MergedRow>();
      for (const r of dev) bySlug.set(r.slug, r);
      for (const r of local) {
        if (!bySlug.has(r.slug)) bySlug.set(r.slug, r);
      }
      const merged = [...bySlug.values()].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

      if (!mounted) return;
      setRows(merged);
      setLoading(false);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  const accountRef = userId ? accountRefFromId(userId) : null;

  return (
    <LeonixDashboardShell lang={lang} activeNav="servicios" plan={plan} userName={name} email={email} accountRef={accountRef}>
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#5C5346]/95">{t.subtitle}</p>
              <p className="mt-2 max-w-2xl text-xs text-[#7A7164]">{t.devHint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/clasificados/publicar/servicios?${q}`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#E8DFD0] bg-white px-4 text-sm font-semibold text-[#1E1810] shadow-sm hover:bg-[#FFFCF7]"
              >
                {t.publish}
              </Link>
              <Link
                href={`/clasificados/servicios/resultados?${q}`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[#3B66AD] px-4 text-sm font-bold text-white shadow-md hover:bg-[#2f5699]"
              >
                {t.results}
              </Link>
            </div>
          </header>

          {rows.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-[#E8DFD0] bg-[#FAF7F2]/90 p-10 text-center text-sm text-[#5C5346]">
              {t.empty}
            </div>
          ) : (
            <div className="mt-8 overflow-x-auto rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-[#FAF7F2]/95 text-left text-xs font-bold uppercase text-[#7A7164]">
                  <tr>
                    <th className="p-3">{t.slug}</th>
                    <th className="p-3">Negocio / Business</th>
                    <th className="p-3">{t.city}</th>
                    <th className="p-3">{t.source}</th>
                    <th className="p-3"> </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.slug} className="border-t border-[#E8DFD0]/80">
                      <td className="p-3 font-mono text-xs text-[#3D3428]">{r.slug}</td>
                      <td className="p-3 font-semibold text-[#1E1810]">{r.businessName}</td>
                      <td className="p-3 text-xs text-[#5C5346]">{r.city}</td>
                      <td className="p-3 text-xs text-[#5C5346]">
                        {r.source === "browser" ? t.sourceBrowser : t.sourceDev}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/clasificados/servicios/${encodeURIComponent(r.slug)}?${q}`}
                            className="text-xs font-bold text-[#3B66AD] underline"
                          >
                            {t.view}
                          </Link>
                          <Link
                            href={`/clasificados/servicios/resultados?${q}&q=${encodeURIComponent(r.businessName)}`}
                            className="text-xs font-semibold text-[#6B5B2E] underline"
                          >
                            {t.results}
                          </Link>
                          <Link
                            href={`/clasificados/publicar/servicios?${q}`}
                            className="text-xs font-semibold text-[#7A7164] underline"
                          >
                            {t.edit}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </LeonixDashboardShell>
  );
}
