import { fetchClasificadosCategoryOpsAuditRows } from "@/app/admin/_lib/adminClasificadosCategoryOpsAudit";
import type { ClasificadosCategoryRegistryEntry } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import { adminCardBase } from "../../../_components/adminTheme";

function boolCell(v: boolean) {
  return (
    <span className={v ? "font-bold text-emerald-800" : "font-bold text-rose-800"} title={v ? "Verified at page load" : "See reason column"}>
      {v ? "TRUE" : "FALSE"}
    </span>
  );
}

export async function ClasificadosCategoryOpsAudit({ registry }: { registry: ClasificadosCategoryRegistryEntry[] }) {
  const rows = await fetchClasificadosCategoryOpsAuditRows(registry);

  return (
    <section className={`${adminCardBase} mb-8 overflow-hidden p-0`} aria-labelledby="clasificados-ops-audit-heading">
      <div className="border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-3">
        <h2 id="clasificados-ops-audit-heading" className="text-base font-bold text-[#1E1810]">
          Auditoría operativa — colas por categoría
        </h2>
        <p className="mt-1 max-w-4xl text-[11px] leading-snug text-[#5C5346]">
          Valores TRUE/FALSE se calculan al cargar esta página (consultas reales a Supabase y los mismos helpers que usa la cola). Si algo
          falla, la columna «Motivo» indica el error de Postgres/PostgREST o la limitación exacta.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-collapse text-left text-xs text-[#3D3428]">
          <thead className="bg-[#FBF7EF]/90 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
            <tr>
              <th className="border-b border-[#E8DFD0]/80 p-2">Slug</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">Cola admin</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">Fuente</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">Cargar</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">Buscar</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">Link público</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">Moderar</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">Filas (aprox.)</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">Motivo si FALSE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug} className="border-b border-[#E8DFD0]/60 align-top">
                <td className="p-2 font-mono text-[11px] font-semibold">{r.slug}</td>
                <td className="p-2">
                  <code className="break-all rounded bg-white/90 px-1 py-0.5 text-[10px]">{r.queueUrl}</code>
                </td>
                <td className="max-w-[220px] p-2 text-[11px] leading-snug text-[#5C5346]">{r.sourceTableOrSystem}</td>
                <td className="p-2">{boolCell(r.canLoadPublishedListings)}</td>
                <td className="p-2">{boolCell(r.canSearchFilterListings)}</td>
                <td className="p-2">{boolCell(r.canOpenPublicListingLink)}</td>
                <td className="p-2">{boolCell(r.canModerateOrStatusManage)}</td>
                <td className="p-2 tabular-nums text-[#5C5346]">{r.rowCount == null ? "—" : r.rowCount}</td>
                <td className="max-w-xs p-2 text-[11px] leading-snug text-rose-900">
                  {r.falseReasons.length ? r.falseReasons.join(" · ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
