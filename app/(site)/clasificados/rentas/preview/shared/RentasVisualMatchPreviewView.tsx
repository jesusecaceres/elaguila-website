"use client";

import type React from "react";
import { FiExternalLink, FiMail, FiMapPin, FiMessageCircle, FiPhone, FiPlayCircle } from "react-icons/fi";
import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

type Vm = BienesRaicesPrivadoPreviewVm | BienesRaicesNegocioPreviewVm;

type Props = {
  vm: Vm;
  lang: "es" | "en";
  videoUrls?: readonly string[] | null;
};

const BORDER = "rgba(44,36,22,0.1)";
const CREAM = "#FDFBF7";
const IVORY = "#F9F6F1";
const CHARCOAL = "#2C2416";
const MUTED = "#5C5346";
const BRONZE = "#B8954A";

function isNegocio(vm: Vm): vm is BienesRaicesNegocioPreviewVm {
  return "identity" in vm;
}

function cleanUrls(urls: readonly string[] | null | undefined): string[] {
  const out: string[] = [];
  for (const raw of urls ?? []) {
    const url = String(raw ?? "").trim();
    if (!/^https?:\/\//i.test(url) || out.includes(url)) continue;
    out.push(url);
    if (out.length >= 4) break;
  }
  return out;
}

function mediaVideos(vm: Vm, videoUrls: readonly string[] | null | undefined): Array<{ href: string; label: string }> {
  const explicit = cleanUrls(videoUrls);
  const fromVm = cleanUrls(vm.media?.externalVideoLinks?.map((v) => v.href));
  const urls = explicit.length ? explicit : fromVm;
  return urls.map((href, index) => ({
    href,
    label:
      index === 0
        ? "View video"
        : `View video ${index + 1}`,
  }));
}

function photos(vm: Vm): string[] {
  const all = vm.media?.allPhotoUrls?.filter(Boolean) ?? [];
  if (all.length) return all;
  return [vm.media?.heroUrl, ...(vm.media?.secondaryPhotoUrls ?? [])].filter((u): u is string => Boolean(u));
}

function contact(vm: Vm) {
  if (isNegocio(vm)) {
    return {
      title: vm.contactRailTitle || "Contact",
      name: vm.identity.name,
      role: vm.identity.role,
      email: vm.identity.contactEmail,
      phone: vm.identity.contactPhone,
      callHref: vm.contact.llamarHref,
      mailHref: vm.contact.solicitarInfoHref,
      smsHref: vm.contact.smsHref,
      waHref: vm.contact.whatsappHref,
      websiteHref: vm.contact.websiteHref ?? vm.identity.profileHref,
      mapHref: vm.location.mapsUrl,
      note: vm.contact.instructionsLine || vm.contact.preferredContactLine || vm.identity.bioLine,
    };
  }
  return {
    title: vm.contactRailTitle || "Rental inquiry",
    name: vm.seller.name,
    role: vm.seller.byOwnerLabel,
    email: vm.seller.emailDisplay,
    phone: vm.seller.phoneDisplay,
    callHref: vm.contact.llamarHref,
    mailHref: vm.contact.solicitarInfoHref,
    smsHref: vm.contact.smsHref,
    waHref: vm.contact.whatsappHref,
    websiteHref: vm.contact.websiteHref,
    mapHref: vm.location.mapsUrl,
    note: vm.contact.instructionsLine || vm.contact.preferredContactLine || vm.seller.noteLine,
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-5 shadow-[0_12px_40px_-18px_rgba(42,36,22,0.18)]" style={{ borderColor: BORDER, background: CREAM }}>
      <h2 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ActionLink({ href, children }: { href: string | null | undefined; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="flex min-h-[44px] items-center justify-center rounded-xl border px-3 py-2 text-sm font-bold transition hover:bg-white/10"
      style={{ borderColor: "rgba(255,255,255,0.22)", color: "#F9F6F1" }}
    >
      {children}
    </a>
  );
}

export function RentasVisualMatchPreviewView({ vm, lang, videoUrls }: Props) {
  const ph = photos(vm);
  const [hero, ...rest] = ph;
  const videos = mediaVideos(vm, videoUrls);
  const c = contact(vm);
  const quickFacts = (vm.quickFacts ?? []).filter((f) => String(f.value ?? "").trim());
  const detailRows = (vm.propertyDetailsRows ?? []).filter((r) => String(r.value ?? "").trim());
  const highlights = (vm.highlightsRows ?? []).filter((r) => String(r.label ?? r.value ?? "").trim());

  return (
    <div className="w-full min-w-0 antialiased" style={{ backgroundColor: IVORY, color: CHARCOAL }}>
      <main className="mx-auto grid max-w-[1240px] gap-5 px-4 pb-12 pt-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:px-8">
        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border p-5 shadow-[0_12px_40px_-18px_rgba(42,36,22,0.18)]" style={{ borderColor: BORDER, background: CREAM }}>
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: BRONZE }}>
              {vm.operationSummary}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl" style={{ color: CHARCOAL }}>
              {vm.heroTitle}
            </h1>
            {vm.addressLine ? (
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold" style={{ color: MUTED }}>
                <FiMapPin className="h-4 w-4 shrink-0" style={{ color: BRONZE }} aria-hidden />
                <span>{vm.addressLine}</span>
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <span className="font-serif text-3xl font-bold sm:text-4xl" style={{ color: BRONZE }}>
                {vm.priceDisplay}
              </span>
              {vm.listingStatusLabel && vm.listingStatusLabel !== "—" ? (
                <span className="mb-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: `${BRONZE}55`, background: "rgba(184,149,74,0.12)", color: "#7A5F22" }}>
                  {vm.listingStatusLabel}
                </span>
              ) : null}
            </div>
            {quickFacts.length ? (
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {quickFacts.slice(0, 8).map((fact) => (
                  <div key={`${fact.label}-${fact.value}`} className="rounded-xl border bg-white/75 p-3" style={{ borderColor: BORDER }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>{fact.label}</p>
                    <p className="mt-1 text-sm font-bold" style={{ color: CHARCOAL }}>{fact.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section id="galeria-multimedia" className="rounded-2xl border p-4 shadow-[0_12px_40px_-18px_rgba(42,36,22,0.18)]" style={{ borderColor: BORDER, background: CREAM }}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="text-base font-bold" style={{ color: CHARCOAL }}>{lang === "es" ? "Galería multimedia" : "Media gallery"}</h2>
              {ph.length ? <span className="text-xs font-semibold" style={{ color: MUTED }}>{ph.length} {ph.length === 1 ? "photo" : "photos"}</span> : null}
            </div>
            <div className="grid gap-3 lg:grid-cols-12">
              <div className={rest.length ? "lg:col-span-8" : "lg:col-span-12"}>
                {hero ? (
                  <img src={hero} alt="" className="aspect-[16/10] w-full rounded-2xl object-cover" />
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border text-sm font-semibold" style={{ borderColor: BORDER, color: MUTED }}>
                    {lang === "es" ? "Sin fotos" : "No photos"}
                  </div>
                )}
              </div>
              {rest.length ? (
                <div className="grid grid-cols-2 gap-3 lg:col-span-4">
                  {rest.slice(0, 4).map((url) => (
                    <img key={url} src={url} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
                  ))}
                </div>
              ) : null}
            </div>
            {videos.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {videos.map((video) => (
                  <a key={video.href} href={video.href} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-xl border p-3 text-sm font-bold transition hover:bg-[#FFF6E7]" style={{ borderColor: BORDER, color: CHARCOAL }}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E1810] text-[#F9F6F1]"><FiPlayCircle className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">{video.label}</span>
                    <FiExternalLink className="h-4 w-4 shrink-0" style={{ color: BRONZE }} />
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          {vm.hasDescription && vm.description ? (
            <Section title={lang === "es" ? "Descripción" : "Description"}>
              <p className="whitespace-pre-wrap text-sm leading-7" style={{ color: CHARCOAL }}>{vm.description}</p>
            </Section>
          ) : null}

          {detailRows.length ? (
            <Section title={lang === "es" ? "Detalles de la renta" : "Rental details"}>
              <div className="grid gap-2 sm:grid-cols-2">
                {detailRows.map((row) => (
                  <div key={`${row.label}-${row.value}`} className="rounded-xl border bg-white/70 p-3" style={{ borderColor: BORDER }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>{row.label}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm font-semibold" style={{ color: CHARCOAL }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {highlights.length ? (
            <Section title={String(vm.highlightsSectionTitle ?? "").trim() || (lang === "es" ? "Destacados" : "Highlights")}>
              <div className="flex flex-wrap gap-2">
                {highlights.map((row) => (
                  <span key={`${row.label}-${row.value}`} className="rounded-full border bg-white px-3 py-1 text-xs font-semibold" style={{ borderColor: BORDER, color: CHARCOAL }}>
                    {row.label || row.value}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          {vm.location?.hasMeaningfulAddress ? (
            <Section title={lang === "es" ? "Ubicación" : "Location"}>
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>{isNegocio(vm) ? vm.location.fullAddress || vm.location.cityStateZip : vm.location.cityStateZip}</p>
              {vm.location.mapsUrl ? (
                <a href={vm.location.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-xl border px-4 py-2 text-sm font-bold" style={{ borderColor: `${BRONZE}66`, color: CHARCOAL }}>
                  {lang === "es" ? "Ver en mapa" : "View on map"}
                </a>
              ) : null}
            </Section>
          ) : null}
        </div>

        <aside className="rounded-2xl border p-5 shadow-[0_18px_46px_-18px_rgba(42,36,22,0.35)] lg:sticky lg:top-5" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#2C2416", color: "#F9F6F1" }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "#C9B46A" }}>{c.title}</p>
          {c.name ? <h2 className="mt-2 text-lg font-bold">{c.name}</h2> : null}
          {c.role ? <p className="mt-1 text-xs font-semibold text-[#D8CFC3]">{c.role}</p> : null}
          {c.note ? <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-[#D8CFC3]">{c.note}</p> : null}
          <div className="mt-4 space-y-2">
            <ActionLink href={c.mailHref}><FiMail className="mr-2 h-4 w-4" />{lang === "es" ? "Enviar correo" : "Email seller"}</ActionLink>
            <ActionLink href={c.callHref}><FiPhone className="mr-2 h-4 w-4" />{lang === "es" ? "Llamar" : "Call"}</ActionLink>
            <ActionLink href={c.waHref}><FiMessageCircle className="mr-2 h-4 w-4" />WhatsApp</ActionLink>
            <ActionLink href={c.smsHref}>{lang === "es" ? "Enviar texto" : "Send text"}</ActionLink>
            <ActionLink href={c.websiteHref}>{lang === "es" ? "Ver sitio web" : "View website"}</ActionLink>
            <ActionLink href={c.mapHref}>{lang === "es" ? "Ver mapa" : "View on map"}</ActionLink>
          </div>
          {(c.phone || c.email) ? (
            <div className="mt-4 space-y-1 border-t border-white/10 pt-4 text-xs text-[#D8CFC3]">
              {c.phone ? <p>{c.phone}</p> : null}
              {c.email ? <p className="break-words">{c.email}</p> : null}
            </div>
          ) : null}
        </aside>
      </main>
    </div>
  );
}
