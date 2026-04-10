"use client";

import { useCallback, useEffect, useState } from "react";
import { persistLeonixConsent, readLeonixConsent, type LeonixConsentV1 } from "@/app/lib/leonixPublicConsent";

const COPY = {
  es: {
    title: "Cookies y preferencias",
    body:
      "Usamos cookies necesarias para el sitio, y —con tu permiso— mediciones de audiencia en primera persona y preferencias para mejorar tu experiencia. No vendemos tus datos.",
    acceptAll: "Aceptar todo",
    rejectNonEssential: "Rechazar lo no esencial",
    manage: "Gestionar preferencias",
    save: "Guardar",
    necessary: "Necesarias (siempre activas)",
    necessaryHint: "Sesión, seguridad, idioma y continuidad de rutas esenciales.",
    analytics: "Analíticas",
    analyticsHint: "Medición agregada del uso (primera parte).",
    personalization: "Personalización",
    personalizationHint: "Recordar preferencias de búsqueda y similares en este sitio.",
  },
  en: {
    title: "Cookies & preferences",
    body:
      "We use strictly necessary cookies for the site, and —with your permission— first-party audience measurement and preferences to improve your experience. We do not sell your data.",
    acceptAll: "Accept all",
    rejectNonEssential: "Reject non-essential",
    manage: "Manage preferences",
    save: "Save",
    necessary: "Necessary (always on)",
    necessaryHint: "Session, security, language, and essential route continuity.",
    analytics: "Analytics",
    analyticsHint: "Aggregated, first-party usage measurement.",
    personalization: "Personalization",
    personalizationHint: "Remember search preferences and similar on this site.",
  },
} as const;

export function LeonixCookieConsent() {
  const [lang, setLang] = useState<"es" | "en">("es");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [personalization, setPersonalization] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const path = window.location.pathname;
      setLang(path.startsWith("/en") ? "en" : "es");
    } catch {
      setLang("es");
    }
    const existing = readLeonixConsent();
    setVisible(!existing);
    if (existing) {
      setAnalytics(existing.analytics);
      setPersonalization(existing.personalization);
    }
  }, []);

  const t = COPY[lang];

  const close = useCallback((rec: Pick<LeonixConsentV1, "analytics" | "personalization">) => {
    persistLeonixConsent(rec);
    setVisible(false);
    setManage(false);
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[200] border-t border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/98 p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md sm:p-5"
      role="dialog"
      aria-labelledby="lx-consent-title"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div>
          <h2 id="lx-consent-title" className="text-base font-bold text-[color:var(--lx-text)]">
            {t.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-muted)]">{t.body}</p>
        </div>

        {manage ? (
          <div className="flex flex-col gap-3 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4">
            <div>
              <p className="text-sm font-semibold text-[color:var(--lx-text)]">{t.necessary}</p>
              <p className="text-xs text-[color:var(--lx-muted)]">{t.necessaryHint}</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-[color:var(--lx-nav-border)]"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              <span>
                <span className="text-sm font-semibold text-[color:var(--lx-text)]">{t.analytics}</span>
                <span className="mt-0.5 block text-xs text-[color:var(--lx-muted)]">{t.analyticsHint}</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-[color:var(--lx-nav-border)]"
                checked={personalization}
                onChange={(e) => setPersonalization(e.target.checked)}
              />
              <span>
                <span className="text-sm font-semibold text-[color:var(--lx-text)]">{t.personalization}</span>
                <span className="mt-0.5 block text-xs text-[color:var(--lx-muted)]">{t.personalizationHint}</span>
              </span>
            </label>
            <button
              type="button"
              className="min-h-[44px] rounded-xl bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold text-[#FFFCF7]"
              onClick={() => close({ analytics, personalization })}
            >
              {t.save}
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            className="min-h-[44px] rounded-xl border border-[color:var(--lx-nav-border)] px-4 text-sm font-semibold text-[color:var(--lx-text)]"
            onClick={() => setManage((m) => !m)}
          >
            {t.manage}
          </button>
          <button
            type="button"
            className="min-h-[44px] rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 text-sm font-semibold text-[color:var(--lx-text)]"
            onClick={() => close({ analytics: false, personalization: false })}
          >
            {t.rejectNonEssential}
          </button>
          <button
            type="button"
            className="min-h-[44px] rounded-xl bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold text-[#FFFCF7]"
            onClick={() => close({ analytics: true, personalization: true })}
          >
            {t.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
