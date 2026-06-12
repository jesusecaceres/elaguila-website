"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  buildAdminActionReturnUrl,
  stripAdminQueueActionParams,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { republishActionLabel } from "@/app/admin/_lib/classifiedsRepublishCapability";
import { AdminDashboardCtaButton, AdminDashboardCtaGrid } from "@/app/admin/_components/AdminDashboardCta";
import { adminQueueActionCompact, adminQueueActionGroupLabel } from "@/app/admin/_components/adminTheme";

export type ClassifiedStaffOpsVariant =
  | "restaurante"
  | "listings"
  | "servicios"
  | "empleos"
  | "autos"
  | "viajes";

type Props = {
  variant: ClassifiedStaffOpsVariant;
  rowId: string;
  /** True when the listing is publicly live (published / active / approved+public, etc.). */
  publicLive: boolean;
  promoted: boolean;
  verified: boolean;
  /** When false, hide archive (e.g. row already archived). */
  canArchive?: boolean;
  /** Staff / owner edit surface for this row (dashboard, perfil, etc.). */
  staffEditBoardHref?: string;
  /** When set with `republishRow`, shows Move to top / Republish / No republish (listings + verticals). */
  republishCategory?: string;
  republishRow?: Record<string, unknown>;
  leonixAdId?: string | null;
  displayLabel?: string | null;
  /** Desktop table uses compact single-column groups; mobile cards use 2-col grid. */
  layout?: "compact" | "card";
};

function patchUrl(variant: ClassifiedStaffOpsVariant, rowId: string): string {
  const id = encodeURIComponent(rowId);
  switch (variant) {
    case "restaurante":
      return `/api/admin/restaurantes/listings/${id}`;
    case "listings":
      return `/api/admin/clasificados/listings/${id}`;
    case "servicios":
      return `/api/admin/servicios/listings/${id}`;
    case "empleos":
      return `/api/admin/empleos/listings/${id}`;
    case "autos":
      return `/api/admin/autos/listings/${id}`;
    case "viajes":
      return `/api/admin/viajes/listings/${id}`;
    default:
      return `/api/admin/clasificados/listings/${id}`;
  }
}

function safeErrorMessage(j: { error?: string }, status: number): string {
  const raw = (j.error ?? `HTTP ${status}`).trim();
  return raw.slice(0, 200);
}

export function ClassifiedAdminRowActions({
  variant,
  rowId,
  publicLive,
  promoted,
  verified,
  canArchive = true,
  republishCategory,
  republishRow,
  leonixAdId,
  displayLabel,
  layout = "compact",
}: Props) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);

  const returnTo = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    stripAdminQueueActionParams(sp);
    const q = sp.toString();
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams]);

  const run = useCallback(
    async (action: string, proofAction?: string) => {
      const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
      setBusy(true);
      try {
        const res = await fetch(patchUrl(variant, rowId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ action }),
        });
        const j = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !j.ok) {
          const url = buildAdminActionReturnUrl({
            returnTo,
            action_status: "error",
            action,
            proof_action: proofAction,
            target: rowId,
            target_label: displayLabel,
            target_ad_id: leonixAdId,
            scroll_y: scrollY,
            action_error: safeErrorMessage(j, res.status),
          });
          window.location.assign(url);
          return;
        }
        const url = buildAdminActionReturnUrl({
          returnTo,
          action_status: "success",
          action,
          proof_action: proofAction,
          target: rowId,
          target_label: displayLabel,
          target_ad_id: leonixAdId,
          scroll_y: scrollY,
        });
        window.location.assign(url);
      } catch {
        const url = buildAdminActionReturnUrl({
          returnTo,
          action_status: "error",
          action,
          proof_action: proofAction,
          target: rowId,
          target_label: displayLabel,
          target_ad_id: leonixAdId,
          scroll_y: scrollY,
          action_error: "network",
        });
        window.location.assign(url);
      } finally {
        setBusy(false);
      }
    },
    [displayLabel, leonixAdId, returnTo, rowId, variant],
  );

  const runArchive = useCallback(() => {
    if (!canArchive) return;
    const ok = window.confirm("Archive this listing? It will stop showing publicly.");
    if (!ok) return;
    void run("archive");
  }, [canArchive, run]);

  const republish =
    republishCategory && republishRow ? republishActionLabel(republishRow, republishCategory) : null;

  const compact = adminQueueActionCompact;
  const gridCols = layout === "card" ? 2 : 1;

  return (
    <div className="min-w-0 space-y-3" data-testid="classified-admin-row-actions">
      <div>
        <p className={adminQueueActionGroupLabel}>Lifecycle</p>
        <AdminDashboardCtaGrid columns={gridCols}>
          {republish ? (
            <AdminDashboardCtaButton
              label={busy ? "…" : republish.label}
              variant="neutral"
              disabled={busy || republish.disabled}
              title={republish.disabled ? republish.reason : "Republish or move listing to top"}
              onClick={() => {
                if (republish.disabled) return;
                void run("republish", "republish");
              }}
              className={compact}
            />
          ) : null}
          {publicLive ? (
            <AdminDashboardCtaButton
              label={busy ? "…" : "Suspend"}
              variant="warning"
              disabled={busy}
              title="Suspend public visibility"
              onClick={() => void run("suspend")}
              className={compact}
            />
          ) : (
            <AdminDashboardCtaButton
              label={busy ? "…" : "Restore"}
              variant="active"
              disabled={busy}
              title="Restore (unsuspend). Not Republish or Move to top."
              onClick={() => void run("unsuspend")}
              className={compact}
            />
          )}
          {canArchive ? (
            <AdminDashboardCtaButton
              label={busy ? "…" : "Archive"}
              variant="neutral"
              disabled={busy}
              title="Archive this listing"
              onClick={runArchive}
              className={compact}
            />
          ) : null}
        </AdminDashboardCtaGrid>
      </div>

      <div>
        <p className={adminQueueActionGroupLabel}>Monetization &amp; trust</p>
        <AdminDashboardCtaGrid columns={gridCols}>
          {promoted ? (
            <AdminDashboardCtaButton
              label={busy ? "…" : "Remove featured"}
              variant="neutral"
              disabled={busy}
              onClick={() => void run("promote_off")}
              className={compact}
            />
          ) : (
            <AdminDashboardCtaButton
              label={busy ? "…" : "Feature"}
              variant="premium"
              disabled={busy}
              onClick={() => void run("promote_on")}
              className={compact}
            />
          )}
          {verified ? (
            <AdminDashboardCtaButton
              label={busy ? "…" : "Remove verified"}
              variant="neutral"
              disabled={busy}
              onClick={() => void run("verify_off")}
              className={compact}
            />
          ) : (
            <AdminDashboardCtaButton
              label={busy ? "…" : "Verify Leonix"}
              variant="active"
              disabled={busy}
              onClick={() => void run("verify_on")}
              className={compact}
            />
          )}
        </AdminDashboardCtaGrid>
      </div>
    </div>
  );
}
