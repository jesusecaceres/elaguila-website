import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { DoorbellAdminClient } from "./DoorbellAdminClient";

export const dynamic = "force-dynamic";

/**
 * Leonix PWA digital doorbell enrollment (Build 12).
 * Protected by admin dashboard layout (leonix_admin cookie).
 */
export default function DigitalContactDoorbellAdminPage() {
  return (
    <div className="min-w-0 max-w-3xl space-y-6 overflow-x-hidden">
      <AdminPageHeader
        eyebrow="Virtual Front Desk"
        title="Leonix Doorbell"
        subtitle="Enable notifications on this device to receive visitor video-call alerts."
        helperText="Push is primary. Email remains a secondary fallback. SMS is a future optional escalation — not required for V1."
      />
      <DoorbellAdminClient />
    </div>
  );
}
