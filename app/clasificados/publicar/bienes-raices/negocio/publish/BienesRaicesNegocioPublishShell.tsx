import type { ReactNode } from "react";

/** BR branch: negocio. Thin wrapper for ownership (track choice, negocio-only basics sections). */
export function BienesRaicesNegocioPublishShell({ children }: { children: ReactNode }) {
  return (
    <div className="contents" data-publish-owner="bienes-raices" data-publish-branch="negocio">
      {children}
    </div>
  );
}
