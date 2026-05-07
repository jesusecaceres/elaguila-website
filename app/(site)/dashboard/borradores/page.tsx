import { redirect } from "next/navigation";

export default async function DashboardBorradoresAliasPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang = sp.lang === "en" ? "en" : "es";
  redirect(`/dashboard/drafts?lang=${lang}`);
}
