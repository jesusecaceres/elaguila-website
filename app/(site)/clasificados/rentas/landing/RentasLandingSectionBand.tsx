import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function RentasLandingSectionBand({ id, title, description, action, children }: Props) {
  return (
    <section className="mt-14 sm:mt-16" aria-labelledby={id}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 id={id} className="font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.85rem]">
            {title}
          </h2>
          {description ? <p className="mt-2 max-w-2xl text-sm text-[#5C5346]/88">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
