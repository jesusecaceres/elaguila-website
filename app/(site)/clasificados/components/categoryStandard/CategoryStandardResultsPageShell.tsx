"use client";

import type { ReactNode } from "react";
import { CATEGORY_STANDARD_MAIN, CATEGORY_STANDARD_PAGE_BG } from "./categoryStandardTheme";

type Props = {
  children: ReactNode;
  /** Default 1080px; narrow lanes (busco/mascotas) can pass max-w-3xl */
  maxWidthClass?: string;
};

/**
 * Results pages: cream background, no scenic hero band — listings-first layout.
 * Site `(site)/layout` provides the global Navbar.
 */
export function CategoryStandardResultsPageShell({
  children,
  maxWidthClass = "max-w-[1080px]",
}: Props) {
  return (
    <div className={CATEGORY_STANDARD_PAGE_BG}>
      <div className={`${CATEGORY_STANDARD_MAIN} ${maxWidthClass}`}>{children}</div>
    </div>
  );
}
