import { PublishAuthGateLayout } from "@/app/components/auth/PublishAuthGateLayout";

export default function AutosPagoLayout({ children }: { children: React.ReactNode }) {
  return <PublishAuthGateLayout>{children}</PublishAuthGateLayout>;
}
