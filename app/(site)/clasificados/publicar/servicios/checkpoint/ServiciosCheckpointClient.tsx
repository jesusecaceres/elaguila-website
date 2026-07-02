"use client";

import { useState } from "react";
import Link from "next/link";

type Lang = "es" | "en";

const COPY = {
  es: {
    title: "Publicar en Servicios",
    subtitle: "Presenta tu negocio de servicios con una ficha profesional.",
    cardKicker: "SERVICIOS PROFESIONALES",
    cardTitle: "Servicios profesionales",
    cardPrice: "$399/mes",
    cardDescription:
      "Para negocios y profesionales que ofrecen servicios locales: mecánicos, dentistas, contratistas, limpieza, belleza, reparación y más.",
    cardCta: "Publicar servicio",
    cardMore: "Ver más",
    cardMoreTitle: "Qué incluye Servicios profesionales — $399/mes",
    cardMoreDetails:
      "Este plan crea una ficha profesional para que clientes encuentren tu negocio, entiendan tus servicios, vean tus fotos, revisen tus horarios y contacten directamente desde Leonix.",
    cardMoreBullets: [
      "Ficha profesional con logo, foto principal y galería",
      "Business Hub con teléfono, SMS, WhatsApp, email, sitio web y redes",
      "Servicios, áreas de servicio, horarios y ubicación pública si aplica",
      "Enlaces extra: formulario, portafolio, calendario, reserva o cotización",
      "Hasta 4 promociones generales incluidas",
      "Preparado para móvil/PWA",
    ],
    cardMoreCta: "Publicar servicio",
    cardMoreClose: "Cerrar",
    couponUpsell: "Opcional: agrega cupones destacados por +$99/mes dentro de la aplicación.",
    couponPreviewTitle: "Cupones destacados",
    couponPreviewPrice: "+$99/mes",
    couponPreviewDescription:
      "Ofertas formales con precio regular y precio especial para atraer clientes con descuentos claros.",
    couponPreviewBullets: [
      "Hasta 4 cupones destacados",
      "Precio regular y precio especial",
      "Imagen/flyer, código, vencimiento y nota opcional",
      "Enlace externo y botón personalizado",
      "Se agregan al resumen final si los activas",
    ],
    couponMoreTitle: "Cupones destacados — +$99/mes",
    couponMoreDetails:
      "Los cupones son una herramienta pagada para convertir visitantes en clientes con ofertas claras. A diferencia de las promociones generales (que están incluidas y son principalmente textuales), los cupones pueden mostrar precio regular, precio especial, ahorro, código y condiciones específicas.",
    couponMoreDifference:
      "Diferencia: Las promociones están incluidas y son principalmente descriptivas. Los cupones son un add-on de pago con precios claros, imágenes y códigos.",
    couponExamples: [
      "Cambio de aceite: antes $49.99, ahora $29.99",
      "Alineación: antes $120, ahora $79",
      "Limpieza dental: antes $180, ahora $99",
      "Consulta inicial: antes $150, ahora $75",
    ],
    couponMoreCta: "Continuar con Servicios",
    couponMoreClose: "Cerrar",
    couponMoreNote: "Puedes activar cupones dentro de la aplicación.",
    backToClasificados: "← Volver a Clasificados",
  },
  en: {
    title: "Publish in Services",
    subtitle: "Present your service business with a professional profile.",
    cardKicker: "PROFESSIONAL SERVICES",
    cardTitle: "Professional services",
    cardPrice: "$399/mes",
    cardDescription:
      "For businesses and professionals offering local services: mechanics, dentists, contractors, cleaning, beauty, repairs, and more.",
    cardCta: "Publish service",
    cardMore: "See more",
    cardMoreTitle: "What's included with Professional services — $399/mes",
    cardMoreDetails:
      "This plan creates a professional profile so customers can find your business, understand your services, see your photos, review your hours, and contact you directly from Leonix.",
    cardMoreBullets: [
      "Professional profile with logo, hero photo, and gallery",
      "Business Hub with phone, SMS, WhatsApp, email, website, and social media",
      "Services, service areas, hours, and public location if applicable",
      "Extra links: form, portfolio, calendar, booking, or quote",
      "Up to 4 general promotions included",
      "Mobile/PWA ready",
    ],
    cardMoreCta: "Publish service",
    cardMoreClose: "Close",
    couponUpsell: "Optional: add featured coupons for +$99/mes inside the application.",
    couponPreviewTitle: "Featured coupons",
    couponPreviewPrice: "+$99/mes",
    couponPreviewDescription:
      "Formal offers with regular price and special price to attract customers with clear discounts.",
    couponPreviewBullets: [
      "Up to 4 featured coupons",
      "Regular price and special price",
      "Image/flyer, code, expiration, and note optional",
      "External link and custom button",
      "Added to final summary if activated",
    ],
    couponMoreTitle: "Featured coupons — +$99/mes",
    couponMoreDetails:
      "Coupons are a paid tool to convert visitors into customers with clear offers. Unlike general promotions (which are included and primarily text-based), coupons can show regular price, special price, savings, code, and specific conditions.",
    couponMoreDifference:
      "Difference: Promotions are included and primarily descriptive. Coupons are a paid add-on with clear prices, images, and codes.",
    couponExamples: [
      "Oil change: was $49.99, now $29.99",
      "Alignment: was $120, now $79",
      "Dental cleaning: was $180, now $99",
      "Initial consultation: was $150, now $75",
    ],
    couponMoreCta: "Continue with Services",
    couponMoreClose: "Close",
    couponMoreNote: "You can activate coupons inside the application.",
    backToClasificados: "← Back to Classifieds",
  },
} as const;

const CARD =
  "rounded-[20px] border border-[#D8C79A] bg-[#FFFDF7] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] sm:p-6";

const PRIMARY_CARD =
  "rounded-2xl border-2 border-[#C9782F]/70 bg-gradient-to-b from-[#FFFDF7] to-[#F6F0E2] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[#C9782F]/25";

const COUPON_CARD =
  "rounded-2xl border border-[#D8C79A] bg-[#FFFDF7]/70 p-5";

export function ServiciosCheckpointClient({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const [productMoreOpen, setProductMoreOpen] = useState(false);
  const [couponMoreOpen, setCouponMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F0E2] text-[#3D2C12]">
      <main className="mx-auto max-w-5xl px-4 py-8 pb-16 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/clasificados"
            className="inline-flex min-h-[40px] items-center text-sm font-medium text-[#5D4A25] underline underline-offset-2 hover:text-[#3D2C12]"
          >
            {t.backToClasificados}
          </Link>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#3D2C12] sm:text-3xl">
            {t.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5D4A25]/90">
            {t.subtitle}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Main Product Card */}
          <div className={PRIMARY_CARD}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#C9782F]">
                  {t.cardKicker}
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#3D2C12] sm:text-2xl">
                  {t.cardTitle}
                </h2>
                <p className="mt-1 text-2xl font-bold text-[#C9782F]">{t.cardPrice}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#5D4A25]/90">
                  {t.cardDescription}
                </p>
              </div>
            </div>

            {/* Included Value Bullets */}
            <ul className="mt-5 space-y-2 text-sm text-[#5D4A25]/90">
              {t.cardMoreBullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9782F]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Coupon Upsell Note */}
            <p className="mt-5 text-xs font-semibold text-[#8a7a62]">
              {t.couponUpsell}
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={`/clasificados/publicar/servicios?lang=${lang}`}
                className="min-h-[44px] inline-flex items-center justify-center rounded-full bg-[#3D2C12] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a1e0d]"
              >
                {t.cardCta}
              </Link>
              <button
                type="button"
                onClick={() => setProductMoreOpen(true)}
                className="min-h-[44px] inline-flex items-center justify-center rounded-full border border-[#D8C79A] bg-white px-6 py-2.5 text-sm font-semibold text-[#3D2C12] transition hover:bg-[#FFFDF7]"
              >
                {t.cardMore}
              </button>
            </div>
          </div>

          {/* Coupon Preview Card */}
          <div className={COUPON_CARD}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#3D2C12]">
                  {t.couponPreviewTitle}
                </h3>
                <p className="mt-1 text-xl font-bold text-[#C9782F]">
                  {t.couponPreviewPrice}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#5D4A25]/90">
                  {t.couponPreviewDescription}
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-[#5D4A25]/90">
              {t.couponPreviewBullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9782F]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCouponMoreOpen(true)}
                className="min-h-[40px] inline-flex items-center text-sm font-semibold text-[#3B66AD] underline underline-offset-2 hover:text-[#2f5699]"
              >
                {t.cardMore}
              </button>
            </div>
          </div>
        </div>

        {/* Product More Drawer */}
        {productMoreOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal
          >
            <div className={CARD + " max-h-[80vh] overflow-y-auto max-w-2xl w-full"}>
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold text-[#3D2C12]">
                  {t.cardMoreTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setProductMoreOpen(false)}
                  className="text-sm font-semibold text-[#5D4A25] underline underline-offset-2 hover:text-[#3D2C12]"
                >
                  {t.cardMoreClose}
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#5D4A25]/90">
                {t.cardMoreDetails}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#5D4A25]/90">
                {t.cardMoreBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9782F]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setProductMoreOpen(false)}
                  className="min-h-[44px] inline-flex items-center justify-center rounded-full border border-[#D8C79A] bg-white px-6 py-2.5 text-sm font-semibold text-[#3D2C12] transition hover:bg-[#FFFDF7]"
                >
                  {t.cardMoreClose}
                </button>
                <Link
                  href={`/clasificados/publicar/servicios?lang=${lang}`}
                  className="min-h-[44px] inline-flex items-center justify-center rounded-full bg-[#3D2C12] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a1e0d]"
                >
                  {t.cardMoreCta}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Coupon More Drawer */}
        {couponMoreOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal
          >
            <div className={CARD + " max-h-[80vh] overflow-y-auto max-w-2xl w-full"}>
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold text-[#3D2C12]">
                  {t.couponMoreTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setCouponMoreOpen(false)}
                  className="text-sm font-semibold text-[#5D4A25] underline underline-offset-2 hover:text-[#3D2C12]"
                >
                  {t.couponMoreClose}
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#5D4A25]/90">
                {t.couponMoreDetails}
              </p>
              <div className="mt-4 rounded-xl border border-[#D8C79A]/50 bg-[#FFFDF7]/50 p-4">
                <p className="text-xs font-semibold text-[#8a7a62]">
                  {t.couponMoreDifference}
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-[#D8C79A]/50 bg-[#FFFDF7]/50 p-4">
                <p className="text-xs font-semibold text-[#8a7a62]">Ejemplos:</p>
                <ul className="mt-2 space-y-1 text-sm text-[#5D4A25]/90">
                  {t.couponExamples.map((example, i) => (
                    <li key={i}>• {example}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 text-xs text-[#8a7a62]">
                {t.couponMoreNote}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCouponMoreOpen(false)}
                  className="min-h-[44px] inline-flex items-center justify-center rounded-full border border-[#D8C79A] bg-white px-6 py-2.5 text-sm font-semibold text-[#3D2C12] transition hover:bg-[#FFFDF7]"
                >
                  {t.couponMoreClose}
                </button>
                <Link
                  href={`/clasificados/publicar/servicios?lang=${lang}`}
                  className="min-h-[44px] inline-flex items-center justify-center rounded-full bg-[#3D2C12] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a1e0d]"
                >
                  {t.couponMoreCta}
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
