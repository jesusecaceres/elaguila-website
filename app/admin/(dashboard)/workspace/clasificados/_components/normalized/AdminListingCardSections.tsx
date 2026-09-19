import Link from "next/link";
import type { ReactNode } from "react";

import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import type { AdminListingCommercialTruth } from "@/app/admin/_lib/adminListingCommercialTruth";
import type { PublicationTruth } from "@/app/admin/_lib/publicationSemantics";
import {
  ADMIN_CHIP_TONE_CLASS,
  ADMIN_COMMERCIAL_TONE_CLASS,
  ADMIN_SEMANTIC_TONE_CLASS,
  adminCommercialTone,
  adminListingRowChips,
  adminMoney,
  adminSemanticIsPublic,
  humanizeToken,
  type AdminRowChipInput,
} from "../../_lib/adminNormalizedShell";

// NOTE: client-safe on purpose (no hooks, no server-only imports) — the generic queue table is a
// client component and server pages (Autos, Empleos, Ofertas …) use the same sections.

const SECTION_LABEL = "text-[10px] font-bold uppercase tracking-wide text-[#7A7164]";

/** Layout: every category card / mobile row is these sections, in this order. Omitted slot = omitted section. */
export type AdminListingCardSectionsProps = {
  lang?: AdminLang;
  /** Identity block: title, Leonix Ad ID, city / price, chips. Rendered without a section label. */
  header?: ReactNode;
  /** LISTING TRUTH — see `AdminListingTruthSection`. */
  listingTruth?: ReactNode;
  /** COMMERCIAL TRUTH — see `AdminCommercialTruthSection`. Read-only. */
  commercialTruth?: ReactNode;
  /**
   * PERFORMANCE — only what really exists for the category (views, leads, applications, redemptions …).
   * Leave undefined when the category tracks nothing: the section is then omitted, never faked.
   */
  performance?: ReactNode;
  /** MODERATION / TRUST — the existing flag-truth block (`AdminListingFlagTruthBlock`) or category equivalent. */
  moderation?: ReactNode;
  /** ACTIONS — the ONE lifecycle action system (`ClassifiedAdminRowActions` / row actions panel). */
  actions?: ReactNode;
  className?: string;
  testId?: string;
};

function Section({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-1" data-testid={`admin-card-section-${id}`}>
      <p className={SECTION_LABEL}>{label}</p>
      {children}
    </section>
  );
}

export function AdminListingCardSections({
  lang = "en",
  header,
  listingTruth,
  commercialTruth,
  performance,
  moderation,
  actions,
  className,
  testId,
}: AdminListingCardSectionsProps) {
  return (
    <div className={`min-w-0 space-y-3 ${className ?? ""}`} data-testid={testId ?? "admin-listing-card-sections"}>
      {header ? <div className="min-w-0">{header}</div> : null}
      {listingTruth ? (
        <Section id="listing" label={adminTr(lang, "catShell.section.listing")}>
          {listingTruth}
        </Section>
      ) : null}
      {commercialTruth ? (
        <Section id="commercial" label={adminTr(lang, "catShell.section.commercial")}>
          {commercialTruth}
        </Section>
      ) : null}
      {performance ? (
        <Section id="performance" label={adminTr(lang, "catShell.section.performance")}>
          {performance}
        </Section>
      ) : null}
      {moderation ? (
        <Section id="moderation" label={adminTr(lang, "catShell.section.moderation")}>
          {moderation}
        </Section>
      ) : null}
      {actions ? (
        <Section id="actions" label={adminTr(lang, "catShell.section.actions")}>
          {actions}
        </Section>
      ) : null}
    </div>
  );
}

/** Lane / inventory-role chips (Bienes Raíces Negocio vs Privado, parent vs child …). */
export function AdminRowChips({ row, lang = "en" }: { row: AdminRowChipInput; lang?: AdminLang }) {
  const chips = adminListingRowChips(row);
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase" data-testid="admin-row-chips">
      {chips.map((c) => (
        <span key={c.key} className={`rounded-md border px-1.5 py-0.5 ${ADMIN_CHIP_TONE_CLASS[c.tone]}`} data-testid={`admin-row-chip-${c.key}`}>
          {adminTr(lang, c.labelKey)}
        </span>
      ))}
    </div>
  );
}

/**
 * LISTING TRUTH — the category's own status verbatim, whether the ad is public right now, and if not
 * exactly why (publicationSemantics). `truth = null` means "no safe canonical lookup": only the raw
 * status is shown and nothing is claimed about publicness.
 */
export function AdminListingTruthSection({
  lang = "en",
  status,
  truth,
  compact = false,
}: {
  lang?: AdminLang;
  status: string | null | undefined;
  truth: PublicationTruth | null | undefined;
  compact?: boolean;
}) {
  const raw = (status ?? "").trim() || truth?.rawStatus || "—";
  const isPublic = adminSemanticIsPublic(truth?.semantic);
  return (
    <div className="min-w-0 space-y-1" data-testid="admin-listing-truth">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-md border border-[#E8DFD0] bg-[#FAF3E6] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#3D3629]"
          title={adminTr(lang, "catShell.listing.status")}
          data-testid="admin-listing-truth-status"
        >
          {raw}
        </span>
        {truth ? (
          <span
            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${ADMIN_SEMANTIC_TONE_CLASS[truth.semantic]}`}
            data-testid="admin-listing-truth-semantic"
          >
            {isPublic ? adminTr(lang, "catShell.listing.public") : adminTr(lang, "catShell.listing.notPublic")}
            {" · "}
            {adminTr(lang, `catShell.semantic.${truth.semantic}`)}
          </span>
        ) : null}
      </div>
      {truth ? (
        <p className={`${compact ? "text-[11px]" : "text-xs"} leading-snug break-words text-[#5C5346]`} data-testid="admin-listing-truth-reason">
          {truth.reason}
        </p>
      ) : null}
    </div>
  );
}

function Line({ label, value, testId }: { label: string; value: ReactNode; testId?: string }) {
  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5" data-testid={testId}>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</dt>
      <dd className="min-w-0 break-words text-[11px] font-semibold text-[#3D3428]">{value}</dd>
    </div>
  );
}

/**
 * COMMERCIAL TRUTH — READ-ONLY payment / package / entitlement / subscription state plus the
 * checkout → paid → entitled → live circuit, from `loadAdminListingCommercialTruth`.
 * Unknown / not loaded is stated plainly; nothing here can imply "paid" without a payment record.
 */
export function AdminCommercialTruthSection({
  lang = "en",
  truth,
  compact = false,
}: {
  lang?: AdminLang;
  truth: AdminListingCommercialTruth | null | undefined;
  compact?: boolean;
}) {
  if (!truth) {
    return (
      <p className="text-[11px] leading-snug text-[#9A9084]" data-testid="admin-commercial-truth" data-state="not_loaded">
        {adminTr(lang, "catShell.commercial.notLoaded")}
      </p>
    );
  }
  if (truth.state === "unknown") {
    return (
      <div className="space-y-0.5" data-testid="admin-commercial-truth" data-state="unknown">
        <p className="rounded-md border border-[#E8DFD0] bg-white px-2 py-1 text-[11px] leading-snug text-[#7A7164]">
          {adminTr(lang, "catShell.commercial.unknown")}
        </p>
        {truth.note ? <p className="text-[10px] leading-snug text-[#9A9084]">{truth.note}</p> : null}
      </div>
    );
  }

  const tone = adminCommercialTone(truth);
  const amount = adminMoney(truth.amountPaidCents);
  const trackerHref = `/admin/workspace/payment-tracker?q=${encodeURIComponent(truth.listingId)}`;
  const hasAnyRelated = Boolean(truth.entitlementStatus || truth.subscriptionStatus);

  return (
    <div className="min-w-0 space-y-1.5" data-testid="admin-commercial-truth" data-state={truth.state}>
      {truth.state === "no_payment_record" ? (
        <p className="text-[11px] leading-snug text-[#5C5346]" data-testid="admin-commercial-no-record">
          {adminTr(lang, hasAnyRelated ? "catShell.commercial.noRecordEntitlement" : "catShell.commercial.noRecord")}
        </p>
      ) : (
        <div className={`rounded-md border px-2 py-1 ${ADMIN_COMMERCIAL_TONE_CLASS[tone]}`} data-testid="admin-commercial-circuit" data-tone={tone}>
          {truth.circuit ? (
            <>
              <p className="text-[11px] font-bold leading-snug">{truth.circuit.headline}</p>
              {compact ? (
                <details className="mt-0.5">
                  <summary className="cursor-pointer text-[10px] font-semibold opacity-80">{adminTr(lang, "catShell.commercial.circuit")}</summary>
                  <p className="mt-0.5 text-[10px] leading-snug">{truth.circuit.detail}</p>
                </details>
              ) : (
                <p className="mt-0.5 text-[10px] leading-snug">{truth.circuit.detail}</p>
              )}
            </>
          ) : (
            <p className="text-[11px] font-semibold leading-snug">{truth.note ?? adminTr(lang, "catShell.commercial.unknown")}</p>
          )}
        </div>
      )}

      <dl className="space-y-0.5">
        {truth.state === "known" ? (
          <Line
            label={adminTr(lang, "catShell.commercial.payment")}
            testId="admin-commercial-payment"
            value={
              <>
                {humanizeToken(truth.paymentStatus ?? "unknown")}
                {amount ? ` · ${amount}` : ""}
              </>
            }
          />
        ) : null}
        {truth.state === "known" && (truth.packageKey || truth.packageTier) ? (
          <Line label={adminTr(lang, "catShell.commercial.package")} testId="admin-commercial-package" value={truth.packageKey ?? truth.packageTier} />
        ) : null}
        {truth.entitlementStatus || truth.state === "known" ? (
          <Line
            label={adminTr(lang, "catShell.commercial.entitlement")}
            testId="admin-commercial-entitlement"
            value={truth.entitlementStatus ? humanizeToken(truth.entitlementStatus) : adminTr(lang, "catShell.commercial.none")}
          />
        ) : null}
        {truth.subscriptionStatus ? (
          <Line label={adminTr(lang, "catShell.commercial.subscription")} testId="admin-commercial-subscription" value={humanizeToken(truth.subscriptionStatus)} />
        ) : null}
      </dl>

      {truth.state === "known" ? (
        <Link className="text-[10px] font-semibold text-[#6B5B2E] underline" href={trackerHref} data-testid="admin-commercial-tracker-link">
          {adminTr(lang, "catShell.commercial.viewTracker")}
        </Link>
      ) : null}
      <p className="text-[10px] leading-snug text-[#9A9084]" title={adminTr(lang, "catShell.commercial.readOnly")}>
        {compact ? null : adminTr(lang, "catShell.commercial.readOnly")}
      </p>
    </div>
  );
}

/** PERFORMANCE placeholder for categories that track nothing — states it plainly instead of faking numbers. */
export function AdminPerformanceNone({ lang = "en" }: { lang?: AdminLang }) {
  return (
    <p className="text-[11px] leading-snug text-[#9A9084]" data-testid="admin-performance-none">
      {adminTr(lang, "catShell.performance.none")}
    </p>
  );
}
