import type { ReactNode } from "react";

/** Rentas branch: privado. Thin wrapper for ownership (e.g. track choice, future privado-only blocks). */
export function RentasPrivadoPublishShell({ children }: { children: ReactNode }) {
  return (
    <div className="contents" data-publish-owner="rentas" data-publish-branch="privado">
      {children}
    </div>
  );
}
