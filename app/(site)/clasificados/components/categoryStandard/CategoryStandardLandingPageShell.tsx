"use client";

import type { ReactNode } from "react";
import { CATEGORY_STANDARD_MAIN, CATEGORY_STANDARD_PAGE_BG } from "./categoryStandardTheme";

type Props = {
  children: ReactNode;
  maxWidthClass?: string;
};

/** Category landing pages — cream Leonix shell (site layout provides global Navbar). */
export function CategoryStandardLandingPageShell({
  children,
  maxWidthClass = "max-w-6xl",
}: Props) {
  return (
    <div className={CATEGORY_STANDARD_PAGE_BG}>
      <main className={`${CATEGORY_STANDARD_MAIN} ${maxWidthClass}`}>{children}</main>
    </div>
  );
}
