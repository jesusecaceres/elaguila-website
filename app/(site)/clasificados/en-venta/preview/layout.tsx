import { PublishAuthGateLayout } from "@/app/components/auth/PublishAuthGateLayout";

export default function EnVentaPreviewLayout({ children }: { children: React.ReactNode }) {
  return <PublishAuthGateLayout>{children}</PublishAuthGateLayout>;
}
