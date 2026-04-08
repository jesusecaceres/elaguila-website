import Image from "next/image";
import Link from "next/link";

import type { ViajesNegocioProfileModel } from "../data/viajesNegocioProfileSampleData";

const ACCENT = "#D97706";

export function ViajesNegocioProfileLayout({ profile, backHref }: { profile: ViajesNegocioProfileModel; backHref: string }) {
  return (
    <div className="bg-[color:var(--lx-page)] pb-20 text-[color:var(--lx-text)]">
      <section className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-5 lg:px-6">
          <Link href={backHref} className="text-xs font-semibold text-[color:var(--lx-muted)] hover:text-[color:var(--lx-text)]">
            ← Volver a Viajes
          </Link>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] shadow-sm">
              {profile.logoSrc ? (
                <Image src={profile.logoSrc} alt={profile.logoAlt ?? profile.businessName} fill className="object-contain p-2" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[color:var(--lx-gold)]" aria-hidden>
                  {profile.businessName.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{profile.businessName}</h1>
                {profile.verifiedPlaceholder ? (
                  <span className="rounded-full bg-[rgba(212,188,106,0.25)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text)]">
                    Verificado (próximamente)
                  </span>
                ) : null}
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
                <span className="font-semibold text-[color:var(--lx-text-2)]">Idiomas: </span>
                {profile.languages.join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-5 lg:px-6">
        <section className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold">Sobre el negocio</h2>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{profile.about}</p>
        </section>

        <section className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/90 p-6 sm:p-8">
          <h2 className="text-lg font-bold">Contacto</h2>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            {profile.phone ? <p>📞 {profile.phone}</p> : null}
            {profile.whatsapp ? (
              <a href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`} className="font-semibold text-[color:var(--lx-text)] underline-offset-2 hover:underline" style={{ color: ACCENT }}>
                WhatsApp {profile.whatsapp}
              </a>
            ) : null}
            {profile.email ? (
              <a href={`mailto:${profile.email}`} className="hover:underline">
                ✉️ {profile.email}
              </a>
            ) : null}
            {profile.website ? (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                🌐 Sitio web
              </a>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold">Ofertas destacadas</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profile.featuredOffers.map((o) => (
              <Link
                key={o.href}
                href={o.href}
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

        <section className="rounded-2xl border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] p-6 text-sm text-[color:var(--lx-text-2)]">
          <h2 className="text-base font-bold text-[color:var(--lx-text)]">Confianza</h2>
          <p className="mt-2">
            Pronto: reseñas verificadas, años en operación y documentos de registro. Mientras tanto, confirma identidad del negocio antes de pagar adelantos.
          </p>
        </section>
      </div>
    </div>
  );
}
