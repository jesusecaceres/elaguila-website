import { PublishAuthGateLayout } from "@/app/components/auth/PublishAuthGateLayout";

export default function AutosNegociosPreviewLayout({ children }: { children: React.ReactNode }) {
  return <PublishAuthGateLayout>{children}</PublishAuthGateLayout>;
}
