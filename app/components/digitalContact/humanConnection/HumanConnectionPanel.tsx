"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { openSms, openTel, openWhatsApp } from "@/app/components/cta/ctaLaunchers";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";
import { getHumanConnectionCopy } from "@/app/lib/digitalContact/humanConnection/humanConnectionCopy";
import {
  HUMAN_CONNECTION_NAME_MAX,
  HUMAN_CONNECTION_NAME_MIN,
  HUMAN_CONNECTION_REASON_MAX,
  HUMAN_CONNECTION_WAIT_TIMEOUT_MS,
} from "@/app/lib/digitalContact/humanConnection/constants";
import type {
  HumanConnectionPublicState,
  HumanConnectionSurface,
  ScheduleContactMethod,
} from "@/app/lib/digitalContact/humanConnection/humanConnectionTypes";
import type { DigitalContactLang, DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";

type OfferState = {
  offerVideo: boolean;
  offerSchedule: boolean;
  backupSlug: string | null;
  backupDisplayName: string | null;
  backupOfferVideo: boolean;
  videoReason: string;
};

type Props = {
  profile: DigitalContactProfile;
  lang: DigitalContactLang;
  surface: HumanConnectionSurface;
  source?: string | null;
  /** Prefills for WhatsApp/SMS fallbacks */
  whatsappPrefill?: string;
  smsPrefill?: string;
  /** Compact embedding inside visitanos connect card */
  variant?: "card" | "inline";
  /** When false, hide video CTA/flow (schedule-only placement). Default true. */
  enableVideo?: boolean;
  /** When false, hide schedule CTA/form (video-only placement). Default true. */
  enableSchedule?: boolean;
  /**
   * `self` — panel shows its own video/schedule entry CTAs (default).
   * `router` — parent Human Connection Router owns entry CTAs; panel only runs flows.
   */
  entryMode?: "self" | "router";
  /** External open request from router channel selection. */
  openIntent?: "video" | "schedule" | null;
  onOpenIntentConsumed?: () => void;
  /** Notify parent when server offer resolves (for router managed.browserVideo). */
  onOfferResolved?: (offer: { offerVideo: boolean; offerSchedule: boolean }) => void;
};

const inputClass =
  "w-full rounded-lg border border-[#D6C7AD] bg-white px-3.5 py-2.5 text-sm text-[#1F241C] placeholder:text-[#9A9686] outline-none transition focus:border-[var(--dc-accent)] focus:ring-2 focus:ring-[var(--dc-accent-border)]";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#5F6258]";

function analyticsMeta(
  surface: HumanConnectionSurface,
  source: string | null | undefined,
  lang: DigitalContactLang,
): Record<string, unknown> {
  return {
    surface,
    lang,
    ...(source ? { source } : {}),
  };
}

/**
 * Shared Human Connection visitor panel — used by /visitanos and /contact/{slug}.
 * Immediate video CTA renders only when server offer says offerVideo.
 */
export function HumanConnectionPanel({
  profile,
  lang,
  surface,
  source = null,
  whatsappPrefill = "",
  smsPrefill = "",
  variant = "card",
  enableVideo = true,
  enableSchedule = true,
  entryMode = "self",
  openIntent = null,
  onOpenIntentConsumed,
  onOfferResolved,
}: Props) {
  const copy = getHumanConnectionCopy(lang);
  const idBase = useId();
  const [offer, setOffer] = useState<OfferState | null>(null);
  const [videoState, setVideoState] = useState<HumanConnectionPublicState>("idle");
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [contactMethod, setContactMethod] = useState<ScheduleContactMethod>("email");
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meta = analyticsMeta(surface, source, lang);
  const whatsappDigits = profile.whatsappDigits || profile.phoneDigits;
  const hasPhone = Boolean(profile.phoneDigits?.trim());
  const hasEmail = Boolean(profile.email?.trim());

  useEffect(() => {
    if (!openIntent) return;
    if (openIntent === "video" && enableVideo) {
      setVideoState("precall");
    }
    if (openIntent === "schedule" && enableSchedule) {
      setShowSchedule(true);
    }
    onOpenIntentConsumed?.();
  }, [openIntent, enableVideo, enableSchedule, onOpenIntentConsumed]);

  const clearWaitTimer = useCallback(() => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      slug: profile.slug,
      lang,
      surface,
    });
    void fetch(`/api/digital-contact/human-connection/status?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    })
      .then(async (res) => {
        const json = (await res.json().catch(() => null)) as OfferState & { ok?: boolean } | null;
        if (cancelled || !json?.ok) return;
        setOffer({
          offerVideo: Boolean(json.offerVideo),
          offerSchedule: Boolean(json.offerSchedule),
          backupSlug: json.backupSlug ?? null,
          backupDisplayName: json.backupDisplayName ?? null,
          backupOfferVideo: Boolean(json.backupOfferVideo),
          videoReason: String(json.videoReason ?? ""),
        });
        onOfferResolved?.({
          offerVideo: Boolean(json.offerVideo),
          offerSchedule: Boolean(json.offerSchedule),
        });
        if (json.offerVideo && enableVideo && entryMode === "self") {
          trackDigitalContactEvent(profile.slug, "video_cta_view", meta);
        }
        if (json.offerVideo) {
          trackDigitalContactEvent(profile.slug, "connection_channel_view", {
            ...meta,
            channel: "browser_video",
          });
        }
      })
      .catch(() => {
        /* offer fetch failure must not break contact CTAs */
      });
    return () => {
      cancelled = true;
      clearWaitTimer();
    };
    // intentionally once per slug/lang/surface
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.slug, lang, surface]);

  const startWaitTimer = useCallback(() => {
    clearWaitTimer();
    waitTimerRef.current = setTimeout(() => {
      setVideoState((cur) => {
        if (cur === "waiting" || cur === "ready" || cur === "launched") {
          trackDigitalContactEvent(profile.slug, "video_no_answer", meta);
          return "no_answer";
        }
        return cur;
      });
    }, HUMAN_CONNECTION_WAIT_TIMEOUT_MS);
  }, [clearWaitTimer, meta, profile.slug]);

  async function onVideoPrecallSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (videoState === "requesting") return;
    const fd = new FormData(e.currentTarget);
    const visitorFirstName = String(fd.get("visitorFirstName") ?? "").trim();
    const reasonForVisit = String(fd.get("reasonForVisit") ?? "").trim();
    if (visitorFirstName.length < HUMAN_CONNECTION_NAME_MIN) return;

    setVideoState("requesting");
    trackDigitalContactEvent(profile.slug, "video_request_started", meta);

    try {
      const res = await fetch("/api/digital-contact/video/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSlug: profile.slug,
          visitorFirstName,
          reasonForVisit,
          lang,
          surface,
          source,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        session?: { visitorJoinUrl?: string; expiresAt?: string; sessionId?: string };
      } | null;

      if (!res.ok || !json?.ok || !json.session?.visitorJoinUrl) {
        trackDigitalContactEvent(profile.slug, "video_failed", {
          ...meta,
          error: json?.error ?? "request_failed",
        });
        setVideoState("failed");
        return;
      }

      setJoinUrl(json.session.visitorJoinUrl);
      setVideoState("ready");
      startWaitTimer();
    } catch {
      trackDigitalContactEvent(profile.slug, "video_failed", { ...meta, error: "network" });
      setVideoState("failed");
    }
  }

  function launchJoin() {
    if (!joinUrl) return;
    // Prefer new tab — preserves /visitanos state; avoids popup-blocker dead ends when possible.
    const opened = window.open(joinUrl, "_blank", "noopener,noreferrer");
    trackDigitalContactEvent(profile.slug, "video_join_launched", meta);
    setVideoState("launched");
    if (!opened) {
      // Fallback: same-tab navigate as last resort still leaves join URL visible.
      window.location.assign(joinUrl);
    }
    startWaitTimer();
  }

  async function onScheduleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (scheduleStatus === "submitting") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setScheduleStatus("submitting");
    trackDigitalContactEvent(profile.slug, "schedule_request_started", meta);

    try {
      const res = await fetch("/api/digital-contact/schedule-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSlug: profile.slug,
          visitorName: String(fd.get("visitorName") ?? ""),
          contactMethod,
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          preferredTime: String(fd.get("preferredTime") ?? ""),
          message: String(fd.get("message") ?? ""),
          lang,
          surface,
          source,
          website: String(fd.get("website") ?? ""),
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (res.ok && json?.ok) {
        setScheduleStatus("success");
        form.reset();
      } else {
        setScheduleStatus("error");
      }
    } catch {
      setScheduleStatus("error");
    }
  }

  const showFallback =
    videoState === "no_answer" ||
    videoState === "failed" ||
    videoState === "expired" ||
    videoState === "launched";

  // Wait for server offer — avoid empty chrome flash; fail closed for video.
  if (!offer) {
    return null;
  }

  // Hide empty shell when neither video nor schedule is truthful / enabled.
  const videoAllowed = enableVideo && offer.offerVideo;
  const scheduleAllowed = enableSchedule && offer.offerSchedule;
  const inFlow =
    videoState !== "idle" || showSchedule || scheduleStatus === "success" || showFallback;
  if (!videoAllowed && !scheduleAllowed && !inFlow) {
    return null;
  }
  // Router owns entry CTAs — stay silent until a flow is open.
  if (entryMode === "router" && !inFlow) {
    return null;
  }

  const shellClass =
    variant === "inline"
      ? "mt-3 space-y-3"
      : "mt-4 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-4 shadow-sm sm:px-5";

  return (
    <div className={shellClass}>
      {entryMode === "self" && videoAllowed && videoState === "idle" ? (
        <button
          type="button"
          onClick={() => setVideoState("precall")}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--dc-accent)] bg-[var(--dc-button-primary)] px-4 py-3 text-base font-bold text-[#FFFDF7] shadow-md transition hover:bg-[var(--dc-button-hover)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2"
        >
          {copy.videoCta}
        </button>
      ) : null}

      {videoState === "precall" ? (
        <form onSubmit={onVideoPrecallSubmit} className="space-y-3" noValidate>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1F241C]">{copy.videoPrecallTitle}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#3D3428]">{copy.videoPrecallBody}</p>
          </div>
          <div>
            <label htmlFor={`${idBase}-fn`} className={labelClass}>
              {copy.videoFirstName} *
            </label>
            <input
              id={`${idBase}-fn`}
              name="visitorFirstName"
              type="text"
              required
              minLength={HUMAN_CONNECTION_NAME_MIN}
              maxLength={HUMAN_CONNECTION_NAME_MAX}
              autoComplete="given-name"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`${idBase}-reason`} className={labelClass}>
              {copy.videoReasonOptional}
            </label>
            <input
              id={`${idBase}-reason`}
              name="reasonForVisit"
              type="text"
              maxLength={HUMAN_CONNECTION_REASON_MAX}
              className={inputClass}
            />
          </div>
          <p className="text-xs leading-relaxed text-[#5F6258]">{copy.videoPrivacyNotice}</p>
          <p className="text-xs leading-relaxed text-[#5F6258]">{copy.videoProviderNotice}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              className="min-h-[48px] flex-1 rounded-xl bg-[var(--dc-button-primary)] px-4 py-2.5 text-sm font-bold text-[#FFFDF7] transition hover:bg-[var(--dc-button-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)]"
            >
              {copy.videoStart}
            </button>
            <button
              type="button"
              onClick={() => setVideoState("idle")}
              className="min-h-[48px] rounded-xl border border-[#D6C7AD] px-4 py-2.5 text-sm font-semibold text-[#3D3428] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)]"
            >
              {copy.videoCancel}
            </button>
          </div>
        </form>
      ) : null}

      {videoState === "requesting" ? (
        <p role="status" className="text-center text-sm font-semibold text-[#3D3428]">
          {copy.videoRequesting}
        </p>
      ) : null}

      {videoState === "ready" && joinUrl ? (
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold text-[#1F241C]">{copy.videoReady}</p>
          <button
            type="button"
            onClick={launchJoin}
            className="min-h-[48px] w-full rounded-xl bg-[var(--dc-button-primary)] px-4 py-2.5 text-sm font-bold text-[#FFFDF7]"
          >
            {copy.videoReadyCta}
          </button>
          <p className="text-xs text-[#5F6258]">{copy.videoWaiting}</p>
          <p className="text-xs text-[#5F6258]">{copy.videoMicDenied}</p>
        </div>
      ) : null}

      {videoState === "waiting" ? (
        <p role="status" className="text-center text-sm font-semibold text-[#3D3428]">
          {copy.videoWaiting}
        </p>
      ) : null}

      {videoState === "launched" ? (
        <p role="status" className="text-center text-sm leading-relaxed text-[#3D3428]">
          {copy.videoLaunched}
        </p>
      ) : null}

      {videoState === "no_answer" ? (
        <div className="text-center">
          <p className="font-serif text-base font-bold text-[#1F241C]">{copy.videoNoAnswerTitle}</p>
          <p className="mt-1 text-sm text-[#3D3428]">{copy.videoNoAnswerBody}</p>
        </div>
      ) : null}

      {videoState === "failed" ? (
        <div className="text-center">
          <p className="font-serif text-base font-bold text-[#1F241C]">{copy.videoFailedTitle}</p>
          <p className="mt-1 text-sm text-[#3D3428]">{copy.videoFailedBody}</p>
        </div>
      ) : null}

      {videoState === "expired" ? (
        <div className="text-center">
          <p className="font-serif text-base font-bold text-[#1F241C]">{copy.videoExpiredTitle}</p>
          <p className="mt-1 text-sm text-[#3D3428]">{copy.videoExpiredBody}</p>
        </div>
      ) : null}

      {showFallback ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {hasPhone ? (
            <>
              <button
                type="button"
                onClick={() => {
                  trackDigitalContactEvent(profile.slug, "cta_call", meta);
                  openTel(profile.phoneDigits);
                }}
                className="min-h-[44px] rounded-xl border border-[#D6C7AD] bg-[#FBF7EF] px-2 text-sm font-bold text-[#1F241C]"
              >
                {copy.fallbackCall}
              </button>
              <button
                type="button"
                onClick={() => {
                  trackDigitalContactEvent(profile.slug, "cta_whatsapp", meta);
                  openWhatsApp(whatsappDigits, whatsappPrefill);
                }}
                className="min-h-[44px] rounded-xl border border-[#D6C7AD] bg-[#FBF7EF] px-2 text-sm font-bold text-[#1F241C]"
              >
                {copy.fallbackWhatsapp}
              </button>
              <button
                type="button"
                onClick={() => {
                  trackDigitalContactEvent(profile.slug, "cta_text", meta);
                  openSms(profile.phoneDigits, smsPrefill);
                }}
                className="min-h-[44px] rounded-xl border border-[#D6C7AD] bg-[#FBF7EF] px-2 text-sm font-bold text-[#1F241C]"
              >
                {copy.fallbackSms}
              </button>
            </>
          ) : null}
          {hasEmail ? (
            <a
              href={`mailto:${encodeURIComponent(profile.email)}`}
              onClick={() => trackDigitalContactEvent(profile.slug, "cta_email", meta)}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-[#D6C7AD] bg-[#FBF7EF] px-2 text-sm font-bold text-[#1F241C]"
            >
              {copy.fallbackEmail}
            </a>
          ) : null}
        </div>
      ) : null}

      {offer?.backupSlug && showFallback ? (
        <div className="mt-3 border-t border-[#E8DCC5] pt-3 text-center text-sm text-[#3D3428]">
          <Link
            href={`/contact/${encodeURIComponent(offer.backupSlug)}?lang=${lang}`}
            onClick={() => {
              trackDigitalContactEvent(profile.slug, "backup_offered", {
                ...meta,
                backupSlug: offer.backupSlug,
                backupOfferVideo: offer.backupOfferVideo,
              });
              trackDigitalContactEvent(profile.slug, "backup_selected", {
                ...meta,
                backupSlug: offer.backupSlug,
              });
            }}
            className="font-bold text-[var(--dc-button-primary)] underline-offset-2 hover:underline"
          >
            {offer.backupOfferVideo
              ? `${copy.backupVideoCta} ${offer.backupDisplayName || offer.backupSlug}`
              : offer.backupDisplayName || offer.backupSlug}
          </Link>
        </div>
      ) : null}

      {scheduleAllowed ? (
        <div className={videoAllowed || showFallback ? "mt-4 border-t border-[#E8DCC5] pt-4" : ""}>
          {entryMode === "self" && !showSchedule && scheduleStatus !== "success" ? (
            <button
              type="button"
              onClick={() => {
                setShowSchedule(true);
                trackDigitalContactEvent(profile.slug, "schedule_request_started", {
                  ...meta,
                  stage: "open_form",
                });
              }}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[var(--dc-button-primary)] bg-transparent px-4 py-2.5 text-sm font-bold text-[var(--dc-button-primary)] transition hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)]"
            >
              {copy.scheduleCta}
            </button>
          ) : null}

          {scheduleStatus === "success" ? (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
              {copy.scheduleSuccess}
            </p>
          ) : null}

          {showSchedule && scheduleStatus !== "success" ? (
            <form onSubmit={onScheduleSubmit} className="space-y-3" noValidate>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F241C]">{copy.scheduleTitle}</h3>
                <p className="mt-1 text-sm text-[#3D3428]">{copy.scheduleBody}</p>
                <p className="mt-1 text-xs text-[#5F6258]">{copy.scheduleDisclaimer}</p>
              </div>
              <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor={`${idBase}-hp`}>Website</label>
                <input id={`${idBase}-hp`} name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <div>
                <label htmlFor={`${idBase}-sn`} className={labelClass}>
                  {copy.scheduleName} *
                </label>
                <input
                  id={`${idBase}-sn`}
                  name="visitorName"
                  type="text"
                  required
                  minLength={HUMAN_CONNECTION_NAME_MIN}
                  maxLength={HUMAN_CONNECTION_NAME_MAX}
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
              <fieldset>
                <legend className={labelClass}>{copy.scheduleContactMethod}</legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["email", copy.scheduleMethodEmail],
                      ["phone", copy.scheduleMethodPhone],
                      ["whatsapp", copy.scheduleMethodWhatsapp],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setContactMethod(value)}
                      aria-pressed={contactMethod === value}
                      className={`min-h-[44px] rounded-xl px-3 text-sm font-semibold ${
                        contactMethod === value
                          ? "bg-[var(--dc-button-primary)] text-white"
                          : "border border-[#D6C7AD] bg-[#FBF7EF] text-[#1F241C]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              {contactMethod === "email" ? (
                <div>
                  <label htmlFor={`${idBase}-em`} className={labelClass}>
                    {copy.scheduleEmail} *
                  </label>
                  <input id={`${idBase}-em`} name="email" type="email" required maxLength={320} className={inputClass} autoComplete="email" />
                </div>
              ) : (
                <div>
                  <label htmlFor={`${idBase}-ph`} className={labelClass}>
                    {copy.schedulePhone} *
                  </label>
                  <input id={`${idBase}-ph`} name="phone" type="tel" required maxLength={48} className={inputClass} autoComplete="tel" />
                </div>
              )}
              <div>
                <label htmlFor={`${idBase}-pt`} className={labelClass}>
                  {copy.schedulePreferredTime} *
                </label>
                <input
                  id={`${idBase}-pt`}
                  name="preferredTime"
                  type="text"
                  required
                  maxLength={200}
                  placeholder={copy.schedulePreferredTimePlaceholder}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor={`${idBase}-msg`} className={labelClass}>
                  {copy.scheduleMessage}
                </label>
                <textarea id={`${idBase}-msg`} name="message" rows={3} maxLength={2000} className={inputClass} />
              </div>
              {scheduleStatus === "error" ? (
                <p role="alert" className="text-sm font-semibold text-red-800">
                  {copy.scheduleError}
                </p>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={scheduleStatus === "submitting"}
                  className="min-h-[48px] flex-1 rounded-xl bg-[var(--dc-button-primary)] px-4 py-2.5 text-sm font-bold text-[#FFFDF7] disabled:opacity-60"
                >
                  {scheduleStatus === "submitting" ? copy.scheduleSubmitting : copy.scheduleSubmit}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSchedule(false)}
                  className="min-h-[48px] rounded-xl border border-[#D6C7AD] px-4 py-2.5 text-sm font-semibold text-[#3D3428]"
                >
                  {copy.close}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
