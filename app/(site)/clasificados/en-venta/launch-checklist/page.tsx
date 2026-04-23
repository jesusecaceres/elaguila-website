import Link from "next/link";
import { notFound } from "next/navigation";
import { getEnVentaSupabaseBrowserEnvIssues } from "@/app/lib/supabase/enVentaClientEnvCheck";
import { runEnVentaDetailPairSignalsSelfCheck } from "../mapping/enVentaDetailPairSignals";

function allowLaunchChecklist(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_EV_INTERNAL_QA === "1";
}

export const metadata = {
  title: "En Venta — checklist de lanzamiento (interno)",
  robots: { index: false, follow: false },
};

/**
 * Staging/dev verification surface for En Venta go-live.
 * Hidden in production unless NEXT_PUBLIC_EV_INTERNAL_QA=1.
 */
export default function EnVentaLaunchChecklistPage() {
  if (!allowLaunchChecklist()) notFound();

  const signalErrors = runEnVentaDetailPairSignalsSelfCheck();
  const envIssues = getEnVentaSupabaseBrowserEnvIssues();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-[#2C2416]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7164]">Leonix · interno</p>
      <h1 className="mt-2 text-2xl font-bold">En Venta — verificación previa a producción</h1>
      <p className="mt-3 text-sm text-[#5C5346]">
        Esta ruta no sustituye pruebas en Supabase (RLS, Storage, auth). Comprueba el flujo real con una cuenta de
        vendedor y un admin.
      </p>

      <section className="mt-8 rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-5 text-sm">
        <h2 className="text-base font-bold">Variables públicas Supabase (build)</h2>
        <p className="mt-2 text-[#5C5346]">
          Comprueba que el bundle incluye URL y anon key. Esto no valida RLS ni Storage en vivo.
        </p>
        <p className="mt-2 font-mono text-xs">
          {envIssues.length === 0 ? "OK — NEXT_PUBLIC_SUPABASE_* presentes" : `FALLO: ${envIssues.join(" · ")}`}
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-[#E8DFD0] bg-white p-5 text-sm">
        <h2 className="text-base font-bold">Política de fotos al publicar</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5C5346]">
          <li>Sin fotos en el formulario: se publica sin galería (`gallery=none`).</li>
          <li>
            Con ≥1 foto: <strong>todas</strong> las fotos ordenadas deben subirse al bucket{" "}
            <code className="rounded bg-black/5 px-1">listing-images</code> antes de activar el anuncio. Si{" "}
            <strong>falta cualquiera</strong>, la publicación <strong>falla</strong>, el anuncio{" "}
            <strong>no queda público</strong> y la fila pasa a <code className="rounded bg-black/5 px-1">removed</code> +{" "}
            <code className="rounded bg-black/5 px-1">is_published=false</code> (mismo código que si fallan todas).
          </li>
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-5 text-sm">
        <h2 className="text-base font-bold">Contrato `detail_pairs` (helpers)</h2>
        <p className="mt-2 text-[#5C5346]">
          Autochequeo de parsers en <code className="rounded bg-black/5 px-1">enVentaDetailPairSignals.ts</code>:
        </p>
        <p className="mt-2 font-mono text-xs">
          {signalErrors.length === 0 ? "OK — sin errores" : `FALLO: ${signalErrors.join(", ")}`}
        </p>
      </section>

      <ol className="mt-8 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
        <li>
          <strong>Borrador:</strong> crear borrador en publicar (si aplica) y confirmar que no aparece en resultados públicos.
        </li>
        <li>
          <strong>Publicar:</strong> completar formulario free o pro, fotos, ubicación válida (CA). Publicar y ver panel{" "}
          <code className="rounded bg-black/5 px-1">ev-publish-success</code>.
        </li>
        <li>
          <strong>Imágenes:</strong> confirmar miniatura en éxito y en{" "}
          <Link className="font-semibold text-[#2F4A65] underline" href="/dashboard/mis-anuncios">
            Mis anuncios
          </Link>
          .
        </li>
        <li>
          <strong>Resultados:</strong>{" "}
          <Link className="font-semibold text-[#2F4A65] underline" href="/clasificados/en-venta/results?lang=es">
            /clasificados/en-venta/results
          </Link>{" "}
          — el anuncio aparece sin filtros; probar <code className="rounded bg-black/5 px-1">evDept</code>,{" "}
          <code className="rounded bg-black/5 px-1">evSub</code>, <code className="rounded bg-black/5 px-1">cond</code>,{" "}
          <code className="rounded bg-black/5 px-1">pickup/ship/delivery</code>, <code className="rounded bg-black/5 px-1">free</code>,{" "}
          <code className="rounded bg-black/5 px-1">nego</code>, <code className="rounded bg-black/5 px-1">meetup</code>, precio y{" "}
          <code className="rounded bg-black/5 px-1">q</code> (marca/modelo en texto).
        </li>
        <li>
          <strong>Detalle:</strong> abrir URL de anuncio (`/clasificados/anuncio/&lt;uuid&gt;`) y verificar título, precio, specs,
          vuelta a resultados (<code className="rounded bg-black/5 px-1">evReturn</code>).
        </li>
        <li>
          <strong>Admin:</strong>{" "}
          <Link className="font-semibold text-[#2F4A65] underline" href="/admin/workspace/clasificados?category=en-venta">
            /admin/workspace/clasificados
          </Link>{" "}
          — «Ocultar del público» pone <code className="rounded bg-black/5 px-1">is_published=false</code> (desaparece de resultados); «Republicar» lo revierte. «Eliminar (staff)» marca{" "}
          <code className="rounded bg-black/5 px-1">removed</code>.
        </li>
        <li>
          <strong>Reportes:</strong>{" "}
          <Link className="font-semibold text-[#2F4A65] underline" href="/admin/reportes">
            /admin/reportes
          </Link>{" "}
          — cola <code className="rounded bg-black/5 px-1">listing_reports</code> (desde «Reportar anuncio» en detalle).
        </li>
        <li>
          <strong>Mapa/radio:</strong> el acordeón en resultados es solo informativo (no filtra).
        </li>
      </ol>

      <p className="mt-8 text-xs text-[#7A7164]">
        Producción: oculto salvo <code className="rounded bg-black/5 px-1">NEXT_PUBLIC_EV_INTERNAL_QA=1</code>. Matriz de campos:{" "}
        <code className="rounded bg-black/5 px-1">enVentaPublishContract.ts</code>.
      </p>
    </div>
  );
}
