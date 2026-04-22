"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { fetchDashboardProfile } from "../lib/dashboardProfile";

import type { ViajesStagedListingRow, ViajesStagedLifecycleStatus } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";

type Lang = "es" | "en";

function lifecycleStatusLabel(status: ViajesStagedLifecycleStatus, lang: Lang): string {
  const es: Record<ViajesStagedLifecycleStatus, string> = {
    draft: "Borrador",
    submitted: "Enviado (en cola)",
    in_review: "En revisión",
    approved: "Aprobado",
    rejected: "Rechazado",
    changes_requested: "Cambios solicitados",
    expired: "Expirado",
    unpublished: "Oculto",
  };
  const en: Record<ViajesStagedLifecycleStatus, string> = {
    draft: "Draft",
    submitted: "Submitted (queued)",
    in_review: "In review",
    approved: "Approved",
    rejected: "Rejected",
    changes_requested: "Changes requested",
    expired: "Expired",
    unpublished: "Unpublished",
  };
  return (lang === "es" ? es : en)[status] ?? status;
}
type Plan = "free" | "pro";

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
            subtitle:
              "Solicitudes guardadas en Leonix. Revisión interna antes de aparecer en resultados públicos. Leonix no vende el viaje ni procesa pagos aquí.",
            loading: "Cargando…",
            signIn: "Inicia sesión para ver tus envíos.",
            empty: "Aún no hay envíos vinculados a tu cuenta.",
            thTitle: "Título",
            thLane: "Vía",
            thStatus: "Estado de moderación",
            thModeration: "Notas de revisión",
            thSubmitted: "Enviado",
            thActions: "Acciones",
            viewPublic: "Ficha pública",
            preview: "Vista previa interna",
            edit: "Editar y reenviar",
            resubmit: "Reenviar a revisión",
            unpublish: "Ocultar del público",
            results: "Resultados Viajes",
            moderationEmpty: "—",
            busy: "…",
          }
        : {
            title: "Viajes — your submissions",
            subtitle:
              "Requests stored in Leonix. Internal review before they appear in public results. Leonix does not sell the trip or process payment here.",
            loading: "Loading…",
            signIn: "Sign in to see your submissions.",
            empty: "No Viajes submissions are linked to your account yet.",
            thTitle: "Title",
            thLane: "Lane",
            thStatus: "Status",
            thModeration: "Review notes",
            thSubmitted: "Submitted",
            thActions: "Actions",
            viewPublic: "Public offer",
            preview: "Internal preview",
            edit: "Edit & resubmit",
            resubmit: "Send back to review",
            unpublish: "Remove from public",
            results: "Viajes results",
            moderationEmpty: "—",
            busy: "…",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<ViajesStagedListingRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadRows = useCallback(async (sb: ReturnType<typeof createSupabaseBrowserClient>, uid: string) => {
    const { data, error } = await sb
      .from("viajes_staged_listings")
      .select(
        "id, slug, title, lane, lifecycle_status, is_public, submitted_at, updated_at, review_notes, moderation_reason, listing_json, lang"
      )
      .eq("owner_user_id", uid)
      .order("submitted_at", { ascending: false });
    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setErr(null);
      setRows((data ?? []) as ViajesStagedListingRow[]);
    }
  }, []);

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
          setToken(null);
          setRows([]);
          setLoading(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        setUserId(user.id);
        const sess = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
        setToken(sess.data.session?.access_token ?? null);
        const { row: prof } = await fetchDashboardProfile(sb, user.id);
        if (prof?.display_name) setName(prof.display_name);
        if (prof?.email) setEmail(prof.email);
        if (prof?.membership_tier != null) setPlan(normalizePlanFromMembershipTier(prof.membership_tier));
        await loadRows(sb, user.id);
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
  }, [loadRows, pathname, router]);

  const ownerAction = useCallback(
    async (id: string, action: "resubmit" | "unpublish") => {
      if (!token) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      setBusyId(id);
      setErr(null);
      try {
        const res = await fetch("/api/clasificados/viajes/staged-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id, action }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) {
          setErr(json.error ?? `HTTP ${res.status}`);
          return;
        }
        const sb = createSupabaseBrowserClient();
        const u = await withAuthTimeout(sb.auth.getUser(), AUTH_CHECK_TIMEOUT_MS);
        if (u.data.user?.id) await loadRows(sb, u.data.user.id);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "error");
      } finally {
        setBusyId(null);
      }
    },
    [loadRows, pathname, router, token]
  );

  const editHref = (r: ViajesStagedListingRow) => {
    const base = r.lane === "private" ? "/publicar/viajes/privado" : "/publicar/viajes/negocios";
    const qs = new URLSearchParams();
    qs.set("stagedId", r.id);
    if (lang === "en") qs.set("lang", "en");
    return appendLangToPath(`${base}?${qs.toString()}`, lang);
  };

  const previewHref = (r: ViajesStagedListingRow) => {
    const base = r.lane === "private" ? "/clasificados/viajes/preview/privado" : "/clasificados/viajes/preview/negocios";
    const qs = new URLSearchParams();
    qs.set("stagedId", r.id);
    if (lang === "en") qs.set("lang", "en");
    return appendLangToPath(`${base}?${qs.toString()}`, lang);
  };

  const modLine = (r: ViajesStagedListingRow) => {
    const parts = [r.moderation_reason, r.review_notes].filter(Boolean) as string[];
    if (!parts.length) return t.moderationEmpty;
    const s = parts.join(" · ");
    return s.length > 220 ? `${s.slice(0, 217)}…` : s;
  };

  const canResubmit = (s: ViajesStagedLifecycleStatus) =>
    s === "changes_requested" || s === "rejected" || s === "draft" || s === "unpublished";
  const canUnpublish = (r: ViajesStagedListingRow) => r.lifecycle_status === "approved" && r.is_public;

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
            <table className="min-w-[920px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8DFD0] text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
                  <th className="py-2 pr-4">{t.thTitle}</th>
                  <th className="py-2 pr-4">{t.thLane}</th>
                  <th className="py-2 pr-4">{t.thStatus}</th>
                  <th className="py-2 pr-4">{t.thModeration}</th>
                  <th className="py-2 pr-4">{t.thSubmitted}</th>
                  <th className="py-2">{t.thActions}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#F0E8DC]/90">
                    <td className="py-3 pr-4 font-semibold text-[#1E1810]">{r.title}</td>
                    <td className="py-3 pr-4 capitalize text-[#5C5346]">{r.lane}</td>
                    <td className="py-3 pr-4 text-[#5C5346]">
                      {lifecycleStatusLabel(r.lifecycle_status, lang)}
                      {r.is_public ? (lang === "es" ? " · visible público" : " · public") : ""}
                    </td>
                    <td className="max-w-[240px] py-3 pr-4 text-xs text-[#5C5346]">{modLine(r)}</td>
                    <td className="py-3 pr-4 text-xs tabular-nums text-[#5C5346]">{r.submitted_at ?? "—"}</td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                        {r.lifecycle_status === "approved" && r.is_public ? (
                          <Link
                            href={appendLangToPath(`/clasificados/viajes/oferta/${r.slug}`, lang)}
                            className="text-xs font-bold text-[#6B5B2E] underline"
                          >
                            {t.viewPublic}
                          </Link>
                        ) : null}
                        <Link href={previewHref(r)} className="text-xs font-semibold text-[#5C5346] underline">
                          {t.preview}
                        </Link>
                        <Link href={editHref(r)} className="text-xs text-[#5C5346] underline">
                          {t.edit}
                        </Link>
                        {canResubmit(r.lifecycle_status) ? (
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            className="text-left text-xs font-semibold text-[#6B5B2E] underline disabled:opacity-40"
                            onClick={() => void ownerAction(r.id, "resubmit")}
                          >
                            {busyId === r.id ? t.busy : t.resubmit}
                          </button>
                        ) : null}
                        {canUnpublish(r) ? (
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            className="text-left text-xs font-semibold text-rose-900 underline disabled:opacity-40"
                            onClick={() => void ownerAction(r.id, "unpublish")}
                          >
                            {busyId === r.id ? t.busy : t.unpublish}
                          </button>
                        ) : null}
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
