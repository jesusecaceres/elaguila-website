"use client";

import type { ReactNode } from "react";
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
  publicLive: boolean;
  promoted: boolean;
  verified: boolean;
  canArchive?: boolean;
  staffEditBoardHref?: string;
  republishCategory?: string;
  republishRow?: Record<string, unknown>;
  leonixAdId?: string | null;
  displayLabel?: string | null;
  layout?: "compact" | "card";
  /** Mobile card queue — collapse lifecycle/monetization into details sections. */
  collapseSections?: boolean;
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

function ActionSection({
  title,
  children,
  collapseSections,
  testId,
}: {
  title: string;
  children: ReactNode;
  collapseSections?: boolean;
  testId?: string;
}) {
  if (!collapseSections) {
    return (
      <div data-testid={testId}>
        <p className={adminQueueActionGroupLabel}>{title}</p>
        {children}
      </div>
    );
  }

  return (
    <details
      className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7]/80"
      data-testid={testId}
    >
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center px-3 py-2.5 text-xs font-bold uppercase text-[#5C5346] [&::-webkit-details-marker]:hidden">
        {title}
      </summary>
      <div className="border-t border-[#E8DFD0]/60 p-2">{children}</div>
    </details>
  );
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
  collapseSections = false,
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
    <div className="min-w-0 space-y-2 overflow-x-hidden" data-testid="classified-admin-row-actions">
      <ActionSection title="Lifecycle" collapseSections={collapseSections} testId="admin-row-actions-lifecycle">
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
      </ActionSection>

      <ActionSection
        title="Monetization & trust"
        collapseSections={collapseSections}
        testId="admin-row-actions-monetization"
      >
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
      </ActionSection>
    </div>
  );
}
