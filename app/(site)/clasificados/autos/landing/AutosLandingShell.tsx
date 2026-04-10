import type { ReactNode } from "react";
import { AUTOS_LANDING_HERO_BACKDROP } from "./autosLandingBrowseAssets";

export function AutosLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 min-h-[min(52vh,520px)] w-full overflow-hidden rounded-b-[20px] border-b border-[color:var(--lx-nav-border)] shadow-[inset_0_1px_0_rgba(255,252,247,0.55)]"
        aria-hidden
      >
        <div
          className="absolute inset-0 bg-cover bg-[center_42%] opacity-[0.14] mix-blend-multiply"
          style={{ backgroundImage: `url('${AUTOS_LANDING_HERO_BACKDROP}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fbf4e8]/88 via-[#f3ebdd]/94 to-[color:var(--lx-page)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,168,74,0.12),transparent_55%)]" />
      </div>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
