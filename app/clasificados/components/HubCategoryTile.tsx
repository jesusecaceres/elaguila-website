import { cx } from "../lib/cx";

export function HubCategoryTile({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <a
      href={href}
      className={cx(
        "group block rounded-2xl border border-[#C9B46A]/70 bg-[#F5F5F5] backdrop-blur",
        "hover:bg-[#F5F5F5] transition"
      )}
    >
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-bold text-[#111111]">{label}</div>
            <div className="mt-1 text-sm text-[#111111]">{hint}</div>
          </div>
          <span className="shrink-0 text-[#111111] group-hover:text-[#111111] transition" aria-hidden>
            →
          </span>
        </div>
      </div>
    </a>
  );
}
