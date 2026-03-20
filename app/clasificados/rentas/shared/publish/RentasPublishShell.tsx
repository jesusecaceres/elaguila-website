import type { ReactNode } from "react";

/** Thin ownership boundary for Rentas publish UI. Does not add layout nodes. */
export function RentasPublishShell({ children }: { children: ReactNode }) {
  return (
    <div className="contents" data-publish-owner="rentas">
      {children}
    </div>
  );
}
