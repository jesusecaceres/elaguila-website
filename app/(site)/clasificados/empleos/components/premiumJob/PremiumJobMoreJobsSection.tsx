import type { PremiumMoreJobCard } from "../../data/empleoPremiumJobSampleData";
import { PremiumJobMoreJobCard } from "./PremiumJobMoreJobCard";

type Props = {
  title: string;
  jobs: PremiumMoreJobCard[];
  ctaLabel: string;
};

export function PremiumJobMoreJobsSection({ title, jobs, ctaLabel }: Props) {
  if (!jobs.length) return null;
  return (
    <section className="mt-12" aria-labelledby="premium-mas-empleos-heading">
      <h2
        id="premium-mas-empleos-heading"
        className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] sm:text-xl"
      >
        {title}
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {jobs.map((job) => (
          <PremiumJobMoreJobCard key={job.id} job={job} ctaLabel={ctaLabel} />
        ))}
      </div>
    </section>
  );
}
