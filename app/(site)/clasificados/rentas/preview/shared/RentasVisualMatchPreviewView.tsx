"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiExternalLink,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiPlayCircle,
  FiShare2,
} from "react-icons/fi";
import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import type {
  BienesRaicesNegocioPreviewVm,
  BienesRaicesPreviewFact,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { buildOfertaLocalPreviewMapEmbedUrl } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import {
  trackRentasPhoneClick,
  trackRentasWhatsappClick,
  trackRentasEmailClick,
  trackRentasWebsiteClick,
  trackRentasDirectionsClick,
  trackRentasMessageClick,
} from "@/app/clasificados/rentas/analytics/rentasAnalytics";

type Vm = BienesRaicesPrivadoPreviewVm | BienesRaicesNegocioPreviewVm;

type Props = {
  vm: Vm;
  lang: "es" | "en";
  videoUrls?: readonly string[] | null;
  /** Optional listing UUID for analytics tracking in public detail context */
  listingId?: string | null;
};

type DetailGroup = {
  title: string;
  rows: BienesRaicesPreviewFact[];
};

const BORDER = "rgba(201,168,74,0.32)";
const BORDER_SOFT = "rgba(214,199,173,0.78)";
const CREAM = "#FFFDF7";
const CHARCOAL = "#1F241C";
const BODY = "#3D3428";
const MUTED = "#6E6252";
const BRONZE = "#8A6B1F";
const GOLD = "#C9A84A";
const BURGUNDY = "#7A1E2C";
const GREEN = "#2A4536";

function isNegocio(vm: Vm): vm is BienesRaicesNegocioPreviewVm {
  return "identity" in vm;
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function isMeaningfulValue(value: string): boolean {
  const v = value.trim();
  if (!v || /^[-—]+$/.test(v)) return false;
  if (/^(undefined|null)$/i.test(v)) return false;
  if (/^(no preference|sin preferencia)$/i.test(v)) return false;
  return true;
}

function cleanRows(rows: BienesRaicesPreviewFact[] | undefined): BienesRaicesPreviewFact[] {
  const seen = new Set<string>();
  const out: BienesRaicesPreviewFact[] = [];
  for (const row of rows ?? []) {
    const label = text(row.label);
    const value = text(row.value);
    if (!label || !isMeaningfulValue(value)) continue;
    const key = `${label.toLowerCase()}::${value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, value });
  }
  return out;
}

function cleanUrls(urls: readonly string[] | null | undefined): string[] {
  const out: string[] = [];
  for (const raw of urls ?? []) {
    const url = text(raw);
    if (!/^https?:\/\//i.test(url) || out.includes(url)) continue;
    out.push(url);
    if (out.length >= 4) break;
  }
  return out;
}

function mediaVideos(vm: Vm, videoUrls: readonly string[] | null | undefined, lang: "es" | "en"): Array<{ href: string; label: string }> {
  const explicit = cleanUrls(videoUrls);
  const fromVm = cleanUrls(vm.media?.externalVideoLinks?.map((v) => v.href));
  const urls = explicit.length ? explicit : fromVm;
  return urls.map((href, index) => ({
    href,
    label:
      index === 0
        ? lang === "es"
          ? "Ver video"
          : "View video"
        : lang === "es"
          ? `Ver video ${index + 1}`
          : `View video ${index + 1}`,
  }));
}

function photos(vm: Vm): string[] {
  const source = vm.media?.allPhotoUrls?.filter(Boolean).length
    ? vm.media.allPhotoUrls
    : [vm.media?.heroUrl, ...(vm.media?.secondaryPhotoUrls ?? [])];
  const out: string[] = [];
  for (const raw of source) {
    const url = text(raw);
    if (!url || out.includes(url)) continue;
    out.push(url);
  }
  return out;
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

function contact(vm: Vm) {
  if (isNegocio(vm)) {
    return {
      title: vm.contactRailTitle || "Contact advertiser",
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
      showLlamar: vm.contact.showLlamar,
      showSolicitarInfo: vm.contact.showSolicitarInfo,
      showWhatsapp: vm.contact.showWhatsapp,
      showSms: vm.contact.showSms,
    };
  }
  return {
    title: vm.contactRailTitle || "Contact seller",
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
    showLlamar: vm.contact.showLlamar,
    showSolicitarInfo: vm.contact.showSolicitarInfo,
    showWhatsapp: vm.contact.showWhatsapp,
    showSms: vm.contact.showSms,
  };
}

function matchesAny(label: string, needles: string[]): boolean {
  const l = label.toLowerCase();
  return needles.some((needle) => l.includes(needle));
}

function groupDetails(rows: BienesRaicesPreviewFact[], lang: "es" | "en"): DetailGroup[] {
  const summaryNeedles = [
    "posted",
    "publicado",
    "rent",
    "renta",
    "deposit",
    "depósito",
    "deposito",
    "lease",
    "contrato",
    "plazo",
    "availability",
    "disponibilidad",
    "tipo",
    "type",
    "furnished",
    "amueblado",
    "pets",
    "mascotas",
  ];
  const homeNeedles = [
    "bed",
    "recámara",
    "recamara",
    "bath",
    "baño",
    "bano",
    "sq",
    "interior",
    "size",
    "parking",
    "estacionamiento",
    "kitchen",
    "cocina",
    "laundry",
    "lavandería",
    "lavanderia",
    "entrance",
    "entrada",
    "occupants",
    "ocupantes",
  ];
  const conditionsNeedles = [
    "require",
    "requisito",
    "condition",
    "condición",
    "condicion",
    "visit",
    "visita",
    "showing",
    "prefer",
    "shared",
    "compartido",
    "instructions",
    "instrucciones",
  ];

  const summary: BienesRaicesPreviewFact[] = [];
  const home: BienesRaicesPreviewFact[] = [];
  const conditions: BienesRaicesPreviewFact[] = [];
  const other: BienesRaicesPreviewFact[] = [];

  for (const row of rows) {
    if (matchesAny(row.label, conditionsNeedles)) conditions.push(row);
    else if (matchesAny(row.label, homeNeedles)) home.push(row);
    else if (matchesAny(row.label, summaryNeedles)) summary.push(row);
    else other.push(row);
  }

  const groups: DetailGroup[] = [];
  if (summary.length) groups.push({ title: lang === "es" ? "Resumen de renta" : "Rental Summary", rows: summary });
  if (home.length) groups.push({ title: lang === "es" ? "Detalles del hogar" : "Home Details", rows: home });
  if (conditions.length) groups.push({ title: lang === "es" ? "Requisitos y condiciones" : "Requirements & Conditions", rows: conditions });
  if (other.length) groups.push({ title: lang === "es" ? "Más detalles" : "More Details", rows: other });
  return groups;
}

function uniqueFeatureText(rows: BienesRaicesPreviewFact[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const candidates = [row.label, row.value]
      .map(text)
      .filter((v) => isMeaningfulValue(v) && v !== "✓" && v.toLowerCase() !== "sí" && v.toLowerCase() !== "si");
    const value = candidates[0];
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-[1.35rem] border bg-[#FFFDF7] shadow-[0_16px_44px_-28px_rgba(31,36,28,0.32)] ring-1 ring-[#C9A84A]/10"
      style={{ borderColor: BORDER_SOFT }}
    >
      <div className="border-b px-4 py-3 sm:px-5" style={{ borderColor: "rgba(214,199,173,0.5)", background: "linear-gradient(135deg,#FFFDF7,#FBF7EF)" }}>
        {eyebrow ? (
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em]" style={{ color: GREEN }}>
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-serif text-lg font-bold leading-tight tracking-tight" style={{ color: CHARCOAL }}>
          {title}
        </h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function ActionLink({
  href,
  children,
  variant = "secondary",
  onClick,
}: {
  href: string | null | undefined;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "whatsapp";
  onClick?: () => void;
}) {
  if (!href) return null;
  const isExternal = href.startsWith("http");
  const cls =
    variant === "primary"
      ? "border-[#7A1E2C] bg-[#7A1E2C] text-white shadow-[0_10px_22px_-12px_rgba(122,30,44,0.7)] hover:bg-[#5e1721]"
      : variant === "whatsapp"
        ? "border-[#2A4536]/45 bg-[#2A4536] text-[#F8F4EA] hover:bg-[#223528]"
        : "border-[#D6C7AD] bg-[#FFFDF7] text-[#1F241C] hover:border-[#C9A84A] hover:bg-[#FBF7EF]";
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      onClick={onClick}
      className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-center text-[0.82rem] font-bold transition ${cls}`}
    >
      {children}
    </a>
  );
}

export function RentasVisualMatchPreviewView({ vm, lang, videoUrls, listingId }: Props) {
  const ph = photos(vm);
  const [hero, ...rest] = ph;
  const videos = mediaVideos(vm, videoUrls, lang);
  const c = contact(vm);
  const quickFacts = (vm.quickFacts ?? []).filter((f) => isMeaningfulValue(text(f.value)));
  const detailRows = cleanRows(vm.propertyDetailsRows);
  const detailGroups = groupDetails(detailRows, lang);
  const featureText = uniqueFeatureText(cleanRows(vm.highlightsRows));
  const locationLine = vm.location.fullAddress || vm.location.cityStateZip;
  const [shareCopied, setShareCopied] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryCount = ph.length;
  const galleryLabel =
    galleryCount > 0
      ? lang === "es"
        ? `${galleryIndex + 1} de ${galleryCount}`
        : `${galleryIndex + 1} of ${galleryCount}`
      : "";

  const handleNativeShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;

    const title = vm.heroTitle?.trim() || (lang === "en" ? "Leonix Media" : "Leonix Media");

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title,
          text: title,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // User cancelled native share or browser blocked it.
    }
  }, [vm.heroTitle, lang]);

  const handlePhoneClick = useCallback(() => {
    if (listingId) void trackRentasPhoneClick({ listingUuid: listingId });
  }, [listingId]);

  const handleWhatsappClick = useCallback(() => {
    if (listingId) void trackRentasWhatsappClick({ listingUuid: listingId });
  }, [listingId]);

  const handleEmailClick = useCallback(() => {
    if (listingId) void trackRentasEmailClick({ listingUuid: listingId });
  }, [listingId]);

  const handleWebsiteClick = useCallback(() => {
    if (listingId) void trackRentasWebsiteClick({ listingUuid: listingId });
  }, [listingId]);

  const handleSmsClick = useCallback(() => {
    if (listingId) void trackRentasMessageClick({ listingUuid: listingId });
  }, [listingId]);

  const handleDirectionsClick = useCallback(() => {
    if (listingId) void trackRentasDirectionsClick({ listingUuid: listingId });
  }, [listingId]);

  const openPhotoGallery = (index: number) => {
    if (!galleryCount) return;
    setGalleryIndex(Math.max(0, Math.min(index, galleryCount - 1)));
    setGalleryOpen(true);
  };

  const closePhotoGallery = () => setGalleryOpen(false);
  const prevPhoto = () => setGalleryIndex((i) => (galleryCount ? (i <= 0 ? galleryCount - 1 : i - 1) : 0));
  const nextPhoto = () => setGalleryIndex((i) => (galleryCount ? (i >= galleryCount - 1 ? 0 : i + 1) : 0));

  useEffect(() => {
    if (!galleryOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePhotoGallery();
      if (event.key === "ArrowLeft") prevPhoto();
      if (event.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [galleryOpen, galleryCount]);

  useEffect(() => {
    if (galleryIndex >= galleryCount) setGalleryIndex(Math.max(0, galleryCount - 1));
    if (!galleryCount && galleryOpen) setGalleryOpen(false);
  }, [galleryCount, galleryIndex, galleryOpen]);

  return (
    <div
      className="w-full min-w-0 overflow-x-hidden antialiased"
      style={{
        background:
          "radial-gradient(circle at 18% 0%, rgba(201,168,74,0.12), transparent 34rem), linear-gradient(180deg,#F8F4EA 0%,#FBF7EF 44%,#F8F4EA 100%)",
        color: CHARCOAL,
      }}
    >
      <main className="mx-auto grid w-full max-w-[1180px] gap-4 px-3 pb-12 pt-3 sm:gap-5 sm:px-5 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:px-7">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <section
            className="relative overflow-hidden rounded-[1.45rem] border bg-[#FFFDF7] p-4 shadow-[0_18px_52px_-34px_rgba(31,36,28,0.45)] ring-1 ring-[#C9A84A]/12 sm:p-5"
            style={{ borderColor: BORDER_SOFT }}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-[#C9A84A]/10" aria-hidden />
            {vm.operationSummary ? (
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em]" style={{ color: BRONZE }}>
                {vm.operationSummary}
              </p>
            ) : null}
            <h1 className="mt-1.5 max-w-3xl font-serif text-[1.8rem] font-bold leading-[1.05] tracking-tight text-balance sm:text-[2.35rem]" style={{ color: CHARCOAL }}>
              {vm.heroTitle}
            </h1>
            {vm.addressLine ? (
              <p className="mt-2.5 flex items-start gap-2 text-sm font-semibold leading-snug" style={{ color: MUTED }}>
                <FiMapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRONZE }} aria-hidden />
                <span className="min-w-0 break-words">{vm.addressLine}</span>
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-end gap-2.5">
              <span className="font-serif text-[2rem] font-bold leading-none tracking-tight sm:text-[2.55rem]" style={{ color: BURGUNDY }}>
                {vm.priceDisplay}
              </span>
              {vm.listingStatusLabel && vm.listingStatusLabel !== "—" ? (
                <span
                  className="mb-1 rounded-full border px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.14em]"
                  style={{ borderColor: "rgba(42,69,54,0.24)", background: "rgba(42,69,54,0.08)", color: GREEN }}
                >
                  {vm.listingStatusLabel}
                </span>
              ) : null}
            </div>
            {quickFacts.length ? (
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {quickFacts.slice(0, 8).map((fact) => (
                  <div
                    key={`${fact.label}-${fact.value}`}
                    className="relative min-h-[76px] overflow-hidden rounded-2xl border bg-white/80 p-3 shadow-[0_8px_22px_-18px_rgba(31,36,28,0.35)]"
                    style={{ borderColor: "rgba(214,199,173,0.8)" }}
                  >
                    <span className="absolute inset-x-0 top-0 h-0.5 bg-[#C9A84A]" aria-hidden />
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
                      {fact.label}
                    </p>
                    <p className="mt-1 text-[0.95rem] font-bold leading-snug" style={{ color: CHARCOAL }}>
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section
            id="galeria-multimedia"
            className="overflow-hidden rounded-[1.45rem] border bg-[#FFFDF7] p-3 shadow-[0_18px_52px_-34px_rgba(31,36,28,0.45)] ring-1 ring-[#C9A84A]/12 sm:p-4"
            style={{ borderColor: BORDER_SOFT }}
          >
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em]" style={{ color: GREEN }}>
                  {lang === "es" ? "Fotos y recorridos" : "Photos & tours"}
                </p>
                <h2 className="font-serif text-xl font-bold" style={{ color: CHARCOAL }}>
                  {lang === "es" ? "Galería multimedia" : "Media gallery"}
                </h2>
              </div>
              {ph.length ? (
                <button
                  type="button"
                  onClick={() => openPhotoGallery(0)}
                  className="min-h-[36px] rounded-full border bg-[#FBF7EF] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide transition hover:border-[#C9A84A] hover:bg-[#FFFDF7]"
                  style={{ borderColor: BORDER, color: BRONZE }}
                >
                  {lang === "es" ? `Ver todas las fotos (${ph.length})` : `View all photos (${ph.length})`}
                </button>
              ) : null}
            </div>
            <div className="grid gap-2.5 lg:grid-cols-12">
              <div className={rest.length ? "lg:col-span-8" : "lg:col-span-12"}>
                {hero ? (
                  <div className="overflow-hidden rounded-2xl border shadow-[0_18px_42px_-24px_rgba(31,36,28,0.45)]" style={{ borderColor: BORDER }}>
                    <button
                      type="button"
                      onClick={() => openPhotoGallery(0)}
                      className="group block w-full text-left"
                      aria-label={lang === "es" ? "Abrir galería de fotos" : "Open photo gallery"}
                    >
                      <img src={hero} alt="" className="aspect-[16/10] w-full object-cover transition group-hover:scale-[1.01]" />
                    </button>
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border text-sm font-semibold" style={{ borderColor: BORDER, color: MUTED }}>
                    {lang === "es" ? "Sin fotos" : "No photos"}
                  </div>
                )}
              </div>
              {rest.length ? (
                <div className="grid grid-cols-2 gap-2.5 lg:col-span-4">
                  {rest.slice(0, 4).map((url, index) => (
                    <div key={url} className="overflow-hidden rounded-xl border bg-[#FBF7EF]" style={{ borderColor: BORDER }}>
                      <button
                        type="button"
                        onClick={() => openPhotoGallery(index + 1)}
                        className="group block w-full text-left"
                        aria-label={lang === "es" ? `Abrir foto ${index + 2}` : `Open photo ${index + 2}`}
                      >
                        <img src={url} alt="" className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {videos.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {videos.map((video) => (
                  <a
                    key={video.href}
                    href={video.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-[54px] items-center gap-3 rounded-2xl border bg-[#FBF7EF] p-3 text-sm font-bold transition hover:border-[#C9A84A] hover:bg-[#FFFDF7]"
                    style={{ borderColor: BORDER, color: CHARCOAL }}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1F241C] text-[#F8F4EA] shadow-[0_8px_18px_-12px_rgba(31,36,28,0.75)]">
                      <FiPlayCircle className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">{video.label}</span>
                    <FiExternalLink className="h-4 w-4 shrink-0" style={{ color: BRONZE }} />
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          {vm.hasDescription && isMeaningfulValue(vm.description) ? (
            <Section eyebrow={lang === "es" ? "La historia del espacio" : "The rental story"} title={lang === "es" ? "Descripción" : "Description"}>
              <p className="max-w-3xl whitespace-pre-wrap text-[0.96rem] leading-7" style={{ color: BODY }}>
                {vm.description}
              </p>
            </Section>
          ) : null}

          {detailGroups.length ? (
            <section className="space-y-3">
              <div className="px-1">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em]" style={{ color: GREEN }}>
                  {lang === "es" ? "Información organizada" : "Organized information"}
                </p>
                <h2 className="font-serif text-xl font-bold" style={{ color: CHARCOAL }}>
                  {lang === "es" ? "Detalles de la renta" : "Rental details"}
                </h2>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {detailGroups.map((group) => (
                  <div key={group.title} className="rounded-[1.25rem] border bg-[#FFFDF7] p-4 shadow-[0_12px_34px_-26px_rgba(31,36,28,0.28)]" style={{ borderColor: BORDER_SOFT }}>
                    <h3 className="font-serif text-base font-bold" style={{ color: CHARCOAL }}>
                      {group.title}
                    </h3>
                    <div className="mt-3 divide-y" style={{ borderColor: "rgba(214,199,173,0.55)" }}>
                      {group.rows.map((row) => (
                        <div key={`${group.title}-${row.label}-${row.value}`} className="grid gap-1 py-2.5 sm:grid-cols-[0.85fr_1.15fr] sm:gap-3">
                          <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                            {row.label}
                          </p>
                          <p className="whitespace-pre-wrap text-sm font-semibold leading-6" style={{ color: BODY }}>
                            {row.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {featureText.length ? (
            <Section eyebrow={lang === "es" ? "Incluido y destacado" : "Included & highlighted"} title={lang === "es" ? "Características destacadas" : "Highlighted features"}>
              <div className="grid gap-2 sm:grid-cols-2">
                {featureText.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 rounded-2xl border bg-white/75 p-3" style={{ borderColor: "rgba(214,199,173,0.75)" }}>
                    <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRONZE }} aria-hidden />
                    <span className="text-sm font-semibold leading-6" style={{ color: BODY }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {vm.location?.hasMeaningfulAddress ? (
            <Section eyebrow={lang === "es" ? "Zona de la renta" : "Rental area"} title={lang === "es" ? "Ubicación" : "Location"}>
              <div className="mb-4">
                {locationLine ? (
                  <div className="overflow-hidden rounded-lg border border-[#D4C4A8]/70 bg-[#FDF8F0]/40">
                    <p className="border-b border-[#E8D9C4]/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/50">
                      {lang === "es" ? "Vista del mapa" : "Map preview"}
                    </p>
                    <iframe
                      title={lang === "es" ? "Vista del mapa" : "Map preview"}
                      src={buildOfertaLocalPreviewMapEmbedUrl(locationLine)}
                      className="h-40 w-full max-w-full border-0 sm:h-44"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : null}
              </div>
              <p className="text-sm font-semibold leading-6" style={{ color: BODY }}>
                {locationLine}
              </p>
              {vm.location.mapsUrl ? (
                <a
                  href={vm.location.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition hover:bg-[#FBF7EF]"
                  style={{ borderColor: `${GOLD}88`, color: CHARCOAL }}
                >
                  <FiMapPin className="mr-2 h-4 w-4" />
                  {lang === "es" ? "Ver en mapa" : "View on map"}
                </a>
              ) : null}
            </Section>
          ) : null}
        </div>

        <aside
          className="rounded-[1.45rem] border bg-[#FFFDF7] p-4 shadow-[0_18px_52px_-30px_rgba(31,36,28,0.38)] ring-1 ring-[#C9A84A]/12 lg:sticky lg:top-5"
          style={{ borderColor: BORDER_SOFT }}
        >
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em]" style={{ color: BRONZE }}>
            {lang === "es" ? "Contacto" : "Contact advertiser"}
          </p>
          {c.name ? (
            <h2 className="mt-1 font-serif text-xl font-bold leading-tight" style={{ color: CHARCOAL }}>
              {c.name}
            </h2>
          ) : null}
          {c.role ? (
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: GREEN }}>
              {c.role}
            </p>
          ) : null}
          {c.note && isMeaningfulValue(c.note) ? (
            <p className="mt-3 rounded-2xl border bg-[#FBF7EF] p-3 text-xs leading-5" style={{ borderColor: "rgba(214,199,173,0.8)", color: MUTED }}>
              {c.note}
            </p>
          ) : null}
          {(c.phone || c.email) ? (
            <div className="mt-3 space-y-2 rounded-2xl border bg-white/70 p-3 text-xs" style={{ borderColor: BORDER, color: BODY }}>
              {c.phone ? (
                <p className="flex items-center gap-2 font-semibold">
                  <FiPhone className="h-3.5 w-3.5" style={{ color: BRONZE }} />
                  {c.phone}
                </p>
              ) : null}
              {c.email ? (
                <p className="flex items-start gap-2 break-words font-semibold">
                  <FiMail className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: BRONZE }} />
                  <span>{c.email}</span>
                </p>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleNativeShare}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition hover:bg-[#FBF7EF]"
            style={{ borderColor: `${GOLD}88`, color: CHARCOAL }}
          >
            <FiShare2 className="h-4 w-4" />
            {shareCopied
              ? lang === "es"
                ? "Enlace copiado"
                : "Link copied"
              : lang === "es"
                ? "Compartir"
                : "Share"}
          </button>
          {c.showSolicitarInfo && c.mailHref ? (
            <ActionLink href={c.mailHref} variant="primary" onClick={handleEmailClick}>
              <FiMail className="h-4 w-4" />
              {lang === "es" ? "Enviar correo" : "Email seller"}
            </ActionLink>
          ) : null}
          {c.showLlamar && c.callHref ? (
            <ActionLink href={c.callHref} onClick={handlePhoneClick}>
              <FiPhone className="h-4 w-4" />
              {lang === "es" ? "Llamar" : "Call"}
            </ActionLink>
          ) : null}
          {c.showWhatsapp && c.waHref ? (
            <ActionLink href={c.waHref} variant="whatsapp" onClick={handleWhatsappClick}>
              <FiMessageCircle className="h-4 w-4" />
              WhatsApp
            </ActionLink>
          ) : null}
          {c.showSms && c.smsHref ? (
            <ActionLink href={c.smsHref} onClick={handleSmsClick}>
              <FiMessageCircle className="h-4 w-4" />
              {lang === "es" ? "Enviar texto" : "Send text"}
            </ActionLink>
          ) : null}
          {c.websiteHref ? (
            <ActionLink href={c.websiteHref} onClick={handleWebsiteClick}>
              <FiGlobe className="h-4 w-4" />
              {lang === "es" ? "Ver sitio web" : "View website"}
            </ActionLink>
          ) : null}
          {c.mapHref ? (
            <ActionLink href={c.mapHref} onClick={handleDirectionsClick}>
              <FiMapPin className="h-4 w-4" />
              {lang === "es" ? "Ver mapa" : "View on map"}
            </ActionLink>
          ) : null}
          {vm.location?.hasMeaningfulAddress && locationLine ? (
            <div className="mt-4 border-t pt-4" style={{ borderColor: "rgba(214,199,173,0.65)" }}>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em]" style={{ color: GREEN }}>
                {lang === "es" ? "Ubicación" : "Location"}
              </p>
              <div className="mt-2">
                <div className="overflow-hidden rounded-lg border border-[#D4C4A8]/70 bg-[#FDF8F0]/40">
                  <p className="border-b border-[#E8D9C4]/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/50">
                    {lang === "es" ? "Vista del mapa" : "Map preview"}
                  </p>
                  <iframe
                    title={lang === "es" ? "Vista del mapa" : "Map preview"}
                    src={buildOfertaLocalPreviewMapEmbedUrl(locationLine)}
                    className="h-32 w-full max-w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5" style={{ color: BODY }}>
                {locationLine}
              </p>
            </div>
          ) : null}
        </aside>
      </main>
      {galleryOpen && galleryCount > 0 ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 px-3 py-4 sm:px-5"
          role="dialog"
          aria-modal="true"
          aria-label={lang === "es" ? "Galería de fotos" : "Photo gallery"}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={lang === "es" ? "Cerrar galería" : "Close gallery"}
            onClick={closePhotoGallery}
          />
          <div className="relative z-10 flex h-full max-h-[92vh] w-full max-w-6xl flex-col">
            <div className="mb-3 flex items-center justify-between gap-3 text-[#F8F4EA]">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#C9A84A]">
                  {lang === "es" ? "Fotos de la renta" : "Rental photos"}
                </p>
                <p className="text-sm font-bold">{galleryLabel}</p>
              </div>
              <button
                type="button"
                onClick={closePhotoGallery}
                className="min-h-[44px] rounded-full border border-white/25 px-4 py-2 text-sm font-bold transition hover:bg-white/10"
              >
                {lang === "es" ? "Cerrar" : "Close"}
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-white/15 bg-black/35 p-2 sm:p-4">
              <img
                src={ph[galleryIndex]}
                alt=""
                className="max-h-full max-w-full rounded-xl object-contain shadow-[0_24px_64px_-28px_rgba(0,0,0,0.85)]"
              />
              {galleryCount > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 min-h-[44px] -translate-y-1/2 rounded-full border border-white/25 bg-black/45 px-4 py-2 text-sm font-bold text-[#F8F4EA] transition hover:bg-black/70 sm:left-4"
                  >
                    {lang === "es" ? "Anterior" : "Prev"}
                  </button>
                  <button
                    type="button"
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 min-h-[44px] -translate-y-1/2 rounded-full border border-white/25 bg-black/45 px-4 py-2 text-sm font-bold text-[#F8F4EA] transition hover:bg-black/70 sm:right-4"
                  >
                    {lang === "es" ? "Siguiente" : "Next"}
                  </button>
                </>
              ) : null}
            </div>
            {galleryCount > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {ph.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setGalleryIndex(index)}
                    className="h-16 w-20 shrink-0 overflow-hidden rounded-xl border bg-black sm:h-20 sm:w-28"
                    style={{ borderColor: index === galleryIndex ? GOLD : "rgba(255,255,255,0.22)" }}
                    aria-label={lang === "es" ? `Ver foto ${index + 1}` : `View photo ${index + 1}`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
