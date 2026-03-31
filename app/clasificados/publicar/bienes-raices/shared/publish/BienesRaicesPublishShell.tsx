import type { ReactNode } from "react";

/** Thin ownership boundary for Bienes Raíces publish UI. Does not add layout nodes. */
export function BienesRaicesPublishShell({ children }: { children: ReactNode }) {
  return (
    <div className="contents" data-publish-owner="bienes-raices">
      {children}
    </div>
  );
}
