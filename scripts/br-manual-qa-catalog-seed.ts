/**
 * Persistent manual-QA listings for Bienes Raíces: one row per supported Privado `categoriaPropiedad`
 * and per supported Negocio `publicationType`, using the same publish payload as the app
 * (`buildPublishParamsFromBienesRaices*Draft` + `buildListingsInsertRowForLeonixPublish`).
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
 *            BR_SMOKE_EMAIL, BR_SMOKE_PASSWORD (seller owns rows).
 *
 * Idempotent: titles use prefix `BR_MANUAL_QA_STAMP` (default `br-manual-qa-catalog-v1`); existing
 * same-title rows for this owner are skipped.
 *
 * Run: npx tsx scripts/br-manual-qa-catalog-seed.ts
 */

import { strict as assert } from "node:assert";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { filterBrListings } from "../app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters";
import { mapBrListingRowToNegocioCard, type BrListingDbRow } from "../app/(site)/clasificados/bienes-raices/resultados/lib/mapBrListingRowToCard";
import { parseBrResultsUrl } from "../app/(site)/clasificados/bienes-raices/resultados/lib/brResultsUrlState";
import {
  buildListingsInsertRowForLeonixPublish,
  leonixGalleryAppendixForDescription,
} from "../app/(site)/clasificados/lib/leonixPublishRealEstateListingCore";
import { insertListingsRowResilient } from "../app/(site)/clasificados/lib/listingsSelectShrink";
import {
  buildPublishParamsFromBienesRaicesNegocioDraft,
  buildPublishParamsFromBienesRaicesPrivadoDraft,
  type LeonixBrDraftPublishBuildResult,
} from "../app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState";
import {
  createEmptyBienesRaicesMuxVideoSlot,
  mergePartialBienesRaicesNegocioState,
  syncNegocioListingFieldsFromPublication,
  type BienesRaicesPublicationType,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import { mergePartialBienesRaicesPrivadoState } from "../app/(site)/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(name: string): void {
  const p = path.join(repoRoot, name);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

function hydrateEnv(): void {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
}

const muxSlots = (): [ReturnType<typeof createEmptyBienesRaicesMuxVideoSlot>, ReturnType<typeof createEmptyBienesRaicesMuxVideoSlot>] => [
  createEmptyBienesRaicesMuxVideoSlot(0),
  createEmptyBienesRaicesMuxVideoSlot(1),
];

const QA_PHOTOS = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format&fit=crop",
] as const;

const NEGOCIO_PUBLICATIONS: BienesRaicesPublicationType[] = [
  "residencial_venta",
  "residencial_renta",
  "comercial",
  "terreno",
  "proyecto_nuevo",
  "multifamiliar_inversion",
];

function baseOriginForQaLinks(): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (site) return site;
  const v = (process.env.VERCEL_URL ?? "").trim();
  if (v) return v.startsWith("http") ? v : `https://${v}`;
  return "http://localhost:3000";
}

function privadoResidencial(title: string, sellerEmail: string) {
  return mergePartialBienesRaicesPrivadoState({
    categoriaPropiedad: "residencial",
    titulo: title,
    precio: "875000",
    ciudad: "Monterrey",
    ubicacionLinea: "Av. Roble 2400, Col. Del Valle, CP 66266",
    enlaceMapa: "https://maps.google.com/?q=25.6866,-100.3161",
    descripcion:
      "Residencia en esquina con excelente luz natural, cocina integral de diseño, sala-comedor amplia y jardín posterior listo para asador. Vecindario tranquilo con acceso rápido a avenidas principales. Ventanales doble vidrio, closets de piso a techo en recámaras y preparación para minisplit. Ideal para familia que busca espacio, estacionamiento techado y área de lavado techada.",
    estadoAnuncio: "disponible",
    petsAllowed: "yes",
    media: {
      photoDataUrls: [],
      primaryImageIndex: 0,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoLocalDataUrl: "",
    },
    seller: {
      fotoDataUrl: "",
      nombre: "Laura Méndez",
      etiquetaRol: "Propietaria directa",
      telefono: "15555550111",
      whatsapp: "15555550112",
      correo: sellerEmail,
      notaContacto: "Prefiero visitas entre 10:00 y 18:00 entre semana; fines con cita.",
    },
    residencial: {
      tipoCodigo: "casa",
      subtipo: "Residencial en esquina",
      recamaras: "4",
      banos: "3",
      mediosBanos: "1",
      interiorSqft: "2850",
      loteSqft: "4300",
      estacionamiento: "2 techados",
      ano: "2016",
      condicion: "excelente",
      highlightKeys: ["piscina", "patio", "comunidadCerrada"],
    },
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  });
}

function privadoComercial(title: string, sellerEmail: string) {
  return mergePartialBienesRaicesPrivadoState({
    categoriaPropiedad: "comercial",
    titulo: title,
    precio: "1200000",
    ciudad: "San Pedro Garza García",
    ubicacionLinea: "Calzada del Valle 450, local comercial planta baja, CP 66220",
    enlaceMapa: "https://maps.google.com/?q=25.6570,-100.4020",
    descripcion:
      "Local comercial de alta visibilidad con fachada lineal, piso de porcelanato, baño para clientes y medio baño de servicio. Instalaciones eléctricas trifásicas disponibles, preparación para minisplit y persianas de seguridad. Zona de alto tráfico peatonal y vehicular; ideal boutique, clínica ligera o cafetería de especialidad.",
    estadoAnuncio: "disponible",
    petsAllowed: "no",
    media: { photoDataUrls: [], primaryImageIndex: 0, videoUrl: "", videoLocalDataUrl: "" },
    seller: {
      fotoDataUrl: "",
      nombre: "Grupo Inmobiliario Norte",
      etiquetaRol: "Representante autorizado",
      telefono: "15555550221",
      whatsapp: "15555550222",
      correo: sellerEmail,
      notaContacto: "Se entrega llave en mano; negociable según plazo de arrendamiento o venta.",
    },
    comercial: {
      tipoCodigo: "local",
      subtipo: "Planta baja con vitrina",
      uso: "Retail / servicios",
      interiorSqft: "1450",
      oficinas: "1",
      banos: "2",
      niveles: "1",
      estacionamiento: "3 visitas",
      zonificacion: "Comercial mixto",
      condicion: "buena",
      accesoCarga: true,
      destacadoIds: ["recepcion", "alto_trafico"],
    },
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  });
}

function privadoTerreno(title: string, sellerEmail: string) {
  return mergePartialBienesRaicesPrivadoState({
    categoriaPropiedad: "terreno_lote",
    titulo: title,
    precio: "385000",
    ciudad: "Santiago",
    ubicacionLinea: "Carretera Nacional km 8.5, fraccionamiento en desarrollo, CP 67300",
    enlaceMapa: "https://maps.google.com/?q=25.4280,-100.1120",
    descripcion:
      "Lote residencial en fraccionamiento con caseta de acceso, servicios subterráneos y calles pavimentadas. Topografía casi plana, esquina suave con vista arbolada. Uso de suelo habitacional; listo para proyecto de vivienda unifamiliar o dúplex sujeto a reglamento del fraccionamiento.",
    estadoAnuncio: "disponible",
    petsAllowed: "yes",
    media: { photoDataUrls: [], primaryImageIndex: 0, videoUrl: "", videoLocalDataUrl: "" },
    seller: {
      fotoDataUrl: "",
      nombre: "Familia Garza",
      etiquetaRol: "Vendedores particulares",
      telefono: "15555550331",
      whatsapp: "15555550332",
      correo: sellerEmail,
      notaContacto: "Documentación en regla; se agenda visita con 24 h de anticipación.",
    },
    terreno: {
      tipoCodigo: "lote_residencial",
      subtipo: "Esquina",
      loteSqft: "7200",
      usoZonificacion: "Habitacional unifamiliar",
      acceso: "Carretera nacional + calle interna",
      servicios: "Agua, drenaje, electricidad al frente",
      topografia: "Casi plano",
      listoConstruir: true,
      cercado: false,
      destacadoIds: ["acceso_pavimentado", "cerca_servicios", "listo_construir"],
    },
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  });
}

function deepSample() {
  return {
    tipoYEstilo: {
      tipoPropiedad: "Casa / unifamiliar",
      subtipo: "Contemporáneo",
      estilo: "Moderno",
      estado: "Impecable",
      uso: "Habitacional",
    },
    construccion: {
      anioConstruccion: "2018",
      materialExterior: "Ladrillo + acento de cantera",
      tipoTecho: "Losacero + impermeabilización",
      fundacion: "Zapata corrida",
      ventanas: "PVC doble vidrio",
      aislamiento: "Muros con poliestireno",
      acabados: "Mármol en estancia, madera en recámaras",
    },
    interior: {
      pisos: "Porcelanato 60×60",
      calefaccion: "Preparación para minisplit",
      aireAcondicionado: "Minisplit en estancia",
      chimenea: "Decorativa gas",
      electrodomesticos: "Cocina equipada",
      distribucion: "Planta abierta social",
      cuartosAdicionales: "Estudio",
      oficina: "Sí",
      sotano: "No",
      closets: "Walk-in en principal",
      techos: "2.75 m",
    },
    exterior: {
      patio: "Sí",
      porch: "Cochera techada",
      terraza: "Azotea con pérgola",
      balcon: "Principal",
      jardin: "Posterior con riego",
      piscina: "Alberca chica climatizada",
      cocinaExterior: "Asador fijo",
      cercado: "Perimetral",
      vista: "Ciudad parcial",
      iluminacion: "LED exterior",
    },
    estacionamiento: {
      garaje: "2 cajones",
      espacios: "2",
      cubierto: "Sí",
      accesoEv: "No",
      porton: "Eléctrico",
      cochera: "Adosada",
      driveway: "Adicional visitas",
    },
    loteTerreno: {
      tamano: "8×20 m",
      dimensiones: "160 m²",
      topografia: "Plana",
      esquina: "No",
      usoSuelo: "Habitacional",
      zonificacion: "H3",
    },
    utilidades: {
      agua: "Municipal",
      alcantarillado: "Drenaje sanitario",
      electricidad: "127/220 V",
      gas: "Natural estacionario",
      internet: "Fibra al domicilio",
      panelesSolares: "No",
      eficiencia: "Ventanas eficientes",
      calentadorAgua: "Gas rápida recuperación",
    },
    comunidadHoa: {
      hoa: "Sí",
      cuota: "1850",
      frecuencia: "Mensual",
      amenidades: "Club con alberca y gym",
      seguridad: "Caseta 24 h",
      gated: "Acceso controlado",
    },
    financiera: {
      impuestosAnuales: "18500",
      precioPorPie: "Ref. mercado",
      ingresoActual: "—",
      gastosOperativos: "HOA + servicios",
      capRate: "—",
      sellerConcessions: "A negociar",
    },
    escuelasUbicacion: {
      distrito: "Escolar 8",
      primaria: "3 min en auto",
      secundaria: "5 min",
      preparatoria: "8 min",
      puntosCercanos: "Parque lineal, supermercado",
      transporte: "Ruta urbana a 200 m",
      vecindario: "Residencial consolidado",
      zona: "Cumbres / SPGG",
    },
    identificadores: {
      mls: "BR-QA-MLS-001",
      parcela: "123-456-789",
      codigoInterno: "LN-2026-BR-QA",
      referenciaAnunciante: "REF-AG-8844",
    },
    observacionesAgente: {
      observacionesPublicas: "Llaves listas; escritura en notaría convenida.",
      observacionesPrivadas: "Cliente prefiere ofertas firmes con carta bancaria.",
      restricciones: "Sin mascotas en amenidades comunes (reglamento HOA).",
      instruccionesShowing: "48 h mínimo para visita acompañada.",
    },
  };
}

function negocioForPublication(pub: BienesRaicesPublicationType, title: string, sellerEmail: string) {
  const sync = syncNegocioListingFieldsFromPublication(pub);
  const deep = deepSample();

  if (pub === "residencial_venta") {
    return mergePartialBienesRaicesNegocioState({
      advertiserType: "agente_individual",
      publicationType: pub,
      ...sync,
      titulo: title,
      precio: "925000",
      direccion: "Calle Río Amazonas 312, Col. Del Paseo",
      ciudad: "Monterrey",
      estado: "Nuevo León",
      codigoPostal: "64820",
      colonia: "Del Paseo",
      descripcionCorta: "Casa en fraccionamiento con amenidades, recámaras amplias y roof garden.",
      descripcionLarga:
        "Vivienda unifamiliar en coto con doble filtro de acceso, roof garden con pérgola y vista panorámica. Planta baja con estancia, cocina integral con barra de granito y medio baño. Planta alta: tres recámaras (principal con vestidor), dos baños completos y cuarto de lavado. Estacionamiento techado para dos autos. Acabados de lujo y mantenimiento impecable.",
      tipoPropiedad: "Casa",
      recamaras: "3",
      banosCompletos: "2",
      mediosBanos: "1",
      piesCuadrados: "2680",
      tamanoLote: "4100",
      estacionamientos: "2",
      anioConstruccion: "2019",
      niveles: "2",
      condicion: "Excelente",
      amueblado: "No",
      petsAllowed: "yes",
      hoaSiNo: "Sí",
      cuotaHoa: "1650",
      propertySubtype: "Residencial cerrado",
      highlightPresets: { piscina: true, comunidadCerrada: true, estacionamientoTechado: true },
      customHighlightsText: "Roof garden\nPreparación paneles solares",
      media: {
        photoUrls: [],
        primaryImageIndex: 0,
        listingVideoSlots: muxSlots(),
        virtualTourUrl: "https://my.matterport.com/show/?m=example",
        floorPlanUrls: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80"],
        sitePlanUrl: "",
        photoCaptions: ["Fachada principal", "Estancia", "Cocina"],
      },
      asesorFinancieroActivo: true,
      deepDetails: deep,
      identityAgente: {
        nombre: "Carlos Rivas",
        fotoUrl: "",
        rol: "Agente asociado",
        brokerage: "Leonix Realty Monterrey",
        logoBrokerageUrl: "",
        licencia: "AMPI 88421",
        telDirecto: "15555560101",
        telOficina: "15555560102",
        email: sellerEmail,
        sitioWeb: "https://example-leonix-realty.test",
        redes: ["https://instagram.com/example", "", "", "", ""],
        idiomas: "Español, inglés",
        areasServicio: "Monterrey metro, SPGG, Santa Catarina",
        bio: "Especialista en vivienda media-alta y negociación con bancos.",
        segundoAgenteActivo: false,
      },
      asesorFinanciero: {
        nombre: "Mariana López",
        fotoUrl: "",
        rol: "Asesora hipotecaria",
        compania: "Crédito Leonix Demo",
        telefono: "15555560155",
        email: "hipotecas.demo@example.com",
        sitioWeb: "https://example-credito.test",
        nmls: "998877",
        textoApoyo: "Preaprobación en 24 h hábiles sujeta a perfil crediticio.",
      },
      cta: {
        permitirSolicitarInfo: true,
        permitirProgramarVisita: true,
        permitirLlamar: true,
        permitirWhatsapp: true,
        mensajePrellenado: "Hola, me interesa conocer disponibilidad de visita.",
        instruccionesContacto: "Responderemos el mismo día hábil.",
        horarioPreferido: "Mañanas 9–13 h",
        openHouseActivo: true,
        openHouseFecha: "2026-05-03",
        openHouseInicio: "11:00",
        openHouseFin: "14:00",
        openHouseNotas: "Estacionamiento de visitas en calle lateral.",
      },
      trust: {
        mostrarLicencia: true,
        mostrarBrokerage: true,
        mostrarSitioWeb: true,
        mostrarRedes: true,
        confirmarInformacion: true,
        confirmarFotos: true,
        confirmarReglas: true,
        confirmarAutorizacion: true,
      },
    });
  }

  if (pub === "residencial_renta") {
    return mergePartialBienesRaicesNegocioState({
      advertiserType: "agente_individual",
      publicationType: pub,
      ...sync,
      titulo: title,
      precio: "28500",
      direccion: "Av. Constitución 1400 Depto 8B",
      ciudad: "Monterrey",
      estado: "Nuevo León",
      codigoPostal: "64000",
      colonia: "Centro",
      descripcionCorta: "Departamento amueblado en torre con amenidades, renta mensual.",
      descripcionLarga:
        "Departamento de dos recámaras completamente amueblado en torre con gimnasio, roof y cowork. Incluye una cajón de estacionamiento y bodega. Contrato mínimo 12 meses; aval con propiedad en NL o depósito en garantía según perfil.",
      tipoPropiedad: "Departamento",
      recamaras: "2",
      banosCompletos: "2",
      mediosBanos: "0",
      piesCuadrados: "1180",
      tamanoLote: "—",
      estacionamientos: "1",
      anioConstruccion: "2021",
      niveles: "1",
      condicion: "Como nuevo",
      amueblado: "Sí",
      petsAllowed: "no",
      hoaSiNo: "Incluido en renta",
      cuotaHoa: "0",
      highlightPresets: { balcon: true, vista: true },
      media: {
        photoUrls: [],
        primaryImageIndex: 0,
        listingVideoSlots: muxSlots(),
        virtualTourUrl: "",
        floorPlanUrls: [],
        sitePlanUrl: "",
        photoCaptions: [],
      },
      deepDetails: deep,
      identityAgente: {
        nombre: "Ana Torres",
        fotoUrl: "",
        rol: "Agente de rentas",
        brokerage: "Rentas Leonix",
        logoBrokerageUrl: "",
        licencia: "AMPI 77110",
        telDirecto: "15555560201",
        telOficina: "15555560202",
        email: sellerEmail,
        sitioWeb: "https://rentas-leonix.test",
        redes: ["", "", "", "", ""],
        idiomas: "Español",
        areasServicio: "Centro y zona contry",
        bio: "Enfoque en arrendamiento corporativo y residencial.",
        segundoAgenteActivo: false,
      },
      trust: {
        mostrarLicencia: true,
        mostrarBrokerage: true,
        mostrarSitioWeb: true,
        mostrarRedes: true,
        confirmarInformacion: true,
        confirmarFotos: true,
        confirmarReglas: true,
        confirmarAutorizacion: true,
      },
    });
  }

  if (pub === "comercial") {
    return mergePartialBienesRaicesNegocioState({
      advertiserType: "oficina_brokerage",
      publicationType: pub,
      ...sync,
      titulo: title,
      precio: "4500000",
      direccion: "Av. Lázaro Cárdenas 2400 Piso 3",
      ciudad: "San Pedro Garza García",
      estado: "Nuevo León",
      codigoPostal: "66260",
      colonia: "Valle Oriente",
      descripcionCorta: "Oficinas Class A con recepción, sala de juntas y estacionamiento.",
      descripcionLarga:
        "Nivel completo de oficinas con división en módulos, cableado estructurado, HVAC central y planta de emergencia. Ideal corporativo regional o tech hub. Estacionamiento proporcional 1:35 m² y acceso controlado con tarjeta.",
      tipoPropiedad: "Oficinas",
      recamaras: "—",
      banosCompletos: "4",
      mediosBanos: "2",
      piesCuadrados: "5200",
      tamanoLote: "—",
      estacionamientos: "12",
      anioConstruccion: "2015",
      niveles: "1",
      condicion: "Buena",
      amueblado: "Parcial",
      petsAllowed: "yes",
      hoaSiNo: "Sí",
      cuotaHoa: "Por cotizar",
      highlightPresets: { accesoControlado: true, elevador: true },
      media: {
        photoUrls: [],
        primaryImageIndex: 0,
        listingVideoSlots: muxSlots(),
        virtualTourUrl: "",
        floorPlanUrls: [],
        sitePlanUrl: "",
        photoCaptions: [],
      },
      deepDetails: deep,
      identityOficina: {
        nombreOficina: "Leonix Commercial SPGG",
        logoUrl: "",
        telPrincipal: "15555560301",
        email: sellerEmail,
        sitioWeb: "https://commercial-leonix.test",
        redes: ["https://linkedin.com/company/example", "", "", "", ""],
        direccionOficina: "Torre Koi, piso 15",
        horario: "Lun–Vie 9–19 h",
        contactoPrincipal: "Lic. Pedro Sánchez",
        contactoSecundario: "Recepción",
        bio: "Brokerage corporativo con 15 años en NL.",
        areasServicio: "Monterrey metro, Saltillo, Laredo",
      },
      trust: {
        mostrarLicencia: true,
        mostrarBrokerage: true,
        mostrarSitioWeb: true,
        mostrarRedes: true,
        confirmarInformacion: true,
        confirmarFotos: true,
        confirmarReglas: true,
        confirmarAutorizacion: true,
      },
    });
  }

  if (pub === "terreno") {
    return mergePartialBienesRaicesNegocioState({
      advertiserType: "agente_individual",
      publicationType: pub,
      ...sync,
      titulo: title,
      precio: "520000",
      direccion: "Carretera a García km 4.5",
      ciudad: "García",
      estado: "Nuevo León",
      codigoPostal: "66001",
      colonia: "Los Girasoles",
      descripcionCorta: "Terreno habitacional en esquina con servicios al frente.",
      descripcionLarga:
        "Macro lote en esquina con frentes de 24 m y 32 m, topografía plana y cerca de avenida arterial. Factibilidad de servicios verificada; ideal desarrollador boutique o vivienda unifamiliar de lujo.",
      tipoPropiedad: "Terreno",
      recamaras: "—",
      banosCompletos: "—",
      piesCuadrados: "—",
      tamanoLote: "12500",
      estacionamientos: "—",
      anioConstruccion: "—",
      niveles: "—",
      condicion: "Terreno natural",
      amueblado: "No",
      petsAllowed: "yes",
      hoaSiNo: "No",
      cuotaHoa: "",
      highlightPresets: { patio: false },
      media: {
        photoUrls: [],
        primaryImageIndex: 0,
        listingVideoSlots: muxSlots(),
        virtualTourUrl: "",
        floorPlanUrls: [],
        sitePlanUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&q=80",
        photoCaptions: [],
      },
      deepDetails: deep,
      identityAgente: {
        nombre: "Luis Cantú",
        fotoUrl: "",
        rol: "Asesor terrenos",
        brokerage: "Terrenos NL",
        logoBrokerageUrl: "",
        licencia: "AMPI 66002",
        telDirecto: "15555560401",
        telOficina: "",
        email: sellerEmail,
        sitioWeb: "https://terrenos-nl.test",
        redes: ["", "", "", "", ""],
        idiomas: "Español",
        areasServicio: "García, Escobedo",
        bio: "Valoraciones de suelo y viabilidad urbanística.",
        segundoAgenteActivo: false,
      },
      trust: {
        mostrarLicencia: true,
        mostrarBrokerage: true,
        mostrarSitioWeb: true,
        mostrarRedes: true,
        confirmarInformacion: true,
        confirmarFotos: true,
        confirmarReglas: true,
        confirmarAutorizacion: true,
      },
    });
  }

  if (pub === "proyecto_nuevo") {
    return mergePartialBienesRaicesNegocioState({
      advertiserType: "constructor_desarrollador",
      publicationType: pub,
      ...sync,
      titulo: title,
      precio: "3450000",
      direccion: "Av. Universidad 5500 (punto de ventas)",
      ciudad: "San Nicolás de los Garza",
      estado: "Nuevo León",
      codigoPostal: "66470",
      colonia: "Residencial Anáhuac",
      descripcionCorta: "Torre residencial nueva: amenidades resort y entrega 2027.",
      descripcionLarga:
        "Desarrollo de 120 unidades con alberca infinity, sky lounge, gimnasio y pet park. Unidades de 2 y 3 recámaras; acabados premium y cocinas europeas. Punto de ventas con prototipo virtual y esquema de apartado flexible.",
      tipoPropiedad: "Departamento",
      recamaras: "3",
      banosCompletos: "2",
      mediosBanos: "1",
      piesCuadrados: "1950",
      tamanoLote: "—",
      estacionamientos: "2",
      anioConstruccion: "2027",
      niveles: "12",
      condicion: "Nuevo",
      amueblado: "No",
      petsAllowed: "yes",
      hoaSiNo: "Proyectado",
      cuotaHoa: "TBD",
      proyectoComunidad: "Residencial Leonix Anáhuac",
      proyectoModelo: "Modelo B+",
      proyectoEtapa: "II",
      proyectoEntregaEstimada: "Q2 2027",
      proyectoUnidadesDisponibles: "38",
      proyectoAmenidades: "Sky pool, cowork, cinema room, kids club",
      highlightPresets: { amenidadesDesarrollo: true, elevador: true },
      media: {
        photoUrls: [],
        primaryImageIndex: 0,
        listingVideoSlots: muxSlots(),
        virtualTourUrl: "",
        floorPlanUrls: [],
        sitePlanUrl: "",
        photoCaptions: [],
      },
      deepDetails: deep,
      identityConstructor: {
        nombreDesarrollador: "Constructora Leonix Demo",
        logoUrl: "",
        proyectoNombre: "Torre Anáhuac Leonix",
        modelo: "B+ corner",
        direccionVentas: "Av. Universidad 5500 local 2",
        tel: "15555560501",
        email: sellerEmail,
        sitioWeb: "https://torre-anahuac-leonix.test",
        redes: ["https://facebook.com/example", "", "", "", ""],
        horarioVentas: "Mar–Dom 11–19 h",
        estadoDesarrollo: "Excavación completada",
        entregaEstimada: "Junio 2027",
        descripcionProyecto: "Certificación en eficiencia energética prevista.",
        contactoPrincipal: "Ventas corporativas",
        contactoSecundario: "Postventa",
      },
      trust: {
        mostrarLicencia: true,
        mostrarBrokerage: true,
        mostrarSitioWeb: true,
        mostrarRedes: true,
        confirmarInformacion: true,
        confirmarFotos: true,
        confirmarReglas: true,
        confirmarAutorizacion: true,
      },
    });
  }

  /* multifamiliar_inversion */
  return mergePartialBienesRaicesNegocioState({
    advertiserType: "equipo_agentes",
    publicationType: pub,
    ...sync,
    titulo: title,
    precio: "7800000",
    direccion: "Calle Hidalgo 900",
    ciudad: "Monterrey",
    estado: "Nuevo León",
    codigoPostal: "64060",
    colonia: "Barrio Antiguo",
    descripcionCorta: "Edificio de 6 unidades mixtas; oportunidad de inversión con renta establecida.",
    descripcionLarga:
      "Portafolio multifamiliar con 4 departamentos en renta y 2 locales comerciales en planta baja. Ocupación histórica 94%; mantenimiento reciente en fachada e impermeabilización. Estados financieros resumidos disponibles bajo NDA.",
    tipoPropiedad: "Multifamiliar",
    recamaras: "—",
    banosCompletos: "—",
    piesCuadrados: "9800",
    tamanoLote: "5200",
    estacionamientos: "10",
    anioConstruccion: "1998",
    niveles: "3",
    condicion: "Buena",
    amueblado: "No",
    petsAllowed: "no",
    hoaSiNo: "No aplica",
    cuotaHoa: "",
    invNumUnidades: "6",
    invRentaActual: "185000",
    invOcupacion: "94%",
    invCapRate: "7.2%",
    invIngresoEstimado: "2220000 anual bruto",
    highlightPresets: {},
    media: {
      photoUrls: [],
      primaryImageIndex: 0,
      listingVideoSlots: muxSlots(),
      virtualTourUrl: "",
      floorPlanUrls: [],
      sitePlanUrl: "",
      photoCaptions: [],
    },
    deepDetails: deep,
    identityEquipo: {
      nombreEquipo: "Equipo Inversión Leonix",
      imagenUrl: "",
      brokerage: "Leonix Capital Residencial",
      logoUrl: "",
      telGeneral: "15555560601",
      email: sellerEmail,
      sitioWeb: "https://inversion-leonix.test",
      redes: ["", "", "", "", ""],
      areasServicio: "NL y Coahuila",
      bio: "Adquisición y repositioning multifamiliar.",
      agentePrincipalNombre: "Ricardo Páez",
      agentePrincipalRol: "Director inversiones",
      segundoAgenteNombre: "Sofía Nájera",
      segundoAgenteRol: "Analista",
      segundoAgenteTelefono: "15555560602",
    },
    trust: {
      mostrarLicencia: true,
      mostrarBrokerage: true,
      mostrarSitioWeb: true,
      mostrarRedes: true,
      confirmarInformacion: true,
      confirmarFotos: true,
      confirmarReglas: true,
      confirmarAutorizacion: true,
    },
  });
}

async function ensureListing(userClient: SupabaseClient, ownerId: string, built: LeonixBrDraftPublishBuildResult): Promise<string> {
  if (!built.ok) throw new Error(built.error);

  const row = buildListingsInsertRowForLeonixPublish(ownerId, built.params);
  const sb = userClient as Parameters<typeof insertListingsRowResilient>[0];
  const { data, error } = await insertListingsRowResilient(sb, row);
  if (error || !data?.id) throw new Error(error?.message ?? "insert failed");
  const id = data.id;
  const appendix = leonixGalleryAppendixForDescription("es", [...QA_PHOTOS]);
  const desc = `${built.params.description.trim()}${appendix}`.trim();
  const gallery = [...QA_PHOTOS] as string[];
  const { error: uErr } = await userClient.from("listings").update({ description: desc, images: gallery }).eq("id", id);
  if (uErr) throw new Error(uErr.message);
  return id;
}

async function findExistingId(
  userClient: SupabaseClient,
  ownerId: string,
  title: string,
): Promise<string | null> {
  const { data, error } = await userClient
    .from("listings")
    .select("id")
    .eq("category", "bienes-raices")
    .eq("owner_id", ownerId)
    .eq("title", title)
    .maybeSingle();
  if (error) return null;
  const id = (data as { id?: string } | null)?.id;
  return id ? String(id) : null;
}

async function main() {
  hydrateEnv();
  const stamp = (process.env.BR_MANUAL_QA_STAMP ?? "br-manual-qa-catalog-v1").trim();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const service = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const email = (process.env.BR_SMOKE_EMAIL ?? "").trim();
  const password = (process.env.BR_SMOKE_PASSWORD ?? "").trim();

  if (!email || !password) {
    console.error("BR_MANUAL_QA_SEED=BLOCKED_BY_AUTH missing BR_SMOKE_EMAIL or BR_SMOKE_PASSWORD");
    process.exit(2);
  }
  if (!url || !anon) {
    console.error("BR_MANUAL_QA_SEED=BLOCKED_BY_ENV missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(2);
  }
  if (!service) {
    console.error("BR_MANUAL_QA_SEED=BLOCKED_BY_ENV missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(2);
  }

  const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: signData, error: signErr } = await userClient.auth.signInWithPassword({ email, password });
  if (signErr || !signData.user) {
    console.error("BR_MANUAL_QA_SEED=BLOCKED_BY_AUTH", signErr?.message ?? "no user");
    process.exit(2);
  }
  const ownerId = signData.user.id;

  type Created = { lane: string; sub: string; id: string; title: string; filterUrl: string };
  const created: Created[] = [];

  const privSpecs: Array<{ sub: string; title: string; state: ReturnType<typeof privadoResidencial> }> = [
    { sub: "residencial", title: `${stamp} Privado residencial`, state: privadoResidencial(`${stamp} Privado residencial`, email) },
    { sub: "comercial", title: `${stamp} Privado comercial`, state: privadoComercial(`${stamp} Privado comercial`, email) },
    { sub: "terreno_lote", title: `${stamp} Privado terreno`, state: privadoTerreno(`${stamp} Privado terreno`, email) },
  ];

  for (const p of privSpecs) {
    let id = await findExistingId(userClient, ownerId, p.title);
    if (!id) {
      const built = buildPublishParamsFromBienesRaicesPrivadoDraft(p.state, "es");
      id = await ensureListing(userClient, ownerId, built);
    }
    const q = encodeURIComponent(stamp);
    const filterUrl = `/clasificados/bienes-raices/resultados?lang=es&operationType=venta&q=${q}`;
    created.push({ lane: "privado", sub: p.sub, id, title: p.title, filterUrl });
  }

  for (const pub of NEGOCIO_PUBLICATIONS) {
    const title = `${stamp} Negocio ${pub}`;
    let id = await findExistingId(userClient, ownerId, title);
    if (!id) {
      const state = negocioForPublication(pub, title, email);
      const built = buildPublishParamsFromBienesRaicesNegocioDraft(state, "es");
      id = await ensureListing(userClient, ownerId, built);
    }
    const q = encodeURIComponent(stamp);
    const op = pub === "residencial_renta" ? "renta" : "venta";
    const filterUrl = `/clasificados/bienes-raices/resultados?lang=es&operationType=${op}&sellerType=negocio&q=${q}`;
    created.push({ lane: "negocio", sub: pub, id, title, filterUrl });
  }

  const anonBrowse = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const ids = created.map((c) => c.id);
  const { data: catalog, error: cErr } = await anonBrowse
    .from("listings")
    .select(
      "id, title, description, city, price, is_free, images, detail_pairs, seller_type, business_name, created_at, updated_at, published_at, status, is_published",
    )
    .eq("category", "bienes-raices")
    .eq("is_published", true)
    .eq("status", "active")
    .in("id", ids);
  if (cErr) {
    console.error("BR_MANUAL_QA_SEED=FAIL anon catalog", cErr.message);
    process.exit(1);
  }
  const rows = (catalog ?? []) as BrListingDbRow[];
  assert.equal(rows.length, ids.length, "anon browse should return all seeded rows");

  const cards = rows.map((r) => mapBrListingRowToNegocioCard(r, "es"));
  for (const c of created) {
    const st = parseBrResultsUrl(new URLSearchParams(c.filterUrl.split("?")[1] ?? ""));
    const filtered = filterBrListings(cards, st, null);
    assert.ok(filtered.some((x) => x.id === c.id), `filter should include ${c.id} (${c.title})`);
  }

  const origin = baseOriginForQaLinks();
  console.log("");
  console.log("BR_MANUAL_QA_SEED=OK");
  console.log("BR_MANUAL_QA_LISTING_IDS=", JSON.stringify(created.map((x) => ({ lane: x.lane, sub: x.sub, id: x.id }))));
  console.log("Title stamp:", stamp);
  console.log("");
  for (const c of created) {
    console.log(`— ${c.lane} / ${c.sub}`);
    console.log(`  id: ${c.id}`);
    console.log(`  title: ${c.title}`);
    console.log(`  detail: ${origin}/clasificados/anuncio/${c.id}?lang=es`);
    console.log(`  filters: ${origin}${c.filterUrl}`);
  }
  console.log("");
  console.log("Dashboard:", `${origin}/dashboard/mis-anuncios?lang=es`);
  console.log("Admin:", `${origin}/admin/workspace/clasificados?category=bienes-raices&q=${encodeURIComponent(stamp)}`);
  console.log("");
  console.log("Cleanup (do not run automatically):");
  console.log(`  npx tsx scripts/br-smoke-cleanup.ts --title-prefix ${stamp}`);
  console.log(`  npx tsx scripts/br-smoke-cleanup.ts --ids ${ids.join(",")}`);
  console.log("");
}

main().catch((e) => {
  console.error("BR_MANUAL_QA_SEED=FAIL", e);
  process.exit(1);
});
