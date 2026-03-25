import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase } from "../../_components/adminTheme";
import { getClasificadosCategoryRegistry, summarizeRegistryForDashboard } from "../../_lib/clasificadosCategoryRegistry";

export const dynamic = "force-dynamic";

function statusStyle(s: string) {
  switch (s) {
    case "live":
      return "bg-emerald-100 text-emerald-900";
    case "staged":
      return "bg-amber-100 text-amber-900";
    case "coming_soon":
      return "bg-sky-100 text-sky-900";
    case "hidden":
      return "bg-neutral-200 text-neutral-800";
    default:
      return "bg-[#FBF7EF] text-[#5C4E2E]";
  }
}

function readinessStyle(r: string) {
  if (r === "full") return "text-emerald-800";
  if (r === "partial") return "text-amber-800";
  return "text-[#7A7164]";
}

export default function AdminCategoriesPage() {
  const registry = getClasificadosCategoryRegistry();
  const sum = summarizeRegistryForDashboard(registry);

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        subtitle="Clasificados control center. `en-venta` is the primary live vertical; others are staged or coming soon until activated safely."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Live</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{sum.live}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Staged</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{sum.staged}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Coming soon</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{sum.comingSoon}</p>
        </div>
      </div>

      <div className={`${adminCardBase} overflow-hidden`}>
        <div className="border-b border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-4 py-3 text-xs text-[#5C5346]">
          Registry is code-driven from `categoryConfig` with operational overlays. Persist overrides in Supabase when ready —
          edits here are display-only until then.
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase tracking-wide text-[#7A7164]">
              <tr>
                <th className="p-3"> </th>
                <th className="p-3">Slug</th>
                <th className="p-3">Display (ES)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Readiness</th>
                <th className="p-3">Visibility</th>
                <th className="p-3">Landing</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {registry.map((c) => (
                <tr key={c.slug} className="border-t border-[#E8DFD0]/80 align-top">
                  <td className="p-3 text-xl">{c.emoji}</td>
                  <td className="p-3 font-mono text-xs text-[#3D3428]">{c.slug}</td>
                  <td className="p-3 font-semibold text-[#1E1810]">{c.displayNameEs}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusStyle(c.operationalStatus)}`}>
                      {c.operationalStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className={`p-3 text-xs font-semibold ${readinessStyle(c.readiness)}`}>{c.readiness}</td>
                  <td className="p-3 text-xs">{c.visibility}</td>
                  <td className="p-3">
                    <Link href={c.landingTarget} className="text-xs font-bold text-[#6B5B2E] underline" target="_blank">
                      {c.landingTarget}
                    </Link>
                  </td>
                  <td className="max-w-xs p-3 text-xs text-[#5C5346]/95">{c.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#7A7164]">
        Sort order follows `categoryConfig` enumeration order for now. Future: drag reorder persisted per environment.
      </p>
    </div>
  );
}
