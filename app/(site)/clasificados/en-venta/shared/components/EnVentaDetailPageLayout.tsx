"use client";

import type { ReactNode } from "react";

type Props = {
  gallery: ReactNode;
  hero: ReactNode;
  sidebar: ReactNode;
  content: ReactNode;
};

/**
 * Shared Varios (en-venta) detail grid for public listing + seller preview.
 *
 * xl+: gallery (7) + hero (5) on row 1; sticky contact sidebar (4) on the right;
 *      description/facts/delivery span cols 1–8 on row 2.
 * lg:  gallery + hero side-by-side; sidebar + content stack full-width below.
 * mobile: gallery → hero → sidebar → content.
 */
export function EnVentaDetailPageLayout({ gallery, hero, sidebar, content }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-8">
      <div className="order-1 min-w-0 lg:col-span-7 lg:row-start-1 xl:col-span-7">{gallery}</div>
      <div className="order-2 min-w-0 lg:col-span-5 lg:row-start-1 xl:col-span-5">{hero}</div>
      <aside className="order-3 min-w-0 lg:col-span-12 lg:row-start-2 xl:col-span-4 xl:col-start-9 xl:row-span-2 xl:row-start-1">
        <div className="flex flex-col gap-3 xl:sticky xl:top-[calc(6.5rem+1px)]">{sidebar}</div>
      </aside>
      <div className="order-4 min-w-0 lg:col-span-12 lg:row-start-3 xl:col-span-8 xl:col-start-1 xl:row-start-2">
        {content}
      </div>
    </div>
  );
}
