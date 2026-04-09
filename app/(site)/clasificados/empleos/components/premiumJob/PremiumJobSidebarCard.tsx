import { FaClock, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { SiWhatsapp } from "react-icons/si";

type Props = {
  salaryPrimary: string;
  salarySecondary?: string;
  jobType: string;
  locationLabel: string;
  featured: boolean;
  premium: boolean;
  whatsapp?: string;
  email?: string;
  websiteUrl?: string;
  applyLabel: string;
  websiteCtaLabel: string;
  emailLabel: string;
  badgeFeatured: string;
  badgePremium: string;
};

export function PremiumJobSidebarCard({
  salaryPrimary,
  salarySecondary,
  jobType,
  locationLabel,
  featured,
  premium,
  whatsapp,
  email,
  websiteUrl,
  applyLabel,
  websiteCtaLabel,
  emailLabel,
  badgeFeatured,
  badgePremium,
}: Props) {
  const secondaryCount = [whatsapp, email, websiteUrl].filter(Boolean).length;
  const gridCols =
    secondaryCount === 3 ? "sm:grid-cols-3" : secondaryCount === 2 ? "sm:grid-cols-2" : "grid-cols-1";

  return (
    <div className="relative overflow-hidden rounded-lg border border-black/[0.06] bg-white p-5 shadow-[0_8px_32px_rgba(30,24,16,0.1)] sm:p-6">
      {featured ? (
        <div className="absolute right-0 top-0 rounded-bl-lg bg-[#2563EB] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          {badgeFeatured}
        </div>
      ) : null}

      <div className={featured ? "pr-16" : ""}>
        <p className="text-2xl font-bold text-emerald-700 sm:text-3xl">{salaryPrimary}</p>
        {salarySecondary ? (
          <p className="mt-1 text-sm font-medium text-[color:var(--lx-text-2)]">{salarySecondary}</p>
        ) : null}

        <div className="mt-5 space-y-3 text-sm text-[color:var(--lx-text-2)]">
          <div className="flex items-start gap-2">
            <FaClock className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--lx-muted)]" aria-hidden />
            <span>{jobType}</span>
          </div>
          <div className="flex items-start gap-2">
            <FaMapMarkerAlt className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--lx-muted)]" aria-hidden />
            <span>{locationLabel}</span>
          </div>
        </div>

        {premium ? (
          <p className="mt-4 text-xs font-semibold text-amber-700">
            + {badgePremium}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
        >
          {applyLabel}
        </button>

        {(whatsapp || email || websiteUrl) ? (
          <div className={`grid grid-cols-1 gap-3 ${gridCols}`}>
            {whatsapp ? (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:min-h-12 sm:text-[13px]"
              >
                <SiWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                WhatsApp
              </a>
            ) : null}
            {email ? (
              <a
                href={`mailto:${email}`}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#C41E3A] px-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#A01830] sm:min-h-12 sm:text-[13px]"
              >
                <FaEnvelope className="h-4 w-4 shrink-0" aria-hidden />
                {emailLabel}
              </a>
            ) : null}
            {websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center rounded-lg border border-[#2563EB] bg-[#2563EB] px-2 text-center text-xs font-bold leading-tight text-white shadow-sm transition hover:bg-[#1D4ED8] sm:min-h-12 sm:text-[13px]"
              >
                {websiteCtaLabel}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

    </div>
  );
}
