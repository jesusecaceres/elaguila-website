import { redirect } from "next/navigation";
import { resolveMagazineLang } from "@/app/(site)/magazine/2026/june/issueContent";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

/** Canonical issue hub lives at /magazine; preserve language when landing here. */
export default async function June2026IssuePage({ searchParams }: Props) {
  const sp = await searchParams;
  const lang = resolveMagazineLang(sp.lang);
  redirect(`/magazine?lang=${lang}`);
}
