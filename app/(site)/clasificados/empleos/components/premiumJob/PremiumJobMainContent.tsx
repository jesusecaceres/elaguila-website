import { richLineParts } from "./richTextLine";
import { PremiumEmployerTrustCard } from "./PremiumEmployerTrustCard";

type Props = {
  introduction: string;
  responsibilities: string[];
  companyOverview?: string;
  companyName: string;
  logoSrc?: string;
  logoAlt?: string;
  employerAddress?: string;
  websiteUrl?: string;
  trustWebsiteLabel: string;
  headings: {
    responsibilities: string;
    company: string;
  };
};

export function PremiumJobMainContent({
  introduction,
  responsibilities,
  companyOverview,
  companyName,
  logoSrc,
  logoAlt,
  employerAddress,
  websiteUrl,
  trustWebsiteLabel,
  headings,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-7">
        <p className="text-sm leading-relaxed text-[#4A4744] sm:text-base">{introduction}</p>

        {responsibilities.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-[#2A2826]">{headings.responsibilities}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#4A4744] sm:text-base">
              {responsibilities.map((line) => (
                <li key={line}>{richLineParts(line)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {companyOverview ? (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-[#2A2826]">{headings.company}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4A4744] sm:text-base">{companyOverview}</p>
          </div>
        ) : null}
      </div>

      <div className="lg:col-span-5">
        <PremiumEmployerTrustCard
          companyName={companyName}
          logoSrc={logoSrc}
          logoAlt={logoAlt}
          address={employerAddress}
          websiteUrl={websiteUrl}
          websiteLinkLabel={trustWebsiteLabel}
        />
      </div>
    </div>
  );
}
