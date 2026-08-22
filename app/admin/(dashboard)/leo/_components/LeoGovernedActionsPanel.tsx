"use client";

/**
 * LEO-21B/21E.1 — Governed Actions cockpit on /admin/leo.
 * Approve / Cancel always; Execute only when server two-key capability is true.
 * CAPABILITY ≠ AUTHORITY.
 */

import { useCallback, useState, useTransition } from "react";

import { adminCardBase } from "@/app/admin/_components/adminTheme";
import type { LeoGovernedActionProposalCard } from "@/app/leo/_lib/leoGovernedActionProposalReadModel";

export type LeoGovernedActionsLoad =
  | { ok: true; cards: LeoGovernedActionProposalCard[]; truth?: { explanation: string; nextStep: string | null; health: string } }
  | { ok: false; limitation: string; truth?: { explanation: string; nextStep: string | null; health: string } };

type ConfirmApprove = { kind: "approve"; card: LeoGovernedActionProposalCard };
type ConfirmExecute = { kind: "execute"; card: LeoGovernedActionProposalCard };
type ConfirmState = ConfirmApprove | ConfirmExecute | null;

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  try {
    return new Date(t).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusTone(state: string): string {
  switch (state) {
    case "AWAITING_APPROVAL":
      return "border-rose-300 bg-rose-50 text-rose-900";
    case "APPROVED":
      return "border-[#1E4A7A]/30 bg-[#F0F5FA] text-[#1E4A7A]";
    case "EXECUTION_CLAIMED":
    case "EXECUTED":
      return "border-[#C9782F]/50 bg-[#FFF4E8] text-[#7A3E10]";
    case "VERIFIED":
      return "border-[#2A4536]/30 bg-[#EEF5F0] text-[#2A4536]";
    case "FAILED":
      return "border-rose-400 bg-rose-50 text-rose-950";
    case "EXPIRED":
    case "CANCELLED":
      return "border-[color:var(--lx-border)] bg-[color:var(--lx-section)] text-[#5C5346]";
    default:
      return "border-[color:var(--lx-border)] bg-white/80 text-[#5C5346]";
  }
}

function ProposalCard({
  card,
  busy,
  onRequestApprove,
  onRequestExecute,
  onCancel,
}: {
  card: LeoGovernedActionProposalCard;
  busy: boolean;
  onRequestApprove: (card: LeoGovernedActionProposalCard) => void;
  onRequestExecute: (card: LeoGovernedActionProposalCard) => void;
  onCancel: (card: LeoGovernedActionProposalCard) => void;
}) {
  return (
    <article
      className="min-w-0 rounded-xl border border-[color:var(--lx-border)]/70 bg-white/90 p-3.5 sm:p-4"
      data-leo-proposal-id={card.proposalId}
      data-leo-proposal-state={card.proposalState}
      data-leo-can-execute={card.canExecute ? "true" : "false"}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h3 className="min-w-0 flex-1 break-words text-sm font-bold text-[#1E1810] sm:text-[15px]">
          {card.actionFamilyLabel}
        </h3>
        <span
          className={`inline-flex max-w-full shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-bold tracking-wide ${statusTone(card.proposalState)}`}
        >
          {card.statusPrimary}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
        <span className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-rose-900">
          {card.governanceLevel} governance
        </span>
        {card.isExpired ? (
          <span className="rounded-md border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-2 py-1 text-[#5C5346]">
            Expired
          </span>
        ) : null}
      </div>

      <p className="mt-2 break-words text-sm text-[#1E1810]">
        <span className="font-semibold">Target:</span> {card.targetSummary}
      </p>
      <p className="mt-1 break-words text-sm text-[#5C5346]">
        <span className="font-semibold text-[#1E1810]">Summary:</span> {card.payloadSummary}
      </p>

      <details className="mt-2 open:pb-1" open={card.canApprove || card.canExecute}>
        <summary className="cursor-pointer touch-manipulation py-1 text-[11px] font-bold uppercase tracking-wide text-[#A67C52]">
          Exact consequential content
        </summary>
        <pre className="mt-1.5 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[color:var(--lx-border)]/50 bg-[color:var(--lx-section)]/60 p-3 text-xs leading-relaxed text-[#1E1810]">
          {card.payloadDetails.join("\n\n")}
        </pre>
      </details>

      <p className="mt-2 text-xs leading-relaxed text-[#7A3E10]">{card.whyApprovalRequired}</p>
      {card.executionCapabilityNote ? (
        <p className="mt-1 text-xs font-medium text-[#1E4A7A]">{card.executionCapabilityNote}</p>
      ) : null}
      {card.statusSecondary ? (
        <p className="mt-1 text-[11px] text-[#5C5346]">{card.statusSecondary}</p>
      ) : null}

      <dl className="mt-3 grid grid-cols-1 gap-1 text-[11px] text-[#5C5346] sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-[#1E1810]">Created</dt>
          <dd>{formatWhen(card.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#1E1810]">Expires</dt>
          <dd>{formatWhen(card.expiresAt)}</dd>
        </div>
        {card.linkedReceiptId ? (
          <div className="sm:col-span-2">
            <dt className="font-semibold text-[#1E1810]">Linked receipt</dt>
            <dd className="break-all font-mono text-[10px]">{card.linkedReceiptId}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        {card.canApprove ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onRequestApprove(card)}
            className="min-h-12 w-full touch-manipulation rounded-xl border border-rose-400 bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 sm:w-auto sm:min-w-[10rem]"
            data-leo-action="approve-request"
          >
            Approve…
          </button>
        ) : null}
        {card.canExecute ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onRequestExecute(card)}
            className="min-h-12 w-full touch-manipulation rounded-xl border border-rose-500 bg-rose-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 sm:w-auto sm:min-w-[10rem]"
            data-leo-action="execute-request"
          >
            Execute
          </button>
        ) : null}
        {card.canCancel ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel(card)}
            className="min-h-12 w-full touch-manipulation rounded-xl border border-[color:var(--lx-border)] bg-white px-4 py-3 text-sm font-bold text-[#1E1810] disabled:opacity-50 sm:w-auto sm:min-w-[10rem] sm:ml-auto"
            data-leo-action="cancel"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function LeoGovernedActionsPanel({
  initialLoad,
}: {
  initialLoad: LeoGovernedActionsLoad;
}) {
  const [cards, setCards] = useState<LeoGovernedActionProposalCard[]>(
    initialLoad.ok ? initialLoad.cards : [],
  );
  const [loadError, setLoadError] = useState<string | null>(
    initialLoad.ok ? null : initialLoad.limitation,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  /** After UNKNOWN_EXTERNAL_OUTCOME — never offer Execute again for that proposal in-session. */
  const [blockedExecuteIds, setBlockedExecuteIds] = useState<Record<string, true>>({});
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const refreshFromServer = useCallback(async () => {
    const res = await fetch("/api/leo/action/proposals", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const body = (await res.json().catch(() => null)) as
      | { ok: true; cards: LeoGovernedActionProposalCard[] }
      | { ok: false; error?: string; explanation?: string }
      | null;
    if (!res.ok || !body || !body.ok) {
      const explained =
        body && "explanation" in body && body.explanation
          ? body.explanation
          : "Could not refresh proposals after known checks failed.";
      setActionError(explained);
      return false;
    }
    setCards(body.cards);
    setLoadError(null);
    setActionError(null);
    return true;
  }, []);

  const runCancel = (card: LeoGovernedActionProposalCard) => {
    setBusy(true);
    setActionError(null);
    setActionInfo(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/leo/action/proposal/${encodeURIComponent(card.proposalId)}`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ action: "cancel" }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.ok) {
          setActionError(
            typeof body?.error === "string" ? body.error : "Cancel failed. Canonical state unchanged.",
          );
          await refreshFromServer();
          return;
        }
        await refreshFromServer();
      } catch {
        setActionError("Cancel failed. Canonical state unchanged.");
      } finally {
        setBusy(false);
      }
    });
  };

  const runApprove = (card: LeoGovernedActionProposalCard) => {
    setBusy(true);
    setActionError(null);
    setActionInfo(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/leo/action/proposal/${encodeURIComponent(card.proposalId)}`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            action: "approve",
            expectedFingerprint: card.proposalFingerprint,
          }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.ok) {
          setActionError(
            typeof body?.error === "string"
              ? body.error
              : "Approval failed. Canonical state unchanged.",
          );
          setConfirm(null);
          await refreshFromServer();
          return;
        }
        setConfirm(null);
        await refreshFromServer();
      } catch {
        setActionError("Approval failed. Canonical state unchanged.");
        setConfirm(null);
      } finally {
        setBusy(false);
      }
    });
  };

  const runExecute = (card: LeoGovernedActionProposalCard) => {
    setBusy(true);
    setActionError(null);
    setActionInfo(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/leo/action/proposal/${encodeURIComponent(card.proposalId)}/execute`,
          {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              expectedFingerprint: card.proposalFingerprint,
            }),
          },
        );
        const body = await res.json().catch(() => null);
        setConfirm(null);
        if (!res.ok || !body?.ok) {
          setActionError(
            typeof body?.error === "string"
              ? body.error
              : "Execute failed. Canonical state unchanged until refresh.",
          );
          await refreshFromServer();
          return;
        }
        const result = body.result as {
          status?: string;
          safeFailureClass?: string | null;
          warnings?: string[];
          externalSideEffectPossible?: boolean;
        };
        if (result?.status === "UNKNOWN_EXTERNAL_OUTCOME") {
          setBlockedExecuteIds((prev) => ({ ...prev, [card.proposalId]: true }));
          setActionInfo(
            "Unknown outcome — checking Gmail. Do not click Execute again. Reconcile-first.",
          );
        } else if (result?.status === "VERIFIED") {
          setActionInfo("Verified reply sent.");
        } else if (result?.status === "PROVIDER_ACCEPTED") {
          setActionInfo("Provider accepted — verification pending.");
        } else if (result?.status === "FAILED") {
          setActionError(
            Array.isArray(result.warnings) && result.warnings.length
              ? result.warnings.join(" ")
              : result.safeFailureClass
                ? `Failed: ${result.safeFailureClass}`
                : "Execution failed before send or with a safe failure class.",
          );
        }
        await refreshFromServer();
      } catch {
        setActionError("Execute failed. Canonical state unchanged until refresh.");
        setConfirm(null);
      } finally {
        setBusy(false);
      }
    });
  };

  return (
    <section
      className={`${adminCardBase} min-w-0 space-y-3 p-3 sm:p-4`}
      aria-labelledby="leo-governed-actions-heading"
      data-leo-cockpit="governed-actions"
    >
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2
            id="leo-governed-actions-heading"
            className="text-sm font-bold text-[#1E1810] sm:text-base"
          >
            Governed Actions
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#5C5346]">
            Owner approval and gated execution for RED connected actions. Approval does not execute.
            Execute requires server two-key capability (write flag + proven gmail.send).
          </p>
        </div>
        <button
          type="button"
          disabled={busy || pending}
          onClick={() => {
            setBusy(true);
            startTransition(async () => {
              try {
                await refreshFromServer();
              } finally {
                setBusy(false);
              }
            });
          }}
          className="min-h-11 touch-manipulation rounded-xl border border-[color:var(--lx-border)] bg-white px-3 py-2 text-xs font-bold text-[#1E1810] disabled:opacity-50"
          data-leo-action="refresh"
        >
          Refresh
        </button>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p data-leo-health={initialLoad.ok ? undefined : initialLoad.truth?.health}>{loadError}</p>
          {!initialLoad.ok && initialLoad.truth?.nextStep ? (
            <p className="mt-1 text-xs">{initialLoad.truth.nextStep}</p>
          ) : null}
        </div>
      ) : null}
      {actionError ? (
        <p
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}
      {actionInfo ? (
        <p className="rounded-lg border border-[#1E4A7A]/30 bg-[#F0F5FA] px-3 py-2 text-sm text-[#1E4A7A]">
          {actionInfo}
        </p>
      ) : null}

      {!loadError && cards.length === 0 ? (
        <p className="text-sm text-[#5C5346]" data-leo-health={initialLoad.truth?.health ?? "HEALTHY"}>
          {initialLoad.ok && initialLoad.truth?.explanation
            ? initialLoad.truth.explanation
            : "Proposal store is healthy. There are no governed action proposals right now."}
        </p>
      ) : null}

      <div className="flex min-w-0 flex-col gap-3">
        {cards.map((card) => {
          const canExecute =
            card.canExecute && !blockedExecuteIds[card.proposalId];
          return (
            <ProposalCard
              key={card.proposalId}
              card={{ ...card, canExecute }}
              busy={busy || pending}
              onRequestApprove={(c) => {
                setActionError(null);
                setActionInfo(null);
                setConfirm({ kind: "approve", card: c });
              }}
              onRequestExecute={(c) => {
                setActionError(null);
                setActionInfo(null);
                setConfirm({ kind: "execute", card: c });
              }}
              onCancel={runCancel}
            />
          );
        })}
      </div>

      {confirm?.kind === "approve" ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leo-approve-confirm-title"
          data-leo-confirm="approve"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-[color:var(--lx-border)] bg-white p-4 shadow-xl">
            <h3 id="leo-approve-confirm-title" className="text-base font-bold text-[#1E1810]">
              Approve this exact action
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5C5346]">
              You are approving LEO to perform this exact RED action when execution capability is
              enabled. Clicking Approve does <span className="font-semibold">not</span> send email
              or schedule calendar events now.
            </p>
            <p className="mt-3 text-sm text-[#1E1810]">
              <span className="font-semibold">Action:</span> {confirm.card.actionFamilyLabel}
            </p>
            <p className="mt-1 text-sm text-[#1E1810]">
              <span className="font-semibold">Target:</span> {confirm.card.targetSummary}
            </p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-xs text-[#1E1810]">
              {confirm.card.payloadDetails.join("\n\n")}
            </pre>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-rose-800">
              RED governance — fingerprint-bound approval
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={busy || pending}
                onClick={() => runApprove(confirm.card)}
                className="min-h-12 w-full touch-manipulation rounded-xl border border-rose-500 bg-rose-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                data-leo-action="approve-confirm"
              >
                Approve this exact action
              </button>
              <button
                type="button"
                disabled={busy || pending}
                onClick={() => setConfirm(null)}
                className="min-h-12 w-full touch-manipulation rounded-xl border border-[color:var(--lx-border)] bg-white px-4 py-3 text-sm font-bold text-[#1E1810] disabled:opacity-50"
                data-leo-action="approve-dismiss"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirm?.kind === "execute" ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leo-execute-confirm-title"
          data-leo-confirm="execute"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border-2 border-rose-500 bg-white p-4 shadow-xl">
            <h3 id="leo-execute-confirm-title" className="text-base font-bold text-rose-950">
              Send this exact approved reply
            </h3>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-rose-900">
              RED governance — this will attempt a real Gmail send of the approved payload. No
              payload changes. Fingerprint-bound.
            </p>
            <p className="mt-3 text-sm text-[#1E1810]">
              <span className="font-semibold">Action family:</span> {confirm.card.actionFamilyLabel}
            </p>
            <p className="mt-1 break-words text-sm text-[#1E1810]">
              <span className="font-semibold">Recipient:</span>{" "}
              {confirm.card.recipientDisplay ?? confirm.card.targetSummary}
            </p>
            <p className="mt-1 break-all text-sm text-[#1E1810]">
              <span className="font-semibold">Thread:</span>{" "}
              {confirm.card.threadDisplay ?? "(see payload)"}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              Full approved body
            </p>
            <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs leading-relaxed text-[#1E1810]">
              {confirm.card.bodyDisplay ?? confirm.card.payloadDetails.join("\n\n")}
            </pre>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy || pending}
                onClick={() => runExecute(confirm.card)}
                className="min-h-12 w-full touch-manipulation rounded-xl border border-rose-700 bg-rose-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                data-leo-action="execute-confirm"
              >
                Send approved reply
              </button>
              <button
                type="button"
                disabled={busy || pending}
                onClick={() => setConfirm(null)}
                className="min-h-12 w-full touch-manipulation rounded-xl border border-[color:var(--lx-border)] bg-white px-4 py-3 text-sm font-bold text-[#1E1810] disabled:opacity-50"
                data-leo-action="execute-dismiss"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
