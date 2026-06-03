import type { Metadata } from "next";
import { PublishAuthGateLayout } from "@/app/components/auth/PublishAuthGateLayout";

export const metadata: Metadata = {
  title: "Vista previa — Bienes Raíces | Leonix",
  description: "Vista previa Negocio o Privado; el borrador viene del publicador.",
  robots: { index: false, follow: false },
};

export default function BienesRaicesPreviewHubLayout({ children }: { children: React.ReactNode }) {
  return <PublishAuthGateLayout>{children}</PublishAuthGateLayout>;
}
