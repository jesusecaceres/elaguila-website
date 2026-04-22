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
  source: "browser" | "dev_server" | "cloud";
  listingStatus?: string | null;
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
              "Tus anuncios guardados en Leonix (cuenta vinculada) más respaldos locales opcionales en este navegador o archivo dev.",
            loading: "Cargando…",
            empty: "Aún no hay vitrinas Servicios vinculadas a tu cuenta.",
            slug: "Slug",
            city: "Ciudad",
            status: "Estado",
            source: "Origen",
            sourceBrowser: "Navegador",
            sourceDev: "Archivo dev",
            sourceCloud: "Leonix (cuenta)",
            view: "Ver vitrina",
            results: "Buscar en resultados",
            edit: "Seguir editando",
            publish: "Publicar otro",
            leadsTitle: "Solicitudes recientes",
            leadsEmpty: "Aún no hay solicitudes registradas para tu cuenta.",
            pause: "Pausar",
            resume: "Reactivar",
            colLinks: "Enlaces",
            colManage: "Visibilidad",
            devHint:
              "Las filas «Leonix» vienen de tu publicación autenticada. «Archivo dev» solo aparece en desarrollo con publicación dev activa.",
          }
        : {
            title: "My Servicios showcases",
            subtitle: "Your Leonix-saved listings (linked account) plus optional local backups on this device or dev file.",
            loading: "Loading…",
            empty: "No Servicios showcases linked to your account yet.",
            slug: "Slug",
            city: "City",
            status: "Status",
            source: "Source",
            sourceBrowser: "Browser",
            sourceDev: "Dev file",
            sourceCloud: "Leonix (account)",
            view: "View showcase",
            results: "Search in results",
            edit: "Continue editing",
            publish: "Publish another",
            leadsTitle: "Recent inquiries",
            leadsEmpty: "No inquiries recorded for your account yet.",
            pause: "Pause listing",
            resume: "Resume listing",
            colLinks: "Links",
            colManage: "Visibility",
            devHint: "“Leonix” rows come from authenticated publish. “Dev file” only appears in development when dev publish is on.",
          },
    [lang],
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<MergedRow[]>([]);
  const [leads, setLeads] = useState<
    { id: string; listing_slug: string; sender_name: string; sender_email: string; message: string; request_kind: string; created_at: string }[]
  >([]);
  const [manageBusy, setManageBusy] = useState<string | null>(null);

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

      const bySlug = new Map<string, MergedRow>();

      const { data: sess } = await sb.auth.getSession();
      const token = sess.session?.access_token;
      if (token) {
        try {
          const res = await fetch("/api/clasificados/servicios/my-listings", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          const j = (await res.json()) as {
            ok?: boolean;
            listings?: {
              slug: string;
              business_name: string;
              city: string;
              published_at: string;
              listing_status?: string | null;
            }[];
          };
          if (j.ok && Array.isArray(j.listings)) {
            for (const r of j.listings) {
              bySlug.set(r.slug, {
                slug: r.slug,
                businessName: r.business_name,
                city: r.city,
                publishedAt: r.published_at,
                source: "cloud",
                listingStatus: r.listing_status ?? null,
              });
            }
          }
        } catch {
          /* ignore */
        }
        try {
          const lr = await fetch("/api/clasificados/servicios/my-leads", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          const lj = (await lr.json()) as {
            ok?: boolean;
            leads?: {
              id: string;
              listing_slug: string;
              sender_name: string;
              sender_email: string;
              message: string;
              request_kind: string;
              created_at: string;
            }[];
          };
          if (mounted && lj.ok && Array.isArray(lj.leads)) setLeads(lj.leads);
        } catch {
          /* ignore */
        }
      }

      try {
        const res = await fetch("/api/clasificados/servicios/dev-listings", { cache: "no-store" });
        const j = (await res.json()) as { listings?: { slug: string; business_name: string; city: string; published_at: string }[] };
        for (const r of j.listings ?? []) {
          if (!bySlug.has(r.slug)) {
            bySlug.set(r.slug, {
              slug: r.slug,
              businessName: r.business_name,
              city: r.city,
              publishedAt: r.published_at,
              source: "dev_server",
            });
          }
        }
      } catch {
        /* ignore */
      }

      for (const e of listLocalServiciosPublishSummaries()) {
        if (!bySlug.has(e.slug)) {
          bySlug.set(e.slug, {
            slug: e.slug,
            businessName: e.businessName,
            city: e.city,
            publishedAt: e.publishedAt,
            source: "browser",
          });
        }
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

  async function manageListing(slug: string, action: "pause" | "resume") {
    const sb = createSupabaseBrowserClient();
    const { data: sess } = await sb.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return;
    setManageBusy(`${action}:${slug}`);
    try {
      const res = await fetch("/api/clasificados/servicios/manage", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setManageBusy(null);
    }
  }

  const accountRef = userId ? accountRefFromId(userId) : null;

  const sourceLabel = (r: MergedRow) => {
    if (r.source === "browser") return t.sourceBrowser;
    if (r.source === "dev_server") return t.sourceDev;
    return t.sourceCloud;
  };

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
                    <th className="p-3">{t.status}</th>
                    <th className="p-3">{t.source}</th>
                    <th className="p-3">{t.colLinks}</th>
                    <th className="p-3">{t.colManage}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.slug} className="border-t border-[#E8DFD0]/80">
                      <td className="p-3 font-mono text-xs text-[#3D3428]">{r.slug}</td>
                      <td className="p-3 font-semibold text-[#1E1810]">{r.businessName}</td>
                      <td className="p-3 text-xs text-[#5C5346]">{r.city}</td>
                      <td className="p-3 text-xs text-[#5C5346]">{r.listingStatus ?? "—"}</td>
                      <td className="p-3 text-xs text-[#5C5346]">{sourceLabel(r)}</td>
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
                      <td className="p-3">
                        {r.source === "cloud" && r.listingStatus === "published" ? (
                          <button
                            type="button"
                            disabled={manageBusy !== null}
                            onClick={() => void manageListing(r.slug, "pause")}
                            className="text-xs font-bold text-amber-900 underline disabled:opacity-50"
                          >
                            {t.pause}
                          </button>
                        ) : r.source === "cloud" && r.listingStatus === "paused_unpublished" ? (
                          <button
                            type="button"
                            disabled={manageBusy !== null}
                            onClick={() => void manageListing(r.slug, "resume")}
                            className="text-xs font-bold text-emerald-900 underline disabled:opacity-50"
                          >
                            {t.resume}
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#b0a89c]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {leads.length > 0 ? (
            <div className="mt-10 rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-6">
              <h2 className="text-lg font-bold text-[#1E1810]">{t.leadsTitle}</h2>
              <ul className="mt-4 space-y-4 text-sm">
                {leads.map((l) => (
                  <li key={l.id} className="rounded-2xl border border-[#E8DFD0]/80 bg-white/90 p-4">
                    <p className="text-xs font-mono text-[#7A7164]">
                      {l.listing_slug} · {new Date(l.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1 font-semibold text-[#1E1810]">
                      {l.sender_name} ·{" "}
                      <a className="text-[#3B66AD] underline" href={`mailto:${l.sender_email}`}>
                        {l.sender_email}
                      </a>
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-[#5C5346]">{l.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : rows.some((r) => r.source === "cloud") ? (
            <p className="mt-8 text-center text-xs text-[#9A9084]">{t.leadsEmpty}</p>
          ) : null}
        </>
      )}
    </LeonixDashboardShell>
  );
}
