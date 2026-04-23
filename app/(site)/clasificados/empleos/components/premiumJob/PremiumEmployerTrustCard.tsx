import Image from "next/image";
import { FaGlobe, FaMapMarkerAlt } from "react-icons/fa";

type Props = {
  companyName: string;
  logoSrc?: string;
  logoAlt?: string;
  address?: string;
  websiteUrl?: string;
  websiteLinkLabel: string;
};

export function PremiumEmployerTrustCard({
  companyName,
  logoSrc,
  logoAlt,
  address,
  websiteUrl,
  websiteLinkLabel,
}: Props) {
  return (
    <aside className="rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-5 shadow-[0_10px_32px_rgba(42,40,38,0.06)] sm:p-6">
      <div className="flex items-start gap-3">
        {logoSrc ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#E8DFD0] bg-white">
            <Image src={logoSrc} alt={logoAlt ?? companyName} fill className="object-cover" sizes="56px" />
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2] text-base font-bold text-[#7A756E]">
            {companyName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#7A8899]">Empresa</p>
          <p className="mt-1 text-lg font-bold text-[#2A2826]">{companyName}</p>
        </div>
      </div>

      {address ? (
        <div className="mt-4 flex gap-2 text-sm text-[#4A4744]">
          <FaMapMarkerAlt className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8899]" aria-hidden />
          <span>{address}</span>
        </div>
      ) : null}

      {websiteUrl ? (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#6B5320] underline-offset-2 hover:underline"
        >
          <FaGlobe className="h-4 w-4 shrink-0" aria-hidden />
          {websiteLinkLabel}
        </a>
      ) : null}
    </aside>
  );
}
