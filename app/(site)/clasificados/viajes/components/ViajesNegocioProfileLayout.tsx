import Link from "next/link";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import type { ViajesNegocioProfileModel } from "../data/viajesNegocioProfileSampleData";
import type { ViajesUi } from "../data/viajesUiCopy";
import { setLangOnHref } from "../lib/viajesLangHref";
import { withViajesOfferBackParam } from "../lib/viajesOfferLink";
import { ViajesNegocioContactBlock } from "./ViajesNegocioContactBlock";
import { ViajesSafeImage } from "./ViajesSafeImage";

const ACCENT = "#D97706";

export function ViajesNegocioProfileLayout({
  profile,
  backHref,
  backLabel,
  ui,
}: {
  profile: ViajesNegocioProfileModel;
  backHref: string;
  backLabel: string;
  ui: ViajesUi;
}) {
  const n = ui.negocio;
  const profileBackHref = appendLangToPath(`/clasificados/viajes/negocio/${profile.slug}`, ui.lang);

  const offerHref = (href: string) => {
    const withLang = setLangOnHref(href, ui.lang);
    return href.includes("/clasificados/viajes/oferta/") ? withViajesOfferBackParam(withLang, profileBackHref) : withLang;
  };

  return (
    <div className="bg-[color:var(--lx-page)] pb-20 text-[color:var(--lx-text)]">
      <section className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10 lg:px-6">
          <Link href={backHref} className="inline-flex min-h-[44px] items-center text-xs font-semibold text-[color:var(--lx-muted)] hover:text-[color:var(--lx-text)]">
            ← {backLabel}
          </Link>
          <div className="mt-5 flex flex-col gap-6 sm:mt-6 sm:flex-row sm:items-start">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] shadow-sm">
              {profile.logoSrc ? (
                <ViajesSafeImage
                  src={profile.logoSrc}
                  alt={profile.logoAlt ?? profile.businessName}
                  className="absolute inset-0 h-full w-full object-contain p-2"
                  mode="inventory"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[color:var(--lx-gold)]" aria-hidden>
                  {profile.businessName.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{profile.businessName}</h1>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)]">{profile.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.destinationsServed.map((d) => (
                  <span key={d} className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-1 text-xs font-medium">
                    {d}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-[color:var(--lx-muted)]">
                <span className="font-semibold text-[color:var(--lx-text-2)]">{n.languages} </span>
                {profile.languages.join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-5 lg:px-6">
        <section className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold">{n.about}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{profile.about}</p>
        </section>

        <section className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/90 p-6 sm:p-8">
          <h2 className="text-lg font-bold">{n.contact}</h2>
          <ViajesNegocioContactBlock
            phone={profile.phone}
            whatsapp={profile.whatsapp}
            email={profile.email}
            website={profile.website}
            websiteLabel={n.website}
            lang={ui.lang}
          />
        </section>

<<<<<<< HEAD
        <section>
          <h2 className="text-lg font-bold">{n.featuredOffers}</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profile.featuredOffers.map((o) => (
              <Link
                key={o.href}
                href={offerHref(o.href)}
                className="group overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full">
                  <Image src={o.imageSrc} alt={o.imageAlt} fill className="object-cover transition group-hover:scale-[1.02]" sizes="(max-width:768px) 100vw, 33vw" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[color:var(--lx-text)]">{o.title}</h3>
                  <p className="text-sm text-[color:var(--lx-text-2)]">{o.destination}</p>
                  <p className="mt-2 text-sm font-bold" style={{ color: ACCENT }}>
                    {o.priceHint}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
=======
        {profile.featuredOffers.length ? (
          <section>
            <h2 className="text-lg font-bold">{n.featuredOffers}</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {profile.featuredOffers.map((o) => (
                <Link
                  key={o.href}
                  href={offerHref(o.href)}
                  className="group overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-sm transition hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full">
                    <ViajesSafeImage
                      src={o.imageSrc}
                      alt={o.imageAlt}
                      className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.02]"
                      sizes="(max-width:768px) 100vw, 33vw"
                      mode="inventory"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[color:var(--lx-text)]">{o.title}</h3>
                    <p className="text-sm text-[color:var(--lx-text-2)]">{o.destination}</p>
                    <p className="mt-2 text-sm font-bold" style={{ color: ACCENT }}>
                      {o.priceHint}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
>>>>>>> 9f92bb50 (preservation: capture final local Viajes launch work)

        <section className="rounded-2xl border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] p-6 text-sm text-[color:var(--lx-text-2)]">
          <h2 className="text-base font-bold text-[color:var(--lx-text)]">{n.trustTitle}</h2>
          <p className="mt-2">{n.trustBody}</p>
        </section>
      </div>
    </div>
  );
}
