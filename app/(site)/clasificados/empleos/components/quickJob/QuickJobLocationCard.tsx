import type { QuickJobLocationBlock } from "../../data/empleoQuickJobSampleData";

type Props = {
  location: QuickJobLocationBlock;
  sectionTitle: string;
  ctaLabel: string;
  onOpen: () => void;
};

export function QuickJobLocationCard({ location, sectionTitle, ctaLabel, onOpen }: Props) {
  const locality = [location.city, location.state, location.country].filter((x) => (x ?? "").trim()).join(", ");
  const fullLine = [locality, location.zip].filter((x) => (x ?? "").trim()).join(" · ");
  return (
    <section className="rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-5 shadow-[0_8px_28px_rgba(42,40,38,0.06)] sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8A5A18]">{sectionTitle}</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <address className="min-w-0 not-italic text-sm leading-relaxed text-[#4A4744]">
          <p className="font-semibold text-[#2A2826]">{location.businessLine}</p>
          {location.addressLine1 ? <p className="mt-1">{location.addressLine1}</p> : null}
          {location.addressLine2 ? <p className="mt-0.5">{location.addressLine2}</p> : null}
          <p className="mt-0.5">{fullLine}</p>
        </address>
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 rounded-[12px] border border-[#C9A85A]/60 bg-[#FFF8ED] px-4 py-2.5 text-sm font-semibold text-[#6B5320] shadow-sm transition hover:bg-[#FFF0D8] sm:min-w-[10rem]"
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
