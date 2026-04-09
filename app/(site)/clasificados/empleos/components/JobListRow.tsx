import { FaBroom, FaCode, FaHeadset, FaTruck } from "react-icons/fa";
import type { LatestJobSample } from "../data/empleosResultsSampleData";

type Props = {
  job: LatestJobSample;
};

function RowIcon({ kind }: { kind: LatestJobSample["icon"] }) {
  const className = "h-4 w-4 text-[#2563EB]";
  switch (kind) {
    case "truck":
      return <FaTruck className={className} aria-hidden />;
    case "headset":
      return <FaHeadset className={className} aria-hidden />;
    case "code":
      return <FaCode className={className} aria-hidden />;
    case "clean":
      return <FaBroom className={className} aria-hidden />;
    default:
      return null;
  }
}

const ctaClasses: Record<LatestJobSample["ctaVariant"], string> = {
  red: "border border-[#C41E3A] bg-[#C41E3A] text-white hover:bg-[#A01830]",
  green: "border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700",
  blue: "border border-[#2563EB] bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
};

export function JobListRow({ job }: Props) {
  return (
    <div className="flex flex-col gap-4 border-b border-black/[0.06] py-5 last:border-b-0 sm:flex-row sm:items-center sm:gap-6 sm:py-6">
      <div
        className="flex shrink-0 items-start justify-center pt-0.5 sm:w-10 sm:justify-center"
        aria-hidden
      >
        <RowIcon kind={job.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold text-[color:var(--lx-text)]">{job.title}</h3>
        <p className="mt-0.5 text-sm font-semibold text-[#2563EB]">{job.company}</p>
        <p className="mt-0.5 text-xs text-[color:var(--lx-muted)]">{job.location}</p>
        <p className="mt-1 text-sm font-bold text-[#B91C1C]">{job.pay}</p>
        <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">{job.snippet}</p>
      </div>
      <div className="flex shrink-0 justify-end sm:w-36 sm:justify-end">
        <button
          type="button"
          className={`min-h-11 w-full rounded-lg px-4 text-sm font-semibold shadow-sm transition sm:w-auto ${ctaClasses[job.ctaVariant]}`}
        >
          {job.ctaLabel}
        </button>
      </div>
    </div>
  );
}
