import Image from "next/image";
import { FiClock, FiGlobe, FiMapPin, FiPhone } from "react-icons/fi";
import { SiFacebook, SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import type { AutoDealerListing, DealerHoursEntry, DealerSocialKey } from "../types/autoDealerListing";
import { hasDealerCard } from "../lib/autoDealerPresence";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4 shadow-[0_4px_24px_-6px_rgba(42,36,22,0.08)]";

const ICON_ROW = "flex gap-3 text-[color:var(--lx-text-2)]";

const SOCIAL_ORDER: DealerSocialKey[] = ["instagram", "facebook", "youtube", "tiktok", "website"];

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function formatHoursLine(h: DealerHoursEntry): string {
  if (h.closed) return "Cerrado";
  const o = h.open.trim();
  const c = h.close.trim();
  if (!o && !c) return "—";
  return `${o} – ${c}`;
}

export function DealerInfoCard({ data }: { data: AutoDealerListing }) {
  if (!hasDealerCard(data)) return null;

  const socials = SOCIAL_ORDER.filter((k) => Boolean(data.dealerSocials?.[k]));
  const hours = data.dealerHours ?? [];
  const showRating =
    (data.dealerRating !== undefined && Number.isFinite(data.dealerRating)) ||
    (data.dealerReviewCount !== undefined && Number.isFinite(data.dealerReviewCount));

  const initials = (data.dealerName ?? "NA").slice(0, 2).toUpperCase();

  return (
    <div className={CARD}>
      <div className="flex gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7]">
          {data.dealerLogo ? (
            <Image src={data.dealerLogo} alt={data.dealerName ?? "Concesionario"} fill className="object-cover" sizes="56px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[color:var(--lx-muted)]">{initials}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {nonEmpty(data.dealerName) ? (
            <h2 className="text-base font-bold leading-tight tracking-tight text-[color:var(--lx-text)]">{data.dealerName}</h2>
          ) : null}
          {showRating ? (
            <p className="mt-1 text-sm text-[color:var(--lx-muted)]">
              {data.dealerRating !== undefined && Number.isFinite(data.dealerRating) ? (
                <span className="font-semibold text-[color:var(--lx-gold)]">{data.dealerRating.toFixed(1)}</span>
              ) : null}
              {data.dealerRating !== undefined && Number.isFinite(data.dealerRating) && data.dealerReviewCount !== undefined ? " · " : null}
              {data.dealerReviewCount !== undefined && Number.isFinite(data.dealerReviewCount) ? `${data.dealerReviewCount} reseñas` : null}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="mt-4 space-y-3 text-sm">
        {nonEmpty(data.dealerPhone) ? (
          <li className={ICON_ROW}>
            <FiPhone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
            <a
              href={`tel:${data.dealerPhone!.replace(/\D/g, "")}`}
              className="font-medium text-[color:var(--lx-text)] underline-offset-2 hover:underline"
            >
              {data.dealerPhone}
            </a>
          </li>
        ) : null}
        {nonEmpty(data.dealerAddress) ? (
          <li className={ICON_ROW}>
            <FiMapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
            <span className="leading-snug">{data.dealerAddress}</span>
          </li>
        ) : null}
        {hours.length > 0 ? (
          <li className={ICON_ROW}>
            <FiClock className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
            <div className="space-y-1">
              {hours.map((row, idx) => (
                <div key={`${row.day}-${idx}`} className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <span className="font-semibold text-[color:var(--lx-text)]">{row.day}</span>
                  <span className="text-[color:var(--lx-text-2)]">{formatHoursLine(row)}</span>
                </div>
              ))}
            </div>
          </li>
        ) : null}
        {nonEmpty(data.dealerWebsite ?? undefined) ? (
          <li className={ICON_ROW}>
            <FiGlobe className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
            <a
              href={data.dealerWebsite!}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[color:var(--lx-text)] underline-offset-2 hover:underline"
            >
              Sitio web del concesionario
            </a>
          </li>
        ) : null}
      </ul>

      {socials.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[color:var(--lx-nav-border)] pt-4">
          {socials.map((key) => {
            const href = data.dealerSocials?.[key];
            if (!href) return null;
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
                aria-label={socialLabel(key)}
              >
                <SocialIcon kind={key} />
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function socialLabel(key: DealerSocialKey): string {
  switch (key) {
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "youtube":
      return "YouTube";
    case "tiktok":
      return "TikTok";
    case "website":
      return "Sitio web";
    default:
      return "Enlace";
  }
}

function SocialIcon({ kind }: { kind: DealerSocialKey }) {
  const className = "h-[18px] w-[18px]";
  switch (kind) {
    case "instagram":
      return <SiInstagram className={className} />;
    case "facebook":
      return <SiFacebook className={className} />;
    case "youtube":
      return <SiYoutube className={className} />;
    case "tiktok":
      return <SiTiktok className={className} />;
    case "website":
      return <FiGlobe className={className} />;
    default:
      return <FiGlobe className={className} />;
  }
}
