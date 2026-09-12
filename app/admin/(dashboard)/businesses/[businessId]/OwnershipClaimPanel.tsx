"use client";

import { useEffect, useState } from "react";
import { humanizeStaffWriteError } from "@/app/admin/_lib/staffWriteErrorMessages";

/**
 * Systemic Repair Build — Owner Claim / Handoff panel for the existing Business Concierge
 * workspace. Self-contained: fetches its own claim history rather than requiring the parent
 * business-detail page to be re-plumbed. Only Generate / Copy / Revoke — never sends the
 * invitation itself (staff share the link however they normally communicate with the prospect).
 */

export type OwnershipClaimRow = {
  id: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  intendedOwnerEmail: string | null;
  expiresAt: string;
  createdAt: string;
  createdByEmail: string;
  acceptedByEmail: string | null;
  acceptedAt: string | null;
  isEffectivelyExpired: boolean;
};

function statusLabel(claim: OwnershipClaimRow): { text: string; className: string } {
  if (claim.status === "pending" && claim.isEffectivelyExpired) {
    return { text: "expired", className: "bg-[#EDE6D6] text-[#7A7164]" };
  }
  switch (claim.status) {
    case "accepted":
      return { text: "accepted", className: "bg-emerald-100 text-emerald-800" };
    case "revoked":
      return { text: "revoked", className: "bg-[#EDE6D6] text-[#7A7164]" };
    case "expired":
      return { text: "expired", className: "bg-[#EDE6D6] text-[#7A7164]" };
    default:
      return { text: "pending", className: "bg-amber-100 text-amber-800" };
  }
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({} as { error?: string }));
  return humanizeStaffWriteError(data.error, fallback);
}

export function OwnershipClaimPanel({ businessId, canGenerate }: { businessId: string; canGenerate: boolean }) {
  const [claims, setClaims] = useState<OwnershipClaimRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [newLink, setNewLink] = useState<string | null>(null);

  async function loadClaims() {
    const res = await fetch(`/api/admin/businesses/${businessId}/ownership-claim`);
    if (!res.ok) {
      setError(await readApiError(res, "Could not load ownership claims."));
      return;
    }
    const data = (await res.json()) as { claims: OwnershipClaimRow[] };
    setClaims(data.claims);
  }

  useEffect(() => {
    void loadClaims();
  }, [businessId]);

  const pending = (claims ?? []).find((c) => c.status === "pending" && !c.isEffectivelyExpired) ?? null;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setNewLink(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/ownership-claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setGenerating(false);
    if (!res.ok) {
      setError(await readApiError(res, "Could not generate an owner handoff link."));
      return;
    }
    const data = (await res.json()) as { claimLink: string };
    setNewLink(typeof window !== "undefined" ? `${window.location.origin}${data.claimLink}` : data.claimLink);
    await loadClaims();
  }

  async function handleRevoke(claimId: string) {
    setRevoking(claimId);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/ownership-claim`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId }),
    });
    setRevoking(null);
    if (!res.ok) {
      setError(await readApiError(res, "Could not revoke this invitation."));
      return;
    }
    setNewLink(null);
    await loadClaims();
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#7A7164]">
        Generate a one-time link so the real owner can claim THIS existing business (its research, notes, and history stay attached — nothing is duplicated).
      </p>

      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
      {!canGenerate ? (
        <p className="text-xs text-[#7A7164]">Your role can view handoff status. Generating a new link is a manager+ / super-admin action.</p>
      ) : null}

      {newLink ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <p className="font-semibold">Link generated — copy it now, it will not be shown again:</p>
          <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-[11px] text-[#1E1810]">{newLink}</code>
        </div>
      ) : null}

      {canGenerate ? (
        <button
          onClick={() => void handleGenerate()}
          disabled={generating || Boolean(pending)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1F3A2D] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {generating ? "Generating…" : pending ? "A link is already pending" : "Generate owner handoff link"}
        </button>
      ) : null}

      {claims === null ? (
        <p className="text-sm text-[#7A7164]">Loading…</p>
      ) : claims.length === 0 ? (
        <p className="text-sm text-[#7A7164]">No owner handoff invitations yet.</p>
      ) : (
        <div className="space-y-2">
          {claims.map((c) => {
            const label = statusLabel(c);
            return (
              <div key={c.id} className="rounded-lg border border-[#E8DFD0] bg-white p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${label.className}`}>{label.text}</span>
                  <span className="text-[11px] text-[#7A7164]">Created {new Date(c.createdAt).toLocaleString()} by {c.createdByEmail}</span>
                </div>
                {c.intendedOwnerEmail ? <p className="mt-1 text-[11px] text-[#3D3428]">Reserved for: {c.intendedOwnerEmail}</p> : null}
                {c.status === "accepted" && c.acceptedByEmail ? (
                  <p className="mt-1 text-[11px] text-emerald-800">Accepted by {c.acceptedByEmail} on {c.acceptedAt ? new Date(c.acceptedAt).toLocaleString() : ""}</p>
                ) : null}
                {c.status === "pending" && !c.isEffectivelyExpired ? (
                  <p className="mt-1 text-[11px] text-[#7A7164]">Expires {new Date(c.expiresAt).toLocaleString()}</p>
                ) : null}
                {canGenerate && c.status === "pending" && !c.isEffectivelyExpired ? (
                  <button
                    onClick={() => void handleRevoke(c.id)}
                    disabled={revoking === c.id}
                    className="mt-2 inline-flex min-h-[36px] items-center justify-center rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-800 disabled:opacity-50"
                  >
                    {revoking === c.id ? "Revoking…" : "Revoke"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
