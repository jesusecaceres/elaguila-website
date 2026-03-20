import type { ReactNode } from "react";

/** Thin ownership boundary for En Venta publish UI. Does not add layout nodes. */
export function EnVentaPublishShell({ children }: { children: ReactNode }) {
  return (
    <div className="contents" data-publish-owner="en-venta">
      {children}
    </div>
  );
}
