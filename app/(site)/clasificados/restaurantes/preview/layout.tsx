import { PublishAuthGateLayout } from "@/app/components/auth/PublishAuthGateLayout";

export default function RestaurantesPreviewLayout({ children }: { children: React.ReactNode }) {
  return <PublishAuthGateLayout>{children}</PublishAuthGateLayout>;
}
