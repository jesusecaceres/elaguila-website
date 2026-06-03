"use client";

import type { ReactNode } from "react";
import Navbar from "@/app/components/Navbar";
import { CATEGORY_STANDARD_MAIN, CATEGORY_STANDARD_PAGE_BG } from "./categoryStandardTheme";

type Props = {
  children: ReactNode;
  maxWidthClass?: string;
};

/** Category landing pages — cream Leonix shell with navbar. */
export function CategoryStandardLandingPageShell({
  children,
  maxWidthClass = "max-w-6xl",
}: Props) {
  return (
    <div className={CATEGORY_STANDARD_PAGE_BG}>
      <Navbar />
      <main className={`${CATEGORY_STANDARD_MAIN} pb-12 ${maxWidthClass}`}>{children}</main>
    </div>
  );
}
