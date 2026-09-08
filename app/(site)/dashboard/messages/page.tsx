import { redirect } from "next/navigation";

/** Package 1 — canonicalized to the same server-redirect alias pattern used by
 * /dashboard/analiticas, /dashboard/borradores, and /dashboard/notifications.
 * Previously a client-side re-export of ../mensajes/page (URL stayed at /messages).
 * No change to Mensajes behavior itself — only how this alias route reaches it. */
export default async function DashboardMessagesRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => q.append(k, x));
    else if (v != null) q.set(k, v);
  }
  const s = q.toString();
  redirect(s ? `/dashboard/mensajes?${s}` : "/dashboard/mensajes");
}
