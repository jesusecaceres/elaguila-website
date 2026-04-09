import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminCardBase } from "@/app/admin/_components/adminTheme";

export default function AdminViajesEditorialPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · editorial lane"
        title="Editorial / Guides"
        subtitle="Leonix-owned discovery content — separate from affiliate partner cards and from business-submitted offers."
        helperText="Editorial does not replace disclosure on affiliate inventory; it can spotlight destinations and themes without implying a Leonix booking checkout."
      />
      <div className={`${adminCardBase} space-y-3 p-5`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#A67C52]">Lane separation</p>
        <ul className="list-inside list-disc space-y-2 text-sm text-[#5C5346]">
          <li>
            <strong className="text-[#1E1810]">Affiliate</strong> — managed under Affiliate Cards with partner labels and placements.
          </li>
          <li>
            <strong className="text-[#1E1810]">Business</strong> — operator listings moderated under Business Offers with profile linkage.
          </li>
          <li>
            <strong className="text-[#1E1810]">Editorial</strong> — guides, seasonal ideas, and storytelling authored by the content team (queue TBD).
          </li>
        </ul>
        <p className="text-xs text-[#7A7164]">Editorial publishing workflows and CMS hooks ship in a later phase; this page reserves the IA slot.</p>
      </div>
    </>
  );
}
