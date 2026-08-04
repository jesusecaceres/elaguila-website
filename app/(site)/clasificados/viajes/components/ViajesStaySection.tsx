import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { viajesResultsBrowseUrl } from "../lib/viajesBrowseContract";

export function ViajesStaySection({ ui }: { ui: ViajesUi }) {
  const copy = ui.staySection;
  const cards = [
    {
      id: "hotels",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
      href: viajesResultsBrowseUrl(ui.lang, { t: "resorts" }),
      title: copy.hotels.title,
      subline: copy.hotels.subline,
    },
    {
      id: "rentals",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
      href: viajesResultsBrowseUrl(ui.lang, { t: "hoteles" }),
      title: copy.rentals.title,
      subline: copy.rentals.subline,
    },
  ];

  return (
    <section className="mt-12 sm:mt-14">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--lx-burgundy)] sm:text-3xl">
        {copy.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--lx-text-2)]">{copy.subtitle}</p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)]"
          >
            <Image src={card.image} alt={card.title} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width:768px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-bold text-white">{card.title}</h3>
              <p className="mt-1 text-sm text-white/90">{card.subline}</p>
              <span className="mt-2 inline-flex text-sm font-bold text-white/95 underline-offset-2 group-hover:underline">
                {copy.cta}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
