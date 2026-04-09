import { FaCheck } from "react-icons/fa";

type Props = {
  title: string;
  items: string[];
};

export function JobFairSecondaryDetails({ title, items }: Props) {
  if (!items.length) return null;
  return (
    <section className="mt-8 rounded-lg border border-dashed border-black/[0.1] bg-white/60 p-5 sm:p-6">
      <h2 className="text-base font-bold text-[color:var(--lx-text)]">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm text-[color:var(--lx-text-2)]">
            <FaCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
