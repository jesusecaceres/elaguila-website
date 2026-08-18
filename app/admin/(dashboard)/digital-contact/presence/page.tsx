import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { ExecutivePresenceAdminClient } from "./ExecutivePresenceAdminClient";

export const dynamic = "force-dynamic";

/**
 * Minimal authorized presence write surface (Build 04).
 * Protected by admin dashboard layout (leonix_admin cookie).
 * Not exposed on /visitanos or public routes.
 */
export default function DigitalContactPresenceAdminPage() {
  return (
    <div className="min-w-0 max-w-3xl space-y-6 overflow-x-hidden">
      <AdminPageHeader
        eyebrow="Executive Contact"
        title="Temporary presence"
        subtitle="Set a short-lived AVAILABLE / BUSY / AWAY status for Human Connection video eligibility."
        helperText="Every status expires. Do not invent availability. Video still requires a configured provider and allowVideo."
      />
      <ExecutivePresenceAdminClient />
    </div>
  );
}
