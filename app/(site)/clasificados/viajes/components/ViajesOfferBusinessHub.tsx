"use client";

import Link from "next/link";
import type { ViajesContactChannel } from "../data/viajesOfferDetailSampleData";
import type { ViajesOfferModelV2 } from "../lib/v2/viajesOfferModelV2";
import { isViajesDurableHttpsUrl } from "../lib/v2/viajesMediaDurableGuards";
import { viajesPublicAddressLabel } from "../lib/viajesPublicLocation";
import { ViajesContactChannelsRow } from "./ViajesContactChannelsRow";
import { ViajesPartnerLogo } from "./ViajesPartnerLogo";
import { ViajesSheetCtaLink } from "./ViajesSheetCtaLink";

const ACCENT = "#D97706";

function withHttp(url: string) {
  const t = url.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

export function ViajesOfferBusinessHub({
  offer,
  channels,
  lang = "es",
  identityBadge,
  disclosure,
  kicker,
  operatorHint,
}: {
  offer: ViajesOfferModelV2;
  channels: ViajesContactChannel[];
  lang?: "es" | "en";
  identityBadge: string;
  disclosure: string;
  kicker: string;
  operatorHint: string;
}) {
  const p = offer.provider;
  const name = p.name.trim() || offer.contact.displayName.trim();
  if (!name && !channels.length) return null;

  const profileRoute = p.profileRoute.trim();
  const profileHref = profileRoute
    ? profileRoute.startsWith("/")
      ? profileRoute
      : `/clasificados/viajes/negocio/${profileRoute}`
    : "";
  const website = withHttp(p.website || offer.contact.website);
  const booking = withHttp(p.bookingUrl);
  const office = viajesPublicAddressLabel(offer.locations.providerOffice);
  const primaryHref = booking || website || channels[0]?.href || "";
  const primaryLabel = booking
    ? lang === "en"
      ? "View with provider"
      : "Ver con el proveedor"
    : website
      ? lang === "en"
        ? "Website"
        : "Sitio web"
      : lang === "en"
        ? "Contact"
        : "Contactar";

  const hubChannels = channels.filter((c) => {
    if (c.kind === "website" && (c.href === website || c.href === booking)) return true;
    return Boolean(c.href.trim());
  });

  return (
    <section className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-[color:var(--lx-card)] to-[color:var(--lx-card)] p-5 shadow-[0_10px_40px_-20px_rgba(5,150,105,0.2)] sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-black/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {identityBadge}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-900/85">{kicker}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-4">
        {isViajesDurableHttpsUrl(p.logoUrl) ? (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[color:var(--lx-nav-border)] bg-white shadow-sm">
            <ViajesPartnerLogo src={p.logoUrl} className="h-full w-full object-contain p-1" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-[color:var(--lx-text)] sm:text-2xl">{name}</h2>
          {p.type.trim() ? <p className="mt-1 text-sm font-medium text-[color:var(--lx-muted)]">{p.type}</p> : null}
          {p.description.trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{p.description}</p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-emerald-950/85">{operatorHint}</p>
          )}
          {office ? (
            <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">
              <span className="font-semibold">{lang === "en" ? "Public location: " : "Ubicación pública: "}</span>
              {office}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-100/90 bg-emerald-50/60 px-4 py-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
        {disclosure}
      </div>

      {hubChannels.length ? (
        <ViajesContactChannelsRow
          channels={hubChannels}
          ariaLabel={lang === "en" ? "Business contacts" : "Contactos del negocio"}
          lang={lang}
        />
      ) : null}

      <div className="mt-5 flex w-full flex-col gap-2.5 sm:max-w-sm">
        {primaryHref ? (
          <ViajesSheetCtaLink
            href={primaryHref}
            lang={lang}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-md"
            style={{ backgroundColor: ACCENT }}
          >
            {primaryLabel}
          </ViajesSheetCtaLink>
        ) : null}
        {profileHref ? (
          <Link
            href={profileHref}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-3 text-sm font-bold text-[color:var(--lx-text)]"
          >
            {lang === "en" ? "View profile & offers" : "Ver perfil y ofertas"}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
