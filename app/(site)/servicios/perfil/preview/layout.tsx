import { PublishAuthGateLayout } from "@/app/components/auth/PublishAuthGateLayout";

export default function ServiciosPerfilPreviewLayout({ children }: { children: React.ReactNode }) {
  return <PublishAuthGateLayout>{children}</PublishAuthGateLayout>;
}
