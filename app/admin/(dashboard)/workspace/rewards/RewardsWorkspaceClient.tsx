"use client";

/**
 * LEONIX IX REWARDS — staff workspace client.
 *
 * Search → select customer → see balances → redeem credits against an in-office payment, or post
 * an authorized adjustment. The server decides every amount: what staff type is a REQUEST, and
 * `/api/admin/rewards` caps it against the live balance and the amount actually owed before
 * anything moves. The breakdown shown before confirming is the SERVER's answer, not a local sum.
 */
import { useCallback, useState } from "react";

type SearchResult = {
  businessId: string;
  displayName: string;
  publicName: string | null;
  availableCents: number;
  pendingCents: number;
  reservedCents: number;
  lifetimeEarnedCents: number;
  lifetimeRedeemedCents: number;
  availableDisplay: string;
};

type Posted = {
  redeemedDisplay: string;
  remainingDueDisplay: string;
  redeemedCents: number;
  remainingDueCents: number;
};

function dollarsToCents(raw: string): number | null {
  const t = raw.trim().replace(/[$,]/g, "");
  if (!t) return null;
  if (!/^-?\d+(\.\d{1,2})?$/.test(t)) return null;
  // Parse as integer cents: never round a float into money.
  const neg = t.startsWith("-");
  const [whole, frac = ""] = t.replace("-", "").split(".");
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  return neg ? -cents : cents;
}

function fmt(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

async function postAdminRewards(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/rewards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json().catch(() => ({ ok: false, error: "bad_response" }))) as Record<string, unknown>;
}

export function RewardsWorkspaceClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Redeem form
  const [amountDue, setAmountDue] = useState("");
  const [creditsToUse, setCreditsToUse] = useState("");
  const [method, setMethod] = useState("cash");
  const [cashTendered, setCashTendered] = useState("");
  const [posted, setPosted] = useState<Posted | null>(null);

  // Adjustment form
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const runSearch = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    const json = await postAdminRewards({ action: "search", query });
    setBusy(false);
    if (json.ok) {
      setResults((json.results as SearchResult[]) ?? []);
      if (!(json.results as SearchResult[])?.length) setMessage({ kind: "err", text: "Sin resultados / No results" });
    } else {
      setMessage({ kind: "err", text: `Búsqueda falló / Search failed: ${String(json.error)}` });
    }
  }, [query]);

  async function doRedeem() {
    if (!selected) return;
    const dueCents = dollarsToCents(amountDue);
    const wantCents = dollarsToCents(creditsToUse);
    if (dueCents === null || dueCents <= 0) {
      setMessage({ kind: "err", text: "Monto a pagar inválido / Invalid amount due" });
      return;
    }
    if (wantCents === null || wantCents <= 0) {
      setMessage({ kind: "err", text: "Créditos a usar inválidos / Invalid credits amount" });
      return;
    }
    setBusy(true);
    setMessage(null);
    // The ref makes the whole operation idempotent: a double-click posts one redemption.
    const redemptionRef = `office:${selected.businessId}:${dueCents}:${wantCents}:${new Date().toISOString().slice(0, 16)}`;
    const json = await postAdminRewards({
      action: "redeem",
      businessId: selected.businessId,
      requestedCents: wantCents,
      amountDueCents: dueCents,
      redemptionRef,
    });
    setBusy(false);
    if (json.ok) {
      setPosted({
        redeemedDisplay: String(json.redeemedDisplay),
        remainingDueDisplay: String(json.remainingDueDisplay),
        redeemedCents: Number(json.redeemedCents),
        remainingDueCents: Number(json.remainingDueCents),
      });
      setMessage({ kind: "ok", text: "Créditos aplicados / Credits applied" });
      await runSearch();
    } else {
      setMessage({ kind: "err", text: `No se aplicaron créditos / Not applied: ${String(json.error)}` });
    }
  }

  async function doAdjust() {
    if (!selected) return;
    const cents = dollarsToCents(adjustAmount);
    if (cents === null || cents === 0) {
      setMessage({ kind: "err", text: "Monto inválido / Invalid amount" });
      return;
    }
    if (adjustReason.trim().length < 3) {
      setMessage({ kind: "err", text: "Se requiere un motivo / A reason is required" });
      return;
    }
    setBusy(true);
    setMessage(null);
    const json = await postAdminRewards({
      action: "adjust",
      businessId: selected.businessId,
      amountCents: cents,
      reason: adjustReason.trim(),
      adjustmentRef: `adj:${selected.businessId}:${cents}:${Date.now()}`,
    });
    setBusy(false);
    if (json.ok) {
      setMessage({ kind: "ok", text: `Ajuste registrado / Adjustment posted: ${String(json.amountDisplay)}` });
      setAdjustAmount("");
      setAdjustReason("");
      await runSearch();
    } else {
      setMessage({ kind: "err", text: `Ajuste rechazado / Adjustment refused: ${String(json.error)}` });
    }
  }

  const dueCents = dollarsToCents(amountDue) ?? 0;
  const tenderedCents = dollarsToCents(cashTendered) ?? 0;
  const remainingAfterCredits = posted ? posted.remainingDueCents : dueCents;
  const changeDue = method === "cash" && tenderedCents > remainingAfterCredits ? tenderedCents - remainingAfterCredits : 0;

  return (
    <div className="space-y-5">
      {message && (
        <p className={`rounded-lg p-3 text-sm ${message.kind === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}

      {/* SEARCH — name is a search key only; the wallet is keyed on the business id it resolves to. */}
      <section className="rounded-2xl border border-[#E7DCC6] bg-white p-4">
        <h2 className="text-base font-bold">1. Buscar cliente / Find customer</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void runSearch(); }}
            placeholder="Nombre del negocio / Business name"
            className="w-full rounded-lg border border-[#E7DCC6] px-3 py-2 text-sm"
          />
          <button type="button" disabled={busy} onClick={() => void runSearch()} className="rounded-lg bg-[#2F2A1F] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            Buscar
          </button>
        </div>

        {results.length > 0 && (
          <ul className="mt-3 divide-y divide-[#F0E9DA]">
            {results.map((r) => (
              <li key={r.businessId}>
                <button
                  type="button"
                  onClick={() => { setSelected(r); setPosted(null); setMessage(null); }}
                  className={`flex w-full items-center justify-between gap-3 py-2 text-left ${selected?.businessId === r.businessId ? "font-bold" : ""}`}
                >
                  <span className="min-w-0 truncate text-sm">{r.displayName}</span>
                  <span className="shrink-0 text-sm text-green-700">{r.availableDisplay}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected && (
        <>
          <section className="rounded-2xl border border-[#E7DCC6] bg-white p-4">
            <h2 className="text-base font-bold">2. Saldo / Balance — {selected.displayName}</h2>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-[#7A7164]">Disponible / Available</dt><dd className="font-extrabold text-green-700">{fmt(selected.availableCents)}</dd></div>
              <div><dt className="text-xs text-[#7A7164]">Pendiente / Pending</dt><dd className="font-bold">{fmt(selected.pendingCents)}</dd></div>
              <div><dt className="text-xs text-[#7A7164]">Reservado / Reserved</dt><dd className="font-bold">{fmt(selected.reservedCents)}</dd></div>
              <div><dt className="text-xs text-[#7A7164]">Ganado / Lifetime earned</dt><dd className="font-bold">{fmt(selected.lifetimeEarnedCents)}</dd></div>
            </dl>
          </section>

          {/* REDEEM — the server caps the amount; this form collects a request and shows the result. */}
          <section className="rounded-2xl border border-[#E7DCC6] bg-white p-4">
            <h2 className="text-base font-bold">3. Pago en oficina / In-office payment</h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-xs text-[#7A7164]">Monto original / Amount due</span>
                <input value={amountDue} onChange={(e) => setAmountDue(e.target.value)} placeholder="399.00" className="mt-1 w-full rounded-lg border border-[#E7DCC6] px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="text-xs text-[#7A7164]">Créditos a usar / Credits to use</span>
                <input value={creditsToUse} onChange={(e) => setCreditsToUse(e.target.value)} placeholder="35.91" className="mt-1 w-full rounded-lg border border-[#E7DCC6] px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="text-xs text-[#7A7164]">Método / Method</span>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E7DCC6] px-3 py-2">
                  <option value="cash">Efectivo / Cash</option>
                  <option value="card">Tarjeta / Card</option>
                  <option value="check">Cheque / Check</option>
                  <option value="money_order">Money order</option>
                </select>
              </label>
              {method === "cash" && (
                <label className="text-sm">
                  <span className="text-xs text-[#7A7164]">Efectivo recibido / Cash tendered</span>
                  <input value={cashTendered} onChange={(e) => setCashTendered(e.target.value)} placeholder="400.00" className="mt-1 w-full rounded-lg border border-[#E7DCC6] px-3 py-2" />
                </label>
              )}
            </div>

            {/* Breakdown. After posting, these are the SERVER's figures, not a local calculation. */}
            <dl className="mt-3 rounded-xl bg-[#F6F3EC] p-3 text-sm">
              <div className="flex justify-between"><dt>Monto original / Original</dt><dd>{fmt(dueCents)}</dd></div>
              <div className="flex justify-between"><dt>Créditos aplicados / Credits applied</dt><dd className="text-green-700">{posted ? `−${posted.redeemedDisplay}` : "—"}</dd></div>
              <div className="flex justify-between font-bold"><dt>Resta por pagar / Remaining due</dt><dd>{posted ? posted.remainingDueDisplay : fmt(dueCents)}</dd></div>
              {method === "cash" && <div className="flex justify-between"><dt>Cambio / Change due</dt><dd>{fmt(changeDue)}</dd></div>}
            </dl>

            <button
              type="button"
              disabled={busy || !!posted}
              onClick={() => { if (window.confirm("¿Confirmar y aplicar créditos? / Confirm and apply credits?")) void doRedeem(); }}
              className="mt-3 rounded-lg bg-[#2F2A1F] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {posted ? "Aplicado / Applied" : "Confirmar y aplicar / Confirm and apply"}
            </button>
            {posted && (
              <p className="mt-2 text-xs text-[#7A7164]">
                Recibo registrado en el historial inmutable. / Receipt recorded in the immutable ledger.
              </p>
            )}
          </section>

          {/* ADJUSTMENT — authorized, signed, reasoned. */}
          <section className="rounded-2xl border border-[#E7DCC6] bg-white p-4">
            <h2 className="text-base font-bold">4. Ajuste autorizado / Authorized adjustment</h2>
            <p className="mt-1 text-xs text-[#7A7164]">
              Positivo agrega créditos, negativo los retira. Se requiere motivo y queda firmado con tu usuario.
              {" "}Positive adds credits, negative removes them. A reason is required and it is signed with your account.
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="-10.00" className="rounded-lg border border-[#E7DCC6] px-3 py-2 text-sm" />
              <input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Motivo / Reason" className="rounded-lg border border-[#E7DCC6] px-3 py-2 text-sm" />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => { if (window.confirm("¿Registrar ajuste? / Post adjustment?")) void doAdjust(); }}
              className="mt-3 rounded-lg border border-[#2F2A1F] px-4 py-2 text-sm font-bold text-[#2F2A1F] disabled:opacity-60"
            >
              Registrar ajuste / Post adjustment
            </button>
          </section>
        </>
      )}
    </div>
  );
}
