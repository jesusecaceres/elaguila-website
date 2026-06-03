"use client";

import type { ReactNode } from "react";
import Navbar from "@/app/components/Navbar";
import { CATEGORY_STANDARD_MAIN, CATEGORY_STANDARD_PAGE_BG } from "./categoryStandardTheme";

type Props = {
  children: ReactNode;
  /** Default max-w-6xl; narrow lanes (busco/mascotas) can pass max-w-3xl */
  maxWidthClass?: string;
};

/**
 * Results pages: cream background, no scenic hero band — listings-first layout.
 */
export function CategoryStandardResultsPageShell({
  children,
  maxWidthClass = "max-w-6xl",
}: Props) {
  return (
    <div className={CATEGORY_STANDARD_PAGE_BG}>
      <Navbar />
      <div
        className={`relative mx-auto w-full min-w-0 px-4 pb-12 pt-20 sm:px-6 lg:px-8 ${maxWidthClass}`}
      >
        {children}
      </div>
    </div>
  );
}
