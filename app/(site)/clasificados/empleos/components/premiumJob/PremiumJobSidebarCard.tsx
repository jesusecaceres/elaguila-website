import { FaClock, FaEnvelope, FaGlobe, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import { SiWhatsapp } from "react-icons/si";

type Primary = "apply" | "phone" | "whatsapp" | "email" | "website";

type Props = {
  salaryPrimary: string;
  salarySecondary?: string;
  jobType: string;
  scheduleLabel?: string;
  locationLabel: string;
  featured: boolean;
  premium: boolean;
  phone?: string;
  whatsapp?: string;
  email?: string;
  websiteUrl?: string;
  primaryCta: Primary;
  applyLabel: string;
  websiteCtaLabel: string;
  emailLabel: string;
  phoneLabel: string;
  badgeFeatured: string;
  badgePremium: string;
};

const GOLD = "bg-[#B8943F] text-white hover:bg-[#9A7A32]";
const OUTLINE = "border border-[#C9A85A] bg-[#FFFBF7] text-[#6B5320] hover:bg-[#FFF5E6]";
const MUTED = "border border-[#E8DFD0] bg-white text-[#4A4744] hover:bg-[#FAF7F2]";

function digits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function PremiumJobSidebarCard({
  salaryPrimary,
  salarySecondary,
  jobType,
  scheduleLabel,
  locationLabel,
  featured,
  premium,
  phone,
  whatsapp,
  email,
  websiteUrl,
  primaryCta,
  applyLabel,
  websiteCtaLabel,
  emailLabel,
  phoneLabel,
  badgeFeatured,
  badgePremium,
}: Props) {
  const site = websiteUrl?.trim() ?? "";

  let primaryHref: string | undefined;
  let primaryLabel = applyLabel;
  let external = false;

  if (primaryCta === "phone" && phone) {
    primaryHref = `tel:${digits(phone)}`;
    primaryLabel = phoneLabel;
  } else if (primaryCta === "whatsapp" && whatsapp) {
    primaryHref = `https://wa.me/${digits(whatsapp)}`;
    primaryLabel = "WhatsApp";
    external = true;
  } else if (primaryCta === "email" && email) {
    primaryHref = `mailto:${email}`;
    primaryLabel = emailLabel;
  } else if ((primaryCta === "website" || primaryCta === "apply") && site.startsWith("http")) {
    primaryHref = site;
    primaryLabel = applyLabel.trim() || websiteCtaLabel;
    external = true;
  } else if (site.startsWith("http")) {
    primaryHref = site;
    primaryLabel = applyLabel.trim() || websiteCtaLabel;
    external = true;
  } else if (phone) {
    primaryHref = `tel:${digits(phone)}`;
    primaryLabel = phoneLabel;
  } else if (whatsapp) {
    primaryHref = `https://wa.me/${digits(whatsapp)}`;
    primaryLabel = "WhatsApp";
    external = true;
  } else if (email) {
    primaryHref = `mailto:${email}`;
    primaryLabel = emailLabel;
  }

  const primaryClass = `flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-bold shadow-sm transition ${GOLD}`;
  const secClass = `flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] px-3 text-xs font-semibold shadow-sm transition sm:min-h-12 sm:text-[13px] ${OUTLINE}`;
  const terClass = `flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] px-3 text-xs font-semibold shadow-sm transition sm:min-h-12 sm:text-[13px] ${MUTED}`;

  const showPhone = Boolean(phone) && primaryCta !== "phone";
  const showWa = Boolean(whatsapp) && primaryCta !== "whatsapp";
  const showMail = Boolean(email) && primaryCta !== "email";
  const showSite = site.startsWith("http") && primaryCta !== "website" && primaryCta !== "apply";

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-5 shadow-[0_12px_36px_rgba(42,40,38,0.08)] sm:p-6">
      {featured ? (
        <div className="absolute right-0 top-0 rounded-bl-lg bg-[#6B5320] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          {badgeFeatured}
        </div>
      ) : null}

      <div className={featured ? "pr-16" : ""}>
        <p className="text-2xl font-bold text-[#8A5A18] sm:text-3xl">{salaryPrimary}</p>
        {salarySecondary ? (
          <p className="mt-1 text-sm font-medium text-[#5C564E]">{salarySecondary}</p>
        ) : null}

        <div className="mt-5 space-y-3 text-sm text-[#4A4744]">
          <div className="flex items-start gap-2">
            <FaClock className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
            <div>
              <span>{jobType}</span>
              {scheduleLabel ? <p className="mt-1 text-xs text-[#7A756E]">{scheduleLabel}</p> : null}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FaMapMarkerAlt className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
            <span className="leading-snug">{locationLabel}</span>
          </div>
        </div>

        {premium ? <p className="mt-4 text-xs font-semibold text-[#8A5A18]">+ {badgePremium}</p> : null}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {primaryHref ? (
          <a
            href={primaryHref}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className={primaryClass}
          >
            {primaryLabel}
          </a>
        ) : (
          <span className={`${primaryClass} cursor-not-allowed opacity-60`} aria-disabled>
            {primaryLabel}
          </span>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {showPhone ? (
            <a href={`tel:${digits(phone!)}`} className={secClass}>
              <FaPhone className="h-4 w-4 shrink-0" aria-hidden />
              {phoneLabel}
            </a>
          ) : null}
          {showWa ? (
            <a href={`https://wa.me/${digits(whatsapp!)}`} target="_blank" rel="noopener noreferrer" className={secClass}>
              <SiWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
              WhatsApp
            </a>
          ) : null}
          {showMail ? (
            <a href={`mailto:${email}`} className={secClass}>
              <FaEnvelope className="h-4 w-4 shrink-0" aria-hidden />
              {emailLabel}
            </a>
          ) : null}
          {showSite ? (
            <a href={site} target="_blank" rel="noopener noreferrer" className={terClass}>
              <FaGlobe className="h-4 w-4 shrink-0" aria-hidden />
              {websiteCtaLabel}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
