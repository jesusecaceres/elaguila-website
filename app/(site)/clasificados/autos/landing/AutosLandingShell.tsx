import type { ReactNode } from "react";
import Image from "next/image";
import { AUTOS_LANDING_HERO_BACKDROP } from "./autosLandingBrowseAssets";

export function AutosLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 min-h-[min(50vh,440px)] w-full overflow-hidden rounded-b-[22px] border-b border-[color:var(--lx-nav-border)] shadow-[inset_0_1px_0_rgba(255,252,247,0.55)] sm:min-h-[min(54vh,520px)] lg:min-h-[min(58vh,600px)]"
        aria-hidden
      >
        <div className="absolute inset-0">
          <Image
            src={AUTOS_LANDING_HERO_BACKDROP}
            alt=""
            fill
            priority
            className="object-cover object-[center_30%] min-[480px]:object-[center_34%] md:object-[center_36%] lg:object-[center_38%] xl:object-[center_40%]"
            sizes="100vw"
          />
        </div>
        {/* Warm cream wash — keeps Leonix palette and text legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#fbf4e8]/72 via-[#f3ebdd]/86 to-[color:var(--lx-page)]" />
        {/* Soft vignette + gold lift (category presence, not loud) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_115%_90%_at_50%_-8%,rgba(201,168,74,0.16),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_55%_at_50%_108%,rgba(243,235,221,0.96),transparent_62%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(30,24,16,0.06)] via-transparent to-[rgba(243,235,221,0.88)]" />
      </div>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
