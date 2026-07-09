"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { adminBtnSecondary } from "@/app/admin/_components/adminTheme";
import type { PromoRecentCardView } from "@/app/admin/_lib/promoCodeRecentCardMapper";
import {
  buildPromoFollowUpCopyLine,
  formatPromoUsageField,
  PROMO_MANUAL_FOLLOW_UP_REMINDER,
} from "@/app/admin/_lib/promoCodeDisplayHelpers";
import {
  PROMO_OS_CREAM_CARD,
  PROMO_OS_SERIF_TITLE,
  promoFilterChipClass,
} from "@/app/admin/_lib/promoCodeOsV2Theme";

type RecentFilterKey =
  | "all"
  | "newsletter"
  | "restaurantes"
  | "servicios"
  | "autos"
  | "rentas"
  | "active"
  | "redeemed"
  | "needs_attention"
  | "expired_revoked";

type FilterDef = {
  key: RecentFilterKey;
  label: string;
  tone?: "default" | "gold" | "burgundy" | "green";
};

const FILTERS: FilterDef[] = [
  { key: "all", label: "All" },
  { key: "newsletter", label: "Newsletter" },
  { key: "restaurantes", label: "Restaurantes" },
  { key: "servicios", label: "Servicios" },
  { key: "autos", label: "Autos" },
  { key: "rentas", label: "Rentas" },
  { key: "active", label: "Active", tone: "green" },
  { key: "redeemed", label: "Redeemed" },
  { key: "needs_attention", label: "Needs attention", tone: "burgundy" },
  { key: "expired_revoked", label: "Expired / revoked" },
];

function matchesFilter(card: PromoRecentCardView, filter: RecentFilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "newsletter":
      return card.codeType === "newsletter";
    case "restaurantes":
      return card.categoryKey === "restaurantes";
    case "servicios":
      return card.categoryKey === "servicios";
    case "autos":
      return card.categoryKey === "autos";
    case "rentas":
      return card.categoryKey === "rentas";
    case "active":
      return card.effectiveStatus === "active";
    case "redeemed":
      return card.effectiveStatus === "redeemed" || card.hasUsage;
    case "needs_attention":
      return card.needsAttention;
    case "expired_revoked":
      return card.effectiveStatus === "expired" || card.effectiveStatus === "revoked";
    default:
      return true;
  }
}

function matchesSearch(card: PromoRecentCardView, q: string): boolean {
  if (!q.trim()) return true;
  const hay = [
    card.code,
    card.customerName,
    card.customerEmail,
    card.customerPhone,
    card.assignedLine,
    card.salesRep,
    card.sourceLabel,
    card.categoryLabel,
    card.purposeLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q.trim().toLowerCase());
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-950";
    case "draft":
      return "bg-amber-100 text-amber-950";
    case "expired":
      return "bg-stone-200 text-stone-800";
    case "revoked":
      return "bg-rose-100 text-rose-950";
    case "redeemed":
      return "bg-violet-100 text-violet-950";
    default:
      return "bg-[#F4F0E8] text-[#5C5346]";
  }
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime())
      ? d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
      : iso;
  } catch {
    return iso;
  }
}

function money(cents: number | null) {
  if (cents == null || !Number.isFinite(cents)) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

async function copyText(text: string, label: string, setFlash: (s: string | null) => void) {
  try {
    await navigator.clipboard.writeText(text);
    setFlash(`Copied ${label}`);
    setTimeout(() => setFlash(null), 2000);
  } catch {
    setFlash(`Could not copy ${label}`);
    setTimeout(() => setFlash(null), 2500);
  }
}

type PromoCodeRecentCodesPanelProps = {
  cards: PromoRecentCardView[];
  revokeAction: (formData: FormData) => Promise<void>;
  filterState: {
    q: string;
    category: string;
    code_type: string;
    status: string;
    attention: string;
    delivery_status: string;
  };
};

export function PromoCodeRecentCodesPanel({
  cards,
  revokeAction,
  filterState,
}: PromoCodeRecentCodesPanelProps) {
  const [activeFilter, setActiveFilter] = useState<RecentFilterKey>("all");
  const [search, setSearch] = useState("");
  const [copyFlash, setCopyFlash] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = new Map<RecentFilterKey, number>();
    for (const f of FILTERS) {
      map.set(f.key, cards.filter((c) => matchesFilter(c, f.key)).length);
    }
    return map;
  }, [cards]);

  const visible = useMemo(
    () => cards.filter((c) => matchesFilter(c, activeFilter) && matchesSearch(c, search)),
    [cards, activeFilter, search],
  );

  return (
    <section className={`${PROMO_OS_CREAM_CARD} p-4 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={PROMO_OS_SERIF_TITLE}>Recent codes</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Filter and search loaded codes. Server filters above still control what data is fetched.
          </p>
        </div>
        {copyFlash ? (
          <span className="rounded-full border border-[#C9B46A]/70 bg-[#FBF3DC] px-2.5 py-1 text-[10px] font-semibold text-[#4A3F2A]">
            {copyFlash}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search code, email, customer, business, source…"
          className="w-full rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2 text-xs text-[#1E1810] placeholder:text-[#7A7164] focus:border-[#C9B46A] focus:outline-none focus:ring-1 focus:ring-[#C9B46A]/50"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key)}
            className={promoFilterChipClass(activeFilter === f.key, f.tone ?? "default")}
          >
            {f.label}
            <span className="ml-1 tabular-nums opacity-75">({counts.get(f.key) ?? 0})</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-[#5C5346]/90">No codes match this filter or search.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {visible.map((card) => (
            <li key={card.id} className="rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7] p-3 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E8DFD0]/50 pb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-bold text-[#1E1810]">{card.code}</p>
                  <p className="mt-0.5 text-[#5C5346]">
                    <span className="font-semibold text-[#1E1810]">{card.purposeLabel}</span>
                    {" · "}
                    {card.usageModeLabel}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(card.effectiveStatus)}`}
                    title={card.statusHint}
                  >
                    {card.statusLabel}
                    {card.effectiveStatus !== card.storedStatus
                      ? ` (stored: ${card.storedStatus})`
                      : ""}
                  </span>
                  {card.deliveryLabel ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${card.deliveryClassName ?? ""}`}
                      title={card.deliveryHint ?? undefined}
                    >
                      Delivery: {card.deliveryLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">Assignment</p>
                <div className="mt-1 grid gap-1 sm:grid-cols-2">
                  <p className="text-[#5C5346]">
                    <span className="font-semibold text-[#1E1810]">Customer:</span> {card.customerName}
                  </p>
                  <p className="text-[#5C5346]">
                    <span className="font-semibold text-[#1E1810]">Email:</span>{" "}
                    {card.customerEmail ?? "Not available"}
                  </p>
                  {card.customerPhone ? (
                    <p className="text-[#5C5346]">
                      <span className="font-semibold text-[#1E1810]">Phone:</span> {card.customerPhone}
                    </p>
                  ) : null}
                  {card.assignedLine ? (
                    <p className="text-[#7A7164] sm:col-span-2">
                      <span className="font-semibold">Assigned line:</span> {card.assignedLine}
                    </p>
                  ) : null}
                  {card.salesRep ? (
                    <p className="text-[#7A7164] sm:col-span-2">
                      <span className="font-semibold">Sales rep:</span> {card.salesRep}
                    </p>
                  ) : null}
                  <p className="text-[#5C5346] sm:col-span-2">
                    <span className="font-semibold text-[#1E1810]">Source:</span> {card.sourceLabel}
                  </p>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">Scope</p>
                <div className="mt-1 grid gap-1 sm:grid-cols-2">
                  <p className="text-[#5C5346]">
                    <span className="font-semibold text-[#1E1810]">Category:</span> {card.categoryLabel}
                  </p>
                  <p className="text-[#5C5346]">
                    <span className="font-semibold text-[#1E1810]">Discount:</span>{" "}
                    <span className={card.missingDiscount ? "font-semibold text-rose-700" : ""}>
                      {card.discountSummary}
                    </span>
                  </p>
                  <p className="text-[#5C5346] sm:col-span-2">
                    <span className="font-semibold text-[#1E1810]">Package scope:</span> {card.packageScopeLabel}
                  </p>
                  {card.packageTier ? (
                    <p className="text-[#5C5346]">
                      <span className="font-semibold text-[#1E1810]">Package tier:</span> {card.packageTier}
                    </p>
                  ) : null}
                  <p className="text-[#7A7164]">
                    {card.oneTimeUse ? "One-time use" : "Multi-use"}
                    {card.nonStackable ? " · Non-stackable" : ""}
                  </p>
                </div>
              </div>

              <div className="mt-2 rounded-lg border border-[#E8DFD0]/60 bg-white/60 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">Usage / payment</p>
                <p className="mt-1 text-[#5C5346]">
                  <span className="font-semibold text-[#1E1810]">Summary:</span> {card.usageSummary}
                </p>
                <p className="mt-0.5 text-[#7A7164]">
                  Created {fmt(card.createdAt)} · Expires {fmt(card.expiresAt || null)} · redemptions{" "}
                  {card.redemptionCount}
                  {card.maxRedemptions != null ? ` / ${card.maxRedemptions}` : ""}
                </p>
                {card.usage.length === 0 ? (
                  <p className="mt-1 text-[#5C5346]">No linked paid usage yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {card.usage.map((entry) => (
                      <li key={entry.redemptionId} className="rounded-md border border-[#E8DFD0]/50 p-2">
                        {entry.usedBusinessName ? (
                          <p>
                            <span className="font-semibold text-[#1E1810]">Business:</span> {entry.usedBusinessName}
                          </p>
                        ) : null}
                        {entry.usedEmail ? (
                          <p>
                            <span className="font-semibold text-[#1E1810]">Customer email:</span> {entry.usedEmail}
                          </p>
                        ) : null}
                        <p>
                          <span className="font-semibold text-[#1E1810]">Phone:</span>{" "}
                          {formatPromoUsageField(entry.businessPhone)}
                        </p>
                        {entry.businessEmail ? (
                          <p>
                            <span className="font-semibold text-[#1E1810]">Business email:</span> {entry.businessEmail}
                          </p>
                        ) : null}
                        <p>
                          <span className="font-semibold text-[#1E1810]">Address:</span>{" "}
                          {entry.businessAddress ?? "Not captured"}
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E1810]">Category / package:</span>{" "}
                          {formatPromoUsageField(entry.category)} · {formatPromoUsageField(entry.packageKey)}
                        </p>
                        {entry.addOnKeys.length ? (
                          <p>
                            <span className="font-semibold text-[#1E1810]">Add-ons:</span> {entry.addOnKeys.join(", ")}
                          </p>
                        ) : null}
                        <p>
                          <span className="font-semibold text-[#1E1810]">Listing ID:</span>{" "}
                          {formatPromoUsageField(entry.listingId)}
                          {" · "}
                          <span className="font-semibold text-[#1E1810]">Leonix Ad ID:</span>{" "}
                          {formatPromoUsageField(entry.leonixAdId)}
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E1810]">Payment:</span> {entry.paymentStatus ?? "—"}
                          {entry.webhookRedeemed ? " · redeemed after webhook" : ""}
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E1810]">Payment record:</span>{" "}
                          {formatPromoUsageField(entry.paymentRecordId)}
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E1810]">Stripe session:</span>{" "}
                          {formatPromoUsageField(entry.stripeCheckoutSessionId)}
                        </p>
                        {entry.stripePaymentIntentId ? (
                          <p>
                            <span className="font-semibold text-[#1E1810]">Stripe payment intent:</span>{" "}
                            {entry.stripePaymentIntentId}
                          </p>
                        ) : null}
                        {entry.redeemedAt ? (
                          <p>
                            <span className="font-semibold text-[#1E1810]">Redeemed at:</span> {fmt(entry.redeemedAt)}
                          </p>
                        ) : null}
                        <p>
                          <span className="font-semibold text-[#1E1810]">Amounts:</span>{" "}
                          {entry.subtotalCents ? `Original ${entry.subtotalCents}` : "Original —"}
                          {entry.amountDiscountCents ? ` · Discount ${entry.amountDiscountCents}` : ""}
                          {entry.amountTotalCents ? ` · Final ${entry.amountTotalCents}` : ""}
                          {entry.currency ? ` (${entry.currency.toUpperCase()})` : ""}
                        </p>
                        {entry.mismatchLabels.length ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {entry.mismatchLabels.map((lbl) => (
                              <span
                                key={lbl}
                                className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-950"
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entry.paymentTrackerHref ? (
                            <Link href={entry.paymentTrackerHref} className={adminBtnSecondary}>
                              View payment
                            </Link>
                          ) : null}
                          {entry.publicAdUrl ? (
                            <Link href={entry.publicAdUrl} className={adminBtnSecondary} target="_blank">
                              View published ad
                            </Link>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-2 rounded-lg border border-[#C9B46A]/40 bg-[#FBF3DC]/50 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B5B2E]">Next action</p>
                <p className="mt-1 font-medium text-[#1E1810]">{card.nextAction}</p>
                <p className="mt-1 text-[10px] text-[#7A7164]">
                  <span className="font-semibold text-[#6B5B2E]">Follow-up:</span> {card.followUp}
                </p>
                <p className="mt-1 text-[10px] text-[#7A7164]">{PROMO_MANUAL_FOLLOW_UP_REMINDER}</p>
              </div>

              {card.attentionLabels.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {card.attentionLabels.map((lbl) => (
                    <span
                      key={lbl}
                      className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-950"
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
              ) : null}

              {card.ruleBadges.length ? (
                <p className="mt-1 text-[10px] text-[#7A7164]">{card.ruleBadges.join(" · ")}</p>
              ) : null}

              {card.notesPreview ? (
                <p className="mt-2 rounded border border-[#E8DFD0]/60 bg-white/50 p-2 text-[10px] text-[#5C5346]">
                  <span className="font-semibold text-[#1E1810]">Internal notes (read-only):</span> {card.notesPreview}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={adminBtnSecondary}
                  onClick={() => copyText(card.code, "code", setCopyFlash)}
                >
                  Copy code
                </button>
                {card.customerEmail ? (
                  <button
                    type="button"
                    className={adminBtnSecondary}
                    onClick={() => copyText(card.customerEmail!, "email", setCopyFlash)}
                  >
                    Copy email
                  </button>
                ) : null}
                <button
                  type="button"
                  className={adminBtnSecondary}
                  onClick={() =>
                    copyText(buildPromoFollowUpCopyLine(card.code, card.customerName), "follow-up", setCopyFlash)
                  }
                >
                  Copy follow-up
                </button>
                {card.canRevoke ? (
                  <form action={revokeAction}>
                    <input type="hidden" name="id" value={card.id} />
                    <input type="hidden" name="q" value={filterState.q} />
                    <input type="hidden" name="category" value={filterState.category} />
                    <input type="hidden" name="code_type" value={filterState.code_type} />
                    <input type="hidden" name="status" value={filterState.status} />
                    <input type="hidden" name="attention" value={filterState.attention} />
                    <input type="hidden" name="delivery_status" value={filterState.delivery_status} />
                    <button type="submit" className={adminBtnSecondary}>
                      Revoke
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[10px] text-[#7A7164]">
        Notes are set at creation in this gate. Editable follow-up notes can be a future admin gate.
      </p>
    </section>
  );
}
