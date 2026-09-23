import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { VIAJES_MOBILITY_CARDS } from "../data/viajesLandingSampleData";
import { viajesResultsBrowseUrl } from "../lib/viajesBrowseContract";
import { ViajesSafeImage } from "./ViajesSafeImage";

export function ViajesMobilitySection({ ui }: { ui: ViajesUi }) {
  const copy = ui.mobilitySection;
  return (
    <section className="mt-12 sm:mt-14">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--lx-burgundy)] sm:text-3xl">
        {copy.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--lx-text-2)]">{copy.subtitle}</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VIAJES_MOBILITY_CARDS.map((card) => {
          const item = copy.byId[card.id];
          return (
            <Link
              key={card.id}
              href={viajesResultsBrowseUrl(ui.lang, card.browse)}
              className="group overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-sm"
            >
              <div className="relative aspect-[4/3]">
                <ViajesSafeImage
                  src={card.imageSrc}
                  alt={item?.title ?? card.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width:1024px) 50vw, 25vw"
                  mode="editorial"
                />
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[color:var(--lx-text)]">{item?.title ?? card.title}</h3>
                {item?.subline ? <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{item.subline}</p> : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
