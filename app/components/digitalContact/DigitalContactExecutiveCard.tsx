"use client";

import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { digitalContactOfficeLine } from "@/app/lib/digitalContact/digitalContactSeo";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";
import { getFormattedPhone } from "@/app/components/cta/ctaDataHelpers";
import { openExternalUrl, openMaps, openTel } from "@/app/components/cta/ctaLaunchers";

type Props = {
  profile: DigitalContactProfile;
  copy: DigitalContactCopy;
  onOpenEmail: () => void;
};

function RowIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--dc-accent-border)] bg-[#FBF7EF] text-[var(--dc-primary)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
      {children}
    </span>
  );
}

/** Premium executive contact card — Phone / Office / Website launch instantly; Email opens the small email modal. */
export function DigitalContactExecutiveCard({ profile, copy, onOpenEmail }: Props) {
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
      onClick: () => openTel(profile.phoneDigits),
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
      onClick: onOpenEmail,
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
      onClick: () => openMaps(digitalContactOfficeLine(profile)),
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
      onClick: () => openExternalUrl(profile.website),
    },
  ];

  return (
    <section aria-labelledby="dc-executive-card-title" className="relative mx-auto w-full max-w-2xl px-5 pt-2 sm:px-6">
      <div className="rounded-3xl border border-[#D6C7AD] bg-[#FFFDF7] p-2 shadow-[0_24px_56px_-20px_rgba(31,36,28,0.4)]">
        <h2 id="dc-executive-card-title" className="sr-only">
          {copy.executiveCardTitle}
        </h2>
        <ul className="divide-y divide-[#E8DCC5]">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={row.onClick}
                className="flex min-h-[68px] w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-left transition hover:bg-[var(--dc-accent-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF7] sm:gap-4 sm:px-4"
              >
                <RowIcon>{row.icon}</RowIcon>
                <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#5F6258]">{row.label}</span>
                  <span className="truncate text-sm font-semibold text-[#1F241C] sm:text-base">{row.value}</span>
                </span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[var(--dc-accent)]" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
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
