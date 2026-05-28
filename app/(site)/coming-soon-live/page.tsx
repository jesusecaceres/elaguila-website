import type { Metadata } from "next";
import { LeonixComingSoonView } from "@/app/components/leonix/LeonixComingSoonView";
import { leonixPageTitle } from "@/app/lib/leonixBrand";

export const metadata: Metadata = {
  title: leonixPageTitle("Próximamente — Vista previa"),
  description:
    "Vista previa en vivo de Leonix Media: revista premium, visibilidad digital y herramientas para la comunidad latina.",
  robots: { index: false, follow: false },
};

export default function ComingSoonLivePage() {
  return <LeonixComingSoonView mode="page" />;
}
