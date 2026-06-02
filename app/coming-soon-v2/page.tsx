import type { Metadata } from "next";
import { ComingSoonV2Shell } from "@/app/components/leonix/coming-soon-v2/ComingSoonV2Shell";
import { leonixPageTitle } from "@/app/lib/leonixBrand";

export const metadata: Metadata = {
  title: leonixPageTitle("Lanzamiento V2 — Capa 1"),
  description: "Vista previa de la base Leonix Media — capa 1 (shell y encabezado).",
  robots: { index: false, follow: false },
};

export default function ComingSoonV2Page() {
  return <ComingSoonV2Shell />;
}
