import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ slug: string }> };

/** Legacy URL — unified editor lives under `/admin/workspace/clasificados/category/[slug]#contenido`. */
export default async function ClasificadosCategoryEditorRedirectPage(props: P) {
  const { slug: raw } = await props.params;
  const slug = decodeURIComponent(raw).trim().toLowerCase();
  redirect(`/admin/workspace/clasificados/category/${encodeURIComponent(slug)}#contenido`);
}
