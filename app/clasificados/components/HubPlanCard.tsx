import { cx } from "../lib/cx";

export function HubPlanCard({
  title,
  price,
  bullets,
  accent,
}: {
  title: string;
  price?: string;
  bullets: readonly string[];
  accent?: "gold" | "strong";
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border bg-[#F5F5F5] backdrop-blur p-6",
        accent === "gold" && "border-yellow-500/25",
        accent === "strong" && "border-yellow-500/40 bg-[#F8F6F0]"
      )}
    >
      <div className="text-xl font-bold text-[#111111]">{title}</div>
      {price ? (
        <div className="mt-1 text-sm font-semibold text-[#111111]">{price}</div>
      ) : null}
      <ul className="mt-4 space-y-2 text-sm text-[#111111]">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#111111]/70 shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
