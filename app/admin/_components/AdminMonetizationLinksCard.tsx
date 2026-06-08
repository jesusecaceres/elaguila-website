import Link from "next/link";
import { AdminSectionCard } from "./AdminSectionCard";
import { adminCtaChip, adminCtaChipSecondary } from "./adminTheme";

type Props = {
  title: string;
  subtitle: string;
  entitlementsHref: string;
  entitlementsLabel: string;
  entitlementsHint: string;
  entitlementsCount: string;
  promoHref: string;
  promoLabel: string;
  promoHint: string;
  promoCount: string;
  paymentHref?: string;
  paymentLabel?: string;
  paymentHint?: string;
  paymentCount?: string;
  salesHref?: string;
  salesLabel?: string;
};

/** Compact monetization links — deep stats live on workspace pages, not the executive dashboard. */
export function AdminMonetizationLinksCard({
  title,
  subtitle,
  entitlementsHref,
  entitlementsLabel,
  entitlementsHint,
  entitlementsCount,
  promoHref,
  promoLabel,
  promoHint,
  promoCount,
  paymentHref,
  paymentLabel,
  paymentHint,
  paymentCount,
  salesHref,
  salesLabel,
}: Props) {
  return (
    <AdminSectionCard title={title} subtitle={subtitle}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href={entitlementsHref} className={`${adminCtaChipSecondary} flex-col items-start gap-1 p-4 text-left`}>
          <span className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{entitlementsLabel}</span>
          <span className="text-2xl font-bold text-[#1E1810]">{entitlementsCount}</span>
          <span className="text-[11px] leading-snug text-[#5C5346]">{entitlementsHint}</span>
        </Link>
        <Link href={promoHref} className={`${adminCtaChipSecondary} flex-col items-start gap-1 p-4 text-left`}>
          <span className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{promoLabel}</span>
          <span className="text-2xl font-bold text-[#1E1810]">{promoCount}</span>
          <span className="text-[11px] leading-snug text-[#5C5346]">{promoHint}</span>
        </Link>
        {paymentHref && paymentLabel ? (
          <Link href={paymentHref} className={`${adminCtaChipSecondary} flex-col items-start gap-1 p-4 text-left`}>
            <span className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{paymentLabel}</span>
            <span className="text-2xl font-bold text-[#1E1810]">{paymentCount ?? "—"}</span>
            <span className="text-[11px] leading-snug text-[#5C5346]">{paymentHint}</span>
          </Link>
        ) : null}
      </div>
      {salesHref && salesLabel ? (
        <Link href={salesHref} className={`${adminCtaChip} mt-4 inline-flex text-xs`}>
          {salesLabel} →
        </Link>
      ) : null}
    </AdminSectionCard>
  );
}
