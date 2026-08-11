"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";
import { formatDigitalContactAddressLines } from "@/app/lib/digitalContact/digitalContactAddress";
import {
  executiveThemeCssVars,
  resolveExecutiveTheme,
} from "@/app/lib/digitalContact/digitalContactExecutiveTheme";
import { getDigitalContactProfile } from "@/app/lib/digitalContact/digitalContactRegistry";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";
import {
  resolveExecutivePublicAvailability,
  type ExecutivePublicAvailabilityView,
} from "@/app/lib/digitalContact/resolveExecutivePublicAvailability";
import { resolveHumanConnectionChannels } from "@/app/lib/digitalContact/humanConnection/resolveHumanConnectionChannels";
import {
  listProfilesWithFaceToFaceVideo,
  resolvePreferredFaceToFaceConnection,
} from "@/app/lib/digitalContact/humanConnection/resolvePreferredFaceToFaceConnection";
import { getFaceToFaceCopy } from "@/app/lib/digitalContact/humanConnection/faceToFaceCopy";
import { getConnectionChannelCopy } from "@/app/lib/digitalContact/humanConnection/connectionChannelCopy";
import { openExternalUrl } from "@/app/components/cta/ctaLaunchers";
import { LEONIX_GLOBAL_LLC } from "@/app/lib/leonixBrand";
import {
  getVisitanosCopy,
  visitanosSmsPrefill,
  visitanosWhatsAppPrefill,
  type VisitanosLang,
} from "@/app/lib/visitanos/visitanosCopy";
import {
  resolveLeonixOfficeHoursStatus,
  type LeonixOfficeHoursStatus,
} from "@/app/lib/visitanos/visitanosOfficeHours";
import { HumanConnectionPanel } from "@/app/components/digitalContact/humanConnection/HumanConnectionPanel";
import { HumanConnectionChannelActions } from "@/app/components/digitalContact/humanConnection/HumanConnectionChannelActions";
import { FaceToFaceVideoCta } from "@/app/components/digitalContact/humanConnection/FaceToFaceVideoCta";

type Props = {
  profiles: DigitalContactProfile[];
  initialLang: VisitanosLang;
  /** Whitelisted source token only (e.g. office-window), or null. */
  source: string | null;
};

function withLang(href: string, lang: VisitanosLang, extra?: Record<string, string>): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", lang);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
  }
  return `${path}?${params.toString()}`;
}

function analyticsMeta(source: string | null, lang: VisitanosLang): Record<string, unknown> {
  return {
    surface: "virtual_front_desk",
    lang,
    ...(source ? { source } : {}),
  };
}

export function VisitanosPageClient({ profiles, initialLang, source }: Props) {
  const [lang, setLang] = useState<VisitanosLang>(initialLang);
  /** null until client mount — avoids Pacific-time hydration mismatch. */
  const [hoursStatus, setHoursStatus] = useState<LeonixOfficeHoursStatus | null>(null);
  /** Executive availability clock — separate from business office hours. */
  const [availabilityNow, setAvailabilityNow] = useState<Date | null>(null);
  const [browserVideoOffer, setBrowserVideoOffer] = useState(false);
  /** Schedule only when status API reports notify backend ready (Build 07). */
  const [scheduleOffer, setScheduleOffer] = useState(false);
  const [openIntent, setOpenIntent] = useState<"video" | "schedule" | null>(null);
  const copy = getVisitanosCopy(lang);
  const faceCopy = getFaceToFaceCopy(lang);
  const channelCopy = getConnectionChannelCopy(lang);
  const themeVars = executiveThemeCssVars(resolveExecutiveTheme("leonix"));
  const year = new Date().getFullYear();

  useEffect(() => {
    const t = new Date();
    setHoursStatus(resolveLeonixOfficeHoursStatus(t));
    setAvailabilityNow(t);
  }, []);

  /** Primary human path — first active Executive Contact profile (registry order). */
  const primary = profiles[0] ?? null;
  const officeLines = primary ? formatDigitalContactAddressLines(primary.address) : null;
  const hasContactable =
    Boolean(primary?.phoneDigits?.trim()) || Boolean(primary?.email?.trim());
  const waBody = visitanosWhatsAppPrefill(lang);
  const smsBody = visitanosSmsPrefill(lang);

  const primaryFaceToFace = useMemo(
    () => (primary ? resolvePreferredFaceToFaceConnection({ profile: primary }) : null),
    [primary],
  );
  const videoStaff = useMemo(() => listProfilesWithFaceToFaceVideo(profiles), [profiles]);
  const hasImmediateVideo = Boolean(primaryFaceToFace?.hasImmediateVideo);

  const route = useMemo(() => {
    if (!primary) return null;
    return resolveHumanConnectionChannels({
      profile: primary,
      surface: "virtual_front_desk",
      forceOfferSchedule: false,
      smsPrefill: smsBody,
      whatsappPrefill: waBody,
      managed: {
        browserVideo: browserVideoOffer,
        googleMeet: false,
        scheduleRequest: scheduleOffer,
      },
    });
  }, [primary, smsBody, waBody, browserVideoOffer, scheduleOffer]);

  useEffect(() => {
    if (!primary || !route) return;
    if (primaryFaceToFace?.primary) {
      trackDigitalContactEvent(primary.slug, "face_to_face_cta_view", {
        ...analyticsMeta(source, lang),
        channel: primaryFaceToFace.primary.provider,
      });
    }
    for (const ch of route.channels) {
      if (ch.type === "google_meet" || ch.type === "facetime" || ch.type === "browser_video") continue;
      trackDigitalContactEvent(primary.slug, "connection_channel_view", {
        ...analyticsMeta(source, lang),
        channel: ch.type,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary?.slug, route?.channels.map((c) => c.type).join(","), primaryFaceToFace?.primary?.provider, lang, source]);

  let primaryAvailability: ExecutivePublicAvailabilityView | null = null;
  if (primary && availabilityNow) {
    try {
      primaryAvailability = resolveExecutivePublicAvailability({
        profile: primary,
        now: availabilityNow,
        lang,
        lookupProfile: getDigitalContactProfile,
      });
    } catch {
      primaryAvailability = null;
    }
  }

  const offerBackupStates = new Set(["absent", "busy", "away"]);
  const backupProfile =
    primaryAvailability &&
    primaryAvailability.backupSlug &&
    offerBackupStates.has(primaryAvailability.publicAvailabilityState)
      ? getDigitalContactProfile(primaryAvailability.backupSlug)
      : null;

  const trackStaffProfile = useCallback(
    (slug: string) => {
      trackDigitalContactEvent(slug, "showcase_click", {
        ...analyticsMeta(source, lang),
        action: "staff_profile_click",
      });
    },
    [source, lang],
  );

  const contactoHref = withLang("/contacto", lang, {
    sourceCta: "virtual_front_desk",
    sourcePage: "visitanos",
    ...(source ? { source } : {}),
  });

  const hoursTitle =
    hoursStatus === "within"
      ? copy.hoursWithinTitle
      : hoursStatus === "outside"
        ? copy.hoursOutsideTitle
        : null;
  const hoursBody =
    hoursStatus === "within"
      ? copy.hoursWithinBody
      : hoursStatus === "outside"
        ? copy.hoursOutsideBody
        : null;

  const heroSubhead = hasImmediateVideo ? copy.subheadFaceToFace : copy.subhead;

  return (
    <div className="min-h-screen bg-[var(--dc-gradient-end)]" style={themeVars}>
      <div className="flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div
          className="inline-flex rounded-full border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 text-xs font-semibold shadow-sm"
          role="group"
          aria-label={copy.kicker}
        >
          {(["es", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={`min-h-[44px] rounded-full px-3.5 py-1.5 transition-colors ${
                lang === code
                  ? "bg-[var(--dc-button-primary)] text-white shadow-sm"
                  : "text-[#3D3428] hover:bg-[#E8DCC5]/60"
              }`}
            >
              {copy.langToggle[code]}
            </button>
          ))}
        </div>
      </div>

      <header
        className="relative overflow-hidden px-5 pb-8 pt-5 text-center sm:px-6 sm:pb-9 sm:pt-6"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--dc-gradient-start) 0%, var(--dc-primary-dark) 42%, color-mix(in srgb, var(--dc-primary-dark) 28%, var(--dc-gradient-end) 72%) 82%, var(--dc-gradient-end) 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,var(--dc-accent-soft),transparent_62%)]"
        />

        <div className="relative mx-auto flex max-w-md flex-col items-center">
          <div className="relative h-14 w-14 sm:h-16 sm:w-16">
            <div
              className="absolute -inset-1.5 rounded-full bg-[radial-gradient(circle,var(--dc-glow),transparent_72%)] opacity-65 blur-md"
              aria-hidden
            />
            <div className="absolute inset-0 overflow-hidden rounded-full border border-[var(--dc-accent-border)] bg-[#FFFDF7] shadow-[0_8px_22px_-8px_rgba(0,0,0,0.45)]">
              <Image
                src="/logo-clean.png"
                alt="Leonix Media"
                fill
                priority
                sizes="64px"
                className="object-contain p-1.5"
              />
            </div>
          </div>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--dc-accent)] sm:text-[11px]">
            {copy.kicker}
          </p>
          <h1 className="mt-2 text-balance font-serif text-[1.65rem] font-bold leading-[1.12] tracking-tight text-[#FFFDF7] sm:text-[1.95rem]">
            {copy.headline}
          </h1>
          <p className="mt-2.5 max-w-sm text-pretty text-[0.9rem] leading-relaxed text-[#F8F4EA]/92 sm:text-[0.95rem]">
            {heroSubhead}
          </p>

          <div
            className="mt-4 w-full max-w-sm rounded-2xl border border-[var(--dc-accent-border)] bg-[rgba(255,253,247,0.12)] px-4 py-3 text-left backdrop-blur-[2px]"
            aria-live="polite"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--dc-accent)]">
              {copy.hoursLabel}
              <span className="ml-2 font-semibold tracking-normal text-[#F8F4EA]/95 normal-case">
                {copy.hoursWindow}
              </span>
            </p>
            {hoursTitle ? (
              <>
                <p className="mt-1.5 text-sm font-semibold leading-snug text-[#FFFDF7]">{hoursTitle}</p>
                {hoursBody ? (
                  <p className="mt-1 text-xs leading-relaxed text-[#F8F4EA]/88 sm:text-[0.8rem]">{hoursBody}</p>
                ) : null}
              </>
            ) : (
              <p className="mt-1.5 text-xs leading-relaxed text-[#F8F4EA]/75">{copy.hoursWindow}</p>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-3 w-full max-w-md px-5 pb-4 sm:px-6">
        {/* 1. Face-to-face video doorbell (only when ECP has approved destination) */}
        {primary && primaryFaceToFace?.hasImmediateVideo ? (
          <section
            aria-labelledby="vfd-video-title"
            className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-4 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.35)] sm:px-5 sm:py-5"
          >
            <h2 id="vfd-video-title" className="sr-only">
              {faceCopy.videoCtaPrimary}
            </h2>
            <FaceToFaceVideoCta
              faceToFace={primaryFaceToFace}
              lang={lang}
              source={source}
              variant="doorbell"
            />
            <p className="mt-3 text-center text-xs text-[#5F6258]">
              {primary.preferredName || primary.fullName}
            </p>
          </section>
        ) : null}

        {/* 2. Staff video choice when multiple executives have video destinations */}
        {videoStaff.length > 1 ? (
          <section aria-labelledby="vfd-who-video" className="mt-6">
            <h2 id="vfd-who-video" className="text-center font-serif text-lg font-bold text-[#1F241C]">
              {faceCopy.whoToSpeakWith}
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-center text-sm text-[#3D3428]">{faceCopy.whoToSpeakWithBody}</p>
            <ul className="mt-4 space-y-2.5">
              {videoStaff.map(({ profile, faceToFace }) => {
                const opt = faceToFace.primary;
                if (!opt) return null;
                return (
                  <li key={profile.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        trackDigitalContactEvent(profile.slug, "face_to_face_cta_selected", {
                          ...analyticsMeta(source, lang),
                          channel: opt.provider,
                          action: "staff_video_choice",
                        });
                        openExternalUrl(opt.url);
                      }}
                      className="flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-2.5 text-left transition hover:border-[var(--dc-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2"
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[var(--dc-accent-border)] bg-white">
                        <Image
                          src={profile.photoPath ?? "/logo-clean.png"}
                          alt=""
                          fill
                          sizes="44px"
                          className={profile.photoPath ? "object-cover" : "object-contain p-1.5"}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-[#1F241C]">
                          {profile.preferredName || profile.fullName}
                        </span>
                        <span className="block truncate text-xs text-[#5F6258]">{profile.title}</span>
                      </span>
                      <span className="shrink-0 text-xs font-bold text-[var(--dc-button-primary)]">
                        {faceCopy.personVideoCta}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* 3. Native contact fallback — demoted when video exists; primary when not */}
        {primary && hasContactable && route ? (
          <section
            aria-labelledby="vfd-connect-title"
            className={`rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-4 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.35)] sm:px-5 sm:py-5 ${
              hasImmediateVideo ? "mt-6" : ""
            }`}
          >
            <h2
              id="vfd-connect-title"
              className="text-center font-serif text-lg font-bold text-[#1F241C] sm:text-xl"
            >
              {hasImmediateVideo ? faceCopy.otherWaysTitle : channelCopy.connectYourWay}
            </h2>
            <p className="mt-1 text-center text-sm leading-relaxed text-[#3D3428]">
              {hasImmediateVideo ? faceCopy.otherWaysBody : channelCopy.connectYourWayBody}
            </p>

            <div className="mt-4">
              <HumanConnectionChannelActions
                channels={route.channels}
                profileSlug={primary.slug}
                lang={lang}
                surface="virtual_front_desk"
                source={source}
                omitTypes={["google_meet", "facetime", "browser_video", "schedule_request"]}
                onManagedBrowserVideo={() => setOpenIntent("video")}
                onScheduleRequest={() => setOpenIntent("schedule")}
              />
            </div>

            <HumanConnectionPanel
              profile={primary}
              lang={lang}
              surface="virtual_front_desk"
              source={source}
              whatsappPrefill={waBody}
              smsPrefill={smsBody}
              variant="inline"
              enableVideo
              enableSchedule={scheduleOffer}
              entryMode="router"
              openIntent={openIntent}
              onOpenIntentConsumed={() => setOpenIntent(null)}
              onOfferResolved={(o) => {
                setBrowserVideoOffer(o.offerVideo);
                setScheduleOffer(o.offerSchedule);
              }}
            />

            {!hasImmediateVideo ? (
              <p className="mt-3 text-center text-xs text-[#5F6258]">
                {primary.preferredName || primary.fullName}
                {" · "}
                {primary.phoneDisplay}
              </p>
            ) : null}

            {backupProfile ? (
              <p className="mt-3 border-t border-[#E8DCC5] pt-3 text-center text-sm leading-relaxed text-[#3D3428]">
                {copy.execBackupLead}{" "}
                <Link
                  href={withLang(`/contact/${encodeURIComponent(backupProfile.slug)}`, lang)}
                  onClick={() => {
                    trackDigitalContactEvent(primary.slug, "showcase_click", {
                      ...analyticsMeta(source, lang),
                      action: "backup_profile_click",
                      backupSlug: backupProfile.slug,
                    });
                  }}
                  className="font-bold text-[var(--dc-button-primary)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2"
                >
                  {backupProfile.preferredName || backupProfile.fullName}
                </Link>
                <span className="sr-only"> — {copy.execBackupCta}</span>
              </p>
            ) : null}
          </section>
        ) : null}

        {/* 4. Staff → ECP profiles */}
        {profiles.length > 0 ? (
          <section aria-labelledby="vfd-team-title" className="mt-8">
            <h2 id="vfd-team-title" className="text-center font-serif text-lg font-bold text-[#1F241C] sm:text-xl">
              {copy.teamTitle}
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-center text-sm leading-relaxed text-[#3D3428]">
              {copy.teamBody}
            </p>

            <ul className="mt-4 space-y-2.5">
              {profiles.map((profile) => {
                const href = withLang(`/contact/${encodeURIComponent(profile.slug)}`, lang);
                return (
                  <li key={profile.slug}>
                    <Link
                      href={href}
                      onClick={() => trackStaffProfile(profile.slug)}
                      className="flex min-h-[64px] items-center gap-3 rounded-xl border border-[#D6C7AD]/90 bg-[#FFFDF7]/90 px-3 py-2.5 transition hover:border-[var(--dc-accent)] hover:bg-[#FFFDF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2"
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[var(--dc-accent-border)] bg-white">
                        <Image
                          src={profile.photoPath ?? "/logo-clean.png"}
                          alt=""
                          fill
                          sizes="44px"
                          className={profile.photoPath ? "object-cover" : "object-contain p-1.5"}
                        />
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-bold text-[#1F241C]">{profile.fullName}</span>
                        <span className="block truncate text-xs text-[#5F6258]">{profile.title}</span>
                      </span>
                      <span className="shrink-0 text-xs font-bold text-[var(--dc-button-primary)]">
                        {copy.teamProfileCta}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section
          aria-labelledby="vfd-fallback-title"
          className="mt-8 rounded-2xl border border-[#D6C7AD]/70 bg-[#FBF7EF] px-4 py-5 text-center sm:px-5"
        >
          <h2 id="vfd-fallback-title" className="font-serif text-lg font-bold text-[#1F241C]">
            {copy.fallbackTitle}
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-[#3D3428]">{copy.fallbackBody}</p>
          <Link
            href={contactoHref}
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[var(--dc-button-primary)] bg-[var(--dc-button-primary)] px-6 py-2.5 text-sm font-bold text-[#FFFDF7] transition hover:bg-[var(--dc-button-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2"
          >
            {copy.fallbackContactCta}
          </Link>
        </section>

        {officeLines ? (
          <section aria-labelledby="vfd-office-title" className="mt-8 text-center">
            <h2 id="vfd-office-title" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A7B28]">
              {copy.officeLabel}
            </h2>
            <address className="mt-1.5 not-italic text-sm leading-relaxed text-[#3D3428]">
              {officeLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </section>
        ) : null}
      </main>

      <footer className="mx-auto w-full max-w-md px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8 text-center sm:px-6">
        <div className="relative mx-auto h-7 w-20 opacity-90">
          <Image src="/logo-clean.png" alt="Leonix Media" fill sizes="80px" className="object-contain" />
        </div>
        <p className="mt-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7B28]">{copy.footerTagline}</p>
        <p className="mt-1.5 text-xs text-[#5F6258]">{copy.privacyNote}</p>
        <p className="mt-2.5 text-xs text-[#5F6258]">
          © {year} {LEONIX_GLOBAL_LLC}. {copy.footerRights}
        </p>
      </footer>
    </div>
  );
}
