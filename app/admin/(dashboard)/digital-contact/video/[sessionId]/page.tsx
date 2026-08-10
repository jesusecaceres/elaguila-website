import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { getVideoSession } from "@/app/lib/digitalContact/humanConnection/sessionStoreServer";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { HostVideoJoinClient } from "./HostVideoJoinClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

/**
 * Authorized host join surface — never expose provider host tokens to anonymous visitors.
 * Protected by admin dashboard layout + leonix_admin cookie.
 */
export default async function DigitalContactHostVideoPage(props: PageProps) {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    redirect("/admin/login");
  }

  const { sessionId: raw } = await props.params;
  const sessionId = decodeURIComponent(String(raw ?? "").trim());
  if (!sessionId || sessionId.length > 128) notFound();

  const session = await getVideoSession(sessionId);
  if (!session) {
    return (
      <div className="min-w-0 max-w-xl space-y-4">
        <AdminPageHeader
          eyebrow="Human Connection"
          title="Video session unavailable"
          subtitle="This ephemeral session expired, was revoked, or was never created."
        />
        <p className="text-sm text-[#5C5346]">
          Ask the visitor to use Call / WhatsApp / SMS / Email, or request a new video session from
          /visitanos.
        </p>
      </div>
    );
  }

  const expired = Date.parse(session.expiresAt) <= Date.now();
  if (expired) {
    return (
      <div className="min-w-0 max-w-xl space-y-4">
        <AdminPageHeader
          eyebrow="Human Connection"
          title="Video session expired"
          subtitle={`Session for ${session.profileSlug} is no longer joinable.`}
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-xl space-y-4">
      <AdminPageHeader
        eyebrow="Human Connection"
        title="Join visitor video"
        subtitle={`Executive: ${session.profileSlug} · expires ${new Date(session.expiresAt).toLocaleString()}`}
        helperText="Host-only join. Do not share this page or the provider link with visitors."
      />
      <HostVideoJoinClient hostJoinUrl={session.hostProviderJoinUrl} expiresAt={session.expiresAt} />
    </div>
  );
}
