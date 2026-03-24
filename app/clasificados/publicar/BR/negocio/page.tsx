import BienesRaicesComingSoon from "../BienesRaicesComingSoon";

type SearchParams = Promise<{ lang?: string }>;

export default async function PublicarBrNegocioComingSoonPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const lang = sp?.lang === "en" ? "en" : "es";
  return <BienesRaicesComingSoon lane="negocio" lang={lang} />;
}
