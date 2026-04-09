import Image from "next/image";
import type { QuickJobRelatedCard } from "../../data/empleoQuickJobSampleData";

type Props = {
  job: QuickJobRelatedCard;
  ctaLabel: string;
};

export function QuickJobMoreJobCard({ job, ctaLabel }: Props) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-black/[0.06] bg-white shadow-[0_2px_16px_rgba(30,24,16,0.06)]">
      <div className="relative aspect-[16/10] w-full bg-neutral-200">
        <Image
          src={job.imageSrc}
          alt={job.imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="text-sm font-bold leading-snug text-[color:var(--lx-text)]">{job.title}</h3>
        <p className="mt-1 text-xs font-semibold text-[#2563EB]">{job.businessName}</p>
        <p className="mt-0.5 text-[11px] text-[color:var(--lx-muted)]">{job.location}</p>
        <p className="mt-2 text-xs font-semibold text-[#B91C1C]">
          {job.pay}
          <span className="font-normal text-[color:var(--lx-muted)]"> · {job.jobType}</span>
        </p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="min-h-9 rounded-md bg-[#C41E3A] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[#A01830]"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
