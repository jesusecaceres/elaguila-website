"use client";

import type { Lang } from "../../types/tienda";
import type { PrintUploadApprovalChecks } from "../../product-configurators/print-upload/types";
import { puPick, printUploadBuilderCopy } from "../../data/printUploadBuilderCopy";

export function PrintUploadApprovalPanel(props: {
  lang: Lang;
  approval: PrintUploadApprovalChecks;
  onChange: (patch: Partial<PrintUploadApprovalChecks>) => void;
}) {
  const { lang, approval, onChange } = props;
  const rows: Array<{ key: keyof PrintUploadApprovalChecks; label: { es: string; en: string } }> = [
    { key: "reviewedSpecsAndFile", label: printUploadBuilderCopy.approvalRows.reviewed },
    { key: "printAsSubmitted", label: printUploadBuilderCopy.approvalRows.printAsSubmitted },
    { key: "noLeonixLiabilityForArtwork", label: printUploadBuilderCopy.approvalRows.liability },
    { key: "willContactForDesignHelp", label: printUploadBuilderCopy.approvalRows.help },
  ];

  return (
    <section className="rounded-2xl border border-[rgba(201,168,74,0.28)] bg-[linear-gradient(180deg,rgba(201,168,74,0.10),rgba(0,0,0,0.2))] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">{puPick(printUploadBuilderCopy.approvalTitle, lang)}</h2>
      <p className="mt-2 text-sm text-[rgba(255,247,226,0.78)] leading-relaxed">
        {puPick(printUploadBuilderCopy.approvalIntro, lang)}
      </p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <label
            key={row.key}
            className="flex items-start gap-3 rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] px-3 py-3 cursor-pointer hover:bg-[rgba(255,255,255,0.06)]"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[rgba(201,168,74,0.45)]"
              checked={approval[row.key]}
              onChange={(e) => onChange({ [row.key]: e.target.checked })}
            />
            <span className="text-sm text-[rgba(255,255,255,0.88)] leading-snug">{puPick(row.label, lang)}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
