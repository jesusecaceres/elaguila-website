import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { viajesResultsBrowseUrl } from "../lib/viajesBrowseContract";

/** Asymmetric 5-tile bento matching approved landing target. */
const TILES = [
  {
    id: "napa",
    className: "min-h-[220px] sm:min-h-[280px] lg:row-span-2 lg:min-h-[380px]",
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80",
    browse: { q: "Napa" },
  },
  {
    id: "santa-cruz",
    className: "min-h-[160px] lg:col-span-2",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    browse: { q: "Santa Cruz" },
  },
  {
    id: "diversion-en-familia",
    className: "min-h-[160px]",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=80",
    browse: { audience: "familias" as const },
  },
  {
    id: "salidas-de-un-dia",
    className: "min-h-[160px]",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80",
    browse: { t: "dia" },
  },
  {
    id: "descubre-mas",
    className: "min-h-[160px]",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80",
    browse: {},
  },
] as const;

export function ViajesNearbyEscapes({ ui }: { ui: ViajesUi }) {
  const copy = ui.nearbyEscapes;
  return (
    <section className="mt-12 sm:mt-14">
      <div className="mb-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--lx-burgundy)] sm:text-3xl">
          {copy.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[color:var(--lx-text-2)]">{copy.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        {TILES.map((tile) => {
          const item = copy.byId[tile.id];
          const label = item?.title ?? tile.id;
          return (
            <Link
              key={tile.id}
              href={viajesResultsBrowseUrl(ui.lang, tile.browse)}
              className={`group relative overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] ${tile.className}`}
            >
              <Image
                src={tile.image}
                alt={label}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(max-width:1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-base font-bold text-white drop-shadow sm:text-lg">{label}</p>
                {item?.subline ? <p className="mt-0.5 line-clamp-2 text-xs text-white/90">{item.subline}</p> : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
