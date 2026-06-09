"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCookieConsentCopy } from "@/app/lib/leonix/cookieConsentCopy";
import { resolveRouteLang } from "@/app/lib/language";
import { persistLeonixConsent, readLeonixConsent, type LeonixConsentV1 } from "@/app/lib/leonixPublicConsent";

export function LeonixCookieConsent() {
  const searchParams = useSearchParams();
  const lang = resolveRouteLang(searchParams?.get("lang"));
  const t = getCookieConsentCopy(lang);

  const [mounted, setMounted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [personalization, setPersonalization] = useState(false);
  const [preferencesReopen, setPreferencesReopen] = useState(false);

  const syncFromStorage = useCallback(() => {
    const existing = readLeonixConsent();
    if (existing) {
      setAnalytics(existing.analytics);
      setPersonalization(existing.personalization);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    syncFromStorage();
    if (!readLeonixConsent()) {
      setPanelOpen(true);
    }
  }, [syncFromStorage]);

  useEffect(() => {
    const onPrefs = () => {
      setPreferencesReopen(true);
      syncFromStorage();
      setPanelOpen(true);
      setManage(true);
    };
    window.addEventListener("leonix-consent-preferences", onPrefs);
    return () => window.removeEventListener("leonix-consent-preferences", onPrefs);
  }, [syncFromStorage]);

  const close = useCallback((rec: Pick<LeonixConsentV1, "analytics" | "personalization">) => {
    persistLeonixConsent(rec);
    setPanelOpen(false);
    setManage(false);
  }, []);

  const dismiss = useCallback(() => {
    setPanelOpen(false);
    setManage(false);
    setPreferencesReopen(false);
  }, []);

  const showDismiss = preferencesReopen || readLeonixConsent() !== null;

  if (!mounted || !panelOpen) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[200] max-h-[min(92vh,720px)] overflow-y-auto border-t border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/98 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md sm:max-h-[85vh]"
      role="dialog"
      aria-labelledby="lx-consent-title"
      aria-modal="true"
      lang={lang}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="lx-consent-title" className="text-base font-bold text-[color:var(--lx-text)]">
              {t.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-muted)]">{t.body}</p>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-muted)]">{t.body2}</p>
          </div>
          {showDismiss ? (
            <button
              type="button"
              className="shrink-0 rounded-lg border border-[color:var(--lx-nav-border)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--lx-text-2)]"
              onClick={dismiss}
            >
              {t.close}
            </button>
          ) : null}
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
