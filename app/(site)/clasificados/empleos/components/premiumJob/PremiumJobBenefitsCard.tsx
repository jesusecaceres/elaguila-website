type Props = {
  title: string;
  items: string[];
};

/** Lower-column “Ofrecemos” block (benefits / perks). */
export function PremiumJobBenefitsCard({ title, items }: Props) {
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(30,24,16,0.05)] sm:p-6">
      <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{title}</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
