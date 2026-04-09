import type { QuickJobLocationBlock } from "../../data/empleoQuickJobSampleData";

type Props = {
  location: QuickJobLocationBlock;
  sectionTitle: string;
  ctaLabel: string;
  onOpen: () => void;
};

export function QuickJobLocationCard({ location, sectionTitle, ctaLabel, onOpen }: Props) {
  const fullLine = `${location.city}, ${location.state} ${location.zip}`.trim();
  return (
    <section className="rounded-lg border border-black/[0.06] bg-white p-5 shadow-[0_4px_24px_rgba(30,24,16,0.06)] sm:p-6">
      <h2 className="text-base font-bold text-[color:var(--lx-text)]">{sectionTitle}</h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <address className="min-w-0 not-italic text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          <p className="font-semibold text-[color:var(--lx-text)]">{location.businessLine}</p>
          <p className="mt-1">{location.addressLine1}</p>
          <p className="mt-0.5">{fullLine}</p>
        </address>
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 rounded-lg border border-black/[0.1] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:bg-neutral-50 sm:min-w-[10rem]"
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
