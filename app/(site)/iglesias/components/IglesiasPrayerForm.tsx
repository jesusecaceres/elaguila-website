"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { getPrayerUiCopy, prayerCategoryOptions } from "@/app/lib/iglesias/prayerCopy";
import type { PrayerSubmitOutcome } from "@/app/lib/iglesias/prayerTypes";
import type { PrayerVisibility } from "@/app/lib/iglesias/prayerTaxonomy";

export function IglesiasPrayerForm({
  lang,
  targetChurchId,
  targetChurchName,
}: {
  lang: "es" | "en";
  targetChurchId?: string | null;
  targetChurchName?: string | null;
}) {
  const copy = useMemo(() => getPrayerUiCopy(lang), [lang]);
  const formId = useId();
  const warnId = `${formId}-warn`;
  const bodyHelpId = `${formId}-body-help`;
  const bodyErrId = `${formId}-body-err`;
  const [visibility, setVisibility] = useState<PrayerVisibility>(targetChurchId ? "PRIVATE_PRAYER_TEAM" : "PUBLIC_ANONYMOUS");
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState<"es" | "en">(lang);
  const [contactConsent, setContactConsent] = useState(false);
  const [method, setMethod] = useState<"email" | "phone" | "whatsapp">("email");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<PrayerSubmitOutcome | null>(null);
  const [deliveredTeams, setDeliveredTeams] = useState<number | null>(null);
  const [routingReason, setRoutingReason] = useState<string | null>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);
  const categories = useMemo(() => prayerCategoryOptions(lang), [lang]);

  useEffect(() => {
    if (outcome) outcomeRef.current?.focus();
  }, [outcome]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/iglesias/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          visibility: targetChurchId ? "PRIVATE_PRAYER_TEAM" : visibility,
          language,
          displayName,
          city,
          category: category || undefined,
          contactConsent,
          preferredContactMethod: method,
          contactEmail,
          contactPhone,
          contactWhatsapp,
          targetChurchId: targetChurchId || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        outcome?: PrayerSubmitOutcome;
        deliveredTeams?: number;
        routingReason?: string;
      };
      if (!res.ok || !json.ok) {
        if (json.error === "body") setError(copy.errorBody);
        else if (json.error === "rate") setError(copy.errorRate);
        else if (json.error === "duplicate") setError(copy.errorDuplicate);
        else setError(copy.errorGeneric);
        return;
      }
      setOutcome(json.outcome ?? "HUMAN_REVIEW");
      setDeliveredTeams(typeof json.deliveredTeams === "number" ? json.deliveredTeams : null);
      setRoutingReason(json.routingReason ?? null);
      setBody("");
    } catch {
      setError(copy.errorGeneric);
    } finally {
      setPending(false);
    }
  }

  const outcomeCopy =
    outcome === "PUBLISHED"
      ? copy.outcomePublished
      : outcome === "PRIVATE_RECEIVED" && routingReason === "TARGET_INELIGIBLE"
        ? copy.outcomeTargetIneligible
        : outcome === "PRIVATE_RECEIVED" && (deliveredTeams ?? 0) > 0
          ? copy.outcomePrivateRouted(deliveredTeams ?? 0)
          : outcome === "PRIVATE_RECEIVED" && routingReason === "NONE_ELIGIBLE"
            ? copy.outcomePrivateZero
            : outcome === "PRIVATE_RECEIVED"
              ? copy.outcomePrivate
              : outcome === "CRISIS"
                ? copy.outcomeCrisis
                : outcome === "DISALLOWED_HOLD"
                  ? copy.outcomeHold
                  : outcome === "HUMAN_REVIEW"
                    ? copy.outcomeReview
                    : null;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[#D6C7AD]/80 bg-[#FFFDF7] p-4 sm:p-5"
      aria-labelledby={`${formId}-title`}
    >
      <h3 id={`${formId}-title`} className="font-serif text-xl font-bold text-[#1F241C]">
        {targetChurchId ? copy.privateCta : copy.submitTitle}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-[#3D3428]">{copy.submitSupport}</p>
      {targetChurchId ? (
        <p className="mt-2 text-sm leading-relaxed text-[#3D3428]" role="note">
          {targetChurchName ? `${targetChurchName}. ` : ""}
          {copy.targetedHint}
        </p>
      ) : null}

      <div className="mt-4">
        <label htmlFor={`${formId}-body`} className="block text-sm font-semibold text-[#1F241C]">
          {copy.bodyLabel}
        </label>
        <p id={bodyHelpId} className="mt-1 text-xs text-[#5C5346]">
          {copy.bodyHelp}
        </p>
        <textarea
          id={`${formId}-body`}
          name="body"
          required
          minLength={20}
          maxLength={2000}
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-describedby={`${bodyHelpId} ${warnId}${error ? ` ${bodyErrId}` : ""}`}
          aria-invalid={error ? true : undefined}
          className="mt-2 w-full min-h-[10rem] rounded-xl border border-[#D6C7AD] bg-white px-3 py-3 text-base text-[#1F241C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]"
        />
        {error ? (
          <p id={bodyErrId} className="mt-2 text-sm text-[#7A1E2C]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-[#1F241C]">{copy.visibilityLegend}</legend>
        <div className="mt-2 grid gap-2">
          {(
            (targetChurchId
              ? ([["PRIVATE_PRAYER_TEAM", copy.visPrivate, copy.visPrivateHelp]] as const)
              : ([
                  ["PUBLIC_NAMED", copy.visNamed, copy.visNamedHelp],
                  ["PUBLIC_ANONYMOUS", copy.visAnonymous, copy.visAnonymousHelp],
                  ["PRIVATE_PRAYER_TEAM", copy.visPrivate, copy.visPrivateHelp],
                ] as const))
          ).map(([value, label, help]) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E8DFD0] bg-white px-3 py-3"
            >
              <input
                type="radio"
                name="visibility"
                value={value}
                checked={visibility === value}
                onChange={() => setVisibility(value)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-semibold text-[#1F241C]">{label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-[#5C5346]">{help}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p id={warnId} className="mt-4 text-sm leading-relaxed text-[#5C5346]">
        {copy.privacyWarning}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-lang`} className="block text-sm font-semibold text-[#1F241C]">
            {copy.languageLabel}
          </label>
          <select
            id={`${formId}-lang`}
            value={language}
            onChange={(e) => setLanguage(e.target.value === "en" ? "en" : "es")}
            className="mt-1 w-full rounded-xl border border-[#D6C7AD] bg-white px-3 py-2.5 text-sm"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        {visibility === "PUBLIC_NAMED" ? (
          <div>
            <label htmlFor={`${formId}-name`} className="block text-sm font-semibold text-[#1F241C]">
              {copy.displayNameLabel}
            </label>
            <input
              id={`${formId}-name`}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              className="mt-1 w-full rounded-xl border border-[#D6C7AD] bg-white px-3 py-2.5 text-sm"
            />
          </div>
        ) : null}
        <div>
          <label htmlFor={`${formId}-city`} className="block text-sm font-semibold text-[#1F241C]">
            {copy.cityLabel}
          </label>
          <input
            id={`${formId}-city`}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={80}
            className="mt-1 w-full rounded-xl border border-[#D6C7AD] bg-white px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor={`${formId}-cat`} className="block text-sm font-semibold text-[#1F241C]">
            {copy.categoryLabel}
          </label>
          <select
            id={`${formId}-cat`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#D6C7AD] bg-white px-3 py-2.5 text-sm"
          >
            <option value="">{copy.categoryNone}</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visibility === "PRIVATE_PRAYER_TEAM" ? (
        <div className="mt-4 rounded-xl border border-[#E8DFD0] bg-white p-3">
          <label className="flex items-start gap-2 text-sm text-[#3D3428]">
            <input
              type="checkbox"
              checked={contactConsent}
              onChange={(e) => setContactConsent(e.target.checked)}
              className="mt-1"
            />
            {copy.contactConsent}
          </label>
          {contactConsent ? (
            <div className="mt-3 grid gap-3">
              <div>
                <label htmlFor={`${formId}-method`} className="block text-sm font-semibold">
                  {copy.contactMethod}
                </label>
                <select
                  id={`${formId}-method`}
                  value={method}
                  onChange={(e) => setMethod(e.target.value as "email" | "phone" | "whatsapp")}
                  className="mt-1 w-full rounded-xl border border-[#D6C7AD] px-3 py-2.5 text-sm"
                >
                  <option value="email">{copy.methodEmail}</option>
                  <option value="phone">{copy.methodPhone}</option>
                  <option value="whatsapp">{copy.methodWhatsapp}</option>
                </select>
              </div>
              {method === "email" ? (
                <div>
                  <label htmlFor={`${formId}-email`} className="block text-sm font-semibold">
                    {copy.contactEmail}
                  </label>
                  <input
                    id={`${formId}-email`}
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D6C7AD] px-3 py-2.5 text-sm"
                  />
                </div>
              ) : null}
              {method === "phone" ? (
                <div>
                  <label htmlFor={`${formId}-phone`} className="block text-sm font-semibold">
                    {copy.contactPhone}
                  </label>
                  <input
                    id={`${formId}-phone`}
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D6C7AD] px-3 py-2.5 text-sm"
                  />
                </div>
              ) : null}
              {method === "whatsapp" ? (
                <div>
                  <label htmlFor={`${formId}-wa`} className="block text-sm font-semibold">
                    {copy.contactWhatsapp}
                  </label>
                  <input
                    id={`${formId}-wa`}
                    value={contactWhatsapp}
                    onChange={(e) => setContactWhatsapp(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D6C7AD] px-3 py-2.5 text-sm"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="mt-3 text-xs text-[#7A7164]">{copy.privacyNote}</p>

      {outcomeCopy ? (
        <div
          className="mt-4 rounded-xl border border-[#C9A84A]/50 bg-[#FAF6EE] px-3 py-3 text-sm leading-relaxed text-[#1F241C]"
          role="status"
          tabIndex={-1}
          ref={outcomeRef}
        >
          <p>{outcomeCopy}</p>
          {outcome === "PRIVATE_RECEIVED" ? <p className="mt-2 text-[#5C5346]">{copy.outcomePrivateSupport}</p> : null}
          {outcome === "CRISIS" ? <p className="mt-2 text-[#5C5346]">{copy.outcomeCrisisSupport}</p> : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#7A1E2C] px-5 text-sm font-semibold text-white hover:bg-[#6B1A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] disabled:opacity-70 sm:w-auto"
      >
        {pending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
