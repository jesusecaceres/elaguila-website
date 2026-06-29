import { getAdminLang, adminMessages } from "@/app/admin/_lib/adminI18n";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { adminCardBase } from "@/app/admin/_components/adminTheme";

const AUDIT_ROWS: { sectionKey: string; notesKey: string; enDefault: boolean; esToggle: boolean }[] = [
  { sectionKey: "languageAudit.section.dashboard", notesKey: "languageAudit.notes.rowPass", enDefault: true, esToggle: true },
  { sectionKey: "languageAudit.section.categories", notesKey: "languageAudit.notes.rowPass", enDefault: true, esToggle: true },
  {
    sectionKey: "languageAudit.section.clasificadosWorkspace",
    notesKey: "languageAudit.notes.rowPass",
    enDefault: true,
    esToggle: true,
  },
  {
    sectionKey: "languageAudit.section.clasificadosQueues",
    notesKey: "languageAudit.notes.rowPass",
    enDefault: true,
    esToggle: true,
  },
  {
    sectionKey: "languageAudit.section.restaurantesQueue",
    notesKey: "languageAudit.notes.rowPass",
    enDefault: true,
    esToggle: true,
  },
  {
    sectionKey: "languageAudit.section.serviciosQueue",
    notesKey: "languageAudit.notes.rowPass",
    enDefault: true,
    esToggle: true,
  },
  {
    sectionKey: "languageAudit.section.empleosQueue",
    notesKey: "languageAudit.notes.rowPass",
    enDefault: true,
    esToggle: true,
  },
  { sectionKey: "languageAudit.section.autosQueue", notesKey: "languageAudit.notes.rowPass", enDefault: true, esToggle: true },
  { sectionKey: "languageAudit.section.tienda", notesKey: "languageAudit.notes.rowPass", enDefault: true, esToggle: true },
  { sectionKey: "languageAudit.section.users", notesKey: "languageAudit.notes.rowPass", enDefault: true, esToggle: true },
  { sectionKey: "languageAudit.section.payments", notesKey: "languageAudit.notes.rowPass", enDefault: true, esToggle: true },
  { sectionKey: "languageAudit.section.support", notesKey: "languageAudit.notes.rowPass", enDefault: true, esToggle: true },
  { sectionKey: "languageAudit.section.settings", notesKey: "languageAudit.notes.rowPass", enDefault: true, esToggle: true },
  { sectionKey: "languageAudit.section.revista", notesKey: "languageAudit.notes.rowPass", enDefault: true, esToggle: true },
];

function boolText(v: boolean, m: ReturnType<typeof adminMessages>) {
  return v ? m("audit.true") : m("audit.false");
}

export default async function AdminLanguageAuditPage() {
  const lang = await getAdminLang();
  const m = adminMessages(lang);

  return (
    <div>
      <AdminPageHeader title={m("languageAudit.title")} subtitle={m("languageAudit.intro")} />
      <AdminPagePurposeCard
        title="Language Audit"
        purpose="Give operators a QA map for English defaults and Spanish toggles across Admin OS sections."
        dataSource="Static admin language audit rows plus translation_records/server translation cache where used elsewhere."
        status="partial"
        safeActions={["Review coverage", "Identify pages needing translation QA", "Keep public copy changes for separate gates"]}
        nextGate="ADMIN-ACTION-QA-AND-LIVE-SCHEMA-PROOF-01"
        warningNote="This is a QA/readout surface, not an automatic translation editor."
      />
      <div className={`${adminCardBase} overflow-hidden p-0`}>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left text-sm text-[#3D3428]">
            <thead className="bg-[#FBF7EF]/90 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
              <tr>
                <th className="border-b border-[#E8DFD0]/80 p-3">{m("languageAudit.th.section")}</th>
                <th className="border-b border-[#E8DFD0]/80 p-3">{m("languageAudit.th.enDefault")}</th>
                <th className="border-b border-[#E8DFD0]/80 p-3">{m("languageAudit.th.esToggle")}</th>
                <th className="border-b border-[#E8DFD0]/80 p-3">{m("languageAudit.th.notes")}</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_ROWS.map((row) => (
                <tr key={row.sectionKey} className="border-b border-[#E8DFD0]/60 align-top">
                  <td className="p-3 font-semibold text-[#1E1810]">{m(row.sectionKey)}</td>
                  <td className="p-3 font-mono text-xs">{boolText(row.enDefault, m)}</td>
                  <td className="p-3 font-mono text-xs">{boolText(row.esToggle, m)}</td>
                  <td className="max-w-xl p-3 text-xs leading-relaxed text-[#5C5346]">{m(row.notesKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
