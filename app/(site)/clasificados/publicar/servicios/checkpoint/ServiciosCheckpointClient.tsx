"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SupportedLang } from "@/app/lib/language";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";

const COPY = {
  es: {
    title: "Publicar en Servicios",
    subtitle: "Presenta tu negocio de servicios con una ficha profesional.",
    cardKicker: "SERVICIOS PROFESIONALES",
    cardTitle: "Servicios profesionales",
    cardPrice: "$399/mes",
    cardDescription:
      "Para negocios y profesionales que ofrecen servicios locales: mecánicos, dentistas, contratistas, limpieza, belleza, reparación, impuestos, seguros, salud, asesorías y más.",
    cardCta: "Publicar servicio",
    cardMore: "Ver más",
    cardMoreTitle: "Qué incluye Servicios profesionales — $399/mes",
    cardMoreDetails:
      "Este plan crea una ficha profesional para que clientes encuentren tu negocio, entiendan tus servicios, vean tus fotos, revisen tus horarios y contacten directamente desde Leonix.",
    cardMoreBullets: [
      "Perfil visual con logo, foto principal y galería",
      "Servicios principales, especialidades y detalles rápidos",
      "Business Hub con teléfono, SMS, WhatsApp, email, sitio web y redes sociales",
      "Enlaces adicionales como formulario, portafolio, calendario, reserva o cotización",
      "Áreas de servicio, ciudad, estado, ZIP y ubicación pública cuando aplique",
      "Horarios semanales y nota especial de horario",
      "Hasta 4 promociones generales incluidas",
      "Preparado para móvil/PWA",
      "Negocio en la red Leonix",
      "Opción de agregar cupones destacados por +$99/mes",
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
      "Preparación de taxes: antes $250, ahora $149",
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
      "For businesses and professionals offering local services: mechanics, dentists, contractors, cleaning, beauty, repairs, taxes, insurance, health, consulting, and more.",
    cardCta: "Publish service",
    cardMore: "See more",
    cardMoreTitle: "What's included with Professional services — $399/mes",
    cardMoreDetails:
      "This plan creates a professional profile so customers can find your business, understand your services, see your photos, review your hours, and contact you directly from Leonix.",
    cardMoreBullets: [
      "Visual profile with logo, hero photo, and gallery",
      "Main services, specialties, and quick details",
      "Business Hub with phone, SMS, WhatsApp, email, website, and social media",
      "Extra links like form, portfolio, calendar, booking, or quote",
      "Service areas, city, state, ZIP, and public location when applicable",
      "Weekly hours and special hours note",
      "Up to 4 general promotions included",
      "Mobile/PWA ready",
      "Business on the Leonix network",
      "Option to add featured coupons for +$99/mes",
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
      "Tax preparation: was $250, now $149",
    ],
    couponMoreCta: "Continue with Services",
    couponMoreClose: "Close",
    couponMoreNote: "You can activate coupons inside the application.",
    backToClasificados: "← Back to Classifieds",
  },
} as const;

export function ServiciosCheckpointClient({
  lang,
  routeLang,
}: {
  lang: "es" | "en";
  routeLang: SupportedLang;
}) {
  const t = COPY[lang];
  const [productMoreOpen, setProductMoreOpen] = useState(false);
  const applicationHref = withClasificadosPublishLang("/publicar/servicios", routeLang, {
    product: "servicios_profesionales",
  });
  const clasificadosHref = withClasificadosPublishLang("/clasificados", routeLang);

  useEffect(() => {
    if (!productMoreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setProductMoreOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [productMoreOpen]);

  return (
    <div className="min-h-screen bg-[#F6F0E2] text-[#3D2C12]">
      <main className="mx-auto max-w-lg px-4 pb-20 pt-28">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={clasificadosHref}
            className="inline-flex min-h-[40px] items-center text-sm font-medium text-[#5D4A25] underline underline-offset-2 hover:text-[#3D2C12]"
          >
            {t.backToClasificados}
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold text-[#1E1810]">
            {t.title}
          </h1>
          <p className="mt-2 text-sm text-[#5C5346]/88">
            {t.subtitle}
          </p>
        </div>

        {/* Product Cards Stack */}
        <div className="space-y-4">
          <article className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">
                  {t.cardKicker}
                </p>
                <p className="mt-1 text-lg font-bold text-[#1E1810]">
                  {t.cardTitle}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#7A1E2C]">
                  {t.cardPrice}
                </p>
                <p className="mt-2 text-sm text-[#5C5346]/85">
                  {t.cardDescription}
                </p>
                <p className="mt-2 text-xs font-semibold text-[#B8954A]">
                  {t.couponUpsell}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={applicationHref}
                className="text-sm font-bold text-[#7A1E2C] underline-offset-2 hover:underline"
              >
                {t.cardCta}
              </Link>
              <button
                type="button"
                onClick={() => setProductMoreOpen(true)}
                className="text-sm font-semibold text-[#5C5346] underline underline-offset-2 hover:text-[#1E1810]"
              >
                {t.cardMore}
              </button>
            </div>
          </article>
        </div>

        {/* Product More Drawer */}
        {productMoreOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setProductMoreOpen(false)}
          >
            <div
              className="max-w-lg rounded-2xl bg-[#FFFCF7] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-[#1E1810]">
                {t.cardMoreTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#5C5346]">
                {t.cardMoreDetails}
              </p>
              <ul className="mt-4 space-y-2">
                {t.cardMoreBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#5C5346]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setProductMoreOpen(false)}
                className="mt-6 min-h-[44px] w-full rounded-full bg-[#1E1810] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3D2C12]"
              >
                {t.cardMoreClose}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
