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
          subtitle: "Más fotos, video y visibilidad para tu anuncio.",
          benefits: [
            "Hasta 12 fotos",
            "Video destacado",
            "2 impulsos de visibilidad",
            "Duración del anuncio: 30 días",
            "Hasta 3× más visibilidad con video",
          ],
          price: "$9.99",
          cta: "Completar pago",
          back: "Volver a mi anuncio",
          integrationNote: "La pasarela de pago se conectará aquí. Tu borrador se conserva.",
        }
      : {
          title: "LEONIX Pro — For Sale",
          subtitle: "More photos, video, and visibility for your listing.",
          benefits: [
            "Up to 12 photos",
            "Featured video",
            "2 visibility boosts",
            "Listing duration: 30 days",
            "Up to 3× more visibility with video",
          ],
          price: "$9.99",
          cta: "Complete payment",
          back: "Back to my listing",
          integrationNote: "Payment gateway will connect here. Your draft is preserved.",
        };

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16">
      <div className="max-w-lg mx-auto px-6">
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#111111]">{t.title}</h1>
          <p className="mt-2 text-sm text-[#111111]/80">{t.subtitle}</p>
          <ul className="mt-4 space-y-2 text-sm text-[#111111]">
            {t.benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-[#C9B46A]" aria-hidden>✓</span>
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xl font-bold text-[#111111]">{t.price}</p>
          <p className="mt-2 text-xs text-[#111111]/60">{t.integrationNote}</p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-[#111111]/80 px-4 py-3 text-sm font-semibold text-white cursor-not-allowed"
              title={lang === "es" ? "Próximamente" : "Coming soon"}
            >
              {t.cta}
            </button>
            <Link
              href={returnUrl}
              className="w-full rounded-xl border border-black/15 bg-[#F5F5F5] px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#E8E8E8] text-center"
            >
              {t.back}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
