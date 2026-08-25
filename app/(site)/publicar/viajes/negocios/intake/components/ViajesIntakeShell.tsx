"use client";

/**
 * Package 3 — mobile-first Community Opportunity Intake (owner lock 2026-08-25).
 *
 * The mandatory first step for a brand-new Viajes business submission: three short sections
 * (business / offer / community benefit), local draft before authentication, authenticated
 * save at "Send information". After the save Leonix has early visibility and the provider may
 * continue IMMEDIATELY to the prefilled full application — no approval gate. No payment step
 * exists anywhere in this flow.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { resolveClasificadosPublishLang, withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { trackClasificadosEvent } from "@/app/lib/clasificadosAnalytics";
import { ViajesLangSwitch } from "@/app/(site)/clasificados/viajes/components/ViajesLangSwitch";
import {
  normalizeViajesIntakeInput,
  VIAJES_INTAKE_BENEFIT_TYPES,
  VIAJES_INTAKE_MAX_LENGTHS,
  VIAJES_INTAKE_OFFER_TYPES,
  VIAJES_INTAKE_PRICE_BASIS,
  VIAJES_INTAKE_SAME_PUBLIC_OFFER,
  VIAJES_INTAKE_VALUE_BANDS,
  type ViajesIntakeBenefitType,
} from "@/app/(site)/clasificados/viajes/lib/viajesIntakeTypes";
import { getPublicarViajesIntakeCopy } from "../data/publicarViajesIntakeCopy";
import { storeViajesIntakeStagedId, useViajesIntakeDraft } from "../lib/useViajesIntakeDraft";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-5";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full min-h-[44px] rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const CHIP_BASE =
  "inline-flex min-h-[44px] items-center rounded-full border px-3 py-2 text-xs font-semibold transition";
const CHIP_OFF = `${CHIP_BASE} border-[color:var(--lx-nav-border)] bg-[#FFFCF7] text-[color:var(--lx-text-2)]`;
const CHIP_ON = `${CHIP_BASE} border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-text)]`;

export function ViajesIntakeShell() {
  const router = useRouter();
  const sp = useSearchParams();
  const { routeLang, copyLang: lang } = resolveClasificadosPublishLang(sp?.get("lang"));
  const c = getPublicarViajesIntakeCopy(lang);
  const { intake, update, updateBenefit, clearLocalDraft, hydrated } = useViajesIntakeDraft();

  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedStagedId, setSavedStagedId] = useState<string | null>(null);
  const startedTracked = useRef(false);

  useEffect(() => {
    document.title = c.documentTitle;
  }, [c.documentTitle]);

  useEffect(() => {
    if (!hydrated || startedTracked.current) return;
    startedTracked.current = true;
    void trackClasificadosEvent({
      listing_id: null,
      category: "viajes",
      event_type: "apply_started",
      event_source: "unknown",
      metadata: { flow: "viajes_intake", stage: "intake" },
    });
  }, [hydrated]);

  const branchHref = appendLangToPath("/publicar/viajes", routeLang);
  const dashboardHref = appendLangToPath("/dashboard/viajes", routeLang);
  const L = VIAJES_INTAKE_MAX_LENGTHS;

  function toggleBenefitType(t: ViajesIntakeBenefitType) {
    const has = intake.communityBenefit.types.includes(t);
    updateBenefit({
      types: has
        ? intake.communityBenefit.types.filter((x) => x !== t)
        : [...intake.communityBenefit.types, t],
    });
  }

  async function sendIntake() {
    if (!hydrated || busy) return;
    const validated = normalizeViajesIntakeInput(intake);
    if (!validated.ok) {
      setErrors(validated.errors);
      return;
    }
    setErrors([]);
    setBusy(true);
    try {
      let token: string | undefined;
      try {
        const sb = createSupabaseBrowserClient();
        const res = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
        token = res.data.session?.access_token;
      } catch {
        token = undefined;
      }
      if (!token) {
        // Local draft is already persisted — after sign-in the user returns here with nothing lost.
        const returnPath = withClasificadosPublishLang("/publicar/viajes/negocios/intake", routeLang);
        router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
        return;
      }
      const res = await fetch("/api/clasificados/viajes/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lang, intake }),
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string; errors?: string[] };
      if (!res.ok || !json.ok || !json.id) {
        if (json.error === "auth_required") {
          const returnPath = withClasificadosPublishLang("/publicar/viajes/negocios/intake", routeLang);
          router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
          return;
        }
        if (json.error === "invalid_intake" && Array.isArray(json.errors)) {
          setErrors(json.errors);
          return;
        }
        window.alert(lang === "en" ? `Could not send: ${json.error ?? "unknown"}` : `No se pudo enviar: ${json.error ?? "unknown"}`);
        return;
      }
      storeViajesIntakeStagedId(json.id);
      clearLocalDraft();
      setSavedStagedId(json.id);
      void trackClasificadosEvent({
        listing_id: json.id,
        category: "viajes",
        event_type: "apply_submitted",
        event_source: "unknown",
        metadata: { flow: "viajes_intake", stage: "intake" },
      });
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    } catch {
      window.alert(c.networkError);
    } finally {
      setBusy(false);
    }
  }

  const errorText = (codes: string[]) =>
    codes.map((code) => c.errors[code] ?? code).join(" ");

  if (savedStagedId) {
    const continueHref = withClasificadosPublishLang("/publicar/viajes/negocios", routeLang, {
      stagedId: savedStagedId,
    });
    return (
      <div className="min-h-screen pb-16 pt-6 text-[color:var(--lx-text)]" style={{ backgroundColor: "var(--lx-page)" }}>
        <Navbar />
        <div className="mx-auto w-full min-w-0 max-w-xl px-4 sm:px-6">
          <section className={`${CARD} mt-10 text-center`}>
            <h1 className="text-2xl font-bold">{c.received.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.received.body}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={continueHref}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#D97706] px-5 py-3 text-sm font-bold text-white hover:opacity-95"
              >
                {c.received.continueNow}
              </Link>
              <Link
                href={dashboardHref}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-5 py-3 text-sm font-bold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
              >
                {c.received.later}
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden pb-16 pt-6 text-[color:var(--lx-text)]" style={{ backgroundColor: "var(--lx-page)" }}>
      <Navbar />
      <div className="mx-auto flex w-full min-w-0 max-w-xl justify-end px-4 pb-2 sm:px-6">
        <ViajesLangSwitch compact />
      </div>
      <div className="mx-auto w-full min-w-0 max-w-xl px-4 sm:px-6">
        <nav className="text-xs font-semibold text-[color:var(--lx-muted)]">
          <Link
            href={branchHref}
            className="text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
          >
            {c.navBack}
          </Link>
        </nav>

        <header className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">{c.kicker}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{c.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.intro}</p>
          <p className="mt-2 text-xs font-semibold text-[color:var(--lx-muted)]">{c.freeLine}</p>
        </header>

        <div className="mt-6 space-y-5">
          <section className={CARD} aria-labelledby="intake-business">
            <h2 id="intake-business" className="text-base font-bold">{c.sections.business}</h2>
            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.business}</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className={LABEL} htmlFor="in-businessName">{c.fields.businessName.label}</label>
                <input id="in-businessName" className={INPUT} maxLength={L.businessName} value={intake.businessName} onChange={(e) => update({ businessName: e.target.value })} placeholder={c.fields.businessName.placeholder} autoComplete="organization" />
              </div>
              <div>
                <label className={LABEL} htmlFor="in-contactName">{c.fields.contactName.label}</label>
                <input id="in-contactName" className={INPUT} maxLength={L.contactName} value={intake.contactName} onChange={(e) => update({ contactName: e.target.value })} placeholder={c.fields.contactName.placeholder} autoComplete="name" />
              </div>
              <div>
                <label className={LABEL} htmlFor="in-email">{c.fields.email.label}</label>
                <input id="in-email" type="email" inputMode="email" className={INPUT} maxLength={L.email} value={intake.email} onChange={(e) => update({ email: e.target.value })} placeholder={c.fields.email.placeholder} autoComplete="email" />
              </div>
              <div>
                <label className={LABEL} htmlFor="in-phone">{c.fields.phone.label}</label>
                <input id="in-phone" type="tel" inputMode="tel" className={INPUT} maxLength={L.phone} value={intake.phone} onChange={(e) => update({ phone: e.target.value })} placeholder={c.fields.phone.placeholder} autoComplete="tel" />
              </div>
              <div>
                <label className={LABEL} htmlFor="in-website">{c.fields.website.label}</label>
                <input id="in-website" type="url" inputMode="url" className={INPUT} maxLength={L.website} value={intake.website} onChange={(e) => update({ website: e.target.value })} placeholder={c.fields.website.placeholder} autoComplete="url" />
              </div>
              <div>
                <label className={LABEL} htmlFor="in-socials">{c.fields.socials.label}</label>
                <input id="in-socials" className={INPUT} maxLength={L.socials} value={intake.socials} onChange={(e) => update({ socials: e.target.value })} placeholder={c.fields.socials.placeholder} />
              </div>
            </div>
          </section>

          <section className={CARD} aria-labelledby="intake-offer">
            <h2 id="intake-offer" className="text-base font-bold">{c.sections.offer}</h2>
            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.offer}</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className={LABEL} htmlFor="in-offerType">{c.fields.offerType.label}</label>
                <select id="in-offerType" className={INPUT} value={intake.offerType} onChange={(e) => update({ offerType: e.target.value as typeof intake.offerType })}>
                  {["", ...VIAJES_INTAKE_OFFER_TYPES].map((v) => (
                    <option key={v} value={v}>{c.fields.offerType.options[v as keyof typeof c.fields.offerType.options]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="in-destino">{c.fields.destino.label}</label>
                <input id="in-destino" className={INPUT} maxLength={L.destino} value={intake.destino} onChange={(e) => update({ destino: e.target.value })} placeholder={c.fields.destino.placeholder} />
              </div>
              <div>
                <label className={LABEL} htmlFor="in-ciudadSalida">{c.fields.ciudadSalida.label}</label>
                <input id="in-ciudadSalida" className={INPUT} maxLength={L.ciudadSalida} value={intake.ciudadSalida} onChange={(e) => update({ ciudadSalida: e.target.value })} placeholder={c.fields.ciudadSalida.placeholder} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL} htmlFor="in-precio">{c.fields.precio.label}</label>
                  <input id="in-precio" inputMode="decimal" className={INPUT} maxLength={L.precio} value={intake.precio} onChange={(e) => update({ precio: e.target.value })} placeholder={c.fields.precio.placeholder} />
                </div>
                <div>
                  <label className={LABEL} htmlFor="in-priceBasis">{c.fields.priceBasis.label}</label>
                  <select id="in-priceBasis" className={INPUT} value={intake.priceBasis} onChange={(e) => update({ priceBasis: e.target.value as typeof intake.priceBasis })}>
                    {["", ...VIAJES_INTAKE_PRICE_BASIS].map((v) => (
                      <option key={v} value={v}>{c.fields.priceBasis.options[v as keyof typeof c.fields.priceBasis.options]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className={CARD} aria-labelledby="intake-benefit">
            <h2 id="intake-benefit" className="text-base font-bold">{c.sections.benefit}</h2>
            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.sectionHints.benefit}</p>
            <div className="mt-4 space-y-4">
              <div>
                <span className={LABEL}>{c.fields.samePublicOffer.label}</span>
                <div className="mt-2 flex flex-col gap-2">
                  {VIAJES_INTAKE_SAME_PUBLIC_OFFER.map((v) => (
                    <label key={v} className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text-2)]">
                      <input
                        type="radio"
                        name="samePublicOffer"
                        className="h-4 w-4"
                        checked={intake.communityBenefit.samePublicOffer === v}
                        onChange={() => updateBenefit({ samePublicOffer: v })}
                      />
                      {c.fields.samePublicOffer.options[v]}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <span className={LABEL}>{c.fields.benefitTypes.label}</span>
                <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{c.fields.benefitTypes.hint}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {VIAJES_INTAKE_BENEFIT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={intake.communityBenefit.types.includes(t) ? CHIP_ON : CHIP_OFF}
                      aria-pressed={intake.communityBenefit.types.includes(t)}
                      onClick={() => toggleBenefitType(t)}
                    >
                      {c.fields.benefitTypes.options[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={LABEL} htmlFor="in-benefitDescription">{c.fields.benefitDescription.label}</label>
                <textarea id="in-benefitDescription" rows={3} className={INPUT} maxLength={L.benefitDescription} value={intake.communityBenefit.description} onChange={(e) => updateBenefit({ description: e.target.value })} placeholder={c.fields.benefitDescription.placeholder} />
              </div>
              <div>
                <label className={LABEL} htmlFor="in-valueBand">{c.fields.estimatedValueBand.label}</label>
                <select id="in-valueBand" className={INPUT} value={intake.communityBenefit.estimatedValueBand} onChange={(e) => updateBenefit({ estimatedValueBand: e.target.value as (typeof VIAJES_INTAKE_VALUE_BANDS)[number] | "" })}>
                  {["", ...VIAJES_INTAKE_VALUE_BANDS].map((v) => (
                    <option key={v} value={v}>{c.fields.estimatedValueBand.options[v as keyof typeof c.fields.estimatedValueBand.options]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="in-expiration">{c.fields.expiration.label}</label>
                <input id="in-expiration" className={INPUT} maxLength={L.benefitExpiration} value={intake.communityBenefit.expiration} onChange={(e) => updateBenefit({ expiration: e.target.value })} placeholder={c.fields.expiration.placeholder} />
              </div>
              <div>
                <label className={LABEL} htmlFor="in-restrictions">{c.fields.restrictions.label}</label>
                <textarea id="in-restrictions" rows={3} className={INPUT} maxLength={L.benefitRestrictions} value={intake.communityBenefit.restrictions} onChange={(e) => updateBenefit({ restrictions: e.target.value })} placeholder={c.fields.restrictions.placeholder} />
              </div>
            </div>
          </section>

          {errors.length > 0 ? (
            <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
              {errorText(errors)}
            </div>
          ) : null}

          <div className={CARD}>
            <p className="text-xs leading-relaxed text-[color:var(--lx-muted)]">{c.authNote}</p>
            <button
              type="button"
              onClick={() => void sendIntake()}
              disabled={busy || !hydrated}
              className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#D97706] px-5 py-3 text-sm font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? c.submitting : c.submitCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
