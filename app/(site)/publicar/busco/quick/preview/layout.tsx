import { PublishAuthGateLayout } from "@/app/components/auth/PublishAuthGateLayout";

export default function BuscoQuickPreviewLayout({ children }: { children: React.ReactNode }) {
  return <PublishAuthGateLayout>{children}</PublishAuthGateLayout>;
}
