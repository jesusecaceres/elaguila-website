"use client";

import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { digitalContactOfficeLine } from "@/app/lib/digitalContact/digitalContactSeo";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";
import { getFormattedPhone } from "@/app/components/cta/ctaDataHelpers";
import type { CtaSheetIntent } from "@/app/components/cta/types";

type Props = {
  profile: DigitalContactProfile;
  copy: DigitalContactCopy;
  onOpenSheet: (intent: CtaSheetIntent) => void;
};

function RowIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C9A84A]/50 bg-[#FBF7EF] text-[#7A1E2C]">
      {children}
    </span>
  );
}

/** Premium executive contact card — Phone / Email / Office / Website, each opens the shared CTA sheet. */
export function DigitalContactExecutiveCard({ profile, copy, onOpenSheet }: Props) {
  const rows: Array<{
    id: string;
    label: string;
    value: string;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      id: "phone",
      label: copy.phoneLabel,
      value: getFormattedPhone(profile.phoneDisplay || profile.phoneDigits),
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5c0-.6.4-1 1-1h2.6c.5 0 .9.3 1 .8l1 3.6c.1.4 0 .8-.3 1.1L7 11c1.2 2.6 3.4 4.8 6 6l1.5-1.3c.3-.3.7-.4 1.1-.3l3.6 1c.5.1.8.5.8 1V20c0 .6-.4 1-1 1h-1C9.9 21 4 15.1 4 8V5Z" />
        </svg>
      ),
      onClick: () => onOpenSheet({ kind: "call", phone: profile.phoneDigits, contactShareExtras: { email: profile.email, websiteUrl: profile.website } }),
    },
    {
      id: "email",
      label: copy.emailLabel,
      value: profile.email,
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4V6Zm0 0 8 7 8-7" />
        </svg>
      ),
      onClick: () =>
        onOpenSheet({
          kind: "send_email",
          email: profile.email,
          subject: "",
          body: "",
          contactShareExtras: { websiteUrl: profile.website },
        }),
    },
    {
      id: "office",
      label: copy.officeLabel,
      value: digitalContactOfficeLine(profile),
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.4" />
        </svg>
      ),
      onClick: () => onOpenSheet({ kind: "directions", addressOrUrl: digitalContactOfficeLine(profile) }),
    },
    {
      id: "website",
      label: copy.websiteLabel,
      value: profile.website.replace(/^https?:\/\//i, ""),
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <circle cx="12" cy="12" r="8.4" />
          <path strokeLinecap="round" d="M3.6 12h16.8M12 3.6c2.2 2.3 3.4 5.3 3.4 8.4s-1.2 6.1-3.4 8.4c-2.2-2.3-3.4-5.3-3.4-8.4S9.8 5.9 12 3.6Z" />
        </svg>
      ),
      onClick: () => onOpenSheet({ kind: "website", url: profile.website, headline: copy.websiteLabel }),
    },
  ];

  return (
    <section aria-labelledby="dc-executive-card-title" className="mx-auto -mt-8 w-full max-w-2xl px-5 sm:-mt-10 sm:px-6">
      <div className="rounded-3xl border border-[#D6C7AD] bg-[#FFFDF7] p-2 shadow-[0_20px_50px_-20px_rgba(31,36,28,0.35)]">
        <h2 id="dc-executive-card-title" className="sr-only">
          {copy.executiveCardTitle}
        </h2>
        <ul className="divide-y divide-[#E8DCC5]">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={row.onClick}
                className="flex w-full min-h-[64px] items-center gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF7]"
              >
                <RowIcon>{row.icon}</RowIcon>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#5F6258]">{row.label}</span>
                  <span className="truncate text-sm font-semibold text-[#1F241C] sm:text-base">{row.value}</span>
                </span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#C9A84A]" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
