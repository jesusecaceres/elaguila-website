"use client";

/**
 * The queue itself. Every mutation goes through `/api/admin/rewards`, which applies the
 * revenue-protected WRITE gate and attributes the acting staff member — this component never
 * carries an actor, and could not forge one if it tried.
 *
 * THREE OUTCOMES, AND THEY MOVE MONEY IN DIFFERENT DIRECTIONS
 *   REVERSE            — a real clawback, under the canonical `reverse:refund:<id>` key built from
 *                        the refund id a human read off Stripe. If the webhook later delivers that
 *                        same refund properly, it is a no-op rather than a second clawback.
 *   RESTORE            — a WON dispute gives credits BACK. These rows record value the customer is
 *                        OWED, not value to claw back. There used to be no control for them at
 *                        all: the only safe-looking button was "no action", which closed the row
 *                        with nothing moved and left the customer permanently charged the rewards
 *                        for a dispute they had won. Settling one through `reverse` moves nothing
 *                        (its basis is zero) and settling it as an adjustment would leave the
 *                        restoration bound open for a later `restore:<disputeId>` to pay twice, so
 *                        the real restoration path is the only correct one and it is offered here.
 *   NO ACTION REQUIRED — the credits were already reversed, or the refund does not affect them.
 *                        Nothing moves; the row closes with a reason attached.
 *
 * The status filter exists because a queue you cannot look back at is not an audit trail. Resolved
 * rows carry who settled them, when, with what note and under which outcome.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  paymentRecordId: string;
  stripeChargeId: string | null;
  stripeEventId: string | null;
  /** The dispute or refund id this row is about, when the rail named one. */
  externalRef: string | null;
  kind: "refund" | "chargeback";
  cumulativeRefundedCents: number;
  status: "open" | "resolved" | "dismissed";
  attempts: number;
  reason: string;
  createdAtIso: string;
  resolvedAtIso: string | null;
  resolutionOutcome: "reversed" | "restored" | "no_action_required" | null;
  resolutionNote: string | null;
  resolvedRefundExternalId: string | null;
};

type Message = { kind: "ok" | "err"; text: string } | null;
type StatusFilter = "open" | "resolved" | "all";
type Outcome = "reversed" | "restored" | "no_action_required";

async function postAdminRewards(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/rewards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json().catch(() => ({ ok: false, error: "bad_response" }))) as Record<string, unknown>;
}

function money(cents: number): string {
  return `$${(Math.max(0, Math.floor(cents)) / 100).toFixed(2)}`;
}

/**
 * Does this row record credits the customer is OWED rather than a clawback to apply?
 *
 * The webhook files won-dispute work with `kind: "chargeback"` and a cumulative position of zero,
 * and names the reason. Reading the reason is what lets the screen say "credits are owed" instead
 * of rendering "$0.00 · Chargeback" and inviting staff to close it with no movement.
 */
function isRestorationWork(row: Row): boolean {
  return row.kind === "chargeback" && row.reason.startsWith("won_dispute_restoration");
}

export function RewardsRefundQueueClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [refundIds, setRefundIds] = useState<Record<string, string>>({});
  const [disputeIds, setDisputeIds] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await postAdminRewards({ action: "refund_queue", status: statusFilter, limit: 100 });
    setLoading(false);
    if (res.ok !== true) {
      setMessage({ kind: "err", text: "No se pudo cargar la lista / Could not load the queue" });
      return;
    }
    setRows((res.rows as Row[]) ?? []);
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = useCallback(
    async (row: Row, outcome: Outcome) => {
      const note = (notes[row.id] ?? "").trim();
      if (note.length < 3) {
        setMessage({ kind: "err", text: "Escribe una nota (mínimo 3 caracteres) / Add a note (min 3 characters)" });
        return;
      }
      // The same refusals the server applies, said here so a missing id costs a click rather than
      // a round trip. The server still enforces them — and enforces them BEFORE it claims the row.
      const refundExternalId = (refundIds[row.id] ?? "").trim();
      const disputeId = (disputeIds[row.id] ?? row.externalRef ?? "").trim();
      if (outcome === "reversed" && refundExternalId.length < 4) {
        setMessage({
          kind: "err",
          text: "Se requiere el ID del reembolso de Stripe / The Stripe refund ID is required",
        });
        return;
      }
      if (outcome === "restored" && disputeId.length < 4) {
        setMessage({
          kind: "err",
          text: "Se requiere el ID de la disputa de Stripe / The Stripe dispute ID is required",
        });
        return;
      }
      setBusyId(row.id);
      const res = await postAdminRewards({
        action: "refund_resolve",
        resolutionId: row.id,
        outcome,
        note,
        ...(outcome === "reversed" ? { refundExternalId } : {}),
        ...(outcome === "restored" ? { disputeId } : {}),
      });
      setBusyId(null);
      if (res.ok !== true) {
        setMessage({ kind: "err", text: `No se pudo resolver / Could not resolve: ${String(res.error ?? "")}` });
        return;
      }
      const moved = Number(res.movedCents ?? 0);
      setMessage({
        kind: "ok",
        text:
          outcome === "reversed"
            ? `Revertido ${money(moved)} / Reversed ${money(moved)}`
            : outcome === "restored"
              ? `Restaurado ${money(moved)} / Restored ${money(moved)}`
              : "Cerrado sin movimiento / Closed with no movement",
      });
      await load();
    },
    [notes, refundIds, disputeIds, load],
  );

  const emptyText = useMemo(
    () =>
      statusFilter === "open"
        ? "No hay reembolsos sin resolver. / No unresolved refunds."
        : "No hay filas para este filtro. / No rows for this filter.",
    [statusFilter],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["open", "resolved", "all"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            aria-pressed={statusFilter === s}
            className={`min-h-[44px] rounded-xl border px-4 text-sm font-semibold ${
              statusFilter === s
                ? "border-[#1A4D2E] bg-[#F1F8F2] text-[#1A4D2E]"
                : "border-[#E7DCC6] bg-white text-[#7A7164]"
            }`}
          >
            {s === "open" ? "Abiertos / Open" : s === "resolved" ? "Resueltos / Resolved" : "Todos / All"}
          </button>
        ))}
      </div>

      {message ? (
        <p
          className={`rounded-xl border p-3 text-sm ${
            message.kind === "ok"
              ? "border-[#BFD9C4] bg-[#F1F8F2] text-[#1A4D2E]"
              : "border-[#E6C7C7] bg-[#FBF2F2] text-[#8B3A3A]"
          }`}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[#7A7164]">Cargando… / Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-[#E7DCC6] bg-white p-4 text-sm text-[#5D4A25]">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const owed = isRestorationWork(row);
            const open = row.status === "open";
            return (
              <li key={row.id} className="rounded-2xl border border-[#E7DCC6] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="text-sm text-[#2F2A1F]">
                    <p className="font-bold">
                      {owed
                        ? "Créditos por devolver al cliente / Credits owed to the customer"
                        : `${money(row.cumulativeRefundedCents)} · ${
                            row.kind === "chargeback" ? "Disputa / Chargeback" : "Reembolso / Refund"
                          }`}
                    </p>
                    {owed ? (
                      <p className="mt-1 text-xs font-semibold text-[#1A4D2E]">
                        Disputa ganada: los créditos se devuelven. / Dispute won: the credits are given back.
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-[#7A7164]">
                      Pago / Payment: <span className="font-mono">{row.paymentRecordId}</span>
                    </p>
                    {row.externalRef ? (
                      <p className="text-xs text-[#7A7164]">
                        {row.kind === "chargeback" ? "Disputa / Dispute" : "Reembolso / Refund"}:{" "}
                        <span className="font-mono">{row.externalRef}</span>
                      </p>
                    ) : null}
                    {row.stripeChargeId ? (
                      <p className="text-xs text-[#7A7164]">
                        Stripe charge: <span className="font-mono">{row.stripeChargeId}</span>
                      </p>
                    ) : null}
                    {row.stripeEventId ? (
                      <p className="text-xs text-[#7A7164]">
                        Stripe event: <span className="font-mono">{row.stripeEventId}</span>
                      </p>
                    ) : null}
                    <p className="text-xs text-[#7A7164]">
                      {row.reason} · {row.attempts} {row.attempts === 1 ? "entrega / delivery" : "entregas / deliveries"}
                    </p>
                    {!open ? (
                      <p className="mt-1 text-xs text-[#5D4A25]">
                        {row.status === "dismissed" ? "Descartado / Dismissed" : "Resuelto / Resolved"}
                        {row.resolutionOutcome ? ` · ${row.resolutionOutcome}` : ""}
                        {row.resolvedAtIso ? ` · ${row.resolvedAtIso}` : ""}
                        {row.resolutionNote ? ` · ${row.resolutionNote}` : ""}
                      </p>
                    ) : null}
                  </div>
                </div>

                {open ? (
                  <div className="mt-3 space-y-2">
                    {owed ? (
                      <input
                        type="text"
                        value={disputeIds[row.id] ?? row.externalRef ?? ""}
                        onChange={(e) => setDisputeIds((p) => ({ ...p, [row.id]: e.target.value }))}
                        placeholder="dp_... (Stripe dispute ID)"
                        className="min-h-[44px] w-full rounded-xl border border-[#E7DCC6] px-3 font-mono text-sm text-[#2F2A1F]"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    ) : (
                      <input
                        type="text"
                        value={refundIds[row.id] ?? ""}
                        onChange={(e) => setRefundIds((p) => ({ ...p, [row.id]: e.target.value }))}
                        placeholder="re_... (Stripe refund ID)"
                        className="min-h-[44px] w-full rounded-xl border border-[#E7DCC6] px-3 font-mono text-sm text-[#2F2A1F]"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    )}
                    <textarea
                      value={notes[row.id] ?? ""}
                      onChange={(e) => setNotes((p) => ({ ...p, [row.id]: e.target.value }))}
                      placeholder="Nota obligatoria / Required note"
                      rows={2}
                      className="w-full rounded-xl border border-[#E7DCC6] p-3 text-sm text-[#2F2A1F]"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {owed ? (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void resolve(row, "restored")}
                          className="min-h-[44px] rounded-xl border border-[#BFD9C4] bg-[#F1F8F2] px-4 text-sm font-semibold text-[#1A4D2E] disabled:opacity-50"
                        >
                          {busyId === row.id ? "…" : "Restaurar créditos / Restore credits"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void resolve(row, "reversed")}
                          className="min-h-[44px] rounded-xl border border-[#E7DCC6] bg-white px-4 text-sm font-semibold text-[#2F2A1F] disabled:opacity-50"
                        >
                          {busyId === row.id ? "…" : "Revertir créditos / Reverse credits"}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void resolve(row, "no_action_required")}
                        className="min-h-[44px] rounded-xl border border-[#E7DCC6] bg-white px-4 text-sm font-semibold text-[#7A7164] disabled:opacity-50"
                      >
                        Sin acción / No action
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
