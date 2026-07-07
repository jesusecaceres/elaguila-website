import type { ReactNode } from "react";

/** Rentas/Bienes shell for Restaurantes — warm cream background with texture */
export function RestaurantesLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F3EBDD] text-[#1F241C] antialiased">
      {/* Rentas/Bienes subtle texture */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_75%_at_50%_-8%,rgba(201,168,74,0.22),transparent_52%),radial-gradient(ellipse_65%_45%_at_100%_0%,rgba(85,107,62,0.1),transparent_48%),radial-gradient(ellipse_60%_40%_at_0%_25%,rgba(122,30,44,0.06),transparent_42%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 52px),repeating-linear-gradient(0deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 52px)",
        }}
        aria-hidden
      />
      <div className="relative z-[1] min-w-0 pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14">{children}</div>
    </div>
  );
}
