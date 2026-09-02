"use client";

import { useState, type ReactNode } from "react";
import { BusinessGalleryLightbox, type BusinessGallerySlide } from "@/app/components/media/BusinessGalleryModal";
import type { ComidaLocalAnalyticsContext } from "@/app/lib/clasificados/comida-local/comidaLocalAnalytics";
import type { ComidaLocalPreviewVm } from "@/app/lib/clasificados/comida-local/comidaLocalPreviewTypes";
import { ComidaLocalContactActions } from "./ComidaLocalContactActions";
import { SharedConnectionHubReviewDrawer } from "@/app/components/contact/connectionHub/renderers/SharedConnectionHubReviewDrawer";
import {
  CL_CARD_SURFACE,
  CL_CHIP,
  CL_IMAGE_PLACEHOLDER,
  CL_PANEL,
  CL_SECTION_TITLE,
} from "./comidaLocalCustomerStyles";

type Props = {
  vm: ComidaLocalPreviewVm;
  /** Public listing only — real ID from DB when present. */
  leonixAdId?: string | null;
  /** When set, contact CTAs emit real analytics events (public detail only). */
  analyticsContext?: ComidaLocalAnalyticsContext | null;
  /** Gate D21 — section titles/system copy; defaults to Spanish (prior behavior unchanged). */
  lang?: "es" | "en";
};

const SHELL_COPY = {
  es: {
    noPhoto: "Sin foto",
    queVendes: "Qué vendes",
    findMeToday: "Encuéntrame hoy",
    availability: "Disponibilidad: ",
    hours: "Horario",
    openNow: "Abierto ahora",
    closedNow: "Cerrado ahora",
    serviceOptions: "Opciones de servicio",
    paymentMethods: "Métodos de pago",
    paymentHint: "Solo informativo — no procesamos pagos en Leonix.",
    extras: "Extras",
    price: "Precio: ",
    languages: "Idiomas: ",
    highlights: "Detalles destacados",
    links: "Enlaces",
    orderLink: "Pedidos / contacto",
    eventSchedule: "Próximo evento",
    cateringDetails: "Catering",
    cateringRadius: "Área de servicio: ",
    mealPrepSchedule: "Horario de meal prep",
    gallery: "Galería",
    leonixId: "ID Leonix: ",
    galleryAria: "Galería",
    close: "Cerrar",
    prev: "Anterior",
    next: "Siguiente",
    photo: "Foto",
  },
  en: {
    noPhoto: "No photo",
    queVendes: "What you sell",
    findMeToday: "Find me today",
    availability: "Availability: ",
    hours: "Hours",
    openNow: "Open now",
    closedNow: "Closed now",
    serviceOptions: "Service options",
    paymentMethods: "Payment methods",
    paymentHint: "Informational only — Leonix does not process payments.",
    extras: "Extras",
    price: "Price: ",
    languages: "Languages: ",
    highlights: "Highlights",
    links: "Links",
    orderLink: "Order / contact",
    eventSchedule: "Next event",
    cateringDetails: "Catering",
    cateringRadius: "Service area: ",
    mealPrepSchedule: "Meal prep schedule",
    gallery: "Gallery",
    leonixId: "Leonix ID: ",
    galleryAria: "Gallery",
    close: "Close",
    prev: "Previous",
    next: "Next",
    photo: "Photo",
  },
} as const;

function SafeListingImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />
  );
}

function DetailSection({
  title,
  children,
  hint,
}: {
  title: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <section className={`${CL_PANEL} px-4 py-4 sm:px-5 sm:py-5`}>
      <h2 className={CL_SECTION_TITLE}>{title}</h2>
      {hint ? <p className="mt-1 text-[11px] text-[#1E1814]/50">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ComidaLocalDetailShell({ vm, leonixAdId, analyticsContext, lang = "es" }: Props) {
  const copy = SHELL_COPY[lang];
  const headerImage = vm.mainImage ?? vm.logoImage;
  const gallerySlides: BusinessGallerySlide[] = vm.galleryImages.map((img) => ({
    kind: "image",
    url: img.src,
    alt: img.alt,
  }));
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <header className={`${CL_CARD_SURFACE} overflow-hidden p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0">
            {headerImage ? (
              <SafeListingImage
                src={headerImage.src}
                alt={headerImage.alt}
                className="aspect-square h-24 w-24 rounded-lg border border-[#D4C4A8]/80 object-cover sm:h-28 sm:w-28"
              />
            ) : (
              <div
                className={`${CL_IMAGE_PLACEHOLDER} aspect-square h-24 w-24 rounded-lg border border-[#D4C4A8]/80 sm:h-28 sm:w-28`}
                aria-hidden
              >
                {copy.noPhoto}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold leading-tight text-[#1E1814] sm:text-2xl">{vm.businessName}</h1>
            {vm.businessTypeLabel ? (
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#7A1E2C]">
                {vm.businessTypeLabel}
              </p>
            ) : null}
            {vm.foodTypeChips.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {vm.foodTypeChips.map((c) => (
                  <span key={c.key} className={CL_CHIP}>
                    {c.label}
                  </span>
                ))}
              </div>
            ) : null}
            {vm.locationLine ? (
              <p className="mt-2 text-sm text-[#1E1814]/72">{vm.locationLine}</p>
            ) : null}
            {vm.sections.showBusinessAddress ? (
              <p className="mt-1 text-sm text-[#1E1814]/72">{vm.businessAddressLine}</p>
            ) : null}
          </div>
        </div>

        {vm.sections.showContact ? (
          <div className="mt-4 border-t border-[#D4C4A8]/50 pt-4">
            <ComidaLocalContactActions
              actions={vm.contactActions}
              analyticsContext={analyticsContext}
              businessName={vm.businessName}
              lang={lang}
            />
          </div>
        ) : null}

        {vm.reviewLinks.length > 0 ? (
          <div className="mt-3">
            <SharedConnectionHubReviewDrawer
              links={vm.reviewLinks}
              lang={lang}
              businessName={vm.businessName}
              onLinkClick={(link) => {
                if (typeof window !== "undefined") {
                  window.open(link.url, "_blank", "noopener,noreferrer");
                }
              }}
            />
          </div>
        ) : null}
      </header>

      {vm.sections.showQueVendes ? (
        <DetailSection title={copy.queVendes}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1E1814]/88">{vm.queVendes}</p>
        </DetailSection>
      ) : null}

      {vm.sections.showLocationAvailability ? (
        <DetailSection title={copy.findMeToday}>
          <div className="space-y-2 text-sm text-[#1E1814]/85">
            {vm.locationNote ? <p>{vm.locationNote}</p> : null}
            {vm.availabilityNote ? (
              <p>
                <span className="font-medium text-[#1E1814]/65">{copy.availability}</span>
                {vm.availabilityNote}
              </p>
            ) : null}
          </div>
        </DetailSection>
      ) : null}

      {vm.sections.showEventSchedule ? (
        <DetailSection title={copy.eventSchedule}>
          <p className="text-sm leading-relaxed text-[#1E1814]/85">{vm.eventScheduleNote}</p>
        </DetailSection>
      ) : null}

      {vm.sections.showOrderLink && vm.orderLink ? (
        <DetailSection title={copy.orderLink}>
          <a
            href={vm.orderLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className={CL_CHIP}
          >
            {vm.orderLink.label}
          </a>
        </DetailSection>
      ) : null}

      {vm.sections.showCateringDetails ? (
        <DetailSection title={copy.cateringDetails}>
          <div className="space-y-2 text-sm text-[#1E1814]/85">
            {vm.cateringServiceRadiusNote ? (
              <p>
                <span className="font-medium text-[#1E1814]/65">{copy.cateringRadius}</span>
                {vm.cateringServiceRadiusNote}
              </p>
            ) : null}
            {vm.cateringEventInfoNote ? <p className="whitespace-pre-wrap">{vm.cateringEventInfoNote}</p> : null}
          </div>
        </DetailSection>
      ) : null}

      {vm.sections.showMealPrepSchedule ? (
        <DetailSection title={copy.mealPrepSchedule}>
          <p className="text-sm leading-relaxed text-[#1E1814]/85">{vm.mealPrepScheduleNote}</p>
        </DetailSection>
      ) : null}

      {vm.sections.showHours ? (
        <DetailSection title={copy.hours}>
          {vm.isOpenNow !== null ? (
            <p
              className={`mb-2 text-sm font-semibold ${vm.isOpenNow ? "text-emerald-700" : "text-[#7A1E2C]"}`}
            >
              {vm.isOpenNow ? copy.openNow : copy.closedNow}
            </p>
          ) : null}
          <ul className="space-y-1 text-sm text-[#1E1814]/80">
            {vm.hoursLines.map((line) => (
              <li key={line.dayLabel} className="flex justify-between gap-4">
                <span className="text-[#1E1814]/60">{line.dayLabel}</span>
                <span>{line.text}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {vm.sections.showService ? (
        <DetailSection title={copy.serviceOptions}>
          <div className="flex flex-wrap gap-1.5">
            {vm.serviceChips.map((c) => (
              <span key={c.key} className={CL_CHIP}>
                {c.label}
              </span>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {vm.sections.showPayment ? (
        <DetailSection
          title={copy.paymentMethods}
          hint={copy.paymentHint}
        >
          <div className="flex flex-wrap gap-1.5">
            {vm.paymentChips.map((c) => (
              <span key={c.key} className={CL_CHIP}>
                {c.label}
              </span>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {vm.sections.showExtras ? (
        <DetailSection title={copy.extras}>
          <div className="flex flex-wrap gap-3 text-sm text-[#1E1814]/85">
            {vm.priceLevelLabel ? (
              <span>
                <span className="font-medium text-[#1E1814]/60">{copy.price}</span>
                {vm.priceLevelLabel}
              </span>
            ) : null}
            {vm.languageLabels.length > 0 ? (
              <span>
                <span className="font-medium text-[#1E1814]/60">{copy.languages}</span>
                {vm.languageLabels.join(" · ")}
              </span>
            ) : null}
          </div>
        </DetailSection>
      ) : null}

      {vm.sections.showHighlights ? (
        <DetailSection title={copy.highlights}>
          <div className="flex flex-wrap gap-1.5">
            {vm.highlightChips.map((c) => (
              <span key={c.key} className={CL_CHIP}>
                {c.label}
              </span>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {vm.sections.showAdditionalWebsites ? (
        <DetailSection title={copy.links}>
          <div className="flex flex-wrap gap-2">
            {vm.additionalWebsites.map((link, i) => (
              <a
                key={`${link.href}-${i}`}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={CL_CHIP}
              >
                {link.label}
              </a>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {vm.sections.showGallery ? (
        <DetailSection title={copy.gallery}>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {vm.galleryImages.map((img, i) => (
              <button
                key={`${img.src}-${i}`}
                type="button"
                onClick={() => {
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
                className="block"
              >
                <SafeListingImage
                  src={img.src}
                  alt={img.alt}
                  className="aspect-square w-full rounded-lg border border-[#D4C4A8]/70 object-cover"
                />
              </button>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {gallerySlides.length > 0 ? (
        <BusinessGalleryLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          slides={gallerySlides}
          activeIndex={lightboxIndex}
          onActiveIndexChange={setLightboxIndex}
          ariaLabel={copy.galleryAria}
          copy={{ close: copy.close, prev: copy.prev, next: copy.next, counterLabel: copy.photo }}
        />
      ) : null}

      {leonixAdId ? (
        <p className="pb-2 text-center text-[11px] text-[#1E1814]/42">
          {copy.leonixId}
          <span className="font-mono">{leonixAdId}</span>
        </p>
      ) : null}
    </article>
  );
}
