import Image from "next/image";
import type { FeaturedJobSample } from "../data/empleosResultsSampleData";

type Props = {
  job: FeaturedJobSample;
};

const ctaClasses: Record<FeaturedJobSample["ctaVariant"], string> = {
  red: "bg-[#C41E3A] text-white hover:bg-[#A01830]",
  green: "bg-emerald-600 text-white hover:bg-emerald-700",
};

export function FeaturedJobCard({ job }: Props) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(30,24,16,0.08)]">
      <div className="relative aspect-[16/10] w-full shrink-0 bg-neutral-200">
        <Image
          src={job.imageSrc}
          alt={job.imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {job.destacado ? (
          <span className="absolute left-3 top-3 rounded bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-900 shadow-sm">
            Destacado
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold leading-snug text-[color:var(--lx-text)]">{job.title}</h3>
        <p className="mt-1 text-sm font-semibold text-[#2563EB]">{job.company}</p>
        <p className="mt-0.5 text-xs text-[color:var(--lx-muted)]">{job.location}</p>
        <p className="mt-2 text-sm font-bold text-[#B91C1C]">{job.pay}</p>
        <p className="mt-1 text-xs text-[color:var(--lx-text-2)]">{job.schedule}</p>
        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">
          {job.summary}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className={`min-h-11 min-w-[6.5rem] rounded-lg px-4 text-sm font-semibold shadow-sm transition ${ctaClasses[job.ctaVariant]}`}
          >
            {job.ctaLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
