import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "../../../../_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "../../../../_components/adminTheme";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  approveChurchAction,
  deactivateChurchAction,
  rejectChurchAction,
  saveChurchEssentialsAction,
} from "@/app/admin/iglesiasChurchActions";

export const dynamic = "force-dynamic";

export default async function AdminIglesiasChurchPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string }>;
}) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  if (!isSupabaseAdminConfigured()) notFound();
  const admin = getAdminSupabase();
  const { data: church } = await admin.from("churches").select("*").eq("id", id).maybeSingle();
  if (!church) notFound();

  const [{ data: services }, { data: ministries }, { data: media }, { data: submission }] = await Promise.all([
    admin.from("church_services").select("*").eq("church_id", id).order("sort_order"),
    admin.from("church_ministries").select("*").eq("church_id", id).order("sort_order"),
    admin.from("church_media").select("*").eq("church_id", id).order("sort_order"),
    admin.from("church_submissions").select("*").eq("church_id", id).maybeSingle(),
  ]);

  const publicReady = church.approval_status === "approved" && church.is_active && church.published_at;

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Iglesias"
        title={String(church.name)}
        subtitle={`Slug: ${church.slug}. Public only when approved + active + published.`}
        rightSlot={
          <Link href="/admin/workspace/iglesias" className={adminBtnSecondary}>
            ← Queue
          </Link>
        }
      />
      {sp.saved === "1" ? <div className={`${adminCardBase} border-emerald-200 bg-emerald-50 p-4 text-sm`}>Saved.</div> : null}
      <p className="text-sm text-[#5C5346]">
        Status: {church.approval_status} · active={String(church.is_active)} · public={publicReady ? "yes" : "no"} · verified=
        {String(church.verification_status)} (not displayed publicly)
      </p>

      {submission ? (
        <div className={`${adminCardBase} p-5 text-sm`}>
          <h2 className="font-bold">Applicant (private)</h2>
          <p className="mt-2">{submission.applicant_name || "—"}</p>
          <p>{submission.applicant_email || "—"}</p>
          <p>{submission.applicant_phone || "—"}</p>
        </div>
      ) : null}

      <form action={saveChurchEssentialsAction} className={`${adminCardBase} space-y-3 p-5`}>
        <input type="hidden" name="church_id" value={id} />
        <label className="block text-xs font-semibold">
          Name
          <input name="name" className={adminInputClass} defaultValue={church.name ?? ""} />
        </label>
        <label className="block text-xs font-semibold">
          Denomination
          <input name="denomination" className={adminInputClass} defaultValue={church.denomination ?? ""} />
        </label>
        <label className="block text-xs font-semibold">
          City
          <input name="city" className={adminInputClass} defaultValue={church.city ?? ""} />
        </label>
        <label className="block text-xs font-semibold">
          State
          <input name="state" className={adminInputClass} defaultValue={church.state ?? ""} />
        </label>
        <label className="block text-xs font-semibold">
          Country
          <input name="country" className={adminInputClass} defaultValue={church.country ?? ""} />
        </label>
        <label className="block text-xs font-semibold">
          ZIP
          <input name="zip" className={adminInputClass} defaultValue={church.zip ?? ""} />
        </label>
        <label className="block text-xs font-semibold">
          Phone
          <input name="phone" className={adminInputClass} defaultValue={church.phone ?? ""} />
        </label>
        <label className="block text-xs font-semibold">
          Website
          <input name="website" className={adminInputClass} defaultValue={church.website ?? ""} />
        </label>
        <label className="block text-xs font-semibold">
          Mission
          <textarea name="mission" className={adminInputClass} rows={4} defaultValue={church.mission ?? ""} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="public_location" defaultChecked={Boolean(church.public_location)} />
          Public location
        </label>
        <button className={adminBtnPrimary} type="submit">
          Save essentials
        </button>
      </form>

      <div className={`${adminCardBase} p-5 text-sm`}>
        <h2 className="font-bold">Services</h2>
        <ul className="mt-2 list-disc pl-5">
          {(services ?? []).length ? (services ?? []).map((s) => (
            <li key={s.id}>
              day {s.day_of_week} · {s.starts_at} · {s.language} · {s.mode}
            </li>
          )) : <li>None</li>}
        </ul>
        <h2 className="mt-4 font-bold">Ministries</h2>
        <ul className="mt-2 list-disc pl-5">
          {(ministries ?? []).length ? (ministries ?? []).map((m) => <li key={m.id}>{m.need_key}</li>) : <li>None</li>}
        </ul>
        <h2 className="mt-4 font-bold">Media</h2>
        <ul className="mt-2 list-disc pl-5">
          {(media ?? []).length ? (media ?? []).map((m) => (
            <li key={m.id}>
              {m.role}: {m.url}
            </li>
          )) : <li>None</li>}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <form action={approveChurchAction}>
          <input type="hidden" name="church_id" value={id} />
          <button className={adminBtnPrimary} type="submit">
            Approve + activate
          </button>
        </form>
        <form action={deactivateChurchAction}>
          <input type="hidden" name="church_id" value={id} />
          <button className={adminBtnSecondary} type="submit">
            Deactivate
          </button>
        </form>
        <form action={rejectChurchAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="church_id" value={id} />
          <input name="reject_reason" className={adminInputClass} placeholder="Reject reason" />
          <button className={adminBtnSecondary} type="submit">
            Reject
          </button>
        </form>
      </div>
    </div>
  );
}
