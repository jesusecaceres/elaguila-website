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
  savePrayerNetworkAction,
  addPrayerTeamMemberAction,
  deactivatePrayerTeamMemberAction,
} from "@/app/admin/iglesiasChurchActions";
import { PRAYER_CATEGORY_KEYS, PRAYER_CATEGORY_LABELS } from "@/app/lib/iglesias/prayerTaxonomy";

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

  const [{ data: services }, { data: ministries }, { data: media }, { data: submission }, { data: team }] = await Promise.all([
    admin.from("church_services").select("*").eq("church_id", id).order("sort_order"),
    admin.from("church_ministries").select("*").eq("church_id", id).order("sort_order"),
    admin.from("church_media").select("*").eq("church_id", id).order("sort_order"),
    admin.from("church_submissions").select("*").eq("church_id", id).maybeSingle(),
    admin.from("church_prayer_teams").select("*").eq("church_id", id).maybeSingle(),
  ]);
  const { data: members } = team?.id
    ? await admin.from("church_prayer_team_members").select("*").eq("prayer_team_id", team.id).order("created_at")
    : { data: [] as Array<Record<string, unknown>> };

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
          <p className="mt-2 text-xs">Prayer team intent (does not enroll): {String(submission.prayer_team_intent || "—")}</p>
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

      <form action={savePrayerNetworkAction} className={`${adminCardBase} space-y-3 p-5`}>
        <h2 className="font-bold">Prayer Network</h2>
        <p className="text-xs text-[#5C5346]">
          Distinct from approved / active / verified. Enabling does not set verification. Church owner dashboards are deferred; V1 uses admin config + email.
        </p>
        <input type="hidden" name="church_id" value={id} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="prayer_enabled" defaultChecked={Boolean(team?.enabled)} />
          Prayer Network enabled
        </label>
        <label className="block text-xs font-semibold">
          Status
          <select name="prayer_status" className={adminInputClass} defaultValue={String(team?.status ?? "DISABLED")}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="DISABLED">DISABLED</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="accepts_private" defaultChecked={Boolean(team?.accepts_private_requests)} />
          Accept private requests
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="accepts_general" defaultChecked={Boolean(team?.accepts_general_requests)} />
          Accept general requests
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="accepts_high_priority" defaultChecked={Boolean(team?.accepts_high_priority_requests)} />
          Accept high-priority requests
        </label>
        <fieldset>
          <legend className="text-xs font-semibold">Supported languages</legend>
          <div className="mt-1 flex flex-wrap gap-3 text-sm">
            {["es", "en", "bilingual"].map((lang) => (
              <label key={lang} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="supported_languages"
                  value={lang}
                  defaultChecked={Array.isArray(team?.supported_languages) && team.supported_languages.includes(lang)}
                />
                {lang}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-semibold">Supported prayer categories</legend>
          <div className="mt-1 grid gap-1 sm:grid-cols-2 text-sm">
            {PRAYER_CATEGORY_KEYS.map((key) => (
              <label key={key} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="supported_categories"
                  value={key}
                  defaultChecked={Array.isArray(team?.supported_categories) && team.supported_categories.includes(key)}
                />
                {PRAYER_CATEGORY_LABELS[key].es} / {PRAYER_CATEGORY_LABELS[key].en}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-xs font-semibold">
          Geographic scope
          <input name="geographic_scope" className={adminInputClass} defaultValue={team?.geographic_scope ?? ""} />
        </label>
        <label className="block text-xs font-semibold">
          Primary coordinator email
          <input name="primary_contact_email" type="email" className={adminInputClass} defaultValue={team?.primary_contact_email ?? ""} />
        </label>
        <label className="block text-xs font-semibold">
          Primary coordinator phone
          <input name="primary_contact_phone" className={adminInputClass} defaultValue={team?.primary_contact_phone ?? ""} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="delivery_email_enabled" defaultChecked={Boolean(team?.delivery_email_enabled)} />
          Email delivery
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="delivery_dashboard_enabled" defaultChecked={team?.delivery_dashboard_enabled !== false} />
          Dashboard delivery (admin queue)
        </label>
        <button className={adminBtnPrimary} type="submit">
          Save Prayer Network
        </button>
      </form>

      {team?.id ? (
        <div className={`${adminCardBase} space-y-3 p-5`}>
          <h2 className="font-bold">Prayer team roster (never public)</h2>
          <ul className="space-y-2 text-sm">
            {(members ?? []).length ? (members ?? []).map((m) => (
              <li key={String(m.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E8DFD0] px-3 py-2">
                <span>
                  {String(m.name)} · {String(m.role)} · {String(m.email)} · {m.is_active ? "active" : "inactive"}
                </span>
                {m.is_active ? (
                  <form action={deactivatePrayerTeamMemberAction}>
                    <input type="hidden" name="church_id" value={id} />
                    <input type="hidden" name="member_id" value={String(m.id)} />
                    <button className={adminBtnSecondary} type="submit">
                      Deactivate
                    </button>
                  </form>
                ) : null}
              </li>
            )) : <li>No members yet.</li>}
          </ul>
          <form action={addPrayerTeamMemberAction} className="grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="church_id" value={id} />
            <input type="hidden" name="prayer_team_id" value={String(team.id)} />
            <label className="block text-xs font-semibold">
              Name
              <input name="member_name" required className={adminInputClass} />
            </label>
            <label className="block text-xs font-semibold">
              Email
              <input name="member_email" type="email" required className={adminInputClass} />
            </label>
            <label className="block text-xs font-semibold">
              Phone
              <input name="member_phone" className={adminInputClass} />
            </label>
            <label className="block text-xs font-semibold">
              Language
              <select name="member_language" className={adminInputClass} defaultValue="es">
                <option value="es">es</option>
                <option value="en">en</option>
                <option value="bilingual">bilingual</option>
              </select>
            </label>
            <label className="block text-xs font-semibold">
              Role
              <select name="member_role" className={adminInputClass} defaultValue="MEMBER">
                <option value="COORDINATOR">COORDINATOR</option>
                <option value="MEMBER">MEMBER</option>
              </select>
            </label>
            <div className="flex items-end">
              <button className={adminBtnSecondary} type="submit">
                Add member
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p className="text-sm text-[#5C5346]">Save Prayer Network once to create the team record before adding members.</p>
      )}

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
        <ul className="mt-2 space-y-3">
          {(media ?? []).length ? (media ?? []).map((m) => (
            <li key={m.id} className="rounded-lg border border-[#E8DFD0] p-3">
              <p className="font-semibold capitalize">{String(m.role)}</p>
              {String(m.role) === "logo" || String(m.role) === "hero" ? (
                <div className="mt-2 flex items-start gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-[#E8DFD0] bg-white p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={String(m.url)} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                  <p className="min-w-0 break-all text-xs text-[#5C5346]">{String(m.url)}</p>
                </div>
              ) : (
                <p className="mt-1 break-all text-xs">{String(m.url)}</p>
              )}
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
