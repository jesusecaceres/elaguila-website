import type { Metadata } from "next";
import { Suspense } from "react";
import { BienesRaicesLandingHub } from "./BienesRaicesLandingHub";

export const metadata: Metadata = {
  title: "Bienes Raíces | Leonix Clasificados",
  description:
    "Encuentra casas, departamentos, terrenos y espacios comerciales con claridad y confianza.",
};

export default function BienesRaicesCategoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <BienesRaicesLandingHub />
    </Suspense>
  );
}
