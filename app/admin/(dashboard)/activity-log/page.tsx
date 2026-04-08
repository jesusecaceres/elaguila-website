import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminStubBadgeClass } from "../../_components/adminTheme";
import { getTemporaryActivitySeed } from "../../_lib/activityLogSeed";

export const dynamic = "force-dynamic";

export default function AdminActivityLogPage() {
  const rows = getTemporaryActivitySeed();

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminStubBadgeClass}>Datos de ejemplo</span>
        <span className={adminStubBadgeClass}>No persistido</span>
      </div>
      <AdminPageHeader
        title="Activity log"
        subtitle="Audit trail for admin actions. Rows below are temporary seeds until `admin_audit_log` (or similar) exists in Supabase."
        helperText="Las filas no reflejan acciones reales; solo ilustran el diseño de la tabla."
      />

      <div className={`${adminCardBase} overflow-hidden`}>
        <div className="border-b border-[#E8DFD0]/80 bg-[#FFF8F0]/90 px-4 py-3 text-xs text-[#5C5346]">
          Filters are UI-only for now. Recommended schema: actor_email, action, target_type, target_id, summary, meta jsonb,
          created_at.
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase tracking-wide text-[#7A7164]">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target</th>
                <th className="p-3">Id</th>
                <th className="p-3">Summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[#E8DFD0]/80">
                  <td className="whitespace-nowrap p-3 text-xs text-[#5C5346]">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-3 font-medium text-[#1E1810]">{r.actor}</td>
                  <td className="p-3 font-mono text-xs">{r.action}</td>
                  <td className="p-3 text-xs">{r.targetType}</td>
                  <td className="p-3 font-mono text-xs">{r.targetId}</td>
                  <td className="max-w-md p-3 text-xs text-[#5C5346]/95">{r.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
