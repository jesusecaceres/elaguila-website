import { PublishAuthGateLayout } from "@/app/components/auth/PublishAuthGateLayout";

export default function AutosPrivadoPreviewLayout({ children }: { children: React.ReactNode }) {
  return <PublishAuthGateLayout>{children}</PublishAuthGateLayout>;
}
