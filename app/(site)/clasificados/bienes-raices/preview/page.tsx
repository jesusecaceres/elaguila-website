import Link from "next/link";
import {
  BR_PREVIEW_NEGOCIO,
  BR_PREVIEW_PRIVADO,
  BR_PUBLICAR_NEGOCIO,
  BR_PUBLICAR_PRIVADO,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";

type Lang = "es" | "en";

const COPY = {
  es: {
    kicker: "Leonix Clasificados",
    title: "Vista previa Bienes Raíces",
    body: "El preview toma el borrador que guardaste al publicar. Negocio usa el diseño premium aprobado; Privado se conectará al mismo patrón cuando el flujo esté listo.",
    negocioLink: "Vista previa Negocio",
    negocioHint: "Desde Publicar Negocio → Ver vista previa.",
    privadoLink: "Vista previa Privado",
    privadoHint: "Próximamente enlazado al formulario particular.",
    backNegocio: "Volver a Publicar Negocio",
    backPrivado: "Publicar Privado",
  },
  en: {
    kicker: "Leonix Classifieds",
    title: "Real Estate Preview",
    body: "The preview uses the draft you saved when publishing. Business uses the approved premium design; Private will connect to the same pattern when the flow is ready.",
    negocioLink: "Business Preview",
    negocioHint: "From Publish Business → View preview.",
    privadoLink: "Private Preview",
    privadoHint: "Will be linked to the private form soon.",
    backNegocio: "Back to Publish Business",
    backPrivado: "Publish Private",
  },
} as const;

function appendLang(path: string, lang: Lang): string {
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}lang=${lang}`;
}

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function BienesRaicesPreviewHubPage(props: PageProps) {
  const sp = props.searchParams ? await props.searchParams : {};
  const lang: Lang = sp.lang === "en" ? "en" : "es";
  const t = COPY[lang];

  return (
    <main className="min-h-screen bg-[#F4EFE6] px-4 pb-16 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-lg">
        <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.kicker}</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-[#1E1810]">{t.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/88">
          {t.body}
        </p>
        <ul className="mt-8 space-y-3">
          <li>
            <Link
              href={appendLang(BR_PREVIEW_NEGOCIO, lang)}
              className="block rounded-2xl border border-[#C9B46A]/45 bg-[#FFF6E7] p-4 font-semibold text-[#6E5418] shadow-sm hover:bg-[#FFEFD8]"
            >
              {t.negocioLink}
            </Link>
            <p className="mt-1 px-1 text-xs text-[#5C5346]/75">{t.negocioHint}</p>
          </li>
          <li>
            <Link
              href={appendLang(BR_PREVIEW_PRIVADO, lang)}
              className="block rounded-2xl border border-[#E8DFD0] bg-[#FDFBF7] p-4 font-semibold text-[#3D3630] hover:border-[#D4C4A8]"
            >
              {t.privadoLink}
            </Link>
            <p className="mt-1 px-1 text-xs text-[#5C5346]/75">{t.privadoHint}</p>
          </li>
        </ul>
        <div className="mt-10 flex flex-col gap-2 border-t border-[#E8DFD0]/80 pt-6 text-sm">
          <Link href={appendLang(BR_PUBLICAR_NEGOCIO, lang)} className="font-medium text-[#B8954A] underline decoration-[#C9B46A]/50 underline-offset-4">
            {t.backNegocio}
          </Link>
          <Link href={appendLang(BR_PUBLICAR_PRIVADO, lang)} className="font-medium text-[#5C5346] underline decoration-[#C9B46A]/40 underline-offset-4">
            {t.backPrivado}
          </Link>
        </div>
      </div>
    </main>
  );
}
