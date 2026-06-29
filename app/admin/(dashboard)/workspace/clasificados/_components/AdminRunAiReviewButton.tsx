"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  buildAdminActionReturnUrl,
  stripAdminQueueActionParams,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { AdminDashboardCtaButton } from "@/app/admin/_components/AdminDashboardCta";
import { AdminActionExplainer } from "@/app/admin/_components/AdminActionExplainer";
import { adminQueueActionCompact } from "@/app/admin/_components/adminTheme";
import { getAdminActionContract } from "@/app/admin/_lib/adminOsActionRegistry";

export function AdminRunAiReviewButton({
  listingId,
  leonixAdId,
  displayLabel,
  className,
  label = "Run AI review",
}: {
  listingId: string;
  leonixAdId?: string | null;
  displayLabel?: string | null;
  className?: string;
  label?: string;
}) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);

  const returnTo = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    stripAdminQueueActionParams(sp);
    const q = sp.toString();
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams]);

  const run = useCallback(async () => {
    setBusy(true);
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    try {
      const res = await fetch(`/api/admin/clasificados/listings/${encodeURIComponent(listingId)}/ai-review`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; proofLabel?: string };
      const proofLabel =
        j.proofLabel?.trim() ||
        (j.ok ? "AI review completed" : j.error?.trim() || "AI review failed");
      const url = buildAdminActionReturnUrl({
        returnTo,
        action_status: j.ok ? "success" : "error",
        action: "ai_review",
        target: listingId,
        target_label: proofLabel,
        target_ad_id: leonixAdId?.trim() || undefined,
        scroll_y: scrollY,
        action_error: j.ok ? undefined : j.error,
        hash_anchor: "queue",
      });
      window.location.assign(url);
    } catch {
      const url = buildAdminActionReturnUrl({
        returnTo,
        action_status: "error",
        action: "ai_review",
        target: listingId,
        target_label: displayLabel,
        target_ad_id: leonixAdId?.trim() || undefined,
        scroll_y: scrollY,
        action_error: "network",
        hash_anchor: "queue",
      });
      window.location.assign(url);
    } finally {
      setBusy(false);
    }
  }, [displayLabel, leonixAdId, listingId, returnTo]);
  const actionMeta = getAdminActionContract("runAiReview");

  return (
    <div className="space-y-2" data-testid="admin-run-ai-review">
      <AdminActionExplainer action="runAiReview" compact />
      <AdminDashboardCtaButton
        label={busy ? "…" : label || actionMeta.label}
        variant={actionMeta.variant}
        disabled={busy}
        onClick={() => void run()}
        className={className ?? adminQueueActionCompact}
        title={actionMeta.helperCopy}
      />
    </div>
  );
}
