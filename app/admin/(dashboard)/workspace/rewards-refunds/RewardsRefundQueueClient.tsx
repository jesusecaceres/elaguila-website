"use client";

/**
 * The queue itself. Every mutation goes through `/api/admin/rewards`, which applies the
 * revenue-protected WRITE gate and attributes the acting staff member — this component never
 * carries an actor, and could not forge one if it tried.
 *
 * Two outcomes, and they are not the same thing:
 *   REVERSE            — a real clawback, under the canonical `reverse:refund:<id>` key built from
 *                        the refund id a human read off Stripe. If the webhook later delivers that
 *                        same refund properly, it is a no-op rather than a second clawback.
 *   NO ACTION REQUIRED — the credits were already reversed, or the refund does not affect them.
 *                        Nothing moves; the row closes with a reason attached.
 */
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  paymentRecordId: string;
  stripeChargeId: string | null;
  kind: "refund" | "chargeback";
  cumulativeRefundedCents: number;
  status: "open" | "resolved" | "dismissed";
  attempts: number;
  reason: string;
  createdAtIso: string;
};

type Message = { kind: "ok" | "err"; text: string } | null;

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

export function RewardsRefundQueueClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [refundIds, setRefundIds] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await postAdminRewards({ action: "refund_queue", status: "open", limit: 100 });
    setLoading(false);
    if (res.ok !== true) {
      setMessage({ kind: "err", text: "No se pudo cargar la lista / Could not load the queue" });
      return;
    }
    setRows((res.rows as Row[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = useCallback(
    async (row: Row, outcome: "reversed" | "no_action_required") => {
      const note = (notes[row.id] ?? "").trim();
      if (note.length < 3) {
        setMessage({ kind: "err", text: "Escribe una nota (mínimo 3 caracteres) / Add a note (min 3 characters)" });
        return;
      }
      const refundExternalId = (refundIds[row.id] ?? "").trim();
      if (outcome === "reversed" && refundExternalId.length < 4) {
        setMessage({
          kind: "err",
          text: "Se requiere el ID del reembolso de Stripe / The Stripe refund ID is required",
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
            : "Cerrado sin movimiento / Closed with no movement",
      });
      await load();
    },
    [notes, refundIds, load],
  );

  return (
    <section className="space-y-4">
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
        <p className="rounded-2xl border border-[#E7DCC6] bg-white p-4 text-sm text-[#5D4A25]">
          No hay reembolsos sin resolver. / No unresolved refunds.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-[#E7DCC6] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-sm text-[#2F2A1F]">
                  <p className="font-bold">
                    {money(row.cumulativeRefundedCents)} · {row.kind === "chargeback" ? "Disputa / Chargeback" : "Reembolso / Refund"}
                  </p>
                  <p className="mt-1 text-xs text-[#7A7164]">
                    Pago / Payment: <span className="font-mono">{row.paymentRecordId}</span>
                  </p>
                  {row.stripeChargeId ? (
                    <p className="text-xs text-[#7A7164]">
                      Stripe charge: <span className="font-mono">{row.stripeChargeId}</span>
                    </p>
                  ) : null}
                  <p className="text-xs text-[#7A7164]">
                    {row.reason} · {row.attempts} {row.attempts === 1 ? "entrega / delivery" : "entregas / deliveries"}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={refundIds[row.id] ?? ""}
                  onChange={(e) => setRefundIds((p) => ({ ...p, [row.id]: e.target.value }))}
                  placeholder="re_... (Stripe refund ID)"
                  className="min-h-[44px] w-full rounded-xl border border-[#E7DCC6] px-3 font-mono text-sm text-[#2F2A1F]"
                  autoComplete="off"
                  spellCheck={false}
                />
                <textarea
                  value={notes[row.id] ?? ""}
                  onChange={(e) => setNotes((p) => ({ ...p, [row.id]: e.target.value }))}
                  placeholder="Nota obligatoria / Required note"
                  rows={2}
                  className="w-full rounded-xl border border-[#E7DCC6] p-3 text-sm text-[#2F2A1F]"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void resolve(row, "reversed")}
                    className="min-h-[44px] rounded-xl border border-[#E7DCC6] bg-white px-4 text-sm font-semibold text-[#2F2A1F] disabled:opacity-50"
                  >
                    {busyId === row.id ? "…" : "Revertir créditos / Reverse credits"}
                  </button>
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
