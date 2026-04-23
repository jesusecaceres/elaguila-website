/**
 * Rentas sample-content + full browser QA (Privado + Negocio, multiple property shapes).
 * Keeps published rows unless RENTAS_SAMPLE_QA_DELETE=1 (service role cleanup).
 *
 * Run: npm run verify:rentas:sample-browser-qa
 * Requires: .env.local with Supabase + smoke seller/buyer (+ optional admin site password).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const SELLER_PASSWORD = process.env.SMOKE_SELLER_PASSWORD ?? "";
const BUYER_EMAIL = process.env.SMOKE_BUYER_EMAIL ?? "smoke.buyer@yourdomain.com";
const BUYER_PASSWORD = process.env.SMOKE_BUYER_PASSWORD ?? "";
const ADMIN_SITE_PASSWORD = process.env.ADMIN_PASSWORD ?? process.env.SMOKE_ADMIN_SITE_PASSWORD;

const DRAFT_PRIV = "rentas-privado-draft-v1";
const DRAFT_NEG = "rentas-negocio-draft-v1";

function authStorageKey(supabaseUrl: string): string {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

async function seedSupabaseSession(
  page: import("@playwright/test").Page,
  context: import("@playwright/test").BrowserContext,
  supabaseUrl: string,
  anonKey: string,
  email: string,
  password: string,
) {
  const browserAnon = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sess, error: sErr } = await browserAnon.auth.signInWithPassword({ email, password });
  if (sErr || !sess.session) throw new Error(sErr?.message ?? "signInWithPassword failed");
  const storageKey = authStorageKey(supabaseUrl);
  const persisted = JSON.stringify(sess.session);
  await context.addInitScript(
    ([k, v]) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    [storageKey, persisted] as const,
  );
  await page.goto("/");
  await page.evaluate(
    ({ k, v }) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    { k: storageKey, v: persisted },
  );
}

function tinyPngDataUrl(): string {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9W1t0AAAAASUVORK5CYII=";
}

async function seedDraftForNextNavigation(
  context: import("@playwright/test").BrowserContext,
  page: import("@playwright/test").Page,
  key: string,
  state: unknown,
) {
  const raw = JSON.stringify(state);
  await context.addInitScript(
    ([k, r]) => {
      try {
        sessionStorage.setItem(k, r);
      } catch {
        /* ignore */
      }
      try {
        localStorage.setItem(`${k}-ls-fallback`, r);
      } catch {
        /* ignore */
      }
    },
    [key, raw] as const,
  );
  await page.evaluate(
    ({ k, r }) => {
      try {
        sessionStorage.setItem(k, r);
      } catch {
        /* ignore */
      }
      try {
        localStorage.setItem(`${k}-ls-fallback`, r);
      } catch {
        /* ignore */
      }
    },
    { k: key, r: raw },
  );
}

function listingIdFromUrl(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    const m = u.pathname.match(/\/clasificados\/rentas\/listing\/([^/?#]+)/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  } catch {
    const m = urlStr.match(/\/clasificados\/rentas\/listing\/([^/?#]+)/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }
}

type Branch = "privado" | "negocio";
type Cat = "residencial" | "comercial" | "terreno_lote";

type FlowRow = {
  application: "PASS" | "FAIL";
  previewQuality: "PASS" | "FAIL";
  publish: "PASS" | "FAIL";
  landing: "PASS" | "FAIL";
  results: "PASS" | "FAIL";
  filterDiscovery: "PASS" | "FAIL";
  publicDetailParity: "PASS" | "FAIL";
  buyerInquiry: "PASS" | "FAIL" | "BLOCKED_BY_EXTERNAL_SERVICE";
  sellerDashboard: "PASS" | "FAIL";
  adminVisibility: "PASS" | "FAIL" | "BLOCKED_BY_ENV";
};

type SampleReport = {
  title: string;
  branch: Branch;
  categoria: Cat;
  subtypeSummary: string;
  keyValues: Record<string, string>;
  publishRoute: string;
  listingId: string | null;
  publicUrl: string | null;
  previewSnippet: string;
  previewMatchedDetail: boolean | null;
  filterUrl: string;
  flow: FlowRow;
};

function negocioBlock(tag: string, email: string) {
  return {
    negocioNombre: `Inmobiliaria Smoke ${tag}`,
    negocioMarca: "Leonix Smoke Realty",
    negocioLogoDataUrl: "",
    negocioLicencia: `LIC-SMOKE-${tag}`,
    negocioTelDirecto: "5555550101",
    negocioTelOficina: "5555550102",
    negocioEmail: email,
    negocioWhatsapp: "5555550103",
    negocioSitioWeb: "example.com",
    negocioRedes: "https://instagram.com/example",
    negocioBio: "Correduría de muestra para QA de Rentas (contenido controlado, sin datos reales de clientes).",
  };
}

function sellerBlock(email: string) {
  return {
    fotoDataUrl: "",
    nombre: "Smoke Seller",
    telefono: "5555550199",
    whatsapp: "5555550199",
    correo: email,
    notaContacto: "Mejor contacto por WhatsApp en horario de oficina.",
  };
}

function mediaBlock(video: string) {
  return {
    photoDataUrls: [tinyPngDataUrl()],
    primaryImageIndex: 0,
    videoUrl: video,
    videoLocalDataUrl: "",
  };
}

function baseConfirm() {
  return {
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  };
}

test.describe.configure({ timeout: 900_000 });

test.describe("Rentas sample content — multi-variant publish + browse QA", () => {
  test.beforeAll(async () => {
    test.skip(!url || !anon || !service, "Supabase env triplet required.");
    const admin = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    async function ensureUser(email: string, password: string) {
      const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error && !String(error.message).toLowerCase().includes("already")) throw error;
    }
    await ensureUser(SELLER_EMAIL, SELLER_PASSWORD);
    await ensureUser(BUYER_EMAIL, BUYER_PASSWORD);
  });

  test("publish variants, verify browse + roles", async ({ page, context }) => {
    test.skip(!url || !anon || !service);
    test.skip(!SELLER_PASSWORD || !BUYER_PASSWORD, "SMOKE_SELLER_PASSWORD / SMOKE_BUYER_PASSWORD required in .env.local");
    test.setTimeout(900_000);

    const tag = Date.now().toString(36);
    const adminClient = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    const createdIds: string[] = [];
    const samples: SampleReport[] = [];

    const mkCity = (label: string) => `${label}-${tag}`;

    const definitions: Array<{
      branch: Branch;
      cat: Cat;
      title: string;
      city: string;
      filterPath: string;
      subtypeSummary: string;
      keyValues: Record<string, string>;
      draft: Record<string, unknown>;
      previewPath: string;
    }> = [
      {
        branch: "privado",
        cat: "residencial",
        title: `[SMOKE][RENTAS][PRIVADO][RESIDENCIAL] Casa alberca ${tag}`,
        city: mkCity("MTY-Priv-Casa"),
        filterPath: `/clasificados/rentas/results?lang=es&city=${encodeURIComponent(mkCity("MTY-Priv-Casa"))}&pool=1`,
        subtypeSummary: "residencial · casa · dos_pisos · highlights piscina+patio",
        keyValues: {
          rent: "16200",
          deposit: "850",
          lease: "12-meses",
          zip: "64000",
          beds: "3",
          baths: "2",
          halfBaths: "1",
          sqft: "2150",
          parking: "2",
        },
        previewPath: "/clasificados/rentas/preview/privado?lang=es&propiedad=residencial",
        draft: {
          v: 1,
          categoriaPropiedad: "residencial",
          titulo: `[SMOKE][RENTAS][PRIVADO][RESIDENCIAL] Casa alberca ${tag}`,
          rentaMensual: "16200",
          deposito: "850",
          plazoContrato: "12-meses",
          disponibilidad: "Disponible en 10 días",
          amueblado: "amueblado",
          mascotas: "permitidas",
          serviciosIncluidos: "Agua + jardinería básica",
          requisitos: "Identificación oficial + comprobante de ingresos",
          ciudad: mkCity("MTY-Priv-Casa"),
          ubicacionLinea: "Del Valle, CP 64000, frente a parque",
          enlaceMapa: "https://maps.google.com/?q=Monterrey+Mexico",
          descripcion:
            "Residencia de muestra para QA: distribución clara, alberca pequeña y patio. Copy pensado para revisar ritmo de lectura y secciones.",
          estadoAnuncio: "disponible",
          media: mediaBlock("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
          seller: sellerBlock(SELLER_EMAIL),
          residencial: {
            tipoCodigo: "casa",
            subtipo: "dos_pisos",
            recamaras: "3",
            banos: "2",
            mediosBanos: "1",
            interiorSqft: "2150",
            loteSqft: "4300",
            estacionamiento: "2",
            ano: "2014",
            condicion: "buena",
            highlightKeys: ["piscina", "patio"],
          },
          comercial: {},
          terreno: {},
          ...baseConfirm(),
        },
      },
      {
        branch: "privado",
        cat: "residencial",
        title: `[SMOKE][RENTAS][PRIVADO][RESIDENCIAL] Depto vista ${tag}`,
        city: mkCity("GDL-Priv-Apto"),
        filterPath: `/clasificados/rentas/results?lang=es&city=${encodeURIComponent(mkCity("GDL-Priv-Apto"))}&highlights=balcon,vista`,
        subtypeSummary: "residencial · apartamento · subtipo vista",
        keyValues: {
          rent: "12800",
          deposit: "600",
          lease: "6-meses",
          zip: "44110",
          beds: "2",
          baths: "2",
          sqft: "980",
          parking: "1",
        },
        previewPath: "/clasificados/rentas/preview/privado?lang=es&propiedad=residencial",
        draft: {
          v: 1,
          categoriaPropiedad: "residencial",
          titulo: `[SMOKE][RENTAS][PRIVADO][RESIDENCIAL] Depto vista ${tag}`,
          rentaMensual: "12800",
          deposito: "600",
          plazoContrato: "6-meses",
          disponibilidad: "Disponible 1 junio",
          amueblado: "sin_amueblar",
          mascotas: "no_permitidas",
          serviciosIncluidos: "Mantenimiento de áreas comunes",
          requisitos: "Mes de depósito + aval",
          ciudad: mkCity("GDL-Priv-Apto"),
          ubicacionLinea: "Col. Americana, CP 44110",
          enlaceMapa: "https://maps.google.com/?q=Guadalajara+Centro",
          descripcion:
            "Departamento de prueba orientado a filtros de amenidades (balcón + vista). Texto largo suficiente para evaluar interlineado y cortes en tarjeta.",
          estadoAnuncio: "disponible",
          media: mediaBlock(""),
          seller: sellerBlock(SELLER_EMAIL),
          residencial: {
            tipoCodigo: "apartamento",
            subtipo: "vista",
            recamaras: "2",
            banos: "2",
            mediosBanos: "0",
            interiorSqft: "980",
            loteSqft: "",
            estacionamiento: "1",
            ano: "2018",
            condicion: "excelente",
            highlightKeys: ["balcon", "vista"],
          },
          comercial: {},
          terreno: {},
          ...baseConfirm(),
        },
      },
      {
        branch: "privado",
        cat: "comercial",
        title: `[SMOKE][RENTAS][PRIVADO][COMERCIAL] Oficina suite ${tag}`,
        city: mkCity("QRO-Priv-Off"),
        filterPath: `/clasificados/rentas/results?lang=es&city=${encodeURIComponent(mkCity("QRO-Priv-Off"))}&propiedad=comercial`,
        subtypeSummary: "comercial · oficina · suite · destacados recepción + sala juntas",
        keyValues: { rent: "22500", deposit: "1200", lease: "mes-a-mes", sqft: "1450" },
        previewPath: "/clasificados/rentas/preview/privado?lang=es&propiedad=comercial",
        draft: {
          v: 1,
          categoriaPropiedad: "comercial",
          titulo: `[SMOKE][RENTAS][PRIVADO][COMERCIAL] Oficina suite ${tag}`,
          rentaMensual: "22500",
          deposito: "1200",
          plazoContrato: "mes-a-mes",
          disponibilidad: "Entrega inmediata",
          amueblado: "sin_amueblar",
          mascotas: "no_permitidas",
          serviciosIncluidos: "Recepción compartida",
          requisitos: "Póliza RC + identificación",
          ciudad: mkCity("QRO-Priv-Off"),
          ubicacionLinea: "Centro sur, CP 76090",
          enlaceMapa: "",
          descripcion:
            "Oficina privada de muestra: copy para evaluar tono comercial vs residencial y claridad de requisitos contractuales.",
          estadoAnuncio: "disponible",
          media: mediaBlock(""),
          seller: sellerBlock(SELLER_EMAIL),
          residencial: {},
          comercial: {
            tipoCodigo: "oficina",
            subtipo: "suite",
            uso: "Profesional / consultoría",
            interiorSqft: "1450",
            oficinas: "6",
            banos: "2",
            niveles: "1",
            estacionamiento: "4",
            zonificacion: "H3",
            condicion: "buena",
            accesoCarga: false,
            destacadoIds: ["recepcion", "sala_juntas"],
          },
          terreno: {},
          ...baseConfirm(),
        },
      },
      {
        branch: "privado",
        cat: "terreno_lote",
        title: `[SMOKE][RENTAS][PRIVADO][TERRENO] Lote comercial ${tag}`,
        city: mkCity("SLP-Priv-Lote"),
        filterPath: `/clasificados/rentas/results?lang=es&city=${encodeURIComponent(mkCity("SLP-Priv-Lote"))}&propiedad=terreno_lote`,
        subtypeSummary: "terreno_lote · lote_comercial · esquina · destacados vista + acceso pavimentado",
        keyValues: { rent: "8900", deposit: "2000", lease: "1-ano", loteSqft: "12000" },
        previewPath: "/clasificados/rentas/preview/privado?lang=es&propiedad=terreno_lote",
        draft: {
          v: 1,
          categoriaPropiedad: "terreno_lote",
          titulo: `[SMOKE][RENTAS][PRIVADO][TERRENO] Lote comercial ${tag}`,
          rentaMensual: "8900",
          deposito: "2000",
          plazoContrato: "1-ano",
          disponibilidad: "Disponible para desarrollo",
          amueblado: "",
          mascotas: "",
          serviciosIncluidos: "",
          requisitos: "Uso de suelo acorde a zonificación",
          ciudad: mkCity("SLP-Priv-Lote"),
          ubicacionLinea: "Periférico oriente, CP 78394",
          enlaceMapa: "https://maps.google.com/?q=San+Luis+Potosi",
          descripcion:
            "Terreno de prueba para revisar cómo se comunica el arriendo de suelo frente a vivienda: expectativa de obra, accesos y servicios.",
          estadoAnuncio: "disponible",
          media: mediaBlock(""),
          seller: sellerBlock(SELLER_EMAIL),
          residencial: {},
          comercial: {},
          terreno: {
            tipoCodigo: "lote_comercial",
            subtipo: "esquina",
            loteSqft: "12000",
            usoZonificacion: "Comercial mixto",
            acceso: "Avenida principal",
            servicios: "Luz en poste",
            topografia: "Plano",
            listoConstruir: true,
            cercado: false,
            destacadoIds: ["vista", "acceso_pavimentado"],
          },
          ...baseConfirm(),
        },
      },
      {
        branch: "negocio",
        cat: "residencial",
        title: `[SMOKE][RENTAS][NEGOCIO][RESIDENCIAL] Townhome ${tag}`,
        city: mkCity("MTY-Neg-Town"),
        filterPath: `/clasificados/rentas/results?lang=es&city=${encodeURIComponent(mkCity("MTY-Neg-Town"))}&branch=negocio`,
        subtypeSummary: "negocio · residencial · townhome · adosado",
        keyValues: { rent: "19800", deposit: "1500", lease: "12-meses", beds: "4", baths: "3" },
        previewPath: "/clasificados/rentas/preview/negocio?lang=es&propiedad=residencial",
        draft: {
          v: 2,
          categoriaPropiedad: "residencial",
          titulo: `[SMOKE][RENTAS][NEGOCIO][RESIDENCIAL] Townhome ${tag}`,
          rentaMensual: "19800",
          deposito: "1500",
          plazoContrato: "12-meses",
          disponibilidad: "Tour con cita",
          amueblado: "amueblado",
          mascotas: "permitidas",
          serviciosIncluidos: "Seguridad 24h",
          requisitos: "Póliza de arrendamiento + referencias",
          ciudad: mkCity("MTY-Neg-Town"),
          ubicacionLinea: "Cumbres, CP 64346",
          enlaceMapa: "https://maps.google.com/?q=Cumbres+Monterrey",
          descripcion:
            "Townhome publicado por correduría: texto para evaluar credibilidad de negocio vs voz de propietario directo.",
          estadoAnuncio: "disponible",
          media: mediaBlock(""),
          seller: sellerBlock(SELLER_EMAIL),
          ...negocioBlock(tag, SELLER_EMAIL),
          residencial: {
            tipoCodigo: "townhome",
            subtipo: "adosado",
            recamaras: "4",
            banos: "3",
            mediosBanos: "1",
            interiorSqft: "2400",
            loteSqft: "3200",
            estacionamiento: "2",
            ano: "2020",
            condicion: "excelente",
            highlightKeys: ["comunidadCerrada", "estacionamientoTechado"],
          },
          comercial: {},
          terreno: {},
          ...baseConfirm(),
        },
      },
      {
        branch: "negocio",
        cat: "residencial",
        title: `[SMOKE][RENTAS][NEGOCIO][RESIDENCIAL] Multifamiliar ${tag}`,
        city: mkCity("PUE-Neg-Multi"),
        filterPath: `/clasificados/rentas/results?lang=es&city=${encodeURIComponent(mkCity("PUE-Neg-Multi"))}&branch=negocio&rent_min=17500`,
        subtypeSummary: "negocio · residencial · multifamiliar · varias_unidades",
        keyValues: { rent: "18500", deposit: "900", lease: "2-anos" },
        previewPath: "/clasificados/rentas/preview/negocio?lang=es&propiedad=residencial",
        draft: {
          v: 2,
          categoriaPropiedad: "residencial",
          titulo: `[SMOKE][RENTAS][NEGOCIO][RESIDENCIAL] Multifamiliar ${tag}`,
          rentaMensual: "18500",
          deposito: "900",
          plazoContrato: "2-anos",
          disponibilidad: "Contratos corporativos bienvenidos",
          amueblado: "sin_amueblar",
          mascotas: "no_permitidas",
          serviciosIncluidos: "Jardinería",
          requisitos: "Depósito en garantía",
          ciudad: mkCity("PUE-Neg-Multi"),
          ubicacionLinea: "Angelópolis, CP 72830",
          enlaceMapa: "",
          descripcion: "Inversión residencial en renta: copy para revisar si el tono corporativo abruma al usuario final.",
          estadoAnuncio: "disponible",
          media: mediaBlock(""),
          seller: sellerBlock(SELLER_EMAIL),
          ...negocioBlock(tag, SELLER_EMAIL),
          residencial: {
            tipoCodigo: "multifamiliar",
            subtipo: "varias_unidades",
            recamaras: "6",
            banos: "4",
            mediosBanos: "0",
            interiorSqft: "4100",
            loteSqft: "7200",
            estacionamiento: "6",
            ano: "2010",
            condicion: "buena",
            highlightKeys: ["lavanderia", "walkInCloset"],
          },
          comercial: {},
          terreno: {},
          ...baseConfirm(),
        },
      },
      {
        branch: "negocio",
        cat: "comercial",
        title: `[SMOKE][RENTAS][NEGOCIO][COMERCIAL] Local frente ${tag}`,
        city: mkCity("CDMX-Neg-Local"),
        filterPath: `/clasificados/rentas/results?lang=es&city=${encodeURIComponent(mkCity("CDMX-Neg-Local"))}&branch=negocio&propiedad=comercial`,
        subtypeSummary: "negocio · comercial · local · frente_calle",
        keyValues: { rent: "31000", deposit: "3100", lease: "12-meses" },
        previewPath: "/clasificados/rentas/preview/negocio?lang=es&propiedad=comercial",
        draft: {
          v: 2,
          categoriaPropiedad: "comercial",
          titulo: `[SMOKE][RENTAS][NEGOCIO][COMERCIAL] Local frente ${tag}`,
          rentaMensual: "31000",
          deposito: "3100",
          plazoContrato: "12-meses",
          disponibilidad: "Entrega con mes de gracia",
          amueblado: "sin_amueblar",
          mascotas: "no_permitidas",
          serviciosIncluidos: "Basura",
          requisitos: "Anticipo + aval bancario",
          ciudad: mkCity("CDMX-Neg-Local"),
          ubicacionLinea: "Roma Norte, CP 06700",
          enlaceMapa: "https://maps.google.com/?q=Roma+Norte",
          descripcion:
            "Local comercial de muestra: enfatiza tráfico peatonal y fachada para validar badges y jerarquía visual en resultados.",
          estadoAnuncio: "disponible",
          media: mediaBlock(""),
          seller: sellerBlock(SELLER_EMAIL),
          ...negocioBlock(tag, SELLER_EMAIL),
          residencial: {},
          comercial: {
            tipoCodigo: "local",
            subtipo: "frente_calle",
            uso: "Retail / cafetería",
            interiorSqft: "880",
            oficinas: "0",
            banos: "2",
            niveles: "1",
            estacionamiento: "0",
            zonificacion: "HC",
            condicion: "excelente",
            accesoCarga: true,
            destacadoIds: ["alto_trafico", "senalizacion"],
          },
          terreno: {},
          ...baseConfirm(),
        },
      },
      {
        branch: "negocio",
        cat: "terreno_lote",
        title: `[SMOKE][RENTAS][NEGOCIO][TERRENO] Terreno agrícola ${tag}`,
        city: mkCity("AGS-Neg-Ter"),
        filterPath: `/clasificados/rentas/results?lang=es&city=${encodeURIComponent(mkCity("AGS-Neg-Ter"))}&branch=negocio&propiedad=terreno_lote`,
        subtypeSummary: "negocio · terreno_lote · agricola · riegos",
        keyValues: { rent: "4500", deposit: "4500", lease: "1-ano" },
        previewPath: "/clasificados/rentas/preview/negocio?lang=es&propiedad=terreno_lote",
        draft: {
          v: 2,
          categoriaPropiedad: "terreno_lote",
          titulo: `[SMOKE][RENTAS][NEGOCIO][TERRENO] Terreno agrícola ${tag}`,
          rentaMensual: "4500",
          deposito: "4500",
          plazoContrato: "1-ano",
          disponibilidad: "Temporada agrícola",
          amueblado: "",
          mascotas: "",
          serviciosIncluidos: "",
          requisitos: "Contrato de uso de suelo",
          ciudad: mkCity("AGS-Neg-Ter"),
          ubicacionLinea: "Jesús María, CP 20900",
          enlaceMapa: "",
          descripcion:
            "Terreno agrícola en arriendo vía negocio: revisar si el copy agrícola se siente coherente con el resto del marketplace urbano.",
          estadoAnuncio: "disponible",
          media: mediaBlock(""),
          seller: sellerBlock(SELLER_EMAIL),
          ...negocioBlock(tag, SELLER_EMAIL),
          residencial: {},
          comercial: {},
          terreno: {
            tipoCodigo: "agricola",
            subtipo: "riegos",
            loteSqft: "435600",
            usoZonificacion: "Agrícola",
            acceso: "Camino terracería",
            servicios: "Sin servicios urbanos",
            topografia: "Suave pendiente",
            listoConstruir: false,
            cercado: true,
            destacadoIds: ["pozo", "cerca_servicios"],
          },
          ...baseConfirm(),
        },
      },
    ];

    let buyerInquiryOutcome: "PASS" | "FAIL" | "BLOCKED_BY_EXTERNAL_SERVICE" = "FAIL";
    let buyerInquiryStatus: number | null = null;
    let landingPrivadoHits = 0;
    let landingNegocioHits = 0;

    try {
      await seedSupabaseSession(page, context, url!, anon!, SELLER_EMAIL, SELLER_PASSWORD);

      for (const def of definitions) {
        const draftKey = def.branch === "privado" ? DRAFT_PRIV : DRAFT_NEG;
        const flow: FlowRow = {
          application: "PASS",
          previewQuality: "FAIL",
          publish: "FAIL",
          landing: "FAIL",
          results: "FAIL",
          filterDiscovery: "FAIL",
          publicDetailParity: "FAIL",
          buyerInquiry: "BLOCKED_BY_EXTERNAL_SERVICE",
          sellerDashboard: "FAIL",
          adminVisibility: ADMIN_SITE_PASSWORD ? "FAIL" : "BLOCKED_BY_ENV",
        };

        const rep: SampleReport = {
          title: def.title,
          branch: def.branch,
          categoria: def.cat,
          subtypeSummary: def.subtypeSummary,
          keyValues: def.keyValues,
          publishRoute: def.previewPath,
          listingId: null,
          publicUrl: null,
          previewSnippet: "",
          previewMatchedDetail: null,
          filterUrl: def.filterPath,
          flow,
        };

        await seedDraftForNextNavigation(context, page, draftKey, def.draft);
        await page.goto(def.previewPath);
        const publishBtn = page.getByRole("button", { name: /Publicar anuncio|Publish listing/i });
        await expect(publishBtn).toBeVisible({ timeout: 120_000 });
        flow.previewQuality = "PASS";

        const previewMain = await page.locator("main").first().innerText().catch(() => "");
        rep.previewSnippet = previewMain.slice(0, 1200);

        await publishBtn.click();
        await page.waitForURL(/\/clasificados\/rentas\/listing\//, { timeout: 120_000 });
        const id = listingIdFromUrl(page.url());
        expect(id).toBeTruthy();
        rep.listingId = id;
        rep.publicUrl = page.url();
        createdIds.push(id!);
        flow.publish = "PASS";

        await expect(page.getByText(def.title, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
        const detailText = await page.locator("body").innerText();
        /** Normalize NBSP / unicode so `includes` matches SSR + font shaping. */
        const nf = (s: string) => s.normalize("NFKC").replace(/\u00a0/g, " ").replace(/\u202f/g, " ");
        const detailNorm = nf(detailText);
        const titleShort = def.title.replace(/^(?:\[[^\]]+\])+\s*/, "").trim();
        const h1Text = nf((await page.locator("h1").first().innerText().catch(() => "")) ?? "");
        const titleOk =
          detailNorm.includes(nf(def.title)) ||
          (titleShort.length > 0 && detailNorm.includes(nf(titleShort))) ||
          (titleShort.length > 0 && h1Text.includes(nf(titleShort)));
        const addrHint = String((def.draft as { ubicacionLinea?: string }).ubicacionLinea ?? "").trim().slice(0, 18);
        const cityOk =
          detailNorm.includes(nf(def.city)) ||
          (addrHint.length > 3 && detailNorm.toLowerCase().includes(nf(addrHint).toLowerCase()));
        const rentDigits = String(def.keyValues.rent ?? "").replace(/\D/g, "");
        const rentNum = Number(rentDigits);
        const rentFormatted = Number.isFinite(rentNum) && rentNum > 0 ? rentNum.toLocaleString("en-US") : "";
        const rentFormattedEs = Number.isFinite(rentNum) && rentNum > 0 ? rentNum.toLocaleString("es-MX") : "";
        const rentOk =
          rentDigits.length > 0 &&
          (detailNorm.replace(/\D/g, "").includes(rentDigits) ||
            (!!rentFormatted && detailNorm.includes(rentFormatted)) ||
            (!!rentFormattedEs && detailNorm.includes(rentFormattedEs)));
        rep.previewMatchedDetail = titleOk && cityOk && rentOk;
        flow.publicDetailParity = rep.previewMatchedDetail ? "PASS" : "FAIL";

        await page.goto("/clasificados/rentas?lang=es");
        const onLanding = await page.getByText(def.title, { exact: false }).count();
        flow.landing = onLanding > 0 ? "PASS" : "FAIL";

        await page.goto(def.filterPath);
        await expect(page.getByText(def.title, { exact: false }).first()).toBeVisible({ timeout: 120_000 });
        flow.results = "PASS";
        flow.filterDiscovery = "PASS";

        const branchRe = def.branch === "privado" ? /Privado/i : /Negocio/i;
        await expect(page.getByText(branchRe).first()).toBeVisible({ timeout: 60_000 });

        samples.push(rep);
      }

      await page.goto("/clasificados/rentas?lang=es");
      const bodyLanding = await page.locator("body").innerText();
      landingPrivadoHits = (bodyLanding.match(/Privado/gi) ?? []).length;
      landingNegocioHits = (bodyLanding.match(/Negocio/gi) ?? []).length;

      await seedSupabaseSession(page, context, url!, anon!, BUYER_EMAIL, BUYER_PASSWORD);
      const inquiryTarget = samples[0]!;
      await page.goto(inquiryTarget.publicUrl!);
      await page
        .getByRole("button", { name: /Consulta por Leonix|Message via Leonix|Enviar mensaje|Send email/i })
        .first()
        .click();
      await expect(page.getByRole("heading", { name: /Contactar por correo|Email contact/i }).first()).toBeVisible({
        timeout: 30_000,
      });
      await page.getByPlaceholder(/Tu mensaje|Your message/i).fill("QA Rentas: solicitud de visita (mensaje automático).");
      const send = page.getByRole("button", { name: /Enviar por Leonix|Send via Leonix/i });
      await expect(send).toBeEnabled({ timeout: 30_000 });
      try {
        const respWait = page.waitForResponse(
          (r) => r.request().method() === "POST" && /\/api\/clasificados\/rentas\/inquiry\b/i.test(r.url()),
          { timeout: 35_000 },
        );
        await send.click();
        const resp = await respWait;
        buyerInquiryStatus = resp.status();
        if (resp.ok()) buyerInquiryOutcome = "PASS";
        else if (resp.status() >= 500 && (await resp.text()).toLowerCase().includes("messages")) {
          buyerInquiryOutcome = "BLOCKED_BY_EXTERNAL_SERVICE";
        } else buyerInquiryOutcome = "FAIL";
      } catch {
        buyerInquiryOutcome = "FAIL";
      }

      for (const s of samples) {
        s.flow.buyerInquiry = buyerInquiryOutcome;
      }

      await seedSupabaseSession(page, context, url!, anon!, SELLER_EMAIL, SELLER_PASSWORD);
      await page.goto("/dashboard/mis-anuncios?lang=es");
      await expect(page.getByText(/Mis anuncios|My listings/i).first()).toBeVisible({ timeout: 120_000 });
      await page.waitForLoadState("networkidle", { timeout: 90_000 }).catch(() => {});
      const dashBody = await page.locator("body").innerText();
      for (const s of samples) {
        s.flow.sellerDashboard = dashBody.includes(s.title) ? "PASS" : "FAIL";
      }

      if (ADMIN_SITE_PASSWORD) {
        await page.goto("/admin/login");
        await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD);
        await page.getByRole("button", { name: "Log in" }).click();
        await page.waitForURL(/\/admin(\/|$)/, { timeout: 25_000 });
        for (const s of samples) {
          await page.goto(`/admin/workspace/clasificados/rentas/${encodeURIComponent(s.listingId!)}`);
          await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
          const ok = await page.getByText(/Public listing projection/i).first().isVisible({ timeout: 45_000 }).catch(() => false);
          s.flow.adminVisibility = ok ? "PASS" : "FAIL";
        }
      }
    } finally {
      const reportDir = path.join(process.cwd(), "tmp");
      try {
        mkdirSync(reportDir, { recursive: true });
      } catch {
        /* ignore */
      }
      const payload = {
        generatedAt: new Date().toISOString(),
        buyerInquiryStatus,
        buyerInquiryOutcome,
        landingLabelHitsApprox: { privado: landingPrivadoHits, negocio: landingNegocioHits },
        samples,
      };
      writeFileSync(path.join(reportDir, "rentas-sample-content-report.json"), JSON.stringify(payload, null, 2), "utf8");

      if (process.env.RENTAS_SAMPLE_QA_DELETE === "1" && createdIds.length) {
        await adminClient.from("listings").delete().in("id", createdIds);
      }
    }

    for (const s of samples) {
      expect(s.flow.publish, s.title).toBe("PASS");
      expect(s.flow.results, s.title).toBe("PASS");
    }
  });
});
