import type { QuickJobRelatedCard } from "../../data/empleoQuickJobSampleData";
import { QuickJobMoreJobCard } from "./QuickJobMoreJobCard";

type Props = {
  title: string;
  jobs: QuickJobRelatedCard[];
  ctaLabel: string;
};

export function QuickJobMoreJobsSection({ title, jobs, ctaLabel }: Props) {
  if (!jobs.length) return null;
  return (
    <section className="mt-12" aria-labelledby="empleos-mas-empleos-heading">
      <h2
        id="empleos-mas-empleos-heading"
        className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] sm:text-xl"
      >
        {title}
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {jobs.map((job) => (
          <QuickJobMoreJobCard key={job.id} job={job} ctaLabel={ctaLabel} />
        ))}
      </div>
    </section>
  );
}
