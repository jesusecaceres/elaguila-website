import { FaBriefcase, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";

type Props = {
  title: string;
  dateLine: string;
  timeLine?: string;
  venue: string;
  cityStateLine: string;
  organizer?: string;
  organizerUrl?: string;
  organizedByLabel: string;
};

export function JobFairInfoSection({
  title,
  dateLine,
  timeLine,
  venue,
  cityStateLine,
  organizer,
  organizerUrl,
  organizedByLabel,
}: Props) {
  const dateDisplay = timeLine ? `${dateLine} · ${timeLine}` : dateLine;

  return (
    <section className="min-w-0">
      <h1 className="text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl">{title}</h1>
      <div className="mt-6 space-y-4 text-sm text-[color:var(--lx-text-2)] sm:text-base">
        <div className="flex gap-3">
          <FaCalendarAlt className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" aria-hidden />
          <span>{dateDisplay}</span>
        </div>
        <div className="flex gap-3">
          <FaMapMarkerAlt className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" aria-hidden />
          <span>{venue}</span>
        </div>
        <div className="flex gap-3">
          <FaMapMarkerAlt className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" aria-hidden />
          <span>{cityStateLine}</span>
        </div>
        {organizer ? (
          <div className="flex gap-3">
            <FaBriefcase className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" aria-hidden />
            <span>
              {organizedByLabel}{" "}
              {organizerUrl ? (
                <a
                  href={organizerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  {organizer}
                </a>
              ) : (
                <span className="font-semibold text-[color:var(--lx-text)]">{organizer}</span>
              )}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
