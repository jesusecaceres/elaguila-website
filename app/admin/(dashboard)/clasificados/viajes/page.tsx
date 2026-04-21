import Link from "next/link";

import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { countViajesStagedByStatuses } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { AdminViajesAnalyticsPlaceholders } from "./_components/AdminViajesAnalyticsPlaceholders";
import { ADMIN_VIAJES_OVERVIEW_MOCK } from "@/app/admin/_lib/adminViajesOverviewMock";

export default async function AdminViajesOverviewPage() {
  const m = ADMIN_VIAJES_OVERVIEW_MOCK;
  let approvedViajes: number;
  let pendingViajes: number;
  if (isSupabaseAdminConfigured()) {
    approvedViajes = await countViajesStagedByStatuses(["approved"]);
    pendingViajes = await countViajesStagedByStatuses(["submitted", "in_review", "changes_requested"]);
  } else {
    approvedViajes = m.businessOffers;
    pendingViajes = m.pendingBusinessReviews;
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · internal"
        title="Overview"
        subtitle="Viajes staged queue counts load from Supabase when configured; other tiles may remain illustrative."
        helperText="Affiliate cards are authored only in Admin → Viajes → Affiliate Cards. Business listings use the public business branch and moderation tools below."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Affiliate offers (live)" value={m.affiliateOffers} hint="Partner-managed inventory" accent="amber" />
        <AdminStatCard title="Business offers (approved)" value={approvedViajes} hint="viajes_staged_listings · approved" />
        <AdminStatCard title="Pending Viajes review" value={pendingViajes} hint="Submitted / in review / changes requested" accent="rose" />
        <AdminStatCard title="Expired / paused" value={m.expiredOffers} hint="Needs refresh or unpublish" />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title="Featured homepage cards"
          value={m.featuredHomepageSlots}
          hint="Top-of-funnel placements"
          actionLabel="Open campaigns"
          actionHref="/admin/clasificados/viajes/campaigns"
        />
        <AdminStatCard
          title="Active seasonal campaigns"
          value={m.activeSeasonalCampaigns}
          hint="Verano, último minuto, etc."
          actionLabel="Campaigns"
          actionHref="/admin/clasificados/viajes/campaigns"
        />
        <AdminStatCard
          title="Editorial pieces"
          value={m.editorialPieces}
          hint="Guides & ideas (internal)"
          actionLabel="Editorial"
          actionHref="/admin/clasificados/viajes/editorial"
        />
      </div>

      <p className="mb-6 text-xs text-[#7A7164]">{m.lastSyncedNote}</p>

      <AdminViajesAnalyticsPlaceholders />

      <div className={`${adminCardBase} p-5`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Quick links</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/clasificados/viajes/affiliate-cards" className={adminCtaChipSecondary}>
            Affiliate Cards
          </Link>
          <Link href="/admin/clasificados/viajes/business-offers" className={adminCtaChipSecondary}>
            Business Offers
          </Link>
          <Link href="/admin/clasificados/viajes/campaigns" className={adminCtaChipSecondary}>
            Campaigns / Seasonal
          </Link>
          <Link href="/admin/clasificados/viajes/settings" className={adminCtaChipSecondary}>
            Settings / Rules
          </Link>
          <Link href="/clasificados/viajes" target="_blank" rel="noopener noreferrer" className={adminCtaChipSecondary}>
            Public Viajes (new tab)
          </Link>
        </div>
      </div>
    </>
  );
}
