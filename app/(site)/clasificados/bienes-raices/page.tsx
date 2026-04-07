import type { Metadata } from "next";
import { BienesRaicesLandingHub } from "./BienesRaicesLandingHub";

export const metadata: Metadata = {
  title: "Bienes Raíces | Leonix Clasificados",
  description:
    "Encuentra casas, departamentos, terrenos y espacios comerciales con claridad y confianza.",
};

export default function BienesRaicesCategoryPage() {
  return <BienesRaicesLandingHub />;
}
