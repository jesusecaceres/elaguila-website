"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAdminLang } from "@/app/admin/_components/AdminI18nProvider";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import {
  adminQueueRowAnchorId,
  adminQueueRowHighlightClass,
  parseAdminActionResultParams,
} from "@/app/admin/_lib/adminQueueActionFlow";
import type { AdminListingCommercialTruthMap } from "@/app/admin/_lib/adminListingCommercialTruth";
import type { PublicationTruth } from "@/app/admin/_lib/publicationSemantics";
import { appendLangToPath, type Lang } from "@/app/clasificados/lib/hubUrl";
import { AdminListingMonetizationSummary } from "../_components/AdminListingMonetizationSummary";
import { ClasificadosQueueActionChrome } from "../_components/ClasificadosQueueActionChrome";
import { ClassifiedAdminRowActions } from "../_components/ClassifiedAdminRowActions";
import {
  AdminCommercialTruthSection,
  AdminListingCardSections,
  AdminListingTruthSection,
} from "../_components/normalized/AdminListingCardSections";

type ApplicationHealth = {
  total: number;
  submitted: number;
  viewed: number;
  shortlisted: number;
  rejected: number;
  hired: number;
};

type Row = {
  id: string;
  slug: string;
  leonix_ad_id?: string | null;
  title: string;
  company_name: string;
  lifecycle_status: string;
  lane: string;
  published_at?: string | null;
  republish_override?: boolean | null;
  location_line?: string | null;
  owner_user_id: string | null;
  moderation_reason: string | null;
  leonix_verified?: boolean;
  admin_promoted?: boolean;
  apply_count: number;
  view_count: number;
  application_health: ApplicationHealth;
  /** publicationSemantics truth for empleos_public_listings (computed server-side). */
  publication?: PublicationTruth | null;
  /** Why Restore / Republish would be refused (paid-lane row that was never live and has no verified payment). */
  restore_blocked_reason?: string | null;
};

const LANE_LABEL: Record<string, string> = {
  quick: "Local job ad",
  feria: "Job fair",
  premium: "Preserved premium",
};

/** Query params the list API understands — the server page's filter bar writes exactly these. */
const API_PARAMS = ["q", "status", "owner", "leonix_ad_id", "lane", "limit"] as const;

/**
 * Empleos admin list (client). The header, operating summary and filter bar live in the server page
 * (`page.tsx`); this component only loads the rows for the URL's filters and renders one card per
 * listing in the shared normalized section order. There is exactly ONE lifecycle action system per
 * row: `ClassifiedAdminRowActions variant="empleos"` -> PATCH /api/admin/empleos/listings/[id].
 */
export function EmpleosAdminListClient() {
  const sp = useSearchParams();
  const adminLang = useAdminLang();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const actionProof = useMemo(() => (sp ? parseAdminActionResultParams(sp) : null), [sp]);
  const scopeLive = sp?.get("scope") === "live";

  const [rows, setRows] = useState<Row[]>([]);
  const [commercial, setCommercial] = useState<AdminListingCommercialTruthMap>({});
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const apiQuery = useMemo(() => {
    const u = new URLSearchParams();
    for (const k of API_PARAMS) {
      const v = sp?.get(k)?.trim();
      if (v) u.set(k, v);
    }
    if (scopeLive) u.set("scope", "live");
    return u.toString();
  }, [sp, scopeLive]);

  useEffect(() => {
    const ac = new AbortController();
    setErr(null);
    setLoaded(false);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/empleos/listings${apiQuery ? `?${apiQuery}` : ""}`, {
          credentials: "same-origin",
          signal: ac.signal,
          cache: "no-store",
        });
        const json = (await res.json()) as { ok?: boolean; rows?: Row[]; commercial?: AdminListingCommercialTruthMap; error?: string };
        if (ac.signal.aborted) return;
        if (!res.ok || !json.ok) {
          setErr(json.error ?? "load_failed");
          setRows([]);
          setCommercial({});
        } else {
          setRows(json.rows ?? []);
          setCommercial(json.commercial ?? {});
        }
        setLoaded(true);
      } catch (e) {
        if (ac.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) return;
        setErr("network");
        setRows([]);
        setLoaded(true);
      }
    })();
    return () => ac.abort();
  }, [apiQuery]);

  const displayRows = useMemo(() => (scopeLive ? rows.filter((r) => r.lifecycle_status === "published") : rows), [rows, scopeLive]);
  const hasFilter = ["q", "status", "owner", "leonix_ad_id", "lane"].some((k) => Boolean(sp?.get(k)?.trim()));

  return (
    <div className="space-y-4" data-testid="empleos-admin-list">
      {err ? (
        <div className={`${adminCardBase} p-4 text-sm text-red-900`} role="alert">
          {err === "supabase_not_configured" ? "Supabase not configured in this environment." : err}
        </div>
      ) : null}

      {!err && loaded && displayRows.length === 0 ? (
        <div className={`${adminCardBase} border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950`} role="status">
          <p className="font-semibold text-[#1E1810]">
            {scopeLive ? "No live (published) listings with current filters." : "No listings found with the current filters."}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">
            {scopeLive && rows.length > 0 ? (
              <>
                {rows.length} row(s) loaded; none are in <code className="rounded bg-white/80 px-1">published</code> status. Switch to
                the full queue.
              </>
            ) : (
              <>
                {hasFilter ? "Nothing matches the search / filters — clear them to see the whole category." : "The category table returned no rows."} If you
                expected listings, confirm migrations and data in Supabase.
              </>
            )}
          </p>
        </div>
      ) : null}

      {!err && displayRows.length > 0 ? (
        <>
          <ClasificadosQueueActionChrome />
          <div className="grid gap-4 lg:grid-cols-2">
            {displayRows.map((r) => {
              const highlighted = actionProof?.target === r.id;
              const health = r.application_health;
              const live = r.lifecycle_status === "published";
              const extraActions = [
                ...(r.lifecycle_status !== "pending_review" && r.lifecycle_status !== "archived" && r.lifecycle_status !== "draft"
                  ? [
                      {
                        action: "send_to_review",
                        label: "Send to review",
                        confirmMessage: "Send this listing back to review? It will stop showing publicly until staff approve it again.",
                        askReason: true,
                      },
                    ]
                  : []),
                ...(r.lifecycle_status !== "rejected" && r.lifecycle_status !== "archived"
                  ? [
                      {
                        action: "reject",
                        label: "Reject",
                        confirmMessage: "Reject this listing? It will stop showing publicly and the owner cannot resume it.",
                        askReason: true,
                        variant: "warning" as const,
                      },
                    ]
                  : []),
              ];
              return (
                <article
                  key={r.id}
                  id={adminQueueRowAnchorId(r.id)}
                  className={`${adminCardBase} min-w-0 p-4 ${adminQueueRowHighlightClass(highlighted)}`}
                  data-testid="empleos-admin-card"
                >
                  <AdminListingCardSections
                    lang={adminLang}
                    header={
                      <div className="min-w-0 space-y-0.5">
                        <div className="truncate text-sm font-semibold text-[#1E1810]">{r.title}</div>
                        <div className="text-xs text-[#7A7164]">{r.company_name}</div>
                        {r.location_line ? <div className="text-xs text-[#5C5346]">{r.location_line}</div> : null}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#7A7164]">
                          <code className="text-[#9A9084]">{r.slug}</code>
                          <span className="font-mono text-[#3D3428]" title="Leonix Ad ID">
                            {r.leonix_ad_id ?? "—"}
                          </span>
                          <span className="font-semibold text-[#3D3428]" title={r.lane}>
                            {LANE_LABEL[r.lane] ?? r.lane}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#6B645C]">
                          Owner:{" "}
                          {r.owner_user_id ? (
                            <>
                              <code className="break-all">{r.owner_user_id}</code>{" "}
                              <Link href={`/admin/usuarios/${encodeURIComponent(r.owner_user_id)}`} className="font-semibold text-[#6B5B2E] underline">
                                Admin profile
                              </Link>
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>
                    }
                    listingTruth={<AdminListingTruthSection lang={adminLang} status={r.lifecycle_status} truth={r.publication ?? null} compact />}
                    commercialTruth={<AdminCommercialTruthSection lang={adminLang} truth={commercial[r.id]} compact />}
                    performance={
                      <div className="space-y-0.5 text-[11px] leading-snug text-[#4A4744]" data-testid="empleos-admin-applications">
                        <div>
                          Applications: <span className="font-semibold">{health?.total ?? 0}</span>
                          <span className="text-[#7A7164]"> (counter column: {r.apply_count ?? 0})</span>
                        </div>
                        <div className="text-[#7A7164]">
                          New {health?.submitted ?? 0} · Viewed {health?.viewed ?? 0} · Short {health?.shortlisted ?? 0} · Rej {health?.rejected ?? 0}
                          {typeof health?.hired === "number" && health.hired > 0 ? <> · Hired {health.hired}</> : null}
                        </div>
                        <div>Views: {r.view_count ?? 0}</div>
                      </div>
                    }
                    moderation={
                      r.moderation_reason ? (
                        <p className="text-[11px] leading-snug text-amber-900" data-testid="empleos-admin-moderation">
                          Moderation: {r.moderation_reason}
                        </p>
                      ) : undefined
                    }
                    actions={
                      <div className="space-y-2">
                        <ClassifiedAdminRowActions
                          variant="empleos"
                          rowId={r.id}
                          leonixAdId={r.leonix_ad_id}
                          displayLabel={r.title}
                          publicLive={live}
                          promoted={Boolean(r.admin_promoted)}
                          verified={Boolean(r.leonix_verified)}
                          canArchive={r.lifecycle_status !== "archived"}
                          staffEditBoardHref={`/admin/workspace/clasificados/empleos?q=${encodeURIComponent(r.leonix_ad_id ?? r.id)}`}
                          republishCategory="empleos"
                          republishRow={{
                            lifecycle_status: r.lifecycle_status,
                            republish_override: r.republish_override,
                          }}
                          extraActions={extraActions}
                          restoreDisabledReason={r.restore_blocked_reason}
                          layout="card"
                          collapseSections
                        />
                        {r.restore_blocked_reason && !live ? (
                          <p className="text-[10px] leading-snug text-[#7A7164]" data-testid="empleos-admin-payment-required">
                            {r.restore_blocked_reason}
                          </p>
                        ) : null}
                      </div>
                    }
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#E8DFD0]/70 pt-2 text-xs font-semibold">
                    <Link href={appendLangToPath(`/clasificados/empleos/${r.slug}`, lang)} className="text-[#6B5B2E] underline" title="Public job view">
                      View public
                    </Link>
                    <Link
                      href={`/dashboard/empleos/${r.id}?lang=${lang}`}
                      className="text-[#6B5B2E] underline"
                      title="Advertiser panel: API validates owner; staff session does not edit on their behalf"
                    >
                      Advertiser panel (their session)
                    </Link>
                  </div>
                  <details className="mt-2 text-[11px] text-[#7A7164]">
                    <summary className="cursor-pointer select-none font-semibold">Plan configuration (not payment truth)</summary>
                    <div className="mt-1">
                      <AdminListingMonetizationSummary
                        category="empleos"
                        source="empleos_public_listings"
                        listing={r as unknown as Record<string, unknown>}
                        hints={{ analyticsCapability: "partial" }}
                      />
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
