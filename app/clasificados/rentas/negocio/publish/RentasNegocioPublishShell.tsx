import type { ReactNode } from "react";

/** Rentas branch: negocio. Thin wrapper for ownership (track choice, negocio-only basics sections). */
export function RentasNegocioPublishShell({ children }: { children: ReactNode }) {
  return (
    <div className="contents" data-publish-owner="rentas" data-publish-branch="negocio">
      {children}
    </div>
  );
}
