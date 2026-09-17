import Link from "next/link";

import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { countViajesStagedByStatuses } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/**
 * Launch Truth Doctrine — this page previously showed several illustrative/mock stat tiles
 * (affiliate offers, expired/paused, featured homepage cards, seasonal campaigns, editorial
 * pieces) and a mock analytics panel, none backed by real data or a working save path. Only
 * Business Offers moderation (viajes_staged_listings, real Supabase counts + working
 * approve/reject actions) is a real, launch-ready Viajes capability today — this page now shows
 * only that.
 */
export default async function AdminViajesOverviewPage() {
  let approvedViajes = 0;
  let pendingViajes = 0;
  let dataUnavailable = !isSupabaseAdminConfigured();
  if (isSupabaseAdminConfigured()) {
    try {
      approvedViajes = await countViajesStagedByStatuses(["approved"]);
      pendingViajes = await countViajesStagedByStatuses(["submitted", "in_review", "changes_requested"]);
    } catch {
      dataUnavailable = true;
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · internal"
        title="Overview"
        subtitle="Business Offers moderation is the real, working Viajes tool today."
        helperText="Business listings use the public business branch and the moderation tools below."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <AdminStatCard
          title="Business offers (approved)"
          value={dataUnavailable ? "—" : approvedViajes}
          hint={dataUnavailable ? "Supabase unavailable" : "viajes_staged_listings · approved"}
        />
        <AdminStatCard
          title="Pending Viajes review"
          value={dataUnavailable ? "—" : pendingViajes}
          hint={dataUnavailable ? "Supabase unavailable" : "Submitted / in review / changes requested"}
          accent="rose"
        />
      </div>

      <div className={`${adminCardBase} p-5`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Quick links</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/clasificados/viajes/business-offers" className={adminCtaChipSecondary}>
            Business Offers
          </Link>
          <Link href="/clasificados/viajes" target="_blank" rel="noopener noreferrer" className={adminCtaChipSecondary}>
            Public Viajes (new tab)
          </Link>
        </div>
      </div>
    </>
  );
}
