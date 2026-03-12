"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function EnVentaProPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const category = (params?.category as string) || "en-venta";
  const lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const returnUrl = searchParams?.get("return") || `/clasificados/publicar/${category}?lang=${lang}&step=media`;

  const t =
    lang === "es"
      ? {
          title: "LEONIX Pro — En Venta",
          subtitle: "Mejora este anuncio con más fotos, video y visibilidad.",
          mediaTitle: "Más impacto para tu anuncio",
          benefits: [
            "Hasta 12 fotos",
            "Video destacado",
            "2 impulsos de visibilidad",
            "Duración del anuncio: 30 días",
            "Hasta 3× más visibilidad con video",
          ],
          analyticsTitle: "Analíticas del anuncio",
          analyticsSub: "Señales para entender si tu anuncio está funcionando.",
          analytics: [
            "Vistas del anuncio",
            "Guardados y compartidos",
            "Mejor seguimiento del rendimiento",
          ],
          contactTitle: "Más oportunidades de contacto",
          contactSub: "Tu anuncio con más presencia en el mercado.",
          contact: [
            "Los compradores podrán guardar y compartir tu anuncio",
            "Mejores oportunidades de interacción",
          ],
          price: "$9.99",
          cta: "Completar pago",
          back: "Volver a mi anuncio",
          savedReassurance: "Tu anuncio ha sido guardado. Puedes volver cuando quieras.",
          integrationNote: "La pasarela de pago se conectará aquí.",
        }
      : {
          title: "LEONIX Pro — For Sale",
          subtitle: "Upgrade this listing with more photos, video, and visibility.",
          mediaTitle: "More impact for your listing",
          benefits: [
            "Up to 12 photos",
            "Featured video",
            "2 visibility boosts",
            "Listing duration: 30 days",
            "Up to 3× more visibility with video",
          ],
          analyticsTitle: "Listing analytics",
          analyticsSub: "Signals to understand how your listing is performing.",
          analytics: [
            "Listing views",
            "Saves and shares",
            "Better performance tracking",
          ],
          contactTitle: "More contact opportunities",
          contactSub: "Stronger presence for your listing in the marketplace.",
          contact: [
            "Buyers can save and share your listing",
            "Better opportunities for interaction",
          ],
          price: "$9.99",
          cta: "Complete payment",
          back: "Back to my listing",
          savedReassurance: "Your listing has been saved. You can come back anytime.",
          integrationNote: "Payment gateway will connect here.",
        };

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-white pt-28 pb-20">
      <div className="max-w-lg mx-auto px-5">
        {/* Hero */}
        <div className="text-center mb-8">
          <p className="text-[#C9B46A] text-sm font-semibold uppercase tracking-wider">
            {lang === "es" ? "En Venta" : "For Sale"}
          </p>
          <h1 className="text-3xl font-extrabold text-white mt-1">{t.title}</h1>
          <p className="mt-3 text-[#E0E0E0]">{t.subtitle}</p>
        </div>

        {/* Card: premium container */}
        <div className="rounded-2xl border border-[#C9B46A]/30 bg-[#252525] shadow-xl overflow-hidden">
          {/* Core media */}
          <section className="p-6 border-b border-white/10">
            <h2 className="text-lg font-bold text-[#C9B46A]">{t.mediaTitle}</h2>
            <ul className="mt-4 space-y-3 text-[#E8E8E8]">
              {t.benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="text-[#C9B46A] shrink-0" aria-hidden>✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </section>

          {/* Analytics */}
          <section className="p-6 border-b border-white/10 bg-[#2a2a2a]/60">
            <h2 className="text-lg font-bold text-[#C9B46A]">{t.analyticsTitle}</h2>
            <p className="mt-1 text-sm text-[#B0B0B0]">{t.analyticsSub}</p>
            <ul className="mt-3 space-y-2 text-sm text-[#E0E0E0]">
              {t.analytics.map((a, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-[#C9B46A]/90">•</span>
                  {a}
                </li>
              ))}
            </ul>
          </section>

          {/* Contact / buyer tools */}
          <section className="p-6">
            <h2 className="text-lg font-bold text-[#C9B46A]">{t.contactTitle}</h2>
            <p className="mt-1 text-sm text-[#B0B0B0]">{t.contactSub}</p>
            <ul className="mt-3 space-y-2 text-sm text-[#E0E0E0]">
              {t.contact.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-[#C9B46A]/90">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </section>

          {/* Price + CTAs */}
          <div className="p-6 pt-2 bg-[#1f1f1f] border-t border-white/10">
            <p className="text-sm font-medium text-[#C9B46A]">{t.savedReassurance}</p>
            <p className="mt-3 text-2xl font-bold text-white">{t.price}</p>
            <p className="mt-1 text-xs text-[#888]">{t.integrationNote}</p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-[#C9B46A]/90 px-4 py-3.5 text-sm font-semibold text-[#111111] cursor-not-allowed"
                title={lang === "es" ? "Próximamente" : "Coming soon"}
              >
                {t.cta}
              </button>
              <Link
                href={returnUrl}
                className="w-full rounded-xl border border-white/20 bg-transparent px-4 py-3.5 text-sm font-semibold text-white hover:bg-white/10 text-center transition"
              >
                {t.back}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
