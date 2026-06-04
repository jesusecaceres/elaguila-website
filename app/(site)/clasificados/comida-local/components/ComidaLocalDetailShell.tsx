"use client";

import type { ComidaLocalPreviewVm } from "@/app/lib/clasificados/comida-local/comidaLocalPreviewTypes";
import { ComidaLocalContactActions } from "./ComidaLocalContactActions";

const CARD = "rounded-2xl border border-[#D4C4A8]/80 bg-[#FFFCF7] p-5 shadow-sm sm:p-6";
const SECTION_TITLE = "text-sm font-semibold uppercase tracking-wide text-[#1E1814]/65";
const CHIP =
  "inline-flex rounded-lg border border-[#D4C4A8] bg-[#FDF8F0] px-2.5 py-1 text-xs font-medium text-[#1E1814]";

type Props = {
  vm: ComidaLocalPreviewVm;
};

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div
      className="flex aspect-[4/3] w-full max-w-[200px] items-center justify-center rounded-xl border border-[#D4C4A8]/80 bg-gradient-to-br from-[#FDF8F0] to-[#FFFCF7] text-xs text-[#1E1814]/45"
      aria-hidden
    >
      {label}
    </div>
  );
}

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

export function ComidaLocalDetailShell({ vm }: Props) {
  const headerImage = vm.mainImage ?? vm.logoImage;

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <header
        className={`${CARD} overflow-hidden`}
        style={{
          background:
            "linear-gradient(135deg, #FDF8F0 0%, #FFFCF7 45%, rgba(122, 30, 44, 0.06) 100%)",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0">
            {headerImage ? (
              <SafeListingImage
                src={headerImage.src}
                alt={headerImage.alt}
                className="aspect-square h-28 w-28 rounded-xl border border-[#D4C4A8]/80 object-cover sm:h-32 sm:w-32"
              />
            ) : (
              <ImagePlaceholder label="Sin foto principal" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-[#1E1814] sm:text-3xl">{vm.businessName}</h1>
            {vm.foodTypeChips.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {vm.foodTypeChips.map((c) => (
                  <span key={c.key} className={CHIP}>
                    {c.label}
                  </span>
                ))}
              </div>
            ) : null}
            {vm.locationLine ? (
              <p className="mt-2 text-sm text-[#1E1814]/75">{vm.locationLine}</p>
            ) : null}
          </div>
        </div>
      </header>

      {vm.sections.showQueVendes ? (
        <section className={CARD}>
          <h2 className={SECTION_TITLE}>Qué vendes</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#1E1814]/90">
            {vm.queVendes}
          </p>
        </section>
      ) : null}

      {vm.sections.showContact ? (
        <section className={CARD}>
          <h2 className={SECTION_TITLE}>Contacto</h2>
          <div className="mt-4">
            <ComidaLocalContactActions actions={vm.contactActions} />
          </div>
        </section>
      ) : null}

      {vm.sections.showLocationAvailability ? (
        <section className={CARD}>
          <h2 className={SECTION_TITLE}>Ubicación y disponibilidad</h2>
          <div className="mt-3 space-y-2 text-sm text-[#1E1814]/85">
            {vm.locationNote ? <p>{vm.locationNote}</p> : null}
            {vm.availabilityNote ? (
              <p>
                <span className="font-medium text-[#1E1814]/70">Disponibilidad: </span>
                {vm.availabilityNote}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {vm.sections.showService ? (
        <section className={CARD}>
          <h2 className={SECTION_TITLE}>Opciones de servicio</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {vm.serviceChips.map((c) => (
              <span key={c.key} className={CHIP}>
                {c.label}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {vm.sections.showPayment ? (
        <section className={CARD}>
          <h2 className={SECTION_TITLE}>Métodos de pago</h2>
          <p className="mt-1 text-xs text-[#1E1814]/55">Solo informativo — no procesamos pagos aquí.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {vm.paymentChips.map((c) => (
              <span key={c.key} className={CHIP}>
                {c.label}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {vm.sections.showExtras ? (
        <section className={CARD}>
          <h2 className={SECTION_TITLE}>Extras</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#1E1814]/85">
            {vm.priceLevelLabel ? (
              <span>
                <span className="font-medium text-[#1E1814]/65">Precio: </span>
                {vm.priceLevelLabel}
              </span>
            ) : null}
            {vm.languageLabels.length > 0 ? (
              <span>
                <span className="font-medium text-[#1E1814]/65">Idiomas: </span>
                {vm.languageLabels.join(" · ")}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      {vm.sections.showGallery ? (
        <section className={CARD}>
          <h2 className={SECTION_TITLE}>Galería</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {vm.galleryImages.map((img, i) => (
              <SafeListingImage
                key={`${img.src}-${i}`}
                src={img.src}
                alt={img.alt}
                className="aspect-square w-full rounded-xl border border-[#D4C4A8]/70 object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
