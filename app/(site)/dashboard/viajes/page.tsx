"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { fetchDashboardProfile } from "../lib/dashboardProfile";

import type { ViajesStagedLifecycleStatus } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";

type Lang = "es" | "en";
type Plan = "free" | "pro";

type ViajesDashRow = {
  id: string;
  slug: string;
  title: string;
  lane: string;
  lifecycle_status: ViajesStagedLifecycleStatus;
  submitted_at: string | null;
  updated_at: string | null;
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

export default function DashboardViajesStagedPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/viajes";
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Viajes — tus envíos",
            subtitle: "Solicitudes guardadas en Leonix (revisión interna). No son públicas hasta aprobación.",
            loading: "Cargando…",
            signIn: "Inicia sesión para ver tus envíos.",
            empty: "Aún no hay envíos vinculados a tu cuenta.",
            thTitle: "Título",
            thLane: "Vía",
            thStatus: "Estado",
            thSubmitted: "Enviado",
            thActions: "Acciones",
            viewPublic: "Ficha (si aprobada)",
            editNegocios: "Editar borrador negocio",
            editPrivado: "Editar borrador particular",
            results: "Resultados Viajes",
          }
        : {
            title: "Viajes — your submissions",
            subtitle: "Requests stored in Leonix (internal review). They stay private until approved.",
            loading: "Loading…",
            signIn: "Sign in to see your submissions.",
            empty: "No Viajes submissions are linked to your account yet.",
            thTitle: "Title",
            thLane: "Lane",
            thStatus: "Status",
            thSubmitted: "Submitted",
            thActions: "Actions",
            viewPublic: "Public offer (if approved)",
            editNegocios: "Edit business draft",
            editPrivado: "Edit private draft",
            results: "Viajes results",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<ViajesDashRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const sb = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await withAuthTimeout(sb.auth.getUser(), AUTH_CHECK_TIMEOUT_MS);
        if (!mounted) return;
        if (!user) {
          setUserId(null);
          setRows([]);
          setLoading(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        setUserId(user.id);
        const { row: prof } = await fetchDashboardProfile(sb, user.id);
        if (prof?.display_name) setName(prof.display_name);
        if (prof?.email) setEmail(prof.email);
        if (prof?.membership_tier != null) setPlan(normalizePlanFromMembershipTier(prof.membership_tier));

        const { data, error } = await sb
          .from("viajes_staged_listings")
          .select("id, slug, title, lane, lifecycle_status, submitted_at, updated_at")
          .eq("owner_user_id", user.id)
          .order("submitted_at", { ascending: false });

        if (!mounted) return;
        if (error) {
          setErr(error.message);
          setRows([]);
        } else {
          setRows((data ?? []) as ViajesDashRow[]);
        }
      } catch (e) {
        if (!mounted) return;
        setErr(e instanceof Error ? e.message : "error");
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="viajes"
      plan={plan}
      userName={name}
      email={email}
      accountRef={userId ? accountRefFromId(userId) : null}
    >
      <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_14px_44px_-16px_rgba(42,36,22,0.14)] sm:p-8">
        <h1 className="text-2xl font-bold text-[#1E1810]">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]">{t.subtitle}</p>

        {loading ? <p className="mt-8 text-sm text-[#7A7164]">{t.loading}</p> : null}
        {!loading && !userId ? <p className="mt-8 text-sm text-[#7A7164]">{t.signIn}</p> : null}
        {err ? <p className="mt-4 text-sm text-rose-800">{err}</p> : null}

        {!loading && userId && !err && rows.length === 0 ? <p className="mt-8 text-sm text-[#7A7164]">{t.empty}</p> : null}

        {!loading && rows.length > 0 ? (
          <div className="mt-8 overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8DFD0] text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
                  <th className="py-2 pr-4">{t.thTitle}</th>
                  <th className="py-2 pr-4">{t.thLane}</th>
                  <th className="py-2 pr-4">{t.thStatus}</th>
                  <th className="py-2 pr-4">{t.thSubmitted}</th>
                  <th className="py-2">{t.thActions}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#F0E8DC]/90">
                    <td className="py-3 pr-4 font-semibold text-[#1E1810]">{r.title}</td>
                    <td className="py-3 pr-4 capitalize text-[#5C5346]">{r.lane}</td>
                    <td className="py-3 pr-4 text-[#5C5346]">{r.lifecycle_status}</td>
                    <td className="py-3 pr-4 text-xs tabular-nums text-[#5C5346]">{r.submitted_at ?? "—"}</td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap">
                        {r.lifecycle_status === "approved" ? (
                          <Link
                            href={appendLangToPath(`/clasificados/viajes/oferta/${r.slug}`, lang)}
                            className="text-xs font-bold text-[#6B5B2E] underline"
                          >
                            {t.viewPublic}
                          </Link>
                        ) : null}
                        <Link
                          href={r.lane === "private" ? appendLangToPath("/publicar/viajes/privado", lang) : appendLangToPath("/publicar/viajes/negocios", lang)}
                          className="text-xs text-[#5C5346] underline"
                        >
                          {r.lane === "private" ? t.editPrivado : t.editNegocios}
                        </Link>
                        <Link href={appendLangToPath("/clasificados/viajes/resultados", lang)} className="text-xs text-[#7A7164] underline">
                          {t.results}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </LeonixDashboardShell>
  );
}
