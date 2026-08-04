import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { viajesResultsBrowseUrl } from "../lib/viajesBrowseContract";

const CARDS = [
  {
    id: "autos-de-renta",
    image: "https://images.unsplash.com/photo-1519641471654-a57acfcdd3df?auto=format&fit=crop&w=1000&q=80",
    browse: { t: "renta-autos" as const },
  },
  {
    id: "traslados-al-aeropuerto",
    image: "https://images.unsplash.com/photo-1544620341-11cbdcba31c7?auto=format&fit=crop&w=1000&q=80",
    browse: { t: "transporte" as const },
  },
  {
    id: "vans-para-grupos",
    image: "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?auto=format&fit=crop&w=1000&q=80",
    browse: { t: "transporte" as const, audience: "grupos" as const },
  },
  {
    id: "conductores-privados",
    image: "https://images.unsplash.com/photo-1449965403122-ae748c0e2f91?auto=format&fit=crop&w=1000&q=80",
    browse: { t: "transporte" as const },
  },
] as const;

export function ViajesMobilitySection({ ui }: { ui: ViajesUi }) {
  const copy = ui.mobilitySection;
  return (
    <section className="mt-12 sm:mt-14">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--lx-burgundy)] sm:text-3xl">
        {copy.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--lx-text-2)]">{copy.subtitle}</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const item = copy.byId[card.id];
          return (
            <Link
              key={card.id}
              href={viajesResultsBrowseUrl(ui.lang, card.browse)}
              className="group overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-sm"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={card.image}
                  alt={item?.title ?? card.id}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width:1024px) 50vw, 25vw"
                />
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[color:var(--lx-text)]">{item?.title ?? card.id}</h3>
                {item?.subline ? <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{item.subline}</p> : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
