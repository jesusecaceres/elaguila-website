"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Lang = "es" | "en";
type SellerMode = "personal" | "business";
type BizCategory = "rentas" | "autos" | "en-venta" | "empleos" | "servicios" | "clases" | "comunidad";

function getLang(sp: URLSearchParams | null): Lang {
  const v = (sp?.get("lang") ?? "").toLowerCase();
  return v === "en" ? "en" : "es";
}

const BUSINESS_PRICES: Record<Exclude<BizCategory, "clases" | "comunidad">, number> = {
  rentas: 189,
  autos: 149,
  "en-venta": 149,
  empleos: 135,
  servicios: 129,
};

export default function ClasificadosCuentaPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const lang = useMemo(() => getLang(sp), [sp]);

  const t = useMemo(() => {
    const es = lang === "es";
    return {
      title: es ? "Tu cuenta" : "Your account",
      back: es ? "Volver a Clasificados" : "Back to Classifieds",
      note: es
        ? "Los precios se muestran aquí después de iniciar sesión y seleccionar lo que vendes/ofreces."
        : "Pricing is shown here after you sign in and select what you sell/offer.",
      modeLabel: es ? "¿Eres vendedor personal o negocio?" : "Are you a personal seller or a business?",
      personal: es ? "Personal" : "Personal",
      business: es ? "Negocio" : "Business",
      pickCat: es ? "Selecciona tu categoría" : "Pick your category",
      priceLabel: es ? "Precio mensual" : "Monthly price",
      included: es ? "Incluye" : "Includes",
      excl: es ? "No incluye" : "Does not include",
      bizIncluded: es
        ? ["Insignia de negocio", "Múltiples anuncios activos", "Mejor visibilidad que anuncios personales", "Analíticas básicas"]
        : ["Business badge", "Multiple active listings", "Higher visibility than personal listings", "Basic analytics"],
      bizExcluded: es ? ["Cupones", "Sorteos"] : ["Coupons", "Sweepstakes"],
      freeHint: es
        ? "Publica gratis con límites. Ideal para ventas ocasionales."
        : "Post free with limits. Best for occasional selling.",
      proHint: es
        ? "Más duración, mejor visibilidad y presentación limpia (sin comportamiento de negocio)."
        : "Longer duration, better visibility, cleaner presentation (no business behavior).",
      proTitle: es ? "LEONIX Pro (beneficios)" : "LEONIX Pro (benefits)",
      freeTitle: es ? "Gratis (beneficios)" : "Free (benefits)",
    };
  }, [lang]);

  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<SellerMode>("personal");
  const [bizCat, setBizCat] = useState<BizCategory>("rentas");

  useEffect(() => {
    // Gate behind auth (prices live behind login)
    const supabase = createSupabaseBrowserClient();
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!data.session) {
          const target = `/clasificados/cuenta?lang=${lang}`;
          const q = new URLSearchParams();
          q.set("redirect", target);
          router.replace(`/login?${q.toString()}`);
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        // If something goes wrong, still keep UX safe by sending to login
        const target = `/clasificados/cuenta?lang=${lang}`;
        const q = new URLSearchParams();
        q.set("redirect", target);
        router.replace(`/login?${q.toString()}`);
      });
  }, [router, lang]);

  const bizPrice =
    mode === "business" && bizCat !== "clases" && bizCat !== "comunidad"
      ? BUSINESS_PRICES[bizCat as Exclude<BizCategory, "clases" | "comunidad">]
      : null;

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 text-gray-200">…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <div className="text-3xl font-extrabold text-yellow-200">{t.title}</div>
          <div className="mt-2 text-sm text-gray-300">{t.note}</div>
          <div className="mt-4">
            <Link href={`/clasificados?lang=${lang}`} className="text-sm text-gray-200 underline underline-offset-4">
              {t.back}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-gray-100">{t.modeLabel}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("personal")}
              className={
                "rounded-xl border px-4 py-2 text-sm font-semibold transition " +
                (mode === "personal"
                  ? "border-yellow-400/40 bg-yellow-500/10 text-yellow-200"
                  : "border-white/10 bg-black/20 text-gray-100 hover:bg-white/5")
              }
            >
              {t.personal}
            </button>
            <button
              type="button"
              onClick={() => setMode("business")}
              className={
                "rounded-xl border px-4 py-2 text-sm font-semibold transition " +
                (mode === "business"
                  ? "border-yellow-400/40 bg-yellow-500/10 text-yellow-200"
                  : "border-white/10 bg-black/20 text-gray-100 hover:bg-white/5")
              }
            >
              {t.business}
            </button>
          </div>

          {mode === "personal" ? (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-lg font-bold text-gray-100">{t.freeTitle}</div>
                <div className="mt-2 text-sm text-gray-300">{t.freeHint}</div>
              </div>
              <div className="rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-5">
                <div className="text-lg font-bold text-yellow-200">{t.proTitle}</div>
                <div className="mt-2 text-sm text-gray-200">{t.proHint}</div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="text-sm font-semibold text-gray-100">{t.pickCat}</div>
              <select
                value={bizCat}
                onChange={(e) => setBizCat(e.target.value as BizCategory)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-100"
              >
                <option value="rentas">{lang === "es" ? "Rentas" : "Rentals"}</option>
                <option value="autos">{lang === "es" ? "Autos" : "Autos"}</option>
                <option value="en-venta">{lang === "es" ? "En Venta" : "For Sale"}</option>
                <option value="empleos">{lang === "es" ? "Empleos" : "Jobs"}</option>
                <option value="servicios">{lang === "es" ? "Servicios" : "Services"}</option>
                <option value="clases">{lang === "es" ? "Clases (gratis)" : "Classes (free)"}</option>
                <option value="comunidad">{lang === "es" ? "Comunidad (gratis)" : "Community (free)"}</option>
              </select>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-sm text-gray-300">{t.priceLabel}</div>
                <div className="mt-1 text-3xl font-extrabold text-yellow-200">
                  {bizPrice == null ? (lang === "es" ? "Gratis" : "Free") : `$${bizPrice}/mo`}
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-100">{t.included}</div>
                    <ul className="mt-2 space-y-2 text-sm text-gray-300">
                      {t.bizIncluded.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="text-yellow-200">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-100">{t.excl}</div>
                    <ul className="mt-2 space-y-2 text-sm text-gray-300">
                      {t.bizExcluded.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
