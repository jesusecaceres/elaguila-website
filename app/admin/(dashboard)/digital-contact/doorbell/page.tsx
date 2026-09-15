import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { adminCtaChip, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
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
      <AdminPagePurposeCard
        title="How the Virtual Front Desk works"
        purpose="A visitor at /visitanos requests a video call. This page enrolls YOUR device to be notified (push, Samsung/Android-first) so you can join. Fallback contact — WhatsApp, phone, text, email — always remains available to the visitor and comes from each staff member's Executive Hub profile, not from a separate config here."
        dataSource="Push subscriptions live in Supabase; contact destinations (WhatsApp/phone/email) come from Executive Hub records, not this page."
        status="real"
        safeActions={["Enable notifications on this device", "View the live visitor page", "Set a temporary AVAILABLE/BUSY/AWAY status"]}
        nextGate="Outside 9am–5pm Pacific office hours, the video request is shown as informational rather than active — the visitor still sees the fallback contact options."
        warningNote="Google Meet / Microsoft Teams / FaceTime links (when a staff member adds one in Executive Hub) are a secondary, emergency fallback only — never the primary doorbell path. There is no System Health check for this system today."
      />
      <div className="flex flex-wrap gap-2">
        <Link href="/visitanos" target="_blank" rel="noreferrer" className={`${adminCtaChip} inline-flex`}>
          View live visitor page (/visitanos) ↗
        </Link>
        <Link href="/admin/digital-contact/presence" className={`${adminCtaChipSecondary} inline-flex`}>
          Set my temporary presence status →
        </Link>
        <Link href="/admin/team/executive-hub" className={`${adminCtaChipSecondary} inline-flex`}>
          Manage contact info (Executive Hub) →
        </Link>
      </div>
      <DoorbellAdminClient />
    </div>
  );
}
