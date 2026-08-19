import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminPartialBadgeClass } from "../../../_components/adminTheme";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceIglesiasPage() {
  const churches = isSupabaseAdminConfigured()
    ? (
        await getAdminSupabase()
          .from("churches")
          .select("id, name, slug, city, approval_status, is_active, published_at, created_at")
          .order("created_at", { ascending: false })
          .limit(80)
      ).data ?? []
    : [];

  const pending = churches.filter((c) => c.approval_status === "pending").length;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
          Church queue
        </span>
        <span className={adminPartialBadgeClass}>{pending} pending</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Iglesias"
        title="Iglesias"
        subtitle="Public landing `/iglesias` plus church applications. Approved+active+published rows are the only public inventory."
        helperText="No fake churches. Prayer Wall is BUILD 02."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Iglesias"
        publicPath="/iglesias"
        sourceOfTruth="Postgres `churches` (+ services/ministries/media). Landing chrome: `site_section_content.iglesias_page`."
        siteSectionKey="iglesias_page"
        adminEditors={[
          { label: "Copy editor", href: "/admin/workspace/iglesias/content" },
          { label: "Public landing", href: "/iglesias" },
        ]}
        notYet={[
          "Prayer Wall, acknowledgements, and Prayer Network routing (BUILD 02/03).",
          "Verified badge workflow — column exists, not displayed.",
        ]}
      />

      <div className={`${adminCardBase} overflow-x-auto p-0`}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-[11px] uppercase tracking-wide text-[#7A7164]">
            <tr>
              <th className="px-4 py-3">Church</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Approval</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Public</th>
              <th className="px-4 py-3"> </th>
            </tr>
          </thead>
          <tbody>
            {churches.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-[#7A7164]" colSpan={6}>
                  No church rows yet. Public landing stays complete with zero inventory.
                </td>
              </tr>
            ) : (
              churches.map((c) => (
                <tr key={c.id} className="border-b border-[#F0E8D8]">
                  <td className="px-4 py-3 font-semibold text-[#1F241C]">{c.name}</td>
                  <td className="px-4 py-3 text-[#5C5346]">{c.city || "—"}</td>
                  <td className="px-4 py-3">{c.approval_status}</td>
                  <td className="px-4 py-3">{c.is_active ? "yes" : "no"}</td>
                  <td className="px-4 py-3">{c.approval_status === "approved" && c.is_active && c.published_at ? "yes" : "no"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/workspace/iglesias/${c.id}`} className="font-bold text-[#6B5B2E] underline">
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/workspace/iglesias/content" className={adminBtnSecondary}>
          Landing copy
        </Link>
        <Link href="/admin/workspace" className={adminBtnSecondary}>
          ← Workspace overview
        </Link>
      </div>
    </div>
  );
}
