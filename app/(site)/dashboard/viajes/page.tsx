"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { fetchDashboardProfile } from "../lib/dashboardProfile";

import type { ViajesStagedListingRow, ViajesStagedLifecycleStatus, ViajesStagedLane } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";
import { isViajesPrivatePublishDisabled } from "@/app/(site)/clasificados/viajes/lib/viajesPrivateLaneLaunchPolicy";
import { resolveViajesOwnerDashboardHero } from "@/app/(site)/clasificados/viajes/lib/viajesOwnerDashboardHero";
import {
  viajesOwnerEditHref,
  viajesOwnerPreviewHref,
  viajesOwnerPublicHref,
} from "@/app/(site)/clasificados/viajes/lib/viajesOwnerDashboardLinks";

type Lang = "es" | "en";

const OWNER_DASHBOARD_SELECT =
  "id, slug, title, lane, lifecycle_status, is_public, submitted_at, updated_at, published_at, review_notes, moderation_reason, listing_json, hero_image_url, leonix_ad_id, lang";

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
  void raw;
  return "free";
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function DashboardViajesStagedPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/viajes";
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const stagedIdRedirect = (searchParams?.get("stagedId") ?? "").trim();

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
            thSubmitted: "Fechas",
            thActions: "Acciones",
            viewPublic: "Ficha pública",
            preview: "Vista previa interna",
            edit: "Editar y reenviar",
            resubmit: "Reenviar a revisión",
            unpublish: "Ocultar del público",
            results: "Resultados Viajes",
            moderationEmpty: "—",
            busy: "…",
            privateEditDisabled: "Edición particular desactivada en este entorno — contacta a Leonix.",
            privatePreviewDisabled: "Vista previa particular no disponible mientras la vía esté desactivada.",
            redirecting: "Abriendo editor…",
            forbiddenRedirect: "No se encontró ese listado en tu cuenta.",
            noImage: "Sin imagen",
            adId: "Leonix Ad ID",
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
            thSubmitted: "Dates",
            thActions: "Actions",
            viewPublic: "Public offer",
            preview: "Internal preview",
            edit: "Edit & resubmit",
            resubmit: "Send back to review",
            unpublish: "Remove from public",
            results: "Viajes results",
            moderationEmpty: "—",
            busy: "…",
            privateEditDisabled: "Private editing is disabled in this environment — contact Leonix.",
            privatePreviewDisabled: "Private preview is unavailable while this lane is disabled.",
            redirecting: "Opening editor…",
            forbiddenRedirect: "That listing was not found on your account.",
            noImage: "No image",
            adId: "Leonix Ad ID",
          },
    [lang]
  );

  const privateLaneDisabled = isViajesPrivatePublishDisabled();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<ViajesStagedListingRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [redirectBusy, setRedirectBusy] = useState(Boolean(stagedIdRedirect));

  const loadRows = useCallback(async (sb: ReturnType<typeof createSupabaseBrowserClient>, uid: string) => {
    const { data, error } = await sb
      .from("viajes_staged_listings")
      .select(OWNER_DASHBOARD_SELECT)
      .eq("owner_user_id", uid)
      .order("submitted_at", { ascending: false });
    if (error) {
      setErr(error.message);
      setRows([]);
      return [] as ViajesStagedListingRow[];
    }
    setErr(null);
    const list = (data ?? []) as ViajesStagedListingRow[];
    setRows(list);
    return list;
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
          setRedirectBusy(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname + (stagedIdRedirect ? `?stagedId=${stagedIdRedirect}` : ""))}`);
          return;
        }
        setUserId(user.id);
        const sess = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
        setToken(sess.data.session?.access_token ?? null);
        const { row: prof } = await fetchDashboardProfile(sb, user.id);
        if (prof?.display_name) setName(prof.display_name);
        if (prof?.email) setEmail(prof.email);
        if (prof?.membership_tier != null) setPlan(normalizePlanFromMembershipTier(prof.membership_tier));

        if (stagedIdRedirect) {
          const { data: owned, error: ownErr } = await sb
            .from("viajes_staged_listings")
            .select("id, lane, owner_user_id")
            .eq("id", stagedIdRedirect)
            .eq("owner_user_id", user.id)
            .maybeSingle();
          if (!mounted) return;
          if (!ownErr && owned?.id) {
            const href = viajesOwnerEditHref({
              id: owned.id,
              lane: owned.lane as ViajesStagedLane,
              lang,
            });
            router.replace(href);
            return;
          }
          setErr(t.forbiddenRedirect);
          setRedirectBusy(false);
        }

        await loadRows(sb, user.id);
      } catch (e) {
        if (!mounted) return;
        setErr(e instanceof Error ? e.message : "error");
        setRows([]);
        setRedirectBusy(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [loadRows, lang, pathname, router, stagedIdRedirect, t.forbiddenRedirect]);

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

  const editHref = (r: ViajesStagedListingRow) => viajesOwnerEditHref({ id: r.id, lane: r.lane, lang });
  const previewHref = (r: ViajesStagedListingRow) => viajesOwnerPreviewHref({ id: r.id, lane: r.lane, lang });
  const publicHref = (r: ViajesStagedListingRow) =>
    viajesOwnerPublicHref({
      slug: r.slug,
      lifecycle_status: r.lifecycle_status,
      is_public: r.is_public,
      lang,
    });

  const modLine = (r: ViajesStagedListingRow) => {
    const parts = [r.moderation_reason, r.review_notes].filter(Boolean) as string[];
    if (!parts.length) return t.moderationEmpty;
    const s = parts.join(" · ");
    return s.length > 220 ? `${s.slice(0, 217)}…` : s;
  };

  const canResubmit = (s: ViajesStagedLifecycleStatus) =>
    s === "changes_requested" || s === "rejected" || s === "draft" || s === "unpublished";
  const canUnpublish = (r: ViajesStagedListingRow) => r.lifecycle_status === "approved" && r.is_public;

  const CardMedia = ({ r }: { r: ViajesStagedListingRow }) => {
    const hero = resolveViajesOwnerDashboardHero(r);
    if (!hero.src) {
      return (
        <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl bg-[#FAF7F2] text-[10px] font-semibold text-[#7A7164]">
          {t.noImage}
        </div>
      );
    }
    return (
      <img src={hero.src} alt={hero.alt} className="h-20 w-28 shrink-0 rounded-xl object-cover bg-[#FAF7F2]" />
    );
  };

  if (redirectBusy && stagedIdRedirect) {
    return (
      <LeonixDashboardShell
        lang={lang}
        activeNav="listings"
        plan={plan}
        userName={name}
        email={email}
        accountRef={userId ? accountRefFromId(userId) : null}
      >
        <p className="p-8 text-sm text-[#7A7164]">{t.redirecting}</p>
      </LeonixDashboardShell>
    );
  }

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="listings"
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
          <>
            <ul className="mt-8 space-y-3 md:hidden">
              {rows.map((r) => {
                const pub = publicHref(r);
                const ad = r.leonix_ad_id?.trim();
                return (
                  <li key={r.id} className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-4">
                    <div className="flex gap-3">
                      <CardMedia r={r} />
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-[#1E1810]">{r.title}</p>
                        <p className="mt-1 text-xs text-[#5C5346]">
                          {t.thLane}: {r.lane} · {t.thStatus}: {lifecycleStatusLabel(r.lifecycle_status, lang)}
                          {r.is_public ? (lang === "es" ? " · visible público" : " · public") : ""}
                        </p>
                        {ad ? (
                          <p className="mt-1 font-mono text-[10px] text-[#3D3428]">
                            {t.adId}: {ad}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-[#7A7164]">
                          {lang === "es" ? "Enviado" : "Submitted"}: {formatWhen(r.submitted_at)} ·{" "}
                          {lang === "es" ? "Actualizado" : "Updated"}: {formatWhen(r.updated_at)}
                          {r.published_at
                            ? ` · ${lang === "es" ? "Publicado" : "Published"}: ${formatWhen(r.published_at)}`
                            : ""}
                        </p>
                        <p className="mt-1 text-xs text-[#7A7164]">
                          {t.thModeration}: {modLine(r)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pub ? (
                        <Link
                          href={pub}
                          className="rounded-xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold text-[#5C4E2E]"
                        >
                          {t.viewPublic}
                        </Link>
                      ) : null}
                      {r.lane === "private" && privateLaneDisabled ? (
                        <span
                          className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#7A7164]"
                          title={t.privatePreviewDisabled}
                        >
                          {t.preview}
                        </span>
                      ) : (
                        <Link
                          href={previewHref(r)}
                          className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold text-[#2C2416]"
                        >
                          {t.preview}
                        </Link>
                      )}
                      {r.lane === "private" && privateLaneDisabled ? (
                        <span
                          className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#7A7164]"
                          title={t.privateEditDisabled}
                        >
                          {t.edit}
                        </span>
                      ) : (
                        <Link
                          href={editHref(r)}
                          className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold text-[#2C2416]"
                        >
                          {t.edit}
                        </Link>
                      )}
                      {canResubmit(r.lifecycle_status) ? (
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold text-[#2C2416] disabled:opacity-50"
                          onClick={() => void ownerAction(r.id, "resubmit")}
                        >
                          {busyId === r.id ? t.busy : t.resubmit}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8 hidden overflow-x-auto md:block">
              <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E8DFD0] text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
                    <th className="py-2 pr-4"> </th>
                    <th className="py-2 pr-4">{t.thTitle}</th>
                    <th className="py-2 pr-4">{t.thLane}</th>
                    <th className="py-2 pr-4">{t.thStatus}</th>
                    <th className="py-2 pr-4">{t.thModeration}</th>
                    <th className="py-2 pr-4">{t.thSubmitted}</th>
                    <th className="py-2">{t.thActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const pub = publicHref(r);
                    const ad = r.leonix_ad_id?.trim();
                    return (
                      <tr key={r.id} className="border-b border-[#F0E8DC]/90">
                        <td className="py-3 pr-3">
                          <CardMedia r={r} />
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-[#1E1810]">{r.title}</p>
                          {ad ? (
                            <p className="mt-0.5 font-mono text-[10px] text-[#3D3428]">
                              {t.adId}: {ad}
                            </p>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4 capitalize text-[#5C5346]">{r.lane}</td>
                        <td className="py-3 pr-4 text-[#5C5346]">
                          {lifecycleStatusLabel(r.lifecycle_status, lang)}
                          {r.is_public ? (lang === "es" ? " · visible público" : " · public") : ""}
                        </td>
                        <td className="max-w-[240px] py-3 pr-4 text-xs text-[#5C5346]">{modLine(r)}</td>
                        <td className="py-3 pr-4 text-xs tabular-nums text-[#5C5346]">
                          <div>sub {formatWhen(r.submitted_at)}</div>
                          <div>upd {formatWhen(r.updated_at)}</div>
                          {r.published_at ? <div>pub {formatWhen(r.published_at)}</div> : null}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                            {pub ? (
                              <Link href={pub} className="text-xs font-bold text-[#6B5B2E] underline">
                                {t.viewPublic}
                              </Link>
                            ) : null}
                            {r.lane === "private" && privateLaneDisabled ? (
                              <span className="text-xs text-[#7A7164]" title={t.privatePreviewDisabled}>
                                {t.preview}
                              </span>
                            ) : (
                              <Link href={previewHref(r)} className="text-xs font-semibold text-[#5C5346] underline">
                                {t.preview}
                              </Link>
                            )}
                            {r.lane === "private" && privateLaneDisabled ? (
                              <span className="text-xs text-[#7A7164]" title={t.privateEditDisabled}>
                                {t.edit}
                              </span>
                            ) : (
                              <Link href={editHref(r)} className="text-xs text-[#5C5346] underline">
                                {t.edit}
                              </Link>
                            )}
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
                            <Link
                              href={appendLangToPath("/clasificados/viajes/resultados", lang)}
                              className="text-xs text-[#7A7164] underline"
                            >
                              {t.results}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </LeonixDashboardShell>
  );
}
