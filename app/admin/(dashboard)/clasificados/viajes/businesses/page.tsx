import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminCardBase } from "@/app/admin/_components/adminTheme";

import { AdminViajesBusinessesTable } from "./AdminViajesBusinessesTable";

export default function AdminViajesBusinessesPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · business lane"
        title="Businesses / Profiles"
        subtitle="Internal directory of travel agencies and operators. Plan tiers and trust states are placeholders for future billing and verification workflows."
        helperText="This is not a CRM — it anchors moderation decisions and public profile links for approved businesses."
      />
      <div className={`${adminCardBase} mb-6 space-y-2 p-5 text-sm text-[#5C5346]`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#A67C52]">Future-ready fields</p>
        <ul className="list-inside list-disc space-y-1 text-xs">
          <li>Standard vs Plus plans will gate placement depth and support SLAs when billing connects.</li>
          <li>Trust placeholders will map to verification artifacts (site, WhatsApp, media) from moderation.</li>
          <li>Profile status stays independent from individual offer rows — pause a business without deleting history.</li>
        </ul>
      </div>
      <AdminViajesBusinessesTable />
    </>
  );
}
