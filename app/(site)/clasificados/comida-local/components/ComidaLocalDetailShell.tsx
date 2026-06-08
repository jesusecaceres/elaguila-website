"use client";

import type { ReactNode } from "react";
import type { ComidaLocalAnalyticsContext } from "@/app/lib/clasificados/comida-local/comidaLocalAnalytics";
import type { ComidaLocalPreviewVm } from "@/app/lib/clasificados/comida-local/comidaLocalPreviewTypes";
import { ComidaLocalContactActions } from "./ComidaLocalContactActions";
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
};

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

export function ComidaLocalDetailShell({ vm, leonixAdId, analyticsContext }: Props) {
  const headerImage = vm.mainImage ?? vm.logoImage;

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
                Sin foto
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold leading-tight text-[#1E1814] sm:text-2xl">{vm.businessName}</h1>
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
          </div>
        </div>

        {vm.sections.showContact ? (
          <div className="mt-4 border-t border-[#D4C4A8]/50 pt-4">
            <ComidaLocalContactActions
              actions={vm.contactActions}
              analyticsContext={analyticsContext}
            />
          </div>
        ) : null}
      </header>

      {vm.sections.showQueVendes ? (
        <DetailSection title="Qué vendes">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1E1814]/88">{vm.queVendes}</p>
        </DetailSection>
      ) : null}

      {vm.sections.showLocationAvailability ? (
        <DetailSection title="Ubicación y disponibilidad">
          <div className="space-y-2 text-sm text-[#1E1814]/85">
            {vm.locationNote ? <p>{vm.locationNote}</p> : null}
            {vm.availabilityNote ? (
              <p>
                <span className="font-medium text-[#1E1814]/65">Disponibilidad: </span>
                {vm.availabilityNote}
              </p>
            ) : null}
          </div>
        </DetailSection>
      ) : null}

      {vm.sections.showService ? (
        <DetailSection title="Opciones de servicio">
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
          title="Métodos de pago"
          hint="Solo informativo — no procesamos pagos en Leonix."
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
        <DetailSection title="Extras">
          <div className="flex flex-wrap gap-3 text-sm text-[#1E1814]/85">
            {vm.priceLevelLabel ? (
              <span>
                <span className="font-medium text-[#1E1814]/60">Precio: </span>
                {vm.priceLevelLabel}
              </span>
            ) : null}
            {vm.languageLabels.length > 0 ? (
              <span>
                <span className="font-medium text-[#1E1814]/60">Idiomas: </span>
                {vm.languageLabels.join(" · ")}
              </span>
            ) : null}
          </div>
        </DetailSection>
      ) : null}

      {vm.sections.showGallery ? (
        <DetailSection title="Galería">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {vm.galleryImages.map((img, i) => (
              <SafeListingImage
                key={`${img.src}-${i}`}
                src={img.src}
                alt={img.alt}
                className="aspect-square w-full rounded-lg border border-[#D4C4A8]/70 object-cover"
              />
            ))}
          </div>
        </DetailSection>
      ) : null}

      {leonixAdId ? (
        <p className="pb-2 text-center text-[11px] text-[#1E1814]/42">
          ID Leonix: <span className="font-mono">{leonixAdId}</span>
        </p>
      ) : null}
    </article>
  );
}
