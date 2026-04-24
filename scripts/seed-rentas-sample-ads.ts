#!/usr/bin/env tsx

/**
 * Seed comprehensive Rentas sample ads for manual QA
 * Covers all supported property types and subcategories for both Privado and Negocio branches
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user credentials from environment
const SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const SELLER_PASSWORD = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";

function tinyPngDataUrl(): string {
  // 1x1 transparent PNG
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9W1t0AAAAASUVORK5CYII=";
}

function nowTag(): string {
  return String(Date.now());
}

type SampleAd = {
  branch: "privado" | "negocio";
  categoriaPropiedad: "residencial" | "comercial" | "terreno_lote";
  tipoPropiedad: string;
  titulo: string;
  ciudad: string;
  rentaMensual: string;
  deposito: string;
  plazoContrato: string;
  disponibilidad: string;
  amueblado: string;
  mascotas: string;
  serviciosIncluidos: string;
  requisitos: string;
  descripcion: string;
  ubicacionLinea: string;
  enlaceMapa: string;
  estadoAnuncio: string;
  residencial?: Record<string, string>;
  comercial?: Record<string, string>;
  terreno?: Record<string, string>;
  negocioFields?: Record<string, string>;
};

const sampleAds: SampleAd[] = [
  // PRIVADO - RESIDENTIAL
  {
    branch: "privado",
    categoriaPropiedad: "residencial",
    tipoPropiedad: "casa",
    titulo: "Casa en renta con jardín - QA Sample",
    ciudad: `SanPedroQA-${nowTag().slice(-6)}`,
    rentaMensual: "22000",
    deposito: "1100",
    plazoContrato: "12-meses",
    disponibilidad: "Disponible hoy",
    amueblado: "sin_amueblar",
    mascotas: "permitidas",
    serviciosIncluidos: "Agua y mantenimiento",
    requisitos: "Comprobante de ingresos + depósito",
    descripcion: "Casa amplia con jardín, ideal para familias. Datos de prueba QA.",
    ubicacionLinea: "Zona Valle Oriente, CP 66260",
    enlaceMapa: "https://maps.google.com/?q=San+Pedro+Garza+Garcia",
    estadoAnuncio: "disponible",
    residencial: { recamaras: "3", banos: "2", construccionM2: "180", estacionamientos: "2" },
  },
  {
    branch: "privado",
    categoriaPropiedad: "residencial",
    tipoPropiedad: "apartamento",
    titulo: "Apartamento moderno en renta - QA Sample",
    ciudad: `MonterreyCentroQA-${nowTag().slice(-6)}`,
    rentaMensual: "15000",
    deposito: "750",
    plazoContrato: "6-meses",
    disponibilidad: "Disponible 1 de junio",
    amueblado: "amueblado",
    mascotas: "no_permitidas",
    serviciosIncluidos: "Gas y agua incluidos",
    requisitos: "Identificación + depósito + aval",
    descripcion: "Apartamento en centro, accesible y moderno. QA sample data.",
    ubicacionLinea: "Centro de Monterrey, CP 64000",
    enlaceMapa: "https://maps.google.com/?q=Monterrey+Centro",
    estadoAnuncio: "disponible",
    residencial: { recamaras: "2", banos: "2", construccionM2: "85", estacionamientos: "1" },
  },
  {
    branch: "privado",
    categoriaPropiedad: "residencial",
    tipoPropiedad: "condominio",
    titulo: "Condominio con amenities - QA Sample",
    ciudad: `ApodacaQA-${nowTag().slice(-6)}`,
    rentaMensual: "18500",
    deposito: "925",
    plazoContrato: "12-meses",
    disponibilidad: "Disponible inmediatamente",
    amueblado: "amueblado",
    mascotas: "permitidas",
    serviciosIncluidos: "Mantenimiento de áreas comunes",
    requisitos: "Verificación crediticia",
    descripcion: "Condominio con alberca y gimnasio. Datos de prueba.",
    ubicacionLinea: "Residencial Apodaca, CP 66600",
    enlaceMapa: "https://maps.google.com/?q=Apodaca+NL",
    estadoAnuncio: "disponible",
    residencial: { recamaras: "2", banos: "2", construccionM2: "110", estacionamientos: "1" },
  },
  
  // PRIVADO - COMMERCIAL
  {
    branch: "privado",
    categoriaPropiedad: "comercial",
    tipoPropiedad: "oficina",
    titulo: "Oficina comercial en renta - QA Sample",
    ciudad: `SantaCatarinaQA-${nowTag().slice(-6)}`,
    rentaMensual: "12000",
    deposito: "600",
    plazoContrato: "12-meses",
    disponibilidad: "Disponible julio",
    amueblado: "sin_amueblar",
    mascotas: "no_permitidas",
    serviciosIncluidos: "Estacionamiento y seguridad",
    requisitos: "Referencias comerciales",
    descripcion: "Oficina ideal para profesionales o pequeños equipos. QA sample.",
    ubicacionLinea: "Zona Industrial, CP 66100",
    enlaceMapa: "https://maps.google.com/?q=Santa+Catarina+NL",
    estadoAnuncio: "disponible",
    comercial: { superficieM2: "45", estacionamientos: "3", nivel: "1" },
  },
  {
    branch: "privado",
    categoriaPropiedad: "comercial",
    tipoPropiedad: "local",
    titulo: "Local comercial en plaza - QA Sample",
    ciudad: `GuadalupeQA-${nowTag().slice(-6)}`,
    rentaMensual: "18000",
    deposito: "900",
    plazoContrato: "12-meses",
    disponibilidad: "Disponible agosto",
    amueblado: "sin_amueblar",
    mascotas: "no_permitidas",
    serviciosIncluidos: "Seguridad 24/7",
    requisitos: "Depósito + contrato",
    descripcion: "Local comercial en zona de alta visibilidad. Datos de prueba QA.",
    ubicacionLinea: "Centro Comercial, CP 67170",
    enlaceMapa: "https://maps.google.com/?q=Guadalupe+NL",
    estadoAnuncio: "disponible",
    comercial: { superficieM2: "80", estacionamientos: "4", nivel: "PB" },
  },
  
  // PRIVADO - LAND
  {
    branch: "privado",
    categoriaPropiedad: "terreno_lote",
    tipoPropiedad: "lote_residencial",
    titulo: "Lote residencial en desarrollo - QA Sample",
    ciudad: `SantiagoQA-${nowTag().slice(-6)}`,
    rentaMensual: "8000",
    deposito: "400",
    plazoContrato: "mes-a-mes",
    disponibilidad: "Disponible inmediatamente",
    amueblado: "sin_amueblar",
    mascotas: "permitidas",
    serviciosIncluidos: "Acceso controlado",
    requisitos: "Depósito mensual",
    descripcion: "Lote para uso residencial temporal. QA sample data.",
    ubicacionLinea: "Fraccionamiento Santiago, CP 67300",
    enlaceMapa: "https://maps.google.com/?q=Santiago+NL",
    estadoAnuncio: "disponible",
    terreno: { superficieM2: "300", frenteM: "15", fondoM: "20" },
  },
  
  // NEGOCIO - RESIDENTIAL
  {
    branch: "negocio",
    categoriaPropiedad: "residencial",
    tipoPropiedad: "townhome",
    titulo: "Townhome administrado por inmobiliaria - QA Sample",
    ciudad: `CumbresQA-${nowTag().slice(-6)}`,
    rentaMensual: "25000",
    deposito: "1250",
    plazoContrato: "12-meses",
    disponibilidad: "Disponible septiembre",
    amueblado: "amueblado",
    mascotas: "permitidas",
    serviciosIncluidos: "Servicio de limpieza semanal",
    requisitos: "Aval sólido + depósito",
    descripcion: "Townhome en zona exclusiva, administrado profesionalmente. QA sample.",
    ubicacionLinea: "Cumbres, CP 64610",
    enlaceMapa: "https://maps.google.com/?q=Monterrey+Cumbres",
    estadoAnuncio: "disponible",
    residencial: { recamaras: "3", banos: "3", construccionM2: "200", estacionamientos: "2" },
    negocioFields: {
      negocioNombre: `Inmobiliaria Premium QA ${nowTag().slice(-6)}`,
      negocioMarca: "Premium Realty QA",
      negocioLicencia: "LIC-PREM-67890",
      negocioTelOficina: "8112345678",
      negocioEmail: "premium@qa.example.com",
      negocioSitioWeb: "premium-realty-qa.example.com",
      negocioBio: "Inmobiliaria especializada en propiedades de lujo. QA sample.",
    },
  },
  {
    branch: "negocio",
    categoriaPropiedad: "residencial",
    tipoPropiedad: "multifamiliar",
    titulo: "Edificio multifamiliar - QA Sample",
    ciudad: `SanNicolasQA-${nowTag().slice(-6)}`,
    rentaMensual: "35000",
    deposito: "1750",
    plazoContrato: "12-meses",
    disponibilidad: "Disponible octubre",
    amueblado: "sin_amueblar",
    mascotas: "no_permitidas",
    serviciosIncluidos: "Administración y mantenimiento",
    requisitos: "Garantía financiera",
    descripcion: "Edificio completo de 4 unidades. Datos de prueba QA.",
    ubicacionLinea: "Zona San Nicolás, CP 66480",
    enlaceMapa: "https://maps.google.com/?q=San+Nicolas+NL",
    estadoAnuncio: "disponible",
    residencial: { recamaras: "8", banos: "4", construccionM2: "400", estacionamientos: "4" },
    negocioFields: {
      negocioNombre: `Gestión Inmobiliaria QA ${nowTag().slice(-6)}`,
      negocioMarca: "Gestión QA Properties",
      negocioLicencia: "LIC-GEST-54321",
      negocioTelOficina: "8187654321",
      negocioEmail: "gestion@qa.example.com",
      negocioSitioWeb: "gestion-qa.example.com",
      negocioBio: "Especialistas en administración de propiedades comerciales. QA sample.",
    },
  },
  
  // NEGOCIO - COMMERCIAL
  {
    branch: "negocio",
    categoriaPropiedad: "comercial",
    tipoPropiedad: "bodega",
    titulo: "Bodega industrial en renta - QA Sample",
    ciudad: `EscobedoQA-${nowTag().slice(-6)}`,
    rentaMensual: "28000",
    deposito: "1400",
    plazoContrato: "24-meses",
    disponibilidad: "Disponible noviembre",
    amueblado: "sin_amueblar",
    mascotas: "no_permitidas",
    serviciosIncluidos: "Seguridad y vigilancia",
    requisitos: "Garantía bancaria",
    descripcion: "Bodega industrial con acceso de camiones. QA sample data.",
    ubicacionLinea: "Parque Industrial Escobedo, CP 66050",
    enlaceMapa: "https://maps.google.com/?q=Escobedo+NL",
    estadoAnuncio: "disponible",
    comercial: { superficieM2: "500", estacionamientos: "10", nivel: "1" },
    negocioFields: {
      negocioNombre: `Industrial Spaces QA ${nowTag().slice(-6)}`,
      negocioMarca: "Industrial QA Logistics",
      negocioLicencia: "LIC-IND-98765",
      negocioTelOficina: "8198765432",
      negocioEmail: "industrial@qa.example.com",
      negocioSitioWeb: "industrial-qa.example.com",
      negocioBio: "Especialistas en propiedades industriales y logística. QA sample.",
    },
  },
  
  // NEGOCIO - LAND
  {
    branch: "negocio",
    categoriaPropiedad: "terreno_lote",
    tipoPropiedad: "lote_comercial",
    titulo: "Lote comercial para desarrollo - QA Sample",
    ciudad: `GarciaQA-${nowTag().slice(-6)}`,
    rentaMensual: "15000",
    deposito: "750",
    plazoContrato: "12-meses",
    disponibilidad: "Disponible diciembre",
    amueblado: "sin_amueblar",
    mascotas: "no_permitidas",
    serviciosIncluidos: "Acceso y seguridad",
    requisitos: "Proyecto comercial aprobado",
    descripcion: "Lote comercial con alta visibilidad. Datos de prueba QA.",
    ubicacionLinea: "Carretera Nacional, CP 66000",
    enlaceMapa: "https://maps.google.com/?q=Garcia+NL",
    estadoAnuncio: "disponible",
    terreno: { superficieM2: "1000", frenteM: "25", fondoM: "40" },
    negocioFields: {
      negocioNombre: `Developers QA ${nowTag().slice(-6)}`,
      negocioMarca: "QA Development Group",
      negocioLicencia: "LIC-DEV-24680",
      negocioTelOficina: "8111223344",
      negocioEmail: "dev@qa.example.com",
      negocioSitioWeb: "dev-qa.example.com",
      negocioBio: "Consultores inmobiliarios especializados en desarrollo. QA sample.",
    },
  },
];

async function createSampleAd(ad: SampleAd): Promise<string> {
  const tag = nowTag();
  
  const listingData = {
    category: "rentas",
    seller_type: ad.branch,
    business_name: ad.negocioFields?.negocioNombre || null,
    title: ad.titulo,
    price: parseFloat(ad.rentaMensual),
    city: ad.ciudad,
    zip: null,
    status: "active",
    is_published: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: null,
    images: [tinyPngDataUrl()],
    detail_pairs: {
      rentasBranch: ad.branch,
      rentasSubcategoria: ad.categoriaPropiedad,
      tipoPropiedad: ad.tipoPropiedad,
      titulo: ad.titulo,
      rentaMensual: ad.rentaMensual,
      deposito: ad.deposito,
      plazoContrato: ad.plazoContrato,
      fechaDisponible: ad.disponibilidad,
      amueblado: ad.amueblado,
      mascotas: ad.mascotas,
      serviciosIncluidos: ad.serviciosIncluidos,
      requisitos: ad.requisitos,
      descripcion: ad.descripcion,
      ciudad: ad.ciudad,
      ubicacionLinea: ad.ubicacionLinea,
      enlaceMapa: ad.enlaceMapa,
      estadoAnuncio: ad.estadoAnuncio,
      ...(ad.residencial && { residencial: ad.residencial }),
      ...(ad.comercial && { comercial: ad.comercial }),
      ...(ad.terreno && { terreno: ad.terreno }),
      ...(ad.negocioFields && {
        negocioNombre: ad.negocioFields.negocioNombre,
        negocioMarca: ad.negocioFields.negocioMarca,
        negocioLicencia: ad.negocioFields.negocioLicencia,
        negocioTelOficina: ad.negocioFields.negocioTelOficina,
        negocioEmail: ad.negocioFields.negocioEmail,
        negocioSitioWeb: ad.negocioFields.negocioSitioWeb,
        negocioBio: ad.negocioFields.negocioBio,
      }),
    },
    views: 0,
    boost_expires: null,
  };

  const { data, error } = await supabase
    .from('listings')
    .insert(listingData)
    .select('id')
    .single();

  if (error) {
    console.error(`Error creating sample ad "${ad.titulo}":`, error);
    throw error;
  }

  console.log(`✅ Created sample ad: ${ad.titulo} (ID: ${data.id})`);
  return data.id;
}

async function main() {
  console.log(`🏠 Seeding ${sampleAds.length} Rentas sample ads for manual QA...`);
  
  const createdIds: string[] = [];
  
  try {
    for (const ad of sampleAds) {
      const id = await createSampleAd(ad);
      createdIds.push(id);
    }
    
    console.log(`\n✅ Successfully created ${createdIds.length} sample ads`);
    console.log(`\n📋 Summary:`);
    console.log(`- Privado Residential: ${sampleAds.filter(a => a.branch === 'privado' && a.categoriaPropiedad === 'residencial').length}`);
    console.log(`- Privado Commercial: ${sampleAds.filter(a => a.branch === 'privado' && a.categoriaPropiedad === 'comercial').length}`);
    console.log(`- Privado Land: ${sampleAds.filter(a => a.branch === 'privado' && a.categoriaPropiedad === 'terreno_lote').length}`);
    console.log(`- Negocio Residential: ${sampleAds.filter(a => a.branch === 'negocio' && a.categoriaPropiedad === 'residencial').length}`);
    console.log(`- Negocio Commercial: ${sampleAds.filter(a => a.branch === 'negocio' && a.categoriaPropiedad === 'comercial').length}`);
    console.log(`- Negocio Land: ${sampleAds.filter(a => a.branch === 'negocio' && a.categoriaPropiedad === 'terreno_lote').length}`);
    
    console.log(`\n🔗 Sample ad IDs for manual testing:`);
    createdIds.forEach((id, i) => {
      const ad = sampleAds[i];
      console.log(`- ${ad.titulo}: ${id}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding sample ads:', error);
    
    // Cleanup on error
    if (createdIds.length > 0) {
      console.log('🧹 Cleaning up created ads...');
      await supabase.from('listings').delete().in('id', createdIds);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
