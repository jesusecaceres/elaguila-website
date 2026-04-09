import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";

import { AdminViajesPublicSurfaceMap } from "../_components/AdminViajesPublicSurfaceMap";
import { AdminViajesAffiliateCardsManager } from "./AdminViajesAffiliateCardsManager";

export default function AdminViajesAffiliateCardsPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · affiliate lane"
        title="Affiliate Cards"
        subtitle="Partner-managed offers curated by Leonix. This list feeds homepage rails, results eligibility, and campaigns — not the business self-serve branch."
        helperText="Public users never create affiliate cards from /publicar/viajes. Business listings are moderated separately under Business Offers."
      />
      <AdminViajesPublicSurfaceMap />
      <AdminViajesAffiliateCardsManager />
    </>
  );
}
