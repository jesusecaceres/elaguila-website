import BienesRaicesComingSoon from "../BienesRaicesComingSoon";

type SearchParams = Promise<{ lang?: string }>;

export default async function PublicarBrPrivadoComingSoonPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const lang = sp?.lang === "en" ? "en" : "es";
  return <BienesRaicesComingSoon lane="privado" lang={lang} />;
}
