"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { OwnerProductPageFrame } from "../components/OwnerProductPageFrame";
import { OwnerEntityWorkspace } from "../components/OwnerEntityWorkspace";
import type { ActionItem } from "../components/DashboardListingActionBar";
import { fetchDashboardProfile } from "../lib/dashboardProfile";
import { dashboardSafeMutationErrorCopy } from "../lib/dashboardSafeErrorCopy";
import { getOwnerEntityCapabilities, isLiveCapability } from "../lib/ownerEntityCapabilityRegistry";
import { listingUiStatusChipClass, type ListingUiStatus } from "../lib/listingDisplayStatus";
import { editListingLabel, publicViewLabel, previewLabel, publicResultsLabel } from "../lib/dashboardMisAnunciosCategoryTools";

import type { ViajesStagedListingRow, ViajesStagedLifecycleStatus, ViajesStagedLane } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";
import { isViajesPrivatePublishDisabled } from "@/app/(site)/clasificados/viajes/lib/viajesPrivateLaneLaunchPolicy";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";
type Plan = "free" | "pro";

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

/** Chip tone only — never used as the owner-facing Viajes label. */
function viajesChipUiStatus(status: ViajesStagedLifecycleStatus): ListingUiStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "submitted":
    case "in_review":
    case "changes_requested":
      return "pending";
    case "approved":
      return "active";
    case "rejected":
      return "paused";
    case "expired":
      return "expired";
    case "unpublished":
      return "archived";
    default:
      return "unknown";
  }
}

function viajesLaneBadge(lane: ViajesStagedLane, lang: Lang): string {
  if (lane === "private") return lang === "es" ? "Particular" : "Private";
  return lang === "es" ? "Negocios" : "Business";
}

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  void raw;
  return "free";
}

function formatStamp(iso: string | null | undefined, lang: Lang): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return iso;
  return new Date(iso).toLocaleString(lang === "es" ? "es-US" : "en-US");
}

function DashboardViajesStagedPageContent() {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/viajes";
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const capabilities = getOwnerEntityCapabilities("viajes");
  const t = useMemo(
    () =>
      lang === "es"
        ? {
            eyebrow: "Viajes",
            title: "Viajes — tus envíos",
            subtitle:
              "Solicitudes guardadas en Leonix. Revisión interna antes de aparecer en resultados públicos. Leonix no vende el viaje ni procesa pagos aquí.",
            loading: "Cargando…",
            signIn: "Inicia sesión para ver tus envíos.",
            empty: "Aún no hay envíos vinculados a tu cuenta.",
            publish: "Publicar viaje",
            submitted: "Enviado",
            updated: "Actualizado",
            visibility: "Visibilidad",
            visibilityPublic: "Visible al público",
            visibilityHidden: "No público",
            moderation: "Notas de revisión",
            resubmit: "Reenviar a revisión",
            unpublish: "Ocultar del público",
            moderationEmpty: "—",
            busy: "…",
            changesNeeded: "Leonix pidió cambios. Edita y reenvía a revisión.",
            rejectedNeeded: "Este envío fue rechazado. Edita y reenvía a revisión.",
            waitingReview: "Leonix está revisando este envío. Todavía no es público.",
            privateEditDisabled: "Edición particular desactivada en este entorno — contacta a Leonix.",
            privatePreviewDisabled: "Vista previa particular no disponible mientras la vía esté desactivada.",
            moreOptions: "Más opciones",
            moreOptionsClose: "Cerrar",
          }
        : {
            eyebrow: "Viajes",
            title: "Viajes — your submissions",
            subtitle:
              "Requests stored in Leonix. Internal review before they appear in public results. Leonix does not sell the trip or process payment here.",
            loading: "Loading…",
            signIn: "Sign in to see your submissions.",
            empty: "No Viajes submissions are linked to your account yet.",
            publish: "Publish a trip",
            submitted: "Submitted",
            updated: "Updated",
            visibility: "Visibility",
            visibilityPublic: "Public",
            visibilityHidden: "Not public",
            moderation: "Review notes",
            resubmit: "Send back to review",
            unpublish: "Remove from public",
            moderationEmpty: "—",
            busy: "…",
            changesNeeded: "Leonix requested changes. Edit and send back to review.",
            rejectedNeeded: "This submission was rejected. Edit and send it back to review.",
            waitingReview: "Leonix is reviewing this submission. It is not public yet.",
            privateEditDisabled: "Private editing is disabled in this environment — contact Leonix.",
            privatePreviewDisabled: "Private preview is unavailable while this lane is disabled.",
            moreOptions: "More options",
            moreOptionsClose: "Close",
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

  const loadRows = useCallback(async (sb: ReturnType<typeof createSupabaseBrowserClient>, uid: string) => {
    const { data, error } = await sb
      .from("viajes_staged_listings")
      .select(
        "id, slug, title, lane, lifecycle_status, is_public, submitted_at, updated_at, review_notes, moderation_reason, listing_json, lang"
      )
      .eq("owner_user_id", uid)
      .order("submitted_at", { ascending: false });
    if (error) {
      console.error("[dashboard/viajes]", error.message);
      setErr(dashboardSafeMutationErrorCopy(lang));
      setRows([]);
    } else {
      setErr(null);
      setRows((data ?? []) as ViajesStagedListingRow[]);
    }
  }, [lang]);

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
    if (r.lane === "private" && privateLaneDisabled) {
      return appendLangToPath("/publicar/viajes?private_lane=disabled_dashboard", lang);
    }
    const base = r.lane === "private" ? "/publicar/viajes/privado" : "/publicar/viajes/negocios";
    const qs = new URLSearchParams();
    qs.set("stagedId", r.id);
    if (lang === "en") qs.set("lang", "en");
    return appendLangToPath(`${base}?${qs.toString()}`, lang);
  };

  const previewHref = (r: ViajesStagedListingRow) => {
    if (r.lane === "private" && privateLaneDisabled) {
      return appendLangToPath("/publicar/viajes?private_lane=disabled_dashboard", lang);
    }
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
      activeNav="listings"
      plan={plan}
      userName={name}
      email={email}
      accountRef={userId ? accountRefFromId(userId) : null}
      ownerId={userId}
      contentLayout="workbench"
    >
      <OwnerProductPageFrame
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
        primaryAction={{ href: appendLangToPath("/publicar/viajes", lang), label: t.publish }}
        secondaryAction={
          isLiveCapability(capabilities.identity.results)
            ? { href: appendLangToPath("/clasificados/viajes/resultados", lang), label: publicResultsLabel(lang) }
            : null
        }
        loading={loading}
        loadingLabel={t.loading}
        error={!loading && rows.length === 0 ? err : null}
        empty={!loading && !err && rows.length === 0}
        emptyLabel={!userId ? t.signIn : t.empty}
      >
        {err && rows.length > 0 ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{err}</p>
        ) : null}
        {rows.map((r) => {
          const busy = busyId === r.id;
          const privateBlocked = r.lane === "private" && privateLaneDisabled;
          const notes = modLine(r);
          const submitted = formatStamp(r.submitted_at, lang);
          const updated = formatStamp(r.updated_at, lang);
          const detailItems = [
            submitted ? { label: t.submitted, value: submitted } : null,
            updated ? { label: t.updated, value: updated } : null,
            { label: t.visibility, value: r.is_public ? t.visibilityPublic : t.visibilityHidden },
            notes !== t.moderationEmpty ? { label: t.moderation, value: notes } : null,
          ].filter((x): x is { label: string; value: string } => x !== null);

          const primaryAction: ActionItem =
            isLiveCapability(capabilities.identity.edit) && !privateBlocked
              ? { href: editHref(r), label: editListingLabel(lang) }
              : { label: editListingLabel(lang), disabled: true };

          const quickActions: ActionItem[] = [];
          if (isLiveCapability(capabilities.identity.publicView) && r.lifecycle_status === "approved" && r.is_public) {
            quickActions.push({
              href: appendLangToPath(`/clasificados/viajes/oferta/${r.slug}`, lang),
              label: publicViewLabel(lang),
              tone: "secondary",
            });
          }
          if (isLiveCapability(capabilities.identity.preview)) {
            if (privateBlocked) {
              quickActions.push({ label: previewLabel(lang), disabled: true });
            } else {
              quickActions.push({ href: previewHref(r), label: previewLabel(lang), tone: "subtle" });
            }
          }
          if (isLiveCapability(capabilities.identity.results)) {
            quickActions.push({
              href: appendLangToPath("/clasificados/viajes/resultados", lang),
              label: publicResultsLabel(lang),
              tone: "subtle",
            });
          }

          const lifecycleActions: ActionItem[] = [];
          if (canResubmit(r.lifecycle_status)) {
            lifecycleActions.push({
              label: busy ? t.busy : t.resubmit,
              onClick: () => void ownerAction(r.id, "resubmit"),
              disabled: busy,
              tone: "positive",
            });
          }
          if (canUnpublish(r)) {
            lifecycleActions.push({
              label: busy ? t.busy : t.unpublish,
              onClick: () => void ownerAction(r.id, "unpublish"),
              disabled: busy,
              tone: "danger",
            });
          }

          return (
            <OwnerEntityWorkspace
              key={r.id}
              lang={lang}
              header={{
                eyebrow: t.eyebrow,
                title: r.title,
                statusLabel: lifecycleStatusLabel(r.lifecycle_status, lang),
                statusChipClass: listingUiStatusChipClass(viajesChipUiStatus(r.lifecycle_status)),
                badges: [viajesLaneBadge(r.lane, lang)],
              }}
              detailItems={detailItems}
              primaryAction={primaryAction}
              quickActions={quickActions}
              lifecycleActions={lifecycleActions}
              note={
                r.lifecycle_status === "changes_requested"
                  ? { text: notes !== t.moderationEmpty ? `${t.changesNeeded} ${notes}` : t.changesNeeded, tone: "warning" }
                  : r.lifecycle_status === "rejected"
                    ? { text: notes !== t.moderationEmpty ? `${t.rejectedNeeded} ${notes}` : t.rejectedNeeded, tone: "warning" }
                    : r.lifecycle_status === "submitted" || r.lifecycle_status === "in_review"
                      ? { text: t.waitingReview, tone: "neutral" }
                      : null
              }
              footerHint={privateBlocked ? t.privateEditDisabled : null}
              mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
            />
          );
        })}
      </OwnerProductPageFrame>
    </LeonixDashboardShell>
  );
}

export default function DashboardViajesStagedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <DashboardViajesStagedPageContent />
    </Suspense>
  );
}
