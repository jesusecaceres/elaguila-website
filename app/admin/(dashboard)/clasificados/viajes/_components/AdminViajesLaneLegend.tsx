import { adminCardBase } from "@/app/admin/_components/adminTheme";

const LANES: { title: string; body: string; tone: string }[] = [
  {
    title: "Affiliate cards",
    body: "Partner-managed inventory curated in Admin. Always disclosed as a commercial partner on public cards — never disguised as a user listing.",
    tone: "border-amber-200/90 bg-amber-50/80",
  },
  {
    title: "Business offers",
    body: "Agency/operator submissions from the approved business branch. Moderation, trust signals, and profile linkage live here — separate tooling from affiliate authoring.",
    tone: "border-sky-200/90 bg-sky-50/70",
  },
  {
    title: "Editorial / guides",
    body: "Leonix-owned discovery and storytelling. Distinct from partner deals and operator listings; powers ideas, seasonal narratives, and education.",
    tone: "border-violet-200/90 bg-violet-50/70",
  },
];

export function AdminViajesLaneLegend() {
  return (
    <div className="mb-6 grid gap-3 md:grid-cols-3">
      {LANES.map((lane) => (
        <div key={lane.title} className={`${adminCardBase} border p-4 ${lane.tone}`}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#5C5346]">{lane.title}</p>
          <p className="mt-2 text-xs leading-relaxed text-[#2C2416]">{lane.body}</p>
        </div>
      ))}
    </div>
  );
}
