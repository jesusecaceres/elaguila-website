"use client";

import type { ComidaLocalValidationIssue } from "@/app/lib/clasificados/comida-local/comidaLocalTypes";
import { COMIDA_LOCAL_SHELL_COPY } from "@/app/lib/clasificados/comida-local/comidaLocalFieldCopy";

const WARN = "text-[#7A1E2C]";
const ERR = "text-red-800";

function IssueList({
  issues,
  emptyMessage,
  tone,
}: {
  issues: ComidaLocalValidationIssue[];
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

export function ComidaLocalValidationPanel({
  previewIssues,
  publishIssues,
  publishReady,
}: {
  previewIssues: ComidaLocalValidationIssue[];
  publishIssues: ComidaLocalValidationIssue[];
  publishReady: boolean;
}) {
  const publishErrors = publishIssues.filter((i) => i.severity === "error");
  const publishWarnings = publishIssues.filter((i) => i.severity === "warning");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-[#D4C4A8]/70 bg-[#FDF8F0] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7A1E2C]">
          {COMIDA_LOCAL_SHELL_COPY.validationPreviewTitle}
        </h3>
        <div className="mt-2">
          <IssueList
            issues={previewIssues}
            emptyMessage="Tienes lo básico para la vista previa cuando esté disponible."
            tone="preview"
          />
        </div>
      </div>
      <div className="rounded-lg border border-[#D4C4A8]/70 bg-white p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70">
          {COMIDA_LOCAL_SHELL_COPY.validationPublishTitle}
        </h3>
        <div className="mt-2">
          {publishReady ? (
            <p className="text-xs text-[#1E1814]/65">
              Campos obligatorios completos. Usa el botón «Publicar ficha» al final del formulario.
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
