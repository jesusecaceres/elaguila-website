import { redirect } from "next/navigation";

type SearchParams = { lang?: string };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const lang = params.lang === "en" ? "en" : "es";
  redirect(`/clasificados/lista?cat=en-venta&lang=${lang}`);
}
