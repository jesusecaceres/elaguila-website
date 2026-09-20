import { PublishAuthGateLayout } from "@/app/components/auth/PublishAuthGateLayout";

export default function ViajesPreviewLayout({ children }: { children: React.ReactNode }) {
  return <PublishAuthGateLayout>{children}</PublishAuthGateLayout>;
}
