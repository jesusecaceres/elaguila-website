"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";

function normalizeCategory(raw: string): CategoryKey | "" {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  const mapped = v === "viajes" ? "travel" : v;
  const keys = Object.keys(categoryConfig) as CategoryKey[];
  return keys.includes(mapped as CategoryKey) ? (mapped as CategoryKey) : "";
}

export default function CategoryProPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const normalized = normalizeCategory((params?.category as string) ?? "");
  const category = normalized === "all" ? "" : normalized;

  useEffect(() => {
    if (!category) {
      router.replace(`/clasificados/publicar?lang=${lang}`);
    }
  }, [category, lang, router]);

  useEffect(() => {
    if (category === "en-venta") {
      router.replace(`/clasificados/publicar/en-venta?lang=${lang}`);
    }
  }, [category, lang, router]);

  if (!category) {
    return (
      <main className="min-h-[50vh] pt-28 flex items-center justify-center text-[#111111]/70 text-sm">
        {lang === "es" ? "Redirigiendo…" : "Redirecting…"}
      </main>
    );
  }

  const returnUrl = searchParams?.get("return") || `/clasificados/publicar/${category}?lang=${lang}&step=media`;

  if (category === "en-venta") {
    return (
      <main className="min-h-[50vh] pt-28 flex items-center justify-center text-[#111111]/70 text-sm">
        {lang === "es" ? "Redirigiendo…" : "Redirecting…"}
      </main>
    );
  }

  const t =
    lang === "es"
      ? {
          title: "LEONIX Pro",
          subtitle: "Mejora este anuncio con más fotos, video y visibilidad.",
          mediaTitle: "Más impacto para tu anuncio",
          benefits: [
            "Hasta 12 fotos",
            "2 videos sobresalientes",
            "2 impulsos de visibilidad",
            "Insignia Pro",
            "Analíticas del anuncio",
            "Duración del anuncio: 30 días",
          ],
          analyticsTitle: "Analíticas del anuncio",
          analyticsSub: "Señales para entender si tu anuncio está funcionando.",
          analytics: [
            "Vistas del anuncio",
            "Guardados y compartidos",
            "Mejor seguimiento del rendimiento",
          ],
          price: "$9.99",
          cta: "Completar pago",
          back: "Volver a mi anuncio",
          savedReassurance: "Tu anuncio ha sido guardado. Puedes volver cuando quieras.",
          integrationNote: "La pasarela de pago se conectará aquí.",
        }
      : {
          title: "LEONIX Pro",
          subtitle: "Upgrade this listing with more photos, video, and visibility.",
          mediaTitle: "More impact for your listing",
          benefits: [
            "Up to 12 photos",
            "2 featured videos",
            "2 visibility boosts",
            "Pro badge",
            "Listing analytics",
            "Listing duration: 30 days",
          ],
          analyticsTitle: "Listing analytics",
          analyticsSub: "Signals to understand how your listing is performing.",
          analytics: [
            "Listing views",
            "Saves and shares",
            "Better performance tracking",
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
        <div className="text-center mb-8">
          <p className="text-[#C9B46A] text-sm font-semibold uppercase tracking-wider">
            {lang === "es" ? "Clasificados" : "Classifieds"}
          </p>
          <h1 className="text-3xl font-extrabold text-white mt-1">{t.title}</h1>
          <p className="mt-3 text-[#E0E0E0]">{t.subtitle}</p>
        </div>

        <div className="rounded-2xl border border-[#C9B46A]/30 bg-[#252525] shadow-xl overflow-hidden">
          <section className="p-6 border-b border-white/10">
            <h2 className="text-lg font-bold text-[#C9B46A]">{t.mediaTitle}</h2>
            <ul className="mt-4 space-y-3 text-[#E8E8E8]">
              {t.benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="text-[#C9B46A] shrink-0" aria-hidden>
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </section>

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
              <a
                href={returnUrl}
                className="w-full rounded-xl border border-white/20 bg-transparent px-4 py-3.5 text-sm font-semibold text-white hover:bg-white/10 text-center transition"
              >
                {t.back}
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
