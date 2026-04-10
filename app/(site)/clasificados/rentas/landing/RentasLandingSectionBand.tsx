import type { ReactNode } from "react";
import { rentasSectionHeadingMutedClass } from "@/app/clasificados/rentas/rentasLandingTheme";

type Props = {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function RentasLandingSectionBand({ id, title, description, action, children }: Props) {
  return (
    <section className="mt-14 scroll-mt-24 sm:mt-[4.25rem]" aria-labelledby={id}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 id={id} className={rentasSectionHeadingMutedClass}>
            {title}
          </h2>
          {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4A4338]/90">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0 pb-0.5">{action}</div> : null}
      </div>
      <div className="mt-9">{children}</div>
    </section>
  );
}
