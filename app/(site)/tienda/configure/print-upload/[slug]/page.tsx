import { notFound } from "next/navigation";
import type { PrintUploadProductSlug } from "../../../product-configurators/print-upload/types";
import { PRINT_UPLOAD_PRODUCT_SLUGS, isPrintUploadProductSlug } from "../../../product-configurators/print-upload/productConfigs";
import { PrintUploadBuilderShell } from "../../../components/print-upload/PrintUploadBuilderShell";
import type { Lang } from "../../../types/tienda";
import { normalizeLang } from "../../../utils/tiendaRouting";

export function generateStaticParams() {
  return PRINT_UPLOAD_PRODUCT_SLUGS.map((slug) => ({ slug }));
}

export default async function PrintUploadConfigurePage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { slug } = await props.params;
  if (!isPrintUploadProductSlug(slug)) notFound();

  const sp = (await props.searchParams) ?? {};
  const lang: Lang = normalizeLang(sp.lang);

  return <PrintUploadBuilderShell key={`${slug}-${lang}`} productSlug={slug as PrintUploadProductSlug} lang={lang} />;
}
