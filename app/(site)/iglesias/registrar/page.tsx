import type { Metadata } from "next";
import { normalizeLang } from "@/app/lib/language";
import { leonixPageTitle } from "@/app/lib/leonixBrand";
import { IglesiasRegistrarForm } from "./IglesiasRegistrarForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { searchParams?: Promise<{ lang?: string }> }): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang) === "en" ? "en" : "es";
  const title = lang === "en" ? "Register a church" : "Registrar una iglesia";
  const description =
    lang === "en"
      ? "Submit your congregation for review. Leonix publishes churches only after human review."
      : "Envía tu congregación a revisión. Leonix publica iglesias solo después de una revisión humana.";
  return {
    title,
    description,
    alternates: { canonical: "/iglesias/registrar" },
    robots: { index: true, follow: true },
    openGraph: { title: leonixPageTitle(title), description },
  };
}

export default async function Page(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang) === "en" ? "en" : "es";
  return <IglesiasRegistrarForm lang={lang} />;
}
