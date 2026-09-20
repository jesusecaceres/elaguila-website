import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { viajesResultsBrowseUrl } from "../lib/viajesBrowseContract";

const INTENTS = [
  { id: "day", labelEs: "Viaje de un día", labelEn: "Day trip", browse: { t: "dia" } },
  { id: "escapes", labelEs: "Escapadas", labelEn: "Getaways", browse: { t: "fin-de-semana" } },
  { id: "hotels", labelEs: "Hoteles y resorts", labelEn: "Hotels & resorts", browse: { t: "resorts" } },
  { id: "rentals", labelEs: "Rentas vacacionales", labelEn: "Vacation rentals", browse: { t: "hoteles" } },
  { id: "cruises", labelEs: "Cruceros", labelEn: "Cruises", browse: { t: "cruceros" } },
  { id: "mobility", labelEs: "Autos y traslados", labelEn: "Cars & transfers", browse: { t: "transporte" } },
] as const;

export function ViajesLandingIntentPills({ ui }: { ui: ViajesUi }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
      {INTENTS.map((pill) => (
        <Link
          key={pill.id}
          href={viajesResultsBrowseUrl(ui.lang, pill.browse)}
          className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)]"
        >
          {ui.lang === "en" ? pill.labelEn : pill.labelEs}
        </Link>
      ))}
    </div>
  );
}
