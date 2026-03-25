import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminBtnPrimary, adminInputClass } from "../../_components/adminTheme";
import { getWebsiteContentScaffold } from "../../_lib/websiteContentScaffold";

export const dynamic = "force-dynamic";

export default function AdminWebsiteContentPage() {
  const modules = getWebsiteContentScaffold().sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <AdminPageHeader
        title="Website content"
        subtitle="Structured control for approved homepage modules — not a freeform page builder. Persistence is future Supabase/JSON config."
      />

      <div className={`${adminCardBase} mb-8 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Global toggles (stub)</h2>
        <p className="mt-1 text-xs text-[#7A7164]">These controls are display-only until a site config store exists.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input type="checkbox" disabled className="h-4 w-4 rounded border-[#E8DFD0]" defaultChecked />
            Hero visible
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input type="checkbox" disabled className="h-4 w-4 rounded border-[#E8DFD0]" defaultChecked />
            Announcements
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input type="checkbox" disabled className="h-4 w-4 rounded border-[#E8DFD0]" />
            Seasonal promo
          </label>
        </div>
        <button type="button" disabled className={`${adminBtnPrimary} mt-4 opacity-60`}>
          Publish changes (not wired)
        </button>
      </div>

      <div className="grid gap-4">
        {modules.map((m) => (
          <div key={m.id} className={`${adminCardBase} p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-[#7A7164]">Module · sort {m.sortOrder}</p>
                <h3 className="text-lg font-bold text-[#1E1810]">{m.label}</h3>
                <p className="mt-1 max-w-2xl text-sm text-[#5C5346]/95">{m.description}</p>
                {m.notes ? <p className="mt-2 text-xs text-[#A67C52]">{m.notes}</p> : null}
              </div>
              <span className="rounded-full bg-[#FBF7EF] px-3 py-1 text-xs font-bold uppercase text-[#5C4E2E]">
                {m.visibility}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[#5C5346]">Headline / copy ref</label>
                <input className={adminInputClass} disabled placeholder="Future CMS key" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5C5346]">Placement priority</label>
                <input className={adminInputClass} disabled placeholder="1–100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
