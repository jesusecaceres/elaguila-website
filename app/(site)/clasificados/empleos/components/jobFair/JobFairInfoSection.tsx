import { FaBriefcase, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";

type Props = {
  title: string;
  dateLine: string;
  timeLine?: string;
  venue: string;
  addressLine1?: string;
  addressLine2?: string;
  cityStateLine: string;
  organizer?: string;
  organizerUrl?: string;
  organizedByLabel: string;
  filterRegionFootnote?: string;
  freeLabel?: string;
};

export function JobFairInfoSection({
  title,
  dateLine,
  timeLine,
  venue,
  addressLine1,
  addressLine2,
  cityStateLine,
  organizer,
  organizerUrl,
  organizedByLabel,
  filterRegionFootnote,
  freeLabel,
}: Props) {
  const dateDisplay = timeLine ? `${dateLine} · ${timeLine}` : dateLine;

  return (
    <section className="min-w-0">
      {freeLabel ? (
        <span className="mb-3 inline-flex rounded-full border border-[#2E7D4A]/30 bg-[#E8F5EE] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-[#1E4D33]">
          {freeLabel}
        </span>
      ) : null}
      <h1 className="text-3xl font-bold tracking-tight text-[#2A2826] sm:text-4xl">{title}</h1>
      <div className="mt-6 space-y-4 text-base text-[#4A4744] sm:text-lg">
        <div className="flex gap-3">
          <FaCalendarAlt className="mt-0.5 h-5 w-5 shrink-0 text-[#B8943F]" aria-hidden />
          <span className="font-semibold">{dateDisplay}</span>
        </div>
        <div className="flex gap-3">
          <FaMapMarkerAlt className="mt-0.5 h-5 w-5 shrink-0 text-[#B8943F]" aria-hidden />
          <div>
            <span className="font-medium">{venue}</span>
            {addressLine1 ? <p className="mt-1 text-sm text-[#5C564E]">{addressLine1}</p> : null}
            {addressLine2 ? <p className="mt-0.5 text-sm text-[#5C564E]">{addressLine2}</p> : null}
          </div>
        </div>
        <div className="flex gap-3">
          <FaMapMarkerAlt className="mt-0.5 h-5 w-5 shrink-0 text-[#7A8899]" aria-hidden />
          <div>
            <span>{cityStateLine}</span>
            {filterRegionFootnote ? (
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#7A8899]">{filterRegionFootnote}</p>
            ) : null}
          </div>
        </div>
        {organizer ? (
          <div className="flex gap-3">
            <FaBriefcase className="mt-0.5 h-5 w-5 shrink-0 text-[#B8943F]" aria-hidden />
            <span>
              {organizedByLabel}{" "}
              {organizerUrl ? (
                <a
                  href={organizerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#6B5320] underline-offset-2 hover:underline"
                >
                  {organizer}
                </a>
              ) : (
                <span className="font-semibold text-[#2A2826]">{organizer}</span>
              )}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
