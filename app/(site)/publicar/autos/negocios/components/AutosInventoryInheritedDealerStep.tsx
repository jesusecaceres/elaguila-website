"use client";

import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeDealerCustomLinks } from "@/app/lib/clasificados/autos/autosDealerCustomLinks";
import {
  autosInventoryChildEditInMainApplication,
  autosInventoryChildStep5Intro,
  autosInventoryChildStep5SectionTitle,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";

const CARD =
  "rounded-[16px] border border-[#E8DFD0] bg-[#FFFCF7] p-4 shadow-sm sm:p-5";
const LABEL = "text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]";
const VALUE = "mt-0.5 text-sm font-medium text-[color:var(--lx-text)]";

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <dt className={LABEL}>{label}</dt>
      <dd className={VALUE}>{value.trim()}</dd>
    </div>
  );
}

function formatHoursRow(
  row: NonNullable<AutoDealerListing["dealerHours"]>[number],
  closedLabel: string,
): string | null {
  if (row.closed) return `${row.day}: ${closedLabel}`;
  if (row.open && row.close) return `${row.day}: ${row.open} – ${row.close}`;
  if (row.day) return row.day;
  return null;
}

export function AutosInventoryInheritedDealerStep({
  lang,
  copy,
  parentListing,
  onEditInMainApplication,
}: {
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  parentListing: AutoDealerListing;
  onEditInMainApplication?: () => void;
}) {
  const t = copy;
  const socials = parentListing.dealerSocials ?? {};
  const socialEntries = Object.entries(socials).filter(([, v]) => v?.trim());
  const customLinks = normalizeDealerCustomLinks(parentListing.dealerCustomLinks).filter(
    (l) => l.label?.trim() || l.url?.trim(),
  );
  const hours = (parentListing.dealerHours ?? [])
    .map((row) => formatHoursRow(row, t.app.dealer.closed))
    .filter(Boolean) as string[];

  const addressParts = [
    [parentListing.dealerStreetNumber, parentListing.dealerStreetName].filter(Boolean).join(" "),
    parentListing.dealerUnitOrSuite,
    [parentListing.dealerAddressCity ?? parentListing.dealerAddress, parentListing.dealerAddressState, parentListing.dealerAddressZip]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);

  return (
    <section className={CARD}>
      <h3 className="text-sm font-extrabold text-[#1E1810]">{autosInventoryChildStep5SectionTitle(lang)}</h3>
      <p className="mt-3 rounded-xl border border-[#C9B46A]/40 bg-[#FAF7F2] px-4 py-3 text-xs leading-relaxed text-[#5C5346]">
        {autosInventoryChildStep5Intro(lang)}
      </p>
      {onEditInMainApplication ? (
        <button
          type="button"
          onClick={onEditInMainApplication}
          className="mt-3 text-sm font-bold text-[#6E5418] underline-offset-2 hover:underline"
        >
          {autosInventoryChildEditInMainApplication(lang)}
        </button>
      ) : null}

      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t.app.labels.dealerName} value={parentListing.dealerName} />
        <Field label={t.app.labels.phoneOffice} value={parentListing.dealerPhoneOffice} />
        <Field label={t.app.labels.phoneMobile} value={parentListing.dealerPhoneMobile} />
        <Field label={t.app.labels.whatsapp} value={parentListing.dealerWhatsapp} />
        <Field label={t.app.dealer.smsPhone} value={parentListing.dealerSmsPhone} />
        <Field label={lang === "es" ? "Correo" : "Email"} value={parentListing.dealerEmail} />
        <Field label={t.app.labels.website} value={parentListing.dealerWebsite} />
        <Field label={t.app.labels.bookingUrl} value={parentListing.dealerBookingUrl} />
        {addressParts.length > 0 ? (
          <div className="sm:col-span-2">
            <Field label={t.app.labels.address} value={addressParts.join(" · ")} />
          </div>
        ) : null}
        <Field label={t.app.finance.name} value={parentListing.financeContactName} />
        <Field label={t.app.finance.title} value={parentListing.financeContactTitle} />
        <Field label={t.app.finance.phone} value={parentListing.financeContactPhone} />
        <Field label={t.app.finance.whatsapp} value={parentListing.financeContactWhatsapp} />
        <Field label={t.app.finance.email} value={parentListing.financeContactEmail} />
        <Field label={t.app.finance.preApprovalUrl} value={parentListing.financeApplicationUrl} />
        {parentListing.financeNotes?.trim() ? (
          <div className="sm:col-span-2">
            <Field label={t.app.finance.notes} value={parentListing.financeNotes} />
          </div>
        ) : null}
        <Field label={t.app.dealer.googleReviews} value={parentListing.googleReviewsUrl} />
        <Field label={t.app.dealer.yelpReviews} value={parentListing.yelpReviewsUrl} />
      </dl>

      {socialEntries.length > 0 ? (
        <div className="mt-5">
          <p className={LABEL}>{lang === "es" ? "Redes sociales" : "Social profiles"}</p>
          <ul className="mt-2 space-y-1 text-sm text-[color:var(--lx-text-2)]">
            {socialEntries.map(([key, url]) => (
              <li key={key} className="truncate">
                <span className="font-semibold capitalize">{key}: </span>
                {url}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {customLinks.length > 0 ? (
        <div className="mt-5">
          <p className={LABEL}>{t.app.dealer.customLinksHeading}</p>
          <ul className="mt-2 space-y-1 text-sm text-[color:var(--lx-text-2)]">
            {customLinks.map((link) => (
              <li key={link.id}>
                {link.label?.trim() || (lang === "es" ? "Enlace" : "Link")}: {link.url}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hours.length > 0 ? (
        <div className="mt-5">
          <p className={LABEL}>{lang === "es" ? "Horario" : "Hours"}</p>
          <ul className="mt-2 space-y-1 text-sm text-[color:var(--lx-text-2)]">
            {hours.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
