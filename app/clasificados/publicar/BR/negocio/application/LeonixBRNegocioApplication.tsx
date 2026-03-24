"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LeonixBRNegocioForm } from "./schema/leonixBrNegocioForm";
import { createEmptyLeonixBRNegocioForm } from "./helpers/defaultNegocioForm";
import { readFileAsDataUrl } from "./helpers/files";
import { TipoPublicacionSection } from "./sections/TipoPublicacionSection";
import { InformacionPrincipalSection } from "./sections/InformacionPrincipalSection";
import { UbicacionSection } from "./sections/UbicacionSection";
import { CaracteristicasPrincipalesSection } from "./sections/CaracteristicasPrincipalesSection";
import { InteriorSection } from "./sections/InteriorSection";
import { ExteriorSection } from "./sections/ExteriorSection";
import { ServiciosComunidadSection } from "./sections/ServiciosComunidadSection";
import { FotosYMediosSection } from "./sections/FotosYMediosSection";
import { DescripcionMarketingSection } from "./sections/DescripcionMarketingSection";
import { NegocioSection } from "./sections/NegocioSection";
import { AgentePrincipalSection } from "./sections/AgentePrincipalSection";
import { EquipoAdicionalSection } from "./sections/EquipoAdicionalSection";
import { RedesYEnlacesSection } from "./sections/RedesYEnlacesSection";
import { ContactoCTASection } from "./sections/ContactoCTASection";

const MAX_IMAGES = 12;

export default function LeonixBRNegocioApplication() {
  const searchParams = useSearchParams();
  const lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const [form, setForm] = useState<LeonixBRNegocioForm>(() => createEmptyLeonixBRNegocioForm());

  const handleGalleryPicked = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const incoming = Array.from(files);
    const newUrls: string[] = [];
    for (const f of incoming) {
      newUrls.push(await readFileAsDataUrl(f));
    }
    setForm((prev) => {
      const merged = [...prev.property.medios.imagenesDataUrls, ...newUrls].slice(0, MAX_IMAGES);
      return {
        ...prev,
        property: {
          ...prev.property,
          medios: { ...prev.property.medios, imagenesDataUrls: merged },
        },
      };
    });
  }, []);

  const handleLogo = useCallback(async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const logoDataUrl = await readFileAsDataUrl(f);
    setForm((prev) => ({
      ...prev,
      rail: { ...prev.rail, negocio: { ...prev.rail.negocio, logoDataUrl } },
    }));
  }, []);

  const handleAgentPhoto = useCallback(async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const fotoDataUrl = await readFileAsDataUrl(f);
    setForm((prev) => ({
      ...prev,
      rail: {
        ...prev.rail,
        agentePrincipal: { ...prev.rail.agentePrincipal, fotoDataUrl },
      },
    }));
  }, []);

  const backChooser = `/clasificados/bienes-raices?lang=${lang}`;
  const backPublicar = `/clasificados/publicar?lang=${lang}`;

  return (
    <main className="min-h-screen bg-[#D9D9D9] pb-24 pt-24 text-[#111111]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#111111]/50">Leonix · Bienes Raíces</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Publicar — Negocio o profesional</h1>
            <p className="mt-2 max-w-xl text-sm text-[#111111]/75">
              Inmueble y ubicación arriba; negocio, agente y contacto abajo. Así alimentamos después el rail y la ficha sin
              reescribir todo.
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
          Bloque inmueble (propiedad)
        </div>
        <div className="flex flex-col gap-5">
          <TipoPublicacionSection
            value={form.property.tipoPublicacion}
            onChange={(tipoPublicacion) => setForm((f) => ({ ...f, property: { ...f.property, tipoPublicacion } }))}
          />
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
          <InteriorSection
            value={form.property.interior}
            onChange={(interior) => setForm((f) => ({ ...f, property: { ...f.property, interior } }))}
          />
          <ExteriorSection
            value={form.property.exterior}
            onChange={(exterior) => setForm((f) => ({ ...f, property: { ...f.property, exterior } }))}
          />
          <ServiciosComunidadSection
            value={form.property.serviciosComunidad}
            onChange={(serviciosComunidad) => setForm((f) => ({ ...f, property: { ...f.property, serviciosComunidad } }))}
          />
          <FotosYMediosSection
            value={form.property.medios}
            onChange={(medios) => setForm((f) => ({ ...f, property: { ...f.property, medios } }))}
            onPickGalleryFiles={handleGalleryPicked}
            maxImages={MAX_IMAGES}
          />
          <DescripcionMarketingSection
            value={form.property.descripcionMarketing}
            onChange={(descripcionMarketing) => setForm((f) => ({ ...f, property: { ...f.property, descripcionMarketing } }))}
          />
        </div>

        <div className="mt-8 rounded-xl border border-[#A98C2A]/30 bg-[#F5F2E8] px-4 py-3 text-sm font-semibold text-[#111111]">
          Negocio, agente y contacto (rail)
        </div>
        <div className="mt-5 flex flex-col gap-5">
          <NegocioSection
            value={form.rail.negocio}
            onChange={(negocio) => setForm((f) => ({ ...f, rail: { ...f.rail, negocio } }))}
            onPickLogoFile={handleLogo}
          />
          <AgentePrincipalSection
            value={form.rail.agentePrincipal}
            onChange={(agentePrincipal) => setForm((f) => ({ ...f, rail: { ...f.rail, agentePrincipal } }))}
            onPickFotoFile={handleAgentPhoto}
          />
          <EquipoAdicionalSection
            value={form.rail.equipoAdicional}
            onChange={(equipoAdicional) => setForm((f) => ({ ...f, rail: { ...f.rail, equipoAdicional } }))}
          />
          <RedesYEnlacesSection
            value={form.rail.redes}
            onChange={(redes) => setForm((f) => ({ ...f, rail: { ...f.rail, redes } }))}
          />
          <ContactoCTASection
            value={form.rail.contactoCta}
            onChange={(contactoCta) => setForm((f) => ({ ...f, rail: { ...f.rail, contactoCta } }))}
          />
        </div>

        <div className="mt-10 rounded-2xl border border-black/10 bg-[#F5F5F5] p-4 text-center text-sm text-[#111111]/70">
          Guardado local y publicación se conectan después. Este formulario ya deja el modelo listo para preview y ficha.
        </div>
      </div>
    </main>
  );
}
