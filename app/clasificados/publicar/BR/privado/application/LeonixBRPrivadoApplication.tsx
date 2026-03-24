"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LeonixBRPrivadoForm } from "./schema/leonixBrPrivadoForm";
import { createEmptyLeonixBRPrivadoForm } from "./helpers/defaultPrivadoForm";
import { readFileAsDataUrl } from "./helpers/files";
import { InformacionPrincipalSection } from "./sections/InformacionPrincipalSection";
import { UbicacionSection } from "./sections/UbicacionSection";
import { CaracteristicasPrincipalesSection } from "./sections/CaracteristicasPrincipalesSection";
import { DetalleAdicionalSection } from "./sections/DetalleAdicionalSection";
import { FotosYMediosSection } from "./sections/FotosYMediosSection";
import { DescripcionSection } from "./sections/DescripcionSection";
import { AnuncianteSection } from "./sections/AnuncianteSection";
import { ContactoSection } from "./sections/ContactoSection";
import { PresenciaOpcionalSection } from "./sections/PresenciaOpcionalSection";

const MAX_IMAGES = 12;

export default function LeonixBRPrivadoApplication() {
  const searchParams = useSearchParams();
  const lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const [form, setForm] = useState<LeonixBRPrivadoForm>(() => createEmptyLeonixBRPrivadoForm());

  const handleGallery = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const incoming = Array.from(files);
    const newUrls: string[] = [];
    for (const f of incoming) {
      newUrls.push(await readFileAsDataUrl(f));
    }
    setForm((prev) => ({
      ...prev,
      property: {
        ...prev.property,
        medios: {
          ...prev.property.medios,
          imagenesDataUrls: [...prev.property.medios.imagenesDataUrls, ...newUrls].slice(0, MAX_IMAGES),
        },
      },
    }));
  }, []);

  const handleAnuncianteFoto = useCallback(async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const fotoDataUrl = await readFileAsDataUrl(f);
    setForm((prev) => ({ ...prev, anunciante: { ...prev.anunciante, fotoDataUrl } }));
  }, []);

  const backChooser = `/clasificados/bienes-raices?lang=${lang}`;
  const backPublicar = `/clasificados/publicar?lang=${lang}`;

  return (
    <main className="min-h-screen bg-[#D9D9D9] pb-24 pt-24 text-[#111111]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#111111]/50">Leonix · Bienes Raíces</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Publicar — Vendedor particular</h1>
            <p className="mt-2 max-w-xl text-sm text-[#111111]/75">
              Flujo más ligero: primero el inmueble, luego tú como anunciante. Sin rollo de brokerage.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={backChooser}
              className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-semibold hover:bg-[#EFEFEF]"
            >
              Volver al selector
            </Link>
            <Link
              href={backPublicar}
              className="rounded-xl border border-black/10 bg-[#111111] px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Categorías
            </Link>
          </div>
        </header>

        <div className="mb-4 rounded-xl border border-[#A98C2A]/30 bg-[#FAF7EF] px-4 py-3 text-sm font-semibold text-[#111111]">
          Inmueble
        </div>
        <div className="flex flex-col gap-5">
          <InformacionPrincipalSection
            value={form.property.principal}
            onChange={(principal) => setForm((f) => ({ ...f, property: { ...f.property, principal } }))}
          />
          <UbicacionSection
            value={form.property.ubicacion}
            onChange={(ubicacion) => setForm((f) => ({ ...f, property: { ...f.property, ubicacion } }))}
          />
          <CaracteristicasPrincipalesSection
            value={form.property.caracteristicas}
            onChange={(caracteristicas) => setForm((f) => ({ ...f, property: { ...f.property, caracteristicas } }))}
          />
          <DetalleAdicionalSection
            value={form.property.detalleExtra}
            onChange={(detalleExtra) => setForm((f) => ({ ...f, property: { ...f.property, detalleExtra } }))}
          />
          <FotosYMediosSection
            value={form.property.medios}
            onChange={(medios) => setForm((f) => ({ ...f, property: { ...f.property, medios } }))}
            onPickGalleryFiles={handleGallery}
          />
          <DescripcionSection
            value={form.property.descripcion}
            onChange={(descripcion) => setForm((f) => ({ ...f, property: { ...f.property, descripcion } }))}
          />
        </div>

        <div className="mt-8 rounded-xl border border-[#A98C2A]/30 bg-[#F5F2E8] px-4 py-3 text-sm font-semibold text-[#111111]">
          Persona y contacto
        </div>
        <div className="mt-5 flex flex-col gap-5">
          <AnuncianteSection
            value={form.anunciante}
            onChange={(anunciante) => setForm((f) => ({ ...f, anunciante }))}
            onPickFoto={handleAnuncianteFoto}
          />
          <ContactoSection
            value={form.contacto}
            onChange={(contacto) => setForm((f) => ({ ...f, contacto }))}
          />
          <PresenciaOpcionalSection
            value={form.presencia}
            onChange={(presencia) => setForm((f) => ({ ...f, presencia }))}
          />
        </div>

        <div className="mt-10 rounded-2xl border border-black/10 bg-[#F5F5F5] p-4 text-center text-sm text-[#111111]/70">
          Cuando conectemos publicación, este modelo ya está listo para preview y ficha.
        </div>
      </div>
    </main>
  );
}
