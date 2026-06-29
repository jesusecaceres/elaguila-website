"use client";

import { useCallback, useState } from "react";
import type { AdminDashboardPendingReviewQueueRow } from "@/app/admin/_lib/adminDashboardData";
import { buildSellerMailtoForReviewRow } from "@/app/admin/_lib/adminDashboardReviewActions";
import { AdminDashboardCta } from "./AdminDashboardCta";
import { AdminActionExplainerGrid } from "./AdminActionExplainer";
import { adminDashboardCtaNeutral } from "./adminTheme";

const COMPACT = "!min-h-[40px] !w-auto !px-3 !py-2 !text-xs";

export function AdminDashboardReviewCardActions({ row }: { row: AdminDashboardPendingReviewQueueRow }) {
  const [copyState, setCopyState] = useState<"idle" | "ok" | "err">("idle");
  const mailto = buildSellerMailtoForReviewRow(row);
  const sellerHref = row.ownerUserId ? `/admin/usuarios/${row.ownerUserId}` : null;

  const copyEmail = useCallback(async () => {
    const email = row.ownerEmail?.trim();
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopyState("ok");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("err");
      window.setTimeout(() => setCopyState("idle"), 2500);
    }
  }, [row.ownerEmail]);

  return (
    <div className="mt-3 space-y-2" data-testid="admin-review-card-actions">
      <AdminActionExplainerGrid actions={["markReviewed", "archive", "delete"]} />
      <div className="flex flex-wrap gap-2">
        <AdminDashboardCta
          href={row.adminHref}
          label="Review in queue"
          variant="warning"
          title="Open the classifieds admin queue for this listing"
          className={COMPACT}
        />
        {row.editHref ? (
          <AdminDashboardCta
            href={row.editHref}
            label="Edit listing"
            variant="primary"
            title="Staff edit for generic listings rows"
            className={COMPACT}
          />
        ) : null}
        {row.publicHref ? (
          <AdminDashboardCta
            href={row.publicHref}
            label="View public"
            variant="view"
            external
            title="Public listing URL — may not render while pending review"
            className={COMPACT}
          />
        ) : null}
        {sellerHref ? (
          <AdminDashboardCta
            href={sellerHref}
            label="Seller profile"
            variant="active"
            title="Seller record in Leonix admin"
            className={COMPACT}
          />
        ) : null}
      </div>

      {(row.ownerEmail || mailto) && (
        <div className="flex flex-wrap gap-2">
          {row.ownerEmail ? (
            <button
              type="button"
              onClick={() => void copyEmail()}
              className={`${adminDashboardCtaNeutral} ${COMPACT}`}
              title={`Copy ${row.ownerEmail}`}
            >
              {copyState === "ok" ? "Copied" : copyState === "err" ? "Copy failed" : "Copy email"}
            </button>
          ) : null}
          {mailto ? (
            <AdminDashboardCta
              href={mailto}
              label="Email seller"
              variant="active"
              title="Opens mailto — email is not sent from the server"
              className={COMPACT}
            />
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-[#E8DFD0]/80 pt-2">
        <AdminDashboardCta
          href={row.queueActionsHref}
          label="Mark reviewed in queue"
          variant="warning"
          title="Approve/reject or clear flag using existing queue row actions — no dashboard mutation"
          className={COMPACT}
        />
        <AdminDashboardCta
          href={row.queueActionsHref}
          label="Archive in queue"
          variant="neutral"
          title="Archive/suspend uses existing classifieds queue actions"
          className={COMPACT}
        />
        <AdminDashboardCta
          href={row.queueActionsHref}
          label="Delete in queue"
          variant="danger"
          title="Soft delete/remove requires confirmation in the classifieds queue"
          className={COMPACT}
        />
      </div>
    </div>
  );
}
