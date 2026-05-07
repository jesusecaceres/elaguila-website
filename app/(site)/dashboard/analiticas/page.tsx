import { redirect } from "next/navigation";

export default async function DashboardAnaliticasAliasPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang = sp.lang === "en" ? "en" : "es";
  redirect(`/dashboard/analytics?lang=${lang}`);
}
