"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import type { LeonixPaymentRecordRow } from "@/app/admin/_lib/paymentTrackerData";

type PackageOption = { packageKey: string; category: string; label: string; priceCents: number };

/** Package E Build E3, Gate 4 — the only real, approved manual payment methods (mirrors the
 * exact `ManualPaymentMethod` union in app/lib/listingPlans/manualClearedPayments.ts). Never
 * invented — this list IS the backend's own type, kept in sync manually since that type isn't a
 * runtime value the client can import. */
const MANUAL_PAYMENT_METHODS = [
  { value: "zelle", label: "Zelle" },
  { value: "ach", label: "ACH transfer" },
  { value: "cash", label: "Cash receipt" },
  { value: "check", label: "Approved check" },
  { value: "money_order", label: "Money order" },
  { value: "other", label: "Other (specify in notes)" },
] as const;

function formatMoney(cents: number | null, currency = "usd"): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

export function ManualPaymentClient({
  packageOptions,
  pendingManual,
}: {
  packageOptions: PackageOption[];
  pendingManual: LeonixPaymentRecordRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  async function callManualPaymentsApi(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/revenue-os/manual-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { ok?: boolean; message?: string; code?: string };
    return { ok: res.ok && Boolean(json.ok), json };
  }

  async function handleRecordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const form = new FormData(e.currentTarget);
    const amountDollars = Number(form.get("amountDollars") ?? 0);
    const { ok, json } = await callManualPaymentsApi({
      action: "record",
      ownerUserId: String(form.get("ownerUserId") ?? "").trim() || null,
      customerName: String(form.get("customerName") ?? "").trim() || null,
      customerEmail: String(form.get("customerEmail") ?? "").trim() || null,
      businessName: String(form.get("businessName") ?? "").trim() || null,
      category: String(form.get("category") ?? "").trim(),
      listingId: String(form.get("listingId") ?? "").trim() || null,
      leonixAdId: String(form.get("leonixAdId") ?? "").trim() || null,
      packageKey: String(form.get("packageKey") ?? "").trim(),
      amountCents: Number.isFinite(amountDollars) ? Math.round(amountDollars * 100) : 0,
      method: String(form.get("method") ?? "other"),
      receivedAt: String(form.get("receivedAt") ?? "").trim() || null,
      evidenceReference: String(form.get("evidenceReference") ?? "").trim() || null,
      notes: String(form.get("notes") ?? "").trim() || null,
    });
    setBusy(false);
    if (ok) {
      setSuccess("Payment recorded as pending verification. Verify it below once funds are confirmed cleared.");
      e.currentTarget.reset();
      router.refresh();
    } else {
      setError(json.message ?? json.code ?? "Could not record payment.");
    }
  }

  async function handleRowAction(paymentRecordId: string, action: "verify_cleared" | "reject") {
    setRowBusyId(paymentRecordId);
    setError(null);
    setSuccess(null);
    const { ok, json } = await callManualPaymentsApi(
      action === "verify_cleared"
        ? { action, paymentRecordId }
        : { action, paymentRecordId, reason: window.prompt("Reason for rejecting this payment (optional):") ?? null },
    );
    setRowBusyId(null);
    if (ok) {
      setSuccess(action === "verify_cleared" ? "Payment verified cleared — package entitlement activated." : "Payment rejected.");
      router.refresh();
    } else {
      setError(json.message ?? json.code ?? "Action failed.");
    }
  }

  return (
    <>
      {error ? (
        <div className={`${adminCardBase} mb-4 border-2 border-red-200 bg-red-50 p-4 text-sm text-red-900`}>{error}</div>
      ) : null}
      {success ? (
        <div className={`${adminCardBase} mb-4 border-2 border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900`}>
          {success}
        </div>
      ) : null}

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">Record a manual payment</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          This creates a real, pending record — it does not activate anything until verified cleared below.
        </p>
        <form onSubmit={handleRecordSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Package
            <select name="packageKey" required className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm" onChange={(e) => {
              const opt = packageOptions.find((p) => p.packageKey === e.currentTarget.value);
              const catInput = e.currentTarget.form?.elements.namedItem("category") as HTMLInputElement | null;
              if (opt && catInput) catInput.value = opt.category;
            }}>
              <option value="">Select a package…</option>
              {packageOptions.map((p) => (
                <option key={p.packageKey} value={p.packageKey}>
                  {p.label} — {formatMoney(p.priceCents)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Category (auto-filled from package)
            <input name="category" required readOnly className="rounded-lg border border-[#E8DFD0] bg-[#FAF7F2] px-2.5 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Amount received (USD)
            <input name="amountDollars" type="number" step="0.01" min="0.01" required className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Payment method
            <select name="method" required className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm">
              {MANUAL_PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Customer / business name
            <input name="businessName" className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Customer name
            <input name="customerName" className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Customer email
            <input name="customerEmail" type="email" className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Owner user id (if a real profile exists)
            <input name="ownerUserId" placeholder="uuid — optional" className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Listing id (if this payment is for an existing listing)
            <input name="listingId" placeholder="uuid — optional" className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Leonix Ad ID (optional)
            <input name="leonixAdId" className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Date received
            <input name="receivedAt" type="date" className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
            Receipt / reference number
            <input name="evidenceReference" placeholder="Zelle confirmation, check #, receipt #…" className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Notes
            <textarea name="notes" rows={2} className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-2 text-sm" />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-[#2A2620] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "Recording…" : "Record payment (pending verification)"}
            </button>
          </div>
        </form>
      </div>

      <div className={`${adminCardBase} p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">Pending manual payments</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Verify only after funds are actually confirmed cleared — this activates the package entitlement exactly once.
        </p>
        {pendingManual.length === 0 ? (
          <p className="mt-3 text-sm text-[#5C5346]">No manual payments pending verification.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pendingManual.map((r) => (
              <li key={r.id} className="rounded-xl border border-[#E8DFD0] bg-white/80 p-3 text-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#1E1810]">
                      {r.business_name ?? r.customer_name ?? "—"} — {r.category ?? "—"} ({r.package_key ?? r.package_tier ?? "—"})
                    </p>
                    <p className="mt-0.5 text-[#5C5346]">
                      {formatMoney(r.amount_total_cents, r.currency)} · {r.manual_method ?? "—"}
                      {r.evidence_reference ? ` · ref: ${r.evidence_reference}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={rowBusyId === r.id}
                      onClick={() => void handleRowAction(r.id, "verify_cleared")}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-900 disabled:opacity-50"
                    >
                      Verify cleared
                    </button>
                    <button
                      type="button"
                      disabled={rowBusyId === r.id}
                      onClick={() => void handleRowAction(r.id, "reject")}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-bold text-red-900 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
