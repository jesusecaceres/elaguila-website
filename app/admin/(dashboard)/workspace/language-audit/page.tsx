import { getAdminLang, adminMessages } from "@/app/admin/_lib/adminI18n";
import { getAdminStringsKeyCoverageReport } from "@/app/admin/_lib/adminStrings";
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
  const keyCoverage = getAdminStringsKeyCoverageReport();

  return (
    <div>
      <AdminPageHeader title={m("languageAudit.title")} subtitle={m("languageAudit.intro")} />
      <AdminPagePurposeCard
        title="Language Audit"
        purpose="Give operators a QA map for English defaults and Spanish toggles across Admin OS sections."
        dataSource="Static admin language audit rows plus translation_records/server translation cache where used elsewhere."
        status="partial"
        safeActions={["Review coverage", "Identify pages needing translation QA", "Keep public copy changes for separate gates"]}
        nextGate="Confirm every button and count on this page against live Supabase data before relying on it for daily decisions."
        // Gate 18b (SYS-001) — every row below is a hardcoded pass/fail value, not a live check;
        // this page structurally cannot detect a real missing-translation gap. The Admin Guide's
        // own entry for this page already discloses this honestly (`failureGuidance`), but that
        // disclosure lived only in the Guide, not here where an operator is actually looking at
        // the table — bringing the same honest wording onto the page itself, matching wording so
        // the two surfaces never drift into two different explanations of the same limitation.
        warningNote="This page cannot detect a real missing-translation gap by construction — every row below is a hardcoded checklist value, not a live check. It verifies that Admin chrome resolves through the shared EN/ES dictionary, not whether any individual field's content is actually translated."
      />

      {/*
       * Forensic audit (post-Gate-20, SYS-001) — this section is the one genuinely live check on
       * this page: it recomputes EN/ES dictionary key parity from the actual current source on
       * every load, not a stored value. Admin chrome itself is pinned to English-only today
       * (getAdminLang() always returns "en" — see adminI18n.ts, "Phase 13B"), so this is not a
       * live user-facing language switch; it only tells you whether the dormant ES dictionary has
       * drifted out of parity with EN, which matters if/when ES support is ever turned back on.
       */}
      <div className={`${adminCardBase} mb-4 p-4`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Dictionary key coverage (live check)</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Admin chrome is presently English-only by product decision — <code>getAdminLang()</code>{" "}
          always returns <code>&quot;en&quot;</code>. This does not check a live language switch; it
          recomputes, on every load, whether the EN and ES entries in <code>adminStrings.ts</code>{" "}
          have the same keys — a real fact about current code, not a stored checklist value.
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">EN keys / ES keys</dt>
            <dd className="mt-1 text-sm font-mono text-[#1E1810]">
              {keyCoverage.totalEnKeys} / {keyCoverage.totalEsKeys}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">Key parity</dt>
            <dd className="mt-1 text-sm font-mono text-[#1E1810]">
              {keyCoverage.missingInEs.length === 0 && keyCoverage.missingInEn.length === 0
                ? "In sync"
                : `${keyCoverage.missingInEs.length} missing in ES, ${keyCoverage.missingInEn.length} missing in EN`}
            </dd>
          </div>
        </dl>
        {keyCoverage.missingInEs.length > 0 ? (
          <details className="mt-3 text-xs text-[#5C5346]">
            <summary className="cursor-pointer font-bold uppercase tracking-wide text-[#7A7164]">
              Keys present in EN but missing in ES ({keyCoverage.missingInEs.length})
            </summary>
            <ul className="mt-2 max-h-48 space-y-0.5 overflow-y-auto font-mono">
              {keyCoverage.missingInEs.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </details>
        ) : null}
        {keyCoverage.missingInEn.length > 0 ? (
          <details className="mt-3 text-xs text-[#5C5346]">
            <summary className="cursor-pointer font-bold uppercase tracking-wide text-[#7A7164]">
              Keys present in ES but missing in EN ({keyCoverage.missingInEn.length})
            </summary>
            <ul className="mt-2 max-h-48 space-y-0.5 overflow-y-auto font-mono">
              {keyCoverage.missingInEn.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#7A7164]">
        Static per-section checklist (hardcoded — see warning above)
      </p>
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
