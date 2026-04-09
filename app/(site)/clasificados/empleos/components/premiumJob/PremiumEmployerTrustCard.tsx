import Image from "next/image";
import { FaGlobe, FaMapMarkerAlt } from "react-icons/fa";

type Props = {
  companyName: string;
  logoSrc?: string;
  logoAlt?: string;
  rating?: number;
  address?: string;
  websiteUrl?: string;
  websiteLinkLabel: string;
};

function Stars({ value }: { value: number }) {
  const n = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <div className="flex gap-0.5 text-amber-400" aria-label={`${n} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "text-amber-400" : "text-neutral-300"} aria-hidden>
          ★
        </span>
      ))}
    </div>
  );
}

export function PremiumEmployerTrustCard({
  companyName,
  logoSrc,
  logoAlt,
  rating,
  address,
  websiteUrl,
  websiteLinkLabel,
}: Props) {
  return (
    <aside className="rounded-lg border border-black/[0.06] bg-[color:var(--lx-card)] p-5 shadow-[0_4px_20px_rgba(30,24,16,0.06)] sm:p-6">
      <div className="flex items-start gap-3">
        {logoSrc ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-black/[0.06] bg-white">
            <Image src={logoSrc} alt={logoAlt ?? companyName} fill className="object-cover" sizes="48px" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-neutral-100 text-sm font-bold text-[color:var(--lx-muted)]">
            {companyName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-[color:var(--lx-text)]">{companyName}</p>
          {rating != null ? <div className="mt-1.5"><Stars value={rating} /></div> : null}
        </div>
      </div>

      {address ? (
        <div className="mt-4 flex gap-2 text-sm text-[color:var(--lx-text-2)]">
          <FaMapMarkerAlt className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--lx-muted)]" aria-hidden />
          <span>{address}</span>
        </div>
      ) : null}

      {websiteUrl ? (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#2563EB] hover:underline"
        >
          <FaGlobe className="h-4 w-4 shrink-0" aria-hidden />
          {websiteLinkLabel}
        </a>
      ) : null}
    </aside>
  );
}
