import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminCardBase } from "@/app/admin/_components/adminTheme";

import { AdminViajesBusinessOffersModeration } from "./AdminViajesBusinessOffersModeration";

export default function AdminViajesBusinessOffersPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · business lane"
        title="Business Offers"
        subtitle="Moderation queue for operator-submitted offers. Trust, identity, and media review precede publication — distinct from affiliate partner cards."
        helperText="Business applications originate from /publicar/viajes/negocios. Affiliate inventory is managed only under Affiliate Cards."
      />
      <div className={`${adminCardBase} mb-6 space-y-2 p-5 text-sm text-[#5C5346]`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#A67C52]">Moderation model (launch)</p>
        <ul className="list-inside list-disc space-y-1 text-xs">
          <li>Business identity and public profile alignment matter before approval.</li>
          <li>Website and WhatsApp/phone proof may be required for first-time travel advertisers.</li>
          <li>Hero imagery passes a lightweight moderation state before going live.</li>
          <li>Expired or inconsistent offers should pause or return to “needs edits.”</li>
        </ul>
      </div>
      <AdminViajesBusinessOffersModeration />
    </>
  );
}
