import type { ReactNode } from "react";
import { cx } from "../helpers/cx";

export function SectionShell({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("rounded-2xl border border-black/10 bg-[#F8F8F8] p-5 sm:p-6", className)}>
      <header className="mb-4 border-b border-black/10 pb-3">
        <h2 className="text-lg font-extrabold tracking-tight text-[#111111]">{title}</h2>
        {description ? <p className="mt-1 text-sm text-[#111111]/75">{description}</p> : null}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}
