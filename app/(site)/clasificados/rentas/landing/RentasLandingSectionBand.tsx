import type { ReactNode } from "react";
import { rentasDiscoveryBandClass, rentasSectionHeadingMutedClass } from "@/app/clasificados/rentas/rentasLandingTheme";

type Props = {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function RentasLandingSectionBand({ id, title, description, action, children }: Props) {
  return (
    <section className="mt-16 scroll-mt-28 sm:mt-[4.75rem]" aria-labelledby={id}>
      <div className={rentasDiscoveryBandClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <h2 id={id} className={rentasSectionHeadingMutedClass}>
              {title}
            </h2>
            {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4A4338]/90">{description}</p> : null}
          </div>
          {action ? <div className="flex w-full shrink-0 justify-start sm:w-auto sm:justify-end sm:pb-0.5">{action}</div> : null}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
