import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};

  const rawLang = sp.lang;
  const lang =
    typeof rawLang === "string"
      ? rawLang
      : Array.isArray(rawLang)
      ? rawLang[0]
      : undefined;

  const url = lang
    ? `/clasificados/restaurantes?lang=${encodeURIComponent(lang)}`
    : "/clasificados/restaurantes";

  redirect(url);
}
