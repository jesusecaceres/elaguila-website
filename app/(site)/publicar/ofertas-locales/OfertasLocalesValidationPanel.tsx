"use client";

import type { OfertaLocalValidationIssue } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

const WARN = "text-[#7A1E2C]";
const ERR = "text-red-800";

function IssueList({
  issues,
  emptyMessage,
  tone,
}: {
  issues: OfertaLocalValidationIssue[];
  emptyMessage: string;
  tone: "preview" | "publish";
}) {
  if (issues.length === 0) {
    return <p className="text-xs text-[#1E1814]/55">{emptyMessage}</p>;
  }
  return (
    <ul className="space-y-1 text-xs">
      {issues.map((issue) => (
        <li
          key={`${issue.field}-${issue.message}`}
          className={issue.severity === "error" && tone === "publish" ? ERR : WARN}
        >
          {issue.message}
        </li>
      ))}
    </ul>
  );
}

export function OfertasLocalesValidationPanel({
  previewIssues,
  publishIssues,
  previewReady,
  publishFieldsReady,
  lang = "es",
}: {
  previewIssues: OfertaLocalValidationIssue[];
  publishIssues: OfertaLocalValidationIssue[];
  previewReady: boolean;
  publishFieldsReady: boolean;
  lang?: OfertasLocalesAppLang;
}) {
  const c = ofertasLocalesAppCopy(lang);
  const publishErrors = publishIssues.filter((i) => i.severity === "error");
  const publishWarnings = publishIssues.filter((i) => i.severity === "warning");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7A1E2C]">
          {c.validationPreviewTitle}
        </h3>
        <div className="mt-2">
          {previewReady ? (
            <p className="text-xs font-medium text-[#1E1814]/70">{c.previewReady}</p>
          ) : (
            <IssueList issues={previewIssues} emptyMessage={c.previewReady} tone="preview" />
          )}
        </div>
      </div>
      <div className="rounded-xl border border-[#D4C4A8]/70 bg-white p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70">
          {c.validationPublishTitle}
        </h3>
        <div className="mt-2">
          {publishFieldsReady ? (
            <p className="text-xs text-[#1E1814]/65">
              {c.publishReadyForReview} {c.publishNotBuilt}
            </p>
          ) : (
            <>
              <IssueList issues={publishErrors} emptyMessage="" tone="publish" />
              {publishWarnings.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-[#7A1E2C]/90">
                  {publishWarnings.map((issue) => (
                    <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
