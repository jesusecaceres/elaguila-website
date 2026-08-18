"use client";

import { openMailto, openSms, openTel, openWhatsApp, openExternalUrl } from "@/app/components/cta/ctaLaunchers";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";
import type { HumanConnectionChannel } from "@/app/lib/digitalContact/humanConnection/channelTypes";
import { labelForChannel } from "@/app/lib/digitalContact/humanConnection/connectionChannelCopy";
import { getFaceToFaceCopy } from "@/app/lib/digitalContact/humanConnection/faceToFaceCopy";
import type { DigitalContactLang } from "@/app/lib/digitalContact/digitalContactTypes";
import type { HumanConnectionSurface } from "@/app/lib/digitalContact/humanConnection/humanConnectionTypes";

type Props = {
  channels: HumanConnectionChannel[];
  profileSlug: string;
  lang: DigitalContactLang;
  surface: HumanConnectionSurface;
  source?: string | null;
  /** Called when visitor selects managed browser video or schedule (parent owns those flows). */
  onManagedBrowserVideo?: () => void;
  onScheduleRequest?: () => void;
  /** Skip rendering these types (parent already renders them). */
  omitTypes?: Array<HumanConnectionChannel["type"]>;
  /**
   * app_rows = labeled app connection cards (WhatsApp / Messenger / Instagram).
   * default = existing primary/secondary/tertiary button layout.
   */
  layout?: "default" | "app_rows";
};

function ActionIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const ICONS: Partial<Record<HumanConnectionChannel["type"], string>> = {
  phone:
    "M4 5c0-.6.4-1 1-1h2.6c.5 0 .9.3 1 .8l1 3.6c.1.4 0 .8-.3 1.1L7 11c1.2 2.6 3.4 4.8 6 6l1.5-1.3c.3-.3.7-.4 1.1-.3l3.6 1c.5.1.8.5.8 1V20c0 .6-.4 1-1 1h-1C9.9 21 4 15.1 4 8V5Z",
  whatsapp:
    "M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Zm-3.2 5.4c.2-.5.5-.5.8-.5h.6c.2 0 .4 0 .6.5l.7 1.7c.1.3 0 .5-.2.7l-.5.5c.3.8 1.5 2 2.3 2.3l.5-.5c.2-.2.4-.3.7-.2l1.7.7c.5.2.5.4.5.6v.6c0 .3 0 .6-.5.8-1 .5-2.5.2-4-1.3-1.5-1.5-1.8-3-1.2-4Z",
  sms: "M4 5h16v11H8l-4 4V5Z",
  email: "M4 6h16v12H4V6Zm0 0 8 7 8-7",
  facetime:
    "M4 7.5A2.5 2.5 0 0 1 6.5 5h7A2.5 2.5 0 0 1 16 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 16.5v-9ZM17 9.5l3-2v9l-3-2v-5Z",
  browser_video:
    "M4 7.5A2.5 2.5 0 0 1 6.5 5h7A2.5 2.5 0 0 1 16 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 16.5v-9ZM17 9.5l3-2v9l-3-2v-5Z",
  google_meet: "M4 6h10v12H4V6Zm11 3 5-2v10l-5-2V9Z",
  teams: "M4 6h9v12H4V6Zm10 2h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4V8Z",
  messenger: "M12 3a9 9 0 0 0-7.2 14.4L4 21l3.8-1.1A9 9 0 1 0 12 3Zm-3 8.5 2.2 2.2L15 9l-2.2 2.2L9 11.5Z",
  instagram:
    "M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Zm4 4.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm4.2-.9a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z",
  schedule_request: "M7 4v2M17 4v2M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
};

function appActionLabel(type: HumanConnectionChannel["type"], lang: DigitalContactLang): string {
  const copy = getFaceToFaceCopy(lang);
  if (type === "whatsapp") return copy.appWhatsAppAction;
  if (type === "messenger") return copy.appMessengerAction;
  if (type === "instagram") return copy.appInstagramAction;
  if (type === "teams") return copy.appTeamsAction;
  return labelForChannel(type, lang);
}

/**
 * Renders router channels using existing CTA launchers.
 * Tracks connection_channel_selected with truthful channel metadata only.
 */
export function HumanConnectionChannelActions({
  channels,
  profileSlug,
  lang,
  surface,
  source = null,
  onManagedBrowserVideo,
  onScheduleRequest,
  omitTypes = [],
  layout = "default",
}: Props) {
  const omit = new Set(omitTypes);
  const visible = channels.filter((c) => !omit.has(c.type));
  if (visible.length === 0) return null;

  const meta = { surface, lang, ...(source ? { source } : {}) };

  function trackSelect(type: string) {
    trackDigitalContactEvent(profileSlug, "connection_channel_selected", {
      ...meta,
      channel: type,
    });
  }

  function launch(ch: HumanConnectionChannel) {
    trackSelect(ch.type);
    const a = ch.action;
    switch (a.kind) {
      case "tel":
        openTel(a.phoneDigits);
        break;
      case "sms":
        openSms(a.phoneDigits, a.bodyPrefill ?? "");
        break;
      case "whatsapp":
        openWhatsApp(a.phoneDigits, a.bodyPrefill ?? "");
        break;
      case "mailto":
        openMailto(a.email, "", "");
        break;
      case "external_url":
        openExternalUrl(a.url);
        break;
      case "managed_browser_video":
        onManagedBrowserVideo?.();
        break;
      case "managed_google_meet":
        // Unconfigured in V1 — should not appear; no-op fail closed.
        break;
      case "schedule_request":
        onScheduleRequest?.();
        break;
      default:
        break;
    }
  }

  if (layout === "app_rows") {
    return (
      <ul className="space-y-2.5">
        {visible.map((ch) => {
          const name = labelForChannel(ch.type, lang);
          const action = appActionLabel(ch.type, lang);
          return (
            <li key={ch.type}>
              <button
                type="button"
                onClick={() => launch(ch)}
                aria-label={`${name} — ${action}`}
                className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-[#D6C7AD] bg-[#FBF7EF] px-3.5 py-2.5 text-left transition hover:border-[var(--dc-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2"
              >
                {ICONS[ch.type] ? <ActionIcon path={ICONS[ch.type]!} /> : null}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#1F241C]">{name}</span>
                  <span className="block text-xs text-[#5F6258]">{action}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  const primary = visible.find((c) => c.presentation === "primary");
  const secondary = visible.filter((c) => c !== primary && c.presentation !== "tertiary");
  const tertiary = visible.filter((c) => c.presentation === "tertiary");

  return (
    <div className="space-y-2.5">
      {primary ? (
        <button
          type="button"
          onClick={() => launch(primary)}
          aria-label={labelForChannel(primary.type, lang)}
          className="flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--dc-button-primary)] px-5 py-3.5 text-base font-bold text-[#FFFDF7] shadow-md transition hover:bg-[var(--dc-button-hover)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2"
        >
          {ICONS[primary.type] ? <ActionIcon path={ICONS[primary.type]!} /> : null}
          <span>{labelForChannel(primary.type, lang)}</span>
        </button>
      ) : null}

      {secondary.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {secondary.map((ch) => (
            <button
              key={ch.type}
              type="button"
              onClick={() => launch(ch)}
              aria-label={labelForChannel(ch.type, lang)}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#D6C7AD] bg-[#FBF7EF] px-3 py-2.5 text-sm font-bold text-[#1F241C] transition hover:border-[var(--dc-accent)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2"
            >
              {ICONS[ch.type] ? <ActionIcon path={ICONS[ch.type]!} /> : null}
              {labelForChannel(ch.type, lang)}
            </button>
          ))}
        </div>
      ) : null}

      {tertiary.map((ch) =>
        ch.type === "email" ? (
          <button
            key={ch.type}
            type="button"
            onClick={() => launch(ch)}
            aria-label={labelForChannel("email", lang)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#3D3428] underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)]"
          >
            {ICONS.email ? <ActionIcon path={ICONS.email} /> : null}
            {labelForChannel("email", lang)}
          </button>
        ) : ch.type === "schedule_request" ? (
          <button
            key={ch.type}
            type="button"
            onClick={() => launch(ch)}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[var(--dc-button-primary)] bg-transparent px-4 py-2.5 text-sm font-bold text-[var(--dc-button-primary)] transition hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)]"
          >
            {labelForChannel("schedule_request", lang)}
          </button>
        ) : (
          <button
            key={ch.type}
            type="button"
            onClick={() => launch(ch)}
            className="flex min-h-[44px] w-full items-center justify-center text-sm font-semibold text-[#3D3428]"
          >
            {labelForChannel(ch.type, lang)}
          </button>
        ),
      )}
    </div>
  );
}
