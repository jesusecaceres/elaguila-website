"use client";

import { useCallback, useState } from "react";
import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { digitalContactOfficeLine } from "@/app/lib/digitalContact/digitalContactSeo";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";
import { copyToClipboard, getFormattedPhone } from "@/app/components/cta/ctaDataHelpers";
import { openExternalUrl, openMaps, openSms, openTel, openWhatsApp } from "@/app/components/cta/ctaLaunchers";

type Props = {
  profile: DigitalContactProfile;
  copy: DigitalContactCopy;
  onOpenEmail: () => void;
};

type ActionDef = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
};

function ActionIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const ICON_PATHS = {
  call: "M4 5c0-.6.4-1 1-1h2.6c.5 0 .9.3 1 .8l1 3.6c.1.4 0 .8-.3 1.1L7 11c1.2 2.6 3.4 4.8 6 6l1.5-1.3c.3-.3.7-.4 1.1-.3l3.6 1c.5.1.8.5.8 1V20c0 .6-.4 1-1 1h-1C9.9 21 4 15.1 4 8V5Z",
  text: "M4 5h16v11H8l-4 4V5Z",
  whatsapp: "M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Zm-3.2 5.4c.2-.5.5-.5.8-.5h.6c.2 0 .4 0 .6.5l.7 1.7c.1.3 0 .5-.2.7l-.5.5c.3.8 1.5 2 2.3 2.3l.5-.5c.2-.2.4-.3.7-.2l1.7.7c.5.2.5.4.5.6v.6c0 .3 0 .6-.5.8-1 .5-2.5.2-4-1.3-1.5-1.5-1.8-3-1.2-4Z",
  email: "M4 6h16v12H4V6Zm0 0 8 7 8-7",
  directions: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8.6a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z",
  website: "M3.6 12h16.8M12 3.6c2.2 2.3 3.4 5.3 3.4 8.4s-1.2 6.1-3.4 8.4c-2.2-2.3-3.4-5.3-3.4-8.4S9.8 5.9 12 3.6ZM12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8Z",
  copy: "M9 9h9v9H9V9Zm-3 3H4V4h8v2",
} as const;

export function DigitalContactQuickActions({ profile, copy, onOpenEmail }: Props) {
  const [toast, setToast] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2200);
  }, []);

  const formattedPhone = getFormattedPhone(profile.phoneDisplay || profile.phoneDigits);
  const whatsappDigits = profile.whatsappDigits || profile.phoneDigits;

  const actions: ActionDef[] = [
    {
      id: "call",
      label: copy.actionCall,
      icon: <ActionIcon path={ICON_PATHS.call} />,
      onPress: () => {
        trackDigitalContactEvent(profile.slug, "cta_call");
        openTel(profile.phoneDigits);
      },
    },
    {
      id: "text",
      label: copy.actionText,
      icon: <ActionIcon path={ICON_PATHS.text} />,
      onPress: () => {
        trackDigitalContactEvent(profile.slug, "cta_text");
        openSms(profile.phoneDigits, "");
      },
    },
    {
      id: "whatsapp",
      label: copy.actionWhatsapp,
      icon: <ActionIcon path={ICON_PATHS.whatsapp} />,
      onPress: () => {
        trackDigitalContactEvent(profile.slug, "cta_whatsapp");
        openWhatsApp(whatsappDigits, "");
      },
    },
    {
      id: "email",
      label: copy.actionEmail,
      icon: <ActionIcon path={ICON_PATHS.email} />,
      onPress: () => {
        trackDigitalContactEvent(profile.slug, "cta_email");
        onOpenEmail();
      },
    },
    {
      id: "directions",
      label: copy.actionDirections,
      icon: <ActionIcon path={ICON_PATHS.directions} />,
      onPress: () => {
        trackDigitalContactEvent(profile.slug, "cta_directions");
        openMaps(digitalContactOfficeLine(profile));
      },
    },
    {
      id: "website",
      label: copy.actionWebsite,
      icon: <ActionIcon path={ICON_PATHS.website} />,
      onPress: () => {
        trackDigitalContactEvent(profile.slug, "cta_website");
        openExternalUrl(profile.website);
      },
    },
    {
      id: "copy_email",
      label: copy.actionCopyEmail,
      icon: <ActionIcon path={ICON_PATHS.copy} />,
      onPress: () => {
        void (async () => {
          const ok = await copyToClipboard(profile.email);
          if (ok) {
            trackDigitalContactEvent(profile.slug, "copy_email");
            flash(copy.copiedEmail);
          }
        })();
      },
    },
    {
      id: "copy_phone",
      label: copy.actionCopyPhone,
      icon: <ActionIcon path={ICON_PATHS.copy} />,
      onPress: () => {
        void (async () => {
          const ok = await copyToClipboard(formattedPhone);
          if (ok) {
            trackDigitalContactEvent(profile.slug, "copy_phone");
            flash(copy.copiedPhone);
          }
        })();
      },
    },
  ];

  return (
    <section aria-labelledby="dc-quick-actions-title" className="mx-auto w-full max-w-2xl px-5 pt-10 sm:px-6 sm:pt-12">
      <h2 id="dc-quick-actions-title" className="text-center font-serif text-xl font-bold text-[#1F241C] sm:text-2xl">
        {copy.quickActionsTitle}
      </h2>
      <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onPress}
            className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] px-2 py-3 text-center shadow-sm transition hover:border-[#C9A84A] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F4EA]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A1E2C] text-[#FFFCF7]">
              {action.icon}
            </span>
            <span className="text-xs font-bold text-[#1F241C] sm:text-sm">{action.label}</span>
          </button>
        ))}
        {toast ? (
          <p
            role="status"
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1F241C] px-4 py-1.5 text-xs font-semibold text-[#FFFDF7] shadow-lg"
          >
            {toast}
          </p>
        ) : null}
      </div>
    </section>
  );
}
