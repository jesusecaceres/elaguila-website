import { PublishAuthGateLayout } from "@/app/components/auth/PublishAuthGateLayout";

export default function RentasPreviewLayout({ children }: { children: React.ReactNode }) {
  return <PublishAuthGateLayout>{children}</PublishAuthGateLayout>;
}
