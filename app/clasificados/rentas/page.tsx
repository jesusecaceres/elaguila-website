import { redirect } from "next/navigation";

type SearchParams = {
  lang?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const lang = params.lang === "en" ? "en" : "es";

  // Keep category route as a thin wrapper, but point it to the actual
  // Clasificados "lista" engine route you’re using in production.
  redirect(`/clasificados/lista?cat=rentas&lang=${lang}`);
}
