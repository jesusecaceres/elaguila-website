"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { resolveAutosRouteLang, withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { navCopyLang } from "@/app/lib/language";
import { getAutosBranchCopy } from "./autosBranchCopy";
import { getAutosCheckpointCards } from "@/app/clasificados/publicar/_lib/categoryPublishCheckpoints";
import { PublishEntryCheckpointLayout, PublishEntryCheckpointStack } from "@/app/clasificados/publicar/_components/PublishEntryCheckpoint";

export function PublicarAutosBranchClient() {
  const searchParams = useSearchParams();
  const routeLang = useMemo(() => resolveAutosRouteLang(searchParams?.get("lang")), [searchParams]);
  const copyLang = useMemo(() => navCopyLang(routeLang), [routeLang]) as "es" | "en";
  const c = useMemo(() => getAutosBranchCopy(copyLang), [copyLang]);

  useEffect(() => {
    document.title = c.metaTitle;
  }, [c.metaTitle]);

  const privadoHref = withLangParam("/publicar/autos/privado", routeLang);
  const negociosHref = withLangParam("/publicar/autos/negocios", routeLang);
  const publicarHref = withLangParam("/clasificados/publicar", routeLang);

  const cards = useMemo(
    () => getAutosCheckpointCards(copyLang, privadoHref, negociosHref),
    [copyLang, privadoHref, negociosHref],
  );

  return (
    <PublishEntryCheckpointLayout
      lang={copyLang}
      title={c.title}
      body={c.intro}
      backHref={publicarHref}
      backLabel={c.backToPublicar}
    >
      <PublishEntryCheckpointStack cards={cards} lang={copyLang} />
    </PublishEntryCheckpointLayout>
  );
}
