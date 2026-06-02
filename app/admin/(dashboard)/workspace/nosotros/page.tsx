import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase, adminBtnSecondary } from "../../../_components/adminTheme";

const TOPICS = [
  {
    title: "Story & positioning",
    body: "Headline, lead, mission, vision, and values — all saved in the editor and shown on `/about`.",
  },
  {
    title: "Team & leadership",
    body: "Team gallery or long bios do not have dedicated fields yet; long copy can go in lead/values until a dedicated section exists.",
  },
  {
    title: "Media & credibility",
    body: "Optional image (URL) in the editor; partner logos in an extra block are still a design decision (no persisted carousel yet).",
  },
  {
    title: "Calls to action",
    body: "Two CTAs with URL (e.g. contact and tienda). Align messaging with Contacto and the global bar when applicable.",
  },
] as const;

export default function AdminWorkspaceNosotrosPage() {
  return (
    <div>
      <AdminPageHeader
        title="Nosotros — who we are"
        subtitle="The public page is `/about` (bilingual copy from the database). The block map below is training guidance; the real editor is under Content."
        eyebrow="Workspace · Nosotros"
        helperText="Users, payments, and support stay in the global sidebar. Do not use this page for Tienda orders."
      />

      <div className={`${adminCardBase} mb-6 border-[#7A9E6F]/35 bg-[#F8FCF6] p-4 text-sm text-[#2C4A22]`}>
        <strong>Reserved content (DB):</strong>{" "}
        <Link href="/admin/workspace/nosotros/content" className={`${adminBtnSecondary} ml-2 inline-flex`}>
          Content editor (`/about`)
        </Link>
      </div>

      <p className="mb-6 max-w-3xl text-sm text-[#5C5346]">
        <strong className="text-[#1E1810]">What this workspace controls:</strong> the public `/about` page, not global operations. For cross-site data, use{" "}
        <Link href="/admin/site-settings" className="font-bold text-[#6B5B2E] underline">
          global settings
        </Link>
        .
      </p>

      <div className="grid gap-4">
        {TOPICS.map((b) => (
          <section key={b.title} className={`${adminCardBase} p-5`}>
            <h2 className="text-base font-bold text-[#1E1810]">{b.title}</h2>
            <p className="mt-2 text-sm text-[#5C5346]/95">{b.body}</p>
          </section>
        ))}
      </div>

      <div className={`${adminCardBase} mt-8 border-[#7A9E6F]/30 bg-[#F8FCF6] p-4`}>
        <p className="text-sm text-[#2C4A22]">
          <strong>Coordination:</strong> review the{" "}
          <Link href="/admin/workspace/contacto" className="font-bold underline">
            Contacto
          </Link>{" "}
          workspace so phones, hours, and forms do not contradict buttons on this page.
        </p>
      </div>
    </div>
  );
}
