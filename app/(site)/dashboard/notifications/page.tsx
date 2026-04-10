import { redirect } from "next/navigation";

export default async function DashboardNotificationsRedirect({
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
  redirect(s ? `/dashboard/notificaciones?${s}` : "/dashboard/notificaciones");
}
