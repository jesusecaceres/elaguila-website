"use client";

import type { ReactNode } from "react";
import { AdminActionProofBanner } from "@/app/admin/_components/AdminActionProofBanner";
import { AdminQueueScrollRestore } from "@/app/admin/_components/AdminQueueScrollRestore";

/** Proof banner + scroll restore for classified admin queue pages. */
export function ClasificadosQueueActionChrome({ children }: { children?: ReactNode }) {
  return (
    <>
      <AdminActionProofBanner />
      {children}
      <AdminQueueScrollRestore />
    </>
  );
}
