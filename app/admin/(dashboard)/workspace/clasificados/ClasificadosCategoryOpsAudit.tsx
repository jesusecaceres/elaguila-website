import { fetchClasificadosCategoryOpsAuditRows } from "@/app/admin/_lib/adminClasificadosCategoryOpsAudit";
import type { ClasificadosCategoryRegistryEntry } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import { adminCardBase } from "../../../_components/adminTheme";

function boolCell(v: boolean, m: ReturnType<typeof adminMessages>) {
  return (
    <span
      className={v ? "font-bold text-emerald-800" : "font-bold text-rose-800"}
      title={v ? m("audit.boolTitleTrue") : m("audit.boolTitleFalse")}
    >
      {v ? m("audit.true") : m("audit.false")}
    </span>
  );
}

export async function ClasificadosCategoryOpsAudit({
  registry,
  lang,
}: {
  registry: ClasificadosCategoryRegistryEntry[];
  lang: AdminLang;
}) {
  const m = adminMessages(lang);
  const rows = await fetchClasificadosCategoryOpsAuditRows(registry);

  return (
    <section className={`${adminCardBase} mb-8 overflow-hidden p-0`} aria-labelledby="clasificados-ops-audit-heading">
      <div className="border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-3">
        <h2 id="clasificados-ops-audit-heading" className="text-base font-bold text-[#1E1810]">
          {m("audit.title")}
        </h2>
        <p className="mt-1 max-w-4xl text-[11px] leading-snug text-[#5C5346]">{m("audit.intro")}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full border-collapse text-left text-xs text-[#3D3428]">
          <thead className="bg-[#FBF7EF]/90 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
            <tr>
              <th className="border-b border-[#E8DFD0]/80 p-2">{m("audit.th.slug")}</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">{m("audit.th.queue")}</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">{m("audit.th.source")}</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">{m("audit.th.load")}</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">{m("audit.th.search")}</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">{m("audit.th.public")}</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">{m("audit.th.moderate")}</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">{m("audit.th.editAd")}</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">{m("audit.th.leonixEmbedded")}</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">{m("audit.th.rows")}</th>
              <th className="border-b border-[#E8DFD0]/80 p-2">{m("audit.th.reason")}</th>
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
                <td className="p-2">{boolCell(r.canLoadPublishedListings, m)}</td>
                <td className="p-2">{boolCell(r.canSearchFilterListings, m)}</td>
                <td className="p-2">{boolCell(r.canOpenPublicListingLink, m)}</td>
                <td className="p-2">{boolCell(r.canModerateOrStatusManage, m)}</td>
                <td className="p-2">{boolCell(r.canEditAdInAdmin, m)}</td>
                <td className="p-2">{boolCell(r.canLeonixAdIdEmbedded, m)}</td>
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
