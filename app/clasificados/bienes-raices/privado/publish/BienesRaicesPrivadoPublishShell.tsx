import type { ReactNode } from "react";

/** BR branch: privado. Thin wrapper for ownership (e.g. track choice). */
export function BienesRaicesPrivadoPublishShell({ children }: { children: ReactNode }) {
  return (
    <div className="contents" data-publish-owner="bienes-raices" data-publish-branch="privado">
      {children}
    </div>
  );
}
