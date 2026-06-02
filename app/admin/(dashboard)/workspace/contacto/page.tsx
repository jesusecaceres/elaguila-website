import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase } from "../../../_components/adminTheme";

const TOPICS = [
  {
    title: "Channels & hours",
    body: "Phone, email, hours, and address live in the persistent editor (Supabase). No duplicate fields on this summary page.",
  },
  {
    title: "Map & notices",
    body: "Map URL and optional top notice — also in the editor. Form submission still uses the global component (API logic is not edited here).",
  },
  {
    title: "Tienda card",
    body: "Title, body, and CTA for the block linking to Tienda help — editable in the editor; empty = code defaults.",
  },
] as const;

export default function AdminWorkspaceContactoPage() {
  return (
    <div>
      <AdminPageHeader
        title="Contact — how people reach you"
        subtitle="The only saved form for `/contacto` is in the linked editor below. This card summarizes scope; there are no saved fields here."
        eyebrow="Workspace · Contacto"
        helperText="Tienda orders (inbox) stay in global Orders. Internal issues in Support. Coordinate CTAs with Nosotros (`/about`)."
      />

      <div className={`${adminCardBase} mb-6 border-[#7A9E6F]/35 bg-[#F8FCF6] p-4 text-sm text-[#2C4A22]`}>
        <strong>Persistent editor (DB):</strong>{" "}
        <Link href="/admin/workspace/contacto/content" className="font-bold underline">
          Open `/contacto` form
        </Link>
      </div>

      <p className="mb-6 max-w-3xl text-sm text-[#5C5346]">
        <strong className="text-[#1E1810]">What this workspace controls:</strong> the public Contact page and copy around the form. For{" "}
        <Link href="/admin/support" className="font-bold text-[#6B5B2E] underline">
          Support
        </Link>{" "}
        (ops queue) and{" "}
        <Link href="/admin/workspace/nosotros" className="font-bold text-[#6B5B2E] underline">
          Nosotros
        </Link>{" "}
        use the sidebar links.
      </p>

      <div className="grid gap-4">
        {TOPICS.map((b) => (
          <section key={b.title} className={`${adminCardBase} p-5`}>
            <h2 className="text-base font-bold text-[#1E1810]">{b.title}</h2>
            <p className="mt-2 text-sm text-[#5C5346]/95">{b.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
