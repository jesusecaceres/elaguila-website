"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";

type Lang = "es" | "en";

type CategoryKey =
  | "rentas"
  | "en-venta"
  | "empleos"
  | "servicios"
  | "restaurantes"
  | "viajes"
  | "autos"
  | "clases"
  | "comunidad"
  | null;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function MembresiasPage() {
  const params = useSearchParams();
  const lang: Lang = params?.get("lang") === "en" ? "en" : "es";

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>(null);
  const [autoSub, setAutoSub] = useState<"particular" | "negocio" | null>(null);
  const [rentasSub, setRentasSub] = useState<"persona" | "negocio" | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<"standard" | "plus" | null>(null);

  const withLang = (path: string) => {
    const joiner = path.includes("?") ? "&" : "?";
    return `${path}${joiner}lang=${lang}`;
  };

  const isBusinessPath =
    selectedCategory === "servicios" ||
    selectedCategory === "restaurantes" ||
    selectedCategory === "viajes" ||
    selectedCategory === "empleos" ||
    (selectedCategory === "autos" && autoSub === "negocio") ||
    (selectedCategory === "rentas" && rentasSub === "negocio");

  const copy = useMemo(() => {
    const c = {
      es: {
        title: "Membresías",
        subtitle: "Encuentra la opción correcta según lo que quieres publicar y cómo quieres crecer.",
        supportLine:
          "No todos publican igual. Algunas opciones son para vendedores personales y otras para negocios que quieren crecer con más fuerza.",

        selectorTitle: "¿Qué quieres publicar?",
        rentas: "Rentas",
        rentasHelp: "Publicaciones personales, propietarios o presencia profesional.",
        enVenta: "En venta",
        enVentaHelp: "Artículos, cosas del hogar, ventas personales.",
        empleos: "Empleos",
        empleosHelp: "Ofertas de trabajo y contratación.",
        servicios: "Servicios",
        serviciosHelp: "Si ofreces servicios al público, trabajas por citas o dependes de clientes.",
        restaurantes: "Restaurantes",
        restaurantesHelp: "Descubrimiento, confianza y contacto para tu negocio.",
        viajes: "Viajes",
        viajesHelp: "Agencias, ofertas de viajes y presencia profesional.",
        autos: "Autos",
        autosHelp: "Vehículos de particular o presencia comercial.",
        clases: "Clases",
        clasesHelp: "Clases, talleres y actividades.",
        comunidad: "Comunidad",
        comunidadHelp: "Publicaciones comunitarias, gratis.",
        enVentaIntro: "Para vendedores personales y ventas locales. Gratis vs LEONIX Pro — $9.99 por anuncio.",
        pricingRulePersonal: "Precio por anuncio (no mensual).",
        pricingRuleBusiness: "Planes de negocio: precio al mes.",
        personalIntro: "Si publicas como persona, estas son las opciones más relevantes para ti.",
        personalNote:
          "Estas opciones son para vendedores personales, no para negocios ni inventario comercial.",

        compareTitle: "Comparación rápida",
        compareHide: "Ocultar comparación",
        verQueIncluye: "Ver qué incluye",
        queCambiaSubir: "Qué cambia al subir",
        loQueGanas: "Lo que ganas con este plan",
        asistenciaExplain: "Ayuda a darle un impulso extra a tu anuncio por un tiempo cuando más lo necesitas.",
        pricePerPost: "Por anuncio",
        priceMonthly: "Al mes",
        compDuración: "Duración del anuncio",
        compDias7: "7 días",
        comp30diasPorAnuncio: "30 días por anuncio",
        compRepostLimit: "Republicaciones",
        compRepostGratis: "Límite bajo; pocas republicaciones permitidas.",
        compRepostPro: "Más flexibilidad para repostear cuando lo necesites.",
        compFotosContenido: "Fotos y contenido visual",
        compFotosGratis: "Menos fotos que Pro",
        compFotosPro: "Más fotos y mejor galería",
        compVideo: "Video",
        compComoSeMuestra: "Cómo se muestra tu anuncio",
        compPresentación: "Presentación del anuncio",
        compPresentacionMejor: "Mejor presentación",
        compAsistencia: "Asistencia de visibilidad",
        compVistas: "Vistas",
        compGuardados: "Guardados",
        compCompartidos: "Compartidos",
        compFormasContacto: "Formas de contacto",
        compBotonesContacto: "Llamar o enviar texto",
        compContactoStandard: "Llamada / teléfono",
        compContactoPlus: "Más formas: mensaje, email, videollamada, solicitar cotización",
        compDatosAnuncio: "Cómo va tu anuncio",
        compAnaliticas: "Datos del anuncio",
        compPrioridad: "Prioridad frente a opciones básicas",
        compBasica: "Básica",
        compMejorada: "Mejorada",
        compAmpliado: "Ampliado",
        compNoIncluido: "No incluido",
        compIncluido: "Incluido",
        compSinAnaliticas: "Sin analíticas",
        compVistasGuardadosCompartidos: "Vistas, guardados y compartidos",
        compLlamarTexto: "Llamar o enviar texto (si el vendedor lo activa)",
        compNo: "No",
        compSi: "Sí",
        comp1: "1",
        comp2: "2",
        compPerfil: "Perfil profesional",
        compPresenciaCategoria: "Presencia por categoría",
        compFotosVideo: "Fotos y video",
        compSoloImagenes: "Solo imágenes (sin video)",
        compImagenesYVideo: "Imágenes y video",
        compHerramientasContacto: "Formas de contacto",
        compPrioridadVisibilidad: "Prioridad de visibilidad",
        compAsistenciasVisibilidad: "Asistencias de visibilidad",
        compMasLlamadas: "Mejor oportunidad de generar llamadas o mensajes",
        compConvertir: "Mejor oportunidad de generar resultados",
        compGenerarContactos: "Mejor oportunidad de generar contactos",
        compGenerarCandidatos: "Mayor oportunidad de generar candidatos",
        compSugerenciasIA: "Sugerencias de IA",
        compMejorPara: "Mejor para",
        compIdealPara: "Ideal para",
        standardLine: "Standard te ayuda a verte profesionalmente.",
        plusLine: "Plus te ayuda a convertir mejor esa visibilidad en oportunidades.",
        queSignificaAsistencia: "Asistencia de visibilidad: le da un impulso extra a tu anuncio por un tiempo cuando más lo necesitas.",
        queSignificaVistas: "Vistas, guardados y compartidos: te ayudan a ver si tu anuncio está llamando la atención.",
        queSignificaBotones: "Botones de contacto: facilitan que te llamen o te manden texto más rápido.",
        tooltipAsistencia: "Impulso temporal en visibilidad para que tu anuncio destaque cuando más lo necesitas.",
        tooltipFormasContacto: "Las formas en que la gente puede contactarte desde el anuncio (llamar, escribir, etc.).",
        tooltipSugerenciasIA: "Consejos prácticos para mejorar tu anuncio según cómo va (fotos, video, precio, cuándo usar asistencia).",
        tooltipPresentacion: "Qué tan completo, claro y convincente se ve tu anuncio.",

        autoSplit: "¿Publicas como vendedor particular o como negocio?",
        autoParticular: "Particular",
        autoNegocio: "Negocio",
        autoParticularNote:
          "Si operas como lote, dealer o inventario comercial, te corresponde la ruta de negocio.",
        autoNegocioNote: "Para presencia comercial, inventario o operación como negocio.",

        rentasTop: "Rentas personales: un solo plan (LEONIX Pro) por anuncio. Si eres realtor o negocio, usa la ruta de negocio.",
        rentasSplit: "¿Publicas como persona o como negocio/profesional?",
        rentasPersona: "Persona / propietario ocasional",
        rentasNegocio: "Negocio / realtor / administrador",
        rentasPersonalCard: "Rentas personales (LEONIX Pro)",
        rentasPersonalPrice: "$24.99 por anuncio",
        rentasPersonalExplain: "Para propietarios o publicaciones personales ocasionales. 30 días por anuncio, más fotos, video, vistas y formas de contacto.",
        rentasPersonaCta: "Ver opciones de publicación",
        rentasNegocioNote:
          "Si publicas como realtor, administrador o presencia profesional recurrente, te conviene la ruta de negocio.",

        empleosCard: "Publicación de empleo (LEONIX Pro)",
        empleosPrice: "$24.99 por anuncio",
        empleosExplain: "Para vacantes y contratación. 30 días por anuncio, vistas y guardados, formas de contacto (llamar o texto), 1 asistencia de visibilidad y sugerencias para mejorar tu anuncio.",
        empleosNote:
          "Si eres empresa o publicas ofertas de empleo de forma recurrente, los planes de negocio te dan más presencia:",

        serviciosIntro:
          "Si ofreces servicios al público, trabajas por citas o dependes de clientes, esta ruta es para ti.",
        restaurantesIntro:
          "Para que más personas descubran tu restaurante, confíen y te contacten. Presencia y herramientas de negocio.",
        viajesIntro:
          "Para agencias, ofertas de viajes o presencia profesional en el sector. Presencia y herramientas de negocio.",
        plusSummaryStrong: "Bueno para negocios que quieren más impulso, más contacto y mejor oportunidad de generar resultados.",

        clasesIntro:
          "Algunas publicaciones comunitarias pueden ser más ligeras. Si tu oferta es claramente comercial o recurrente, conviene la ruta de negocio.",
        clasesPersonal: "Comunitario / personal",
        clasesNegocio: "Comercial / negocio recurrente",

        verDetalles: "Ver detalles",
        ocultarDetalles: "Ocultar detalles",
        idealPara: "Ideal para",
        incluye: "Qué incluye",
        queSignifica: "Qué significa",
        cuandoSubir: "Cuándo conviene subir",

        gratisTitle: "Gratis",
        gratisPrice: "Gratis",
        gratisSummary: "7 días por anuncio, menos fotos, sin video ni datos del anuncio. Límite bajo de republicaciones.",
        gratisIdeal: ["Personas que publican de vez en cuando", "Comunidad, artículos sueltos o necesidades básicas"],
        gratisIncluye: ["Publicación básica", "Visibilidad en búsqueda", "Presencia en el marketplace"],
        gratisSignifica: "Puedes estar presente y probar la plataforma sin pagar al inicio.",
        gratisSubir: "Si publicas seguido o quieres más fotos, mejor presentación o más datos.",

        proTitle: "LEONIX Pro",
        proPriceEnVenta: "$9.99 por anuncio",
        proPrice: "Desde tu cuenta",
        proSummary: "30 días por anuncio, más fotos, video, vistas y guardados, 1 asistencia de visibilidad y formas de contacto (llamar o texto).",
        proIdeal: ["Personas que venden con más frecuencia", "Quienes quieren verse más serios y destacar mejor"],
        proIncluye: ["Más duración y mejor presentación", "Más fotos, video y mejor descripción", "1 asistencia de visibilidad", "Vistas, guardados y compartidos", "Botones para llamar o enviar texto"],
        proSignifica: "Te deja ver cómo va tu anuncio y te ayuda a entender si la gente está respondiendo.",
        proSubir: "Si ya operas como negocio o dependes de captar clientes o contratos constantemente.",

        standardTitle: "Standard",
        standardPrice: "$49 al mes",
        standardSummary: "Presencia profesional, solo imágenes (sin video), contacto por llamada, datos del anuncio y 1 asistencia de visibilidad por anuncio activo cada 30 días.",
        standardIdeal: ["Negocios que quieren presencia profesional clara y constante", "Dueños que quieren verse mejor por categoría"],
        standardIncluye: ["Perfil profesional del negocio", "Presencia por categoría", "Solo imágenes (sin video)", "Contacto por llamada / teléfono", "1 asistencia de visibilidad por anuncio activo / 30 días", "Datos del anuncio (cómo va)"],
        standardSignifica: "Te ayuda a verte profesionalmente y a que más gente te descubra y te contacte.",
        standardSubir: "Si necesitas más llamadas, mensajes o urgencia de conversión.",

        plusTitle: "Plus",
        plusPrice: "$125 al mes",
        plusSummary: "Más presentación y más formas de contacto (mensaje, email, videollamada, solicitar cotización), 2 asistencias de visibilidad por anuncio activo cada 30 días y sugerencias de IA.",
        plusIdeal: ["Negocios que quieren cerrar más oportunidades", "Quienes necesitan mejor visibilidad y herramientas de contacto"],
        plusIncluye: ["Perfil premium para vender mejor", "Más formas de contacto (mensaje, email, videollamada, cotización)", "Mayor visibilidad y prioridad", "2 asistencias de visibilidad por anuncio activo / 30 días", "Sugerencias de IA para crecer"],
        plusSignifica: "Más impulso, más llamadas y textos, y mejor oportunidad de convertir vistas en clientes.",
        plusSubir: "",

        quizTitle: "¿Qué plan te conviene?",
        q1: "¿Qué buscas más ahorita?",
        q1a: "Tener presencia profesional",
        q1b: "Conseguir más llamadas, mensajes o clientes",
        q2: "¿Qué tan importante es que te contacten rápido desde tu anuncio?",
        q2a: "Algo",
        q2b: "Mucho",
        q3: "¿Quieres mostrar herramientas como sitio web, redes sociales o formas claras de contactarte?",
        q3a: "No tanto",
        q3b: "Sí, eso me importa",
        q4: "¿Tu negocio depende mucho de fotos, presentación y confianza visual?",
        q4a: "Algo",
        q4b: "Mucho",
        q5: "¿Tu meta principal es…?",
        q5a: "Tener presencia profesional",
        q5b: "Generar más resultados",
        resultStandard: "Te recomendamos Standard",
        resultPlus: "Te recomendamos Plus",
        resultStandardWhy:
          "Nos dijiste que buscas una presencia profesional clara y ordenada. Standard te ayuda a empezar fuerte sin complicarte.",
        resultPlusWhy:
          "Nos dijiste que quieres más contacto, más visibilidad y una presencia más fuerte para generar más resultados. Plus te conviene más.",
        quizNote: "Esta guía es solo una recomendación rápida.",
        quizAiLine: "LEONIX también puede ayudarte a mejorar tu anuncio con sugerencias como mejores fotos, mejor video o ajustes de precio cuando haga falta.",
        clasesComunidadFree: "Comunidad: es gratis, no necesitas membresía.",
        comunidadIntro: "Publicaciones comunitarias sin costo. No necesitas membresía para participar.",
        clasesComercialNote: "Si tu clase es de pago o claramente comercial, conviene la ruta de negocio.",
        autoDealerNote: "Si operas como dealer, lote o inventario comercial, te corresponde esta ruta.",
        quizReset: "Volver a responder",
        ctaAccount: "Ir a mi cuenta",

        resourceTitle: "LEONIX te ayuda a entender el lenguaje del negocio",
        resource1: "Qué significa SEO en palabras simples",
        resource2: "Qué significa ROI en palabras simples",
        resource3: "Cómo tomar mejores fotos para vender",
        resource4: "Cómo saber si tu anuncio va bien",
        resourceSoon: "El inicio de una guía para que negocios latinos entiendan mejor estos conceptos.",

        trustTitle: "Invertir en visibilidad también es parte de crecer",
        trustBody:
          "Muchos negocios tratan este tipo de inversión como parte de su presupuesto de publicidad y promoción.",
        trustTax: "Para temas fiscales o deducciones específicas, consulta con tu contador.",

        ctaPost: "Publicar anuncio",
        ctaListings: "Ver anuncios",
        ctaMediaKit: "Solicita el Media Kit",

        routePost: "/clasificados/publicar",
        routeList: "/clasificados/lista",
        routeCuenta: "/clasificados/cuenta",
        routeContacto: "/contacto",
      },
      en: {
        title: "Memberships",
        subtitle: "Find the right option based on what you want to post and how you want to grow.",
        supportLine:
          "Not everyone posts the same way. Some options are for personal sellers and others for businesses that want to grow stronger.",

        selectorTitle: "What do you want to post?",
        rentas: "Rentals",
        rentasHelp: "Personal listings, owners, or professional presence.",
        enVenta: "For sale",
        enVentaHelp: "Items, household stuff, personal sales.",
        empleos: "Jobs",
        empleosHelp: "Job offers and hiring.",
        servicios: "Services",
        serviciosHelp: "If you offer services to the public, work by appointment, or depend on clients.",
        restaurantes: "Restaurants",
        restaurantesHelp: "Discovery, trust, and contact for your business.",
        viajes: "Travel",
        viajesHelp: "Agencies, travel offers, and professional presence.",
        autos: "Autos",
        autosHelp: "Private seller vehicles or commercial presence.",
        clases: "Classes",
        clasesHelp: "Classes, workshops, and activities.",
        comunidad: "Community",
        comunidadHelp: "Community posts, free.",
        enVentaIntro: "For personal sellers and local item sales. Gratis vs LEONIX Pro — $9.99 per listing.",
        pricingRulePersonal: "Price per listing (not monthly).",
        pricingRuleBusiness: "Business plans: monthly price.",
        personalIntro: "If you post as an individual, these are the most relevant options for you.",
        personalNote: "These options are for personal sellers, not for businesses or commercial inventory.",

        compareTitle: "Quick comparison",
        compareHide: "Hide comparison",
        verQueIncluye: "See what's included",
        queCambiaSubir: "What changes when you upgrade",
        loQueGanas: "What you get with this plan",
        asistenciaExplain: "Helps give your listing extra momentum for a period when you need it most.",
        pricePerPost: "Per listing",
        priceMonthly: "Per month",
        compDuración: "Listing duration",
        compDias7: "7 days",
        comp30diasPorAnuncio: "30 days per listing",
        compRepostLimit: "Reposts",
        compRepostGratis: "Low limit; few reposts allowed.",
        compRepostPro: "More flexibility to repost when you need to.",
        compFotosContenido: "Photos and visual content",
        compFotosGratis: "Fewer photos than Pro",
        compFotosPro: "More photos and better gallery",
        compVideo: "Video",
        compComoSeMuestra: "How your listing is shown",
        compPresentación: "Listing presentation",
        compPresentacionMejor: "Better presentation",
        compFormasContacto: "Ways to contact",
        compBotonesContacto: "Call or text",
        compContactoStandard: "Call / phone only",
        compContactoPlus: "More options: message, email, video call, request quote",
        compDatosAnuncio: "How your listing is doing",
        compAsistencia: "Visibility assist",
        compVistas: "Views",
        compGuardados: "Saves",
        compCompartidos: "Shares",
        compAnaliticas: "Analytics",
        compPrioridad: "Priority over basic options",
        compBasica: "Basic",
        compMejorada: "Enhanced",
        compAmpliado: "Expanded",
        compNoIncluido: "Not included",
        compIncluido: "Included",
        compSinAnaliticas: "No analytics",
        compVistasGuardadosCompartidos: "Views, saves, and shares",
        compLlamarTexto: "Call or text (if seller enables it)",
        compNo: "No",
        compSi: "Yes",
        comp1: "1",
        comp2: "2",
        compPerfil: "Professional profile",
        compPresenciaCategoria: "Category presence",
        compFotosVideo: "Photos and video",
        compSoloImagenes: "Images only (no video)",
        compImagenesYVideo: "Images and video",
        compHerramientasContacto: "Ways to contact",
        compPrioridadVisibilidad: "Visibility priority",
        compAsistenciasVisibilidad: "Visibility assists",
        compMasLlamadas: "Better chance to get calls or messages",
        compConvertir: "Better chance to generate results",
        compGenerarContactos: "Better chance to generate contacts",
        compGenerarCandidatos: "Better chance to generate candidates",
        compSugerenciasIA: "AI suggestions",
        compMejorPara: "Best for",
        compIdealPara: "Ideal for",
        standardLine: "Standard helps you look professional.",
        plusLine: "Plus helps you turn that visibility into opportunities.",
        queSignificaAsistencia: "Visibility assist: gives your listing an extra boost for a period when you need it most.",
        queSignificaVistas: "Views, saves, and shares: help you see if your listing is getting attention.",
        queSignificaBotones: "Contact buttons: make it easier for people to call or text you.",
        tooltipAsistencia: "Temporary visibility boost so your listing stands out when you need it.",
        tooltipFormasContacto: "How people can reach you from the listing (call, message, etc.).",
        tooltipSugerenciasIA: "Practical tips to improve your listing based on performance (photos, video, price, when to use assist).",
        tooltipPresentacion: "How complete, clear, and convincing your listing looks.",

        autoSplit: "Do you post as a private seller or as a business?",
        autoParticular: "Private",
        autoNegocio: "Business",
        autoParticularNote:
          "If you operate as a lot, dealer, or commercial inventory, use the business path.",
        autoNegocioNote: "For commercial presence, inventory, or business operation.",

        rentasTop: "Personal rentals: one plan (LEONIX Pro) per listing. If you're a realtor or business, use the business path.",
        rentasSplit: "Do you post as an individual or as a business/professional?",
        rentasPersona: "Individual / occasional owner",
        rentasNegocio: "Business / realtor / manager",
        rentasPersonalCard: "Personal rentals (LEONIX Pro)",
        rentasPersonalPrice: "$24.99 per listing",
        rentasPersonalExplain: "For owners or occasional personal listings. 30 days per listing, more photos, video, views, and contact options.",
        rentasPersonaCta: "See posting options",
        rentasNegocioNote:
          "If you post as a realtor, manager, or recurring professional presence, the business path fits you better.",

        empleosCard: "Job posting (LEONIX Pro)",
        empleosPrice: "$24.99 per listing",
        empleosExplain: "For vacancies and hiring. 30 days per listing, views and saves, contact options (call or text), 1 visibility assist, and tips to improve your listing.",
        empleosNote:
          "If you're a company or post jobs regularly, business plans give you stronger presence:",

        serviciosIntro:
          "If you offer services to the public, work by appointment, or depend on clients, this path is for you.",
        restaurantesIntro:
          "So more people discover your restaurant, trust it, and contact you. Presence and business tools.",
        viajesIntro:
          "For agencies, travel offers, or professional presence in the sector. Presence and business tools.",
        plusSummaryStrong: "Good for businesses that want more momentum, more contact, and better chance to generate results.",

        clasesIntro:
          "Some community posts can be lighter. If your offer is clearly commercial or recurring, the business path fits better.",
        clasesPersonal: "Community / personal",
        clasesNegocio: "Commercial / recurring business",

        verDetalles: "See details",
        ocultarDetalles: "Hide details",
        idealPara: "Ideal for",
        incluye: "What's included",
        queSignifica: "What it means",
        cuandoSubir: "When to upgrade",

        gratisTitle: "Gratis",
        gratisPrice: "Gratis",
        gratisSummary: "7 days per listing, fewer photos, no video or listing data. Low repost limit.",
        gratisIdeal: ["People who post from time to time", "Community, one-off items, or basic needs"],
        gratisIncluye: ["Basic posting", "Visibility in search", "Presence in the marketplace"],
        gratisSignifica: "You can be present and try the platform without paying upfront.",
        gratisSubir: "If you post often or want more photos, better presentation, or more data.",

        proTitle: "LEONIX Pro",
        proPriceEnVenta: "$9.99 per listing",
        proPrice: "From your account",
        proSummary: "30 days per listing, more photos, video, views and saves, 1 visibility assist, and contact options (call or text).",
        proIdeal: ["People who sell more often", "Those who want to look more serious and stand out"],
        proIncluye: ["Longer duration and better presentation", "More photos, video, and description", "1 visibility assist", "Views, saves, and shares", "Call or text buttons"],
        proSignifica: "Lets you see how your listing is doing and whether people are responding.",
        proSubir: "If you already operate as a business or depend on capturing clients or contracts regularly.",

        standardTitle: "Standard",
        standardPrice: "$49/month",
        standardSummary: "Professional presence, images only (no video), contact by call, listing data, and 1 visibility assist per active listing every 30 days.",
        standardIdeal: ["Businesses that want clear, steady professional presence", "Owners who want to look better by category"],
        standardIncluye: ["Professional business profile", "Category presence", "Images only (no video)", "Contact by call / phone", "1 visibility assist per active listing / 30 days", "Listing data (how it's doing)"],
        standardSignifica: "Helps you look professional and get discovered and contacted by more people.",
        standardSubir: "If you need more calls, messages, or conversion urgency.",

        plusTitle: "Plus",
        plusPrice: "$125/month",
        plusSummary: "Stronger presentation and more contact options (message, email, video call, request quote), 2 visibility assists per active listing every 30 days, and AI suggestions.",
        plusIdeal: ["Businesses that want to close more opportunities", "Those who need better visibility and contact tools"],
        plusIncluye: ["Premium profile to sell better", "More contact options (message, email, video call, quote)", "Higher visibility and priority", "2 visibility assists per active listing / 30 days", "AI suggestions to grow"],
        plusSignifica: "More momentum, more calls and texts, and better chance to turn views into clients.",
        plusSubir: "",

        quizTitle: "Which plan fits you best?",
        q1: "What are you looking for most right now?",
        q1a: "Have a professional presence",
        q1b: "Get more calls, messages, or clients",
        q2: "How important is it that people contact you quickly from your listing?",
        q2a: "Some",
        q2b: "A lot",
        q3: "Do you want to show tools like website, social media, or clear ways to contact you?",
        q3a: "Not really",
        q3b: "Yes, that matters to me",
        q4: "Does your business depend a lot on photos, presentation, and visual trust?",
        q4a: "Some",
        q4b: "A lot",
        q5: "Your main goal is…?",
        q5a: "Have a professional presence",
        q5b: "Generate more results",
        resultStandard: "We recommend Standard",
        resultPlus: "We recommend Plus",
        resultStandardWhy:
          "You said you want a clear, organized professional presence. Standard helps you start strong without overcomplicating.",
        resultPlusWhy:
          "You said you want more contact, more visibility, and a stronger presence to generate more results. Plus fits you better.",
        quizNote: "This is just a quick recommendation.",
        quizAiLine: "LEONIX can also help you improve your listing with suggestions like better photos, better video, or price adjustments when needed.",
        clasesComunidadFree: "Community: it's free, no membership needed.",
        comunidadIntro: "Community posts at no cost. You don't need a membership to participate.",
        clasesComercialNote: "If your class is paid or clearly commercial, the business path fits better.",
        autoDealerNote: "If you operate as a dealer, lot, or commercial inventory, this path is for you.",
        quizReset: "Answer again",
        ctaAccount: "Go to my account",

        resourceTitle: "LEONIX helps you understand the language of business",
        resource1: "What SEO means in simple words",
        resource2: "What ROI means in simple words",
        resource3: "How to take better photos to sell",
        resource4: "How to tell if your listing is doing well",
        resourceSoon: "The start of a guide for Latino businesses to better understand these concepts.",

        trustTitle: "Investing in visibility is also part of growing",
        trustBody:
          "Many businesses treat this kind of investment as part of their advertising and promotion budget.",
        trustTax: "For tax-specific treatment or deductions, check with your accountant.",

        ctaPost: "Post a listing",
        ctaListings: "Browse listings",
        ctaMediaKit: "Request the Media Kit",

        routePost: "/clasificados/publicar",
        routeList: "/clasificados/lista",
        routeCuenta: "/clasificados/cuenta",
        routeContacto: "/contacto",
      },
    };
    return c[lang];
  }, [lang]);

  const L = copy;

  const handleQuizAnswer = (value: number) => {
    const next = [...quizAnswers, value];
    setQuizAnswers(next);
    if (next.length >= 5) {
      const sum = next.reduce((a, b) => a + b, 0);
      setQuizResult(sum <= 2 ? "standard" : "plus");
      setQuizStep(5);
    } else {
      setQuizStep(next.length);
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  const selectCategory = (key: CategoryKey) => {
    setSelectedCategory(key);
    setAutoSub(null);
    setRentasSub(null);
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  type MatrixRow = { feature: string; col0: string; col1: string };
  const ComparisonMatrix = ({
    intro,
    col0Name,
    col1Name,
    rows,
    footer0,
    footer1,
    bordered = true,
  }: {
    intro?: string;
    col0Name: string;
    col1Name: string;
    rows: MatrixRow[];
    footer0?: string;
    footer1?: string;
    bordered?: boolean;
  }) => (
    <div
      className={cx(
        "rounded-2xl overflow-hidden",
        bordered && "border border-[#C9B46A]/30 bg-[#F8F6F0]"
      )}
    >
      {intro && <p className="p-3 sm:p-4 text-sm text-[#111111]/90">{intro}</p>}
        <div className={bordered ? "p-3 sm:p-4 pt-0" : "p-0"}>
        <div className="hidden sm:block overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[280px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#111111]/10">
                <th className="text-left font-semibold text-[#111111] py-2 pr-2 align-top w-[40%] sm:w-[35%]">
                  {L.incluye}
                </th>
                <th className="text-left font-semibold text-[#111111] py-2 px-2 align-top">{col0Name}</th>
                <th className="text-left font-semibold text-[#111111] py-2 pl-2 align-top">{col1Name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-[#111111]/5 last:border-0">
                  <td className="py-2.5 pr-2 font-medium text-[#111111] align-top">{r.feature}</td>
                  <td className="py-2.5 px-2 text-[#111111]/90 align-top">{r.col0}</td>
                  <td className="py-2.5 pl-2 text-[#111111]/90 align-top">{r.col1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sm:hidden space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="rounded-xl border border-[#111111]/10 bg-white/60 p-3 text-sm">
              <p className="font-medium text-[#111111] mb-2">{r.feature}</p>
              <p className="text-[#111111]/80">
                <span className="text-[#111111]/60">{col0Name}:</span> {r.col0}
              </p>
              <p className="text-[#111111]/80 mt-1">
                <span className="text-[#111111]/60">{col1Name}:</span> {r.col1}
              </p>
            </div>
          ))}
        </div>
        {(footer0 || footer1) && (
          <div className="mt-4 pt-3 border-t border-[#111111]/10 space-y-1 text-xs text-[#111111]/80">
            {footer0 && <p>{footer0}</p>}
            {footer1 && <p>{footer1}</p>}
          </div>
        )}
      </div>
    </div>
  );

  const personalMatrixRows: MatrixRow[] = [
    { feature: L.compIdealPara, col0: L.gratisIdeal[0], col1: L.proIdeal[0] },
    { feature: L.compDuración, col0: L.compDias7, col1: L.comp30diasPorAnuncio },
    { feature: L.compRepostLimit, col0: L.compRepostGratis, col1: L.compRepostPro },
    { feature: L.compFotosContenido, col0: L.compFotosGratis, col1: L.compFotosPro },
    { feature: L.compVideo, col0: L.compNoIncluido, col1: L.compIncluido },
    { feature: L.compComoSeMuestra, col0: L.compBasica, col1: L.compMejorada },
    { feature: L.compAsistencia, col0: L.compNo, col1: L.comp1 },
    { feature: L.compDatosAnuncio, col0: L.compSinAnaliticas, col1: L.compSi },
    { feature: L.compVistas, col0: L.compSinAnaliticas, col1: L.compSi },
    { feature: L.compGuardados, col0: L.compSinAnaliticas, col1: L.compSi },
    { feature: L.compCompartidos, col0: L.compSinAnaliticas, col1: L.compSi },
    { feature: L.compFormasContacto, col0: L.compNo, col1: L.compLlamarTexto },
    { feature: L.compSugerenciasIA, col0: L.compNo, col1: L.compSi },
  ];

  const businessMatrixRows: MatrixRow[] = [
    { feature: L.compIdealPara, col0: L.standardIdeal[0], col1: L.plusIdeal[0] },
    { feature: L.compPerfil, col0: L.compSi, col1: L.compSi },
    { feature: L.compPresenciaCategoria, col0: L.compSi, col1: L.compSi },
    { feature: L.compFotosVideo, col0: L.compSoloImagenes, col1: L.compImagenesYVideo },
    { feature: L.compFormasContacto, col0: L.compContactoStandard, col1: L.compContactoPlus },
    { feature: L.compPrioridadVisibilidad, col0: L.compBasica, col1: L.compMejorada },
    { feature: L.compDatosAnuncio, col0: L.compSi, col1: L.compSi },
    { feature: L.compAsistenciasVisibilidad, col0: L.comp1, col1: L.comp2 },
    { feature: L.compSugerenciasIA, col0: L.compNo, col1: L.compSi },
    { feature: L.compMejorPara, col0: L.standardLine, col1: L.plusLine },
  ];

  const businessMatrixRowsEmpleos: MatrixRow[] = [
    { feature: L.compIdealPara, col0: L.standardIdeal[0], col1: L.plusIdeal[0] },
    { feature: L.compPerfil, col0: L.compSi, col1: L.compSi },
    { feature: L.compPresenciaCategoria, col0: L.compSi, col1: L.compSi },
    { feature: L.compFormasContacto, col0: L.compContactoStandard, col1: L.compContactoPlus },
    { feature: L.compAnaliticas, col0: L.compSi, col1: L.compSi },
    { feature: L.compAsistenciasVisibilidad, col0: L.comp1, col1: L.comp2 },
    { feature: L.compGenerarCandidatos, col0: L.compBasica, col1: L.compMejorada },
  ];

  const selectorCards: { key: CategoryKey; label: string; help: string }[] = [
    { key: "rentas", label: L.rentas, help: L.rentasHelp },
    { key: "en-venta", label: L.enVenta, help: L.enVentaHelp },
    { key: "empleos", label: L.empleos, help: L.empleosHelp },
    { key: "servicios", label: L.servicios, help: L.serviciosHelp },
    { key: "restaurantes", label: L.restaurantes, help: L.restaurantesHelp },
    { key: "viajes", label: L.viajes, help: L.viajesHelp },
    { key: "autos", label: L.autos, help: L.autosHelp },
    { key: "clases", label: L.clases, help: L.clasesHelp },
    { key: "comunidad", label: L.comunidad, help: L.comunidadHelp },
  ];

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111] pb-20 bg-[radial-gradient(ellipse_at_top,rgba(169,140,42,0.10),transparent_60%)]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
        <header className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111111]">{L.title}</h1>
          <p className="mt-3 text-base sm:text-lg text-[#111111] max-w-xl mx-auto">{L.subtitle}</p>
          <p className="mt-2 text-sm text-[#111111]/80 max-w-lg mx-auto">{L.supportLine}</p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#111111] mb-4">{L.selectorTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {selectorCards.map(({ key, label, help }) => (
              <button
                key={key}
                type="button"
                onClick={() => selectCategory(key)}
                className={cx(
                  "rounded-2xl border p-4 text-left transition",
                  selectedCategory === key
                    ? "border-[#C9B46A]/70 bg-[#F8F6F0]"
                    : "border-[#111111]/15 bg-[#F5F5F5] hover:bg-[#EFEFEF]"
                )}
              >
                <span className="font-semibold text-[#111111]">{label}</span>
                <p className="mt-1 text-xs text-[#111111]/70">{help}</p>
              </button>
            ))}
          </div>
        </section>

        {selectedCategory === "en-venta" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
            <p className="text-xs text-[#111111]/70 mb-2">{L.pricingRulePersonal}</p>
            <ComparisonMatrix
              intro={L.enVentaIntro}
              col0Name={L.gratisTitle}
              col1Name={`${L.proTitle} — ${L.proPriceEnVenta}`}
              rows={personalMatrixRows}
              footer0={L.queSignificaAsistencia}
              footer1={L.queSignificaBotones}
            />
            <p className="mt-4 text-xs text-[#111111]/70">{L.personalNote}</p>
          </section>
        )}

        {selectedCategory === "autos" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
            <p className="text-sm font-medium text-[#111111] mb-3">{L.autoSplit}</p>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <button
                type="button"
                onClick={() => setAutoSub("particular")}
                className={cx(
                  "rounded-xl border py-3 px-4 text-sm font-medium transition",
                  autoSub === "particular"
                    ? "border-[#C9B46A]/60 bg-[#F8F6F0] text-[#111111]"
                    : "border-[#111111]/15 bg-white text-[#111111] hover:bg-[#F5F5F5]"
                )}
              >
                {L.autoParticular}
              </button>
              <button
                type="button"
                onClick={() => setAutoSub("negocio")}
                className={cx(
                  "rounded-xl border py-3 px-4 text-sm font-medium transition",
                  autoSub === "negocio"
                    ? "border-[#C9B46A]/60 bg-[#F8F6F0] text-[#111111]"
                    : "border-[#111111]/15 bg-white text-[#111111] hover:bg-[#F5F5F5]"
                )}
              >
                {L.autoNegocio}
              </button>
            </div>
            {autoSub === "particular" && (
              <>
                <ComparisonMatrix
                  intro={L.personalIntro}
                  col0Name={L.gratisTitle}
                  col1Name={L.proTitle}
                  rows={personalMatrixRows}
                  footer0={L.queSignificaAsistencia}
                  footer1={L.queSignificaBotones}
                />
                <p className="mt-4 text-xs text-[#111111]/70">{L.autoDealerNote}</p>
              </>
            )}
            {autoSub === "negocio" && (
              <>
                <p className="text-xs text-[#111111]/70 mb-2">{L.pricingRuleBusiness}</p>
                <ComparisonMatrix
                  intro={L.autoNegocioNote}
                  col0Name={L.standardTitle}
                  col1Name={L.plusTitle}
                  rows={businessMatrixRows}
                  footer0={L.standardLine}
                  footer1={L.plusLine}
                />
              </>
            )}
          </section>
        )}

        {selectedCategory === "rentas" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
            <p className="text-sm text-[#111111] mb-3">{L.rentasTop}</p>
            <p className="text-sm font-medium text-[#111111] mb-3">{L.rentasSplit}</p>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <button
                type="button"
                onClick={() => setRentasSub("persona")}
                className={cx(
                  "rounded-xl border py-3 px-4 text-sm font-medium transition",
                  rentasSub === "persona"
                    ? "border-[#C9B46A]/60 bg-[#F8F6F0] text-[#111111]"
                    : "border-[#111111]/15 bg-white text-[#111111] hover:bg-[#F5F5F5]"
                )}
              >
                {L.rentasPersona}
              </button>
              <button
                type="button"
                onClick={() => setRentasSub("negocio")}
                className={cx(
                  "rounded-xl border py-3 px-4 text-sm font-medium transition",
                  rentasSub === "negocio"
                    ? "border-[#C9B46A]/60 bg-[#F8F6F0] text-[#111111]"
                    : "border-[#111111]/15 bg-white text-[#111111] hover:bg-[#F5F5F5]"
                )}
              >
                {L.rentasNegocio}
              </button>
            </div>
            {rentasSub === "persona" && (
              <div>
                <div className="rounded-2xl border-2 border-[#C9B46A]/40 bg-[#F8F6F0] p-4 mb-4">
                  <h3 className="text-lg font-bold text-[#111111]">{L.rentasPersonalCard}</h3>
                  <p className="text-base font-semibold text-[#111111] mt-1">{L.rentasPersonalPrice}</p>
                  <p className="mt-2 text-sm text-[#111111]/90">{L.rentasPersonalExplain}</p>
                </div>
                <Link
                  href={withLang(L.routePost)}
                  className="inline-flex justify-center w-full sm:w-auto rounded-xl bg-[#111111] text-[#F5F5F5] font-semibold py-3 px-5 text-sm hover:opacity-95 transition"
                >
                  {L.rentasPersonaCta}
                </Link>
              </div>
            )}
            {rentasSub === "negocio" && (
              <>
                <p className="text-xs text-[#111111]/70 mb-2">{L.pricingRuleBusiness}</p>
                <ComparisonMatrix
                  intro={L.rentasNegocioNote}
                  col0Name={L.standardTitle}
                  col1Name={L.plusTitle}
                  rows={businessMatrixRows}
                  footer0={L.standardLine}
                  footer1={L.plusLine}
                />
              </>
            )}
          </section>
        )}

        {selectedCategory === "empleos" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
            <p className="text-xs text-[#111111]/70 mb-2">{L.pricingRulePersonal}</p>
            <div className="rounded-2xl border-2 border-[#C9B46A]/40 bg-[#F8F6F0] p-4 mb-4">
              <h3 className="text-lg font-bold text-[#111111]">{L.empleosCard}</h3>
              <p className="text-base font-semibold text-[#111111] mt-1">{L.empleosPrice}</p>
              <p className="mt-2 text-sm text-[#111111]/90">{L.empleosExplain}</p>
              <p className="mt-2 text-xs font-medium text-[#111111]/80">{L.verQueIncluye}</p>
            </div>
            <p className="text-sm text-[#111111] mb-4">{L.empleosNote}</p>
            <p className="text-xs text-[#111111]/70 mb-2">{L.pricingRuleBusiness}</p>
            <ComparisonMatrix
              col0Name={L.standardTitle}
              col1Name={L.plusTitle}
              rows={businessMatrixRowsEmpleos}
              footer0={L.standardLine}
              footer1={L.plusLine}
            />
          </section>
        )}

        {selectedCategory === "servicios" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-4 sm:p-6">
            <p className="text-xs text-[#111111]/70 mb-2">{L.pricingRuleBusiness}</p>
            <ComparisonMatrix
              intro={L.serviciosIntro}
              col0Name={L.standardTitle}
              col1Name={L.plusTitle}
              rows={businessMatrixRows}
              footer0={L.standardLine}
              footer1={L.plusLine}
            />
          </section>
        )}

        {selectedCategory === "restaurantes" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-4 sm:p-6">
            <p className="text-xs text-[#111111]/70 mb-2">{L.pricingRuleBusiness}</p>
            <ComparisonMatrix
              intro={L.restaurantesIntro}
              col0Name={L.standardTitle}
              col1Name={L.plusTitle}
              rows={businessMatrixRows}
              footer0={L.standardLine}
              footer1={L.plusLine}
            />
          </section>
        )}

        {selectedCategory === "viajes" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-4 sm:p-6">
            <p className="text-xs text-[#111111]/70 mb-2">{L.pricingRuleBusiness}</p>
            <ComparisonMatrix
              intro={L.viajesIntro}
              col0Name={L.standardTitle}
              col1Name={L.plusTitle}
              rows={businessMatrixRows}
              footer0={L.standardLine}
              footer1={L.plusLine}
            />
          </section>
        )}

        {selectedCategory === "clases" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
            <p className="text-sm text-[#111111] mb-2">{L.clasesComunidadFree}</p>
            <p className="text-sm text-[#111111] mb-4">{L.clasesIntro}</p>
            <p className="text-xs font-medium text-[#111111]/80 mb-2">{L.clasesPersonal}</p>
            <ComparisonMatrix
              col0Name={L.gratisTitle}
              col1Name={L.proTitle}
              rows={personalMatrixRows}
              bordered={false}
            />
            <p className="text-xs font-medium text-[#111111]/80 mt-6 mb-2">{L.clasesNegocio}</p>
            <p className="text-xs text-[#111111]/70 mb-3">{L.clasesComercialNote}</p>
            <ComparisonMatrix
              col0Name={L.standardTitle}
              col1Name={L.plusTitle}
              rows={businessMatrixRows}
              footer0={L.standardLine}
              footer1={L.plusLine}
            />
          </section>
        )}

        {selectedCategory === "comunidad" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
            <p className="text-base font-semibold text-[#111111]">{L.clasesComunidadFree}</p>
            <p className="mt-2 text-sm text-[#111111]/90">{L.comunidadIntro}</p>
          </section>
        )}

        {isBusinessPath && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-4 sm:p-6">
            <h2 className="text-lg font-bold text-[#111111]">{L.quizTitle}</h2>
            {!quizResult && quizStep < 5 && (
              <div className="mt-4 space-y-4">
                {quizStep === 0 && (
                  <div>
                    <p className="font-medium text-[#111111] mb-2">{L.q1}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => handleQuizAnswer(0)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">{L.q1a}</button>
                      <button type="button" onClick={() => handleQuizAnswer(1)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">{L.q1b}</button>
                    </div>
                  </div>
                )}
                {quizStep === 1 && (
                  <div>
                    <p className="font-medium text-[#111111] mb-2">{L.q2}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => handleQuizAnswer(0)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">{L.q2a}</button>
                      <button type="button" onClick={() => handleQuizAnswer(1)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">{L.q2b}</button>
                    </div>
                  </div>
                )}
                {quizStep === 2 && (
                  <div>
                    <p className="font-medium text-[#111111] mb-2">{L.q3}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => handleQuizAnswer(0)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">{L.q3a}</button>
                      <button type="button" onClick={() => handleQuizAnswer(1)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">{L.q3b}</button>
                    </div>
                  </div>
                )}
                {quizStep === 3 && (
                  <div>
                    <p className="font-medium text-[#111111] mb-2">{L.q4}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => handleQuizAnswer(0)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">{L.q4a}</button>
                      <button type="button" onClick={() => handleQuizAnswer(1)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">{L.q4b}</button>
                    </div>
                  </div>
                )}
                {quizStep === 4 && (
                  <div>
                    <p className="font-medium text-[#111111] mb-2">{L.q5}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => handleQuizAnswer(0)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">{L.q5a}</button>
                      <button type="button" onClick={() => handleQuizAnswer(1)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">{L.q5b}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {quizResult && (
              <div className="mt-4 rounded-xl border border-[#C9B46A]/40 bg-[#F5F5F5] p-4">
                <p className="text-lg font-bold text-[#111111]">{quizResult === "standard" ? L.resultStandard : L.resultPlus}</p>
                <p className="mt-2 text-sm text-[#111111]/90">{quizResult === "standard" ? L.resultStandardWhy : L.resultPlusWhy}</p>
                <p className="mt-2 text-xs text-[#111111]/70">{L.quizAiLine}</p>
                <p className="mt-3 text-xs text-[#111111]/60">{L.quizNote}</p>
                <Link href={withLang(L.routeCuenta)} className="mt-4 block w-full text-center rounded-xl bg-[#111111] text-[#F5F5F5] font-semibold py-3 px-4 text-sm hover:opacity-95 transition">
                  {L.ctaAccount}
                </Link>
                <button type="button" onClick={resetQuiz} className="mt-2 block w-full text-center text-sm text-[#111111]/70 hover:text-[#111111]">
                  {L.quizReset}
                </button>
              </div>
            )}
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#111111] mb-3">{L.resourceTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#111111]/10 bg-[#F5F5F5] p-3">
              <p className="text-sm font-medium text-[#111111]">{L.resource1}</p>
            </div>
            <div className="rounded-xl border border-[#111111]/10 bg-[#F5F5F5] p-3">
              <p className="text-sm font-medium text-[#111111]">{L.resource2}</p>
            </div>
            <div className="rounded-xl border border-[#111111]/10 bg-[#F5F5F5] p-3">
              <p className="text-sm font-medium text-[#111111]">{L.resource3}</p>
            </div>
            <div className="rounded-xl border border-[#111111]/10 bg-[#F5F5F5] p-3">
              <p className="text-sm font-medium text-[#111111]">{L.resource4}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-[#111111]/60">{L.resourceSoon}</p>
        </section>

        <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-5">
          <h2 className="text-base font-bold text-[#111111]">{L.trustTitle}</h2>
          <p className="mt-2 text-sm text-[#111111]/90">{L.trustBody}</p>
          <p className="mt-2 text-xs text-[#111111]/70">{L.trustTax}</p>
        </section>

        <section className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
          <Link href={withLang(L.routePost)} className="w-full sm:w-auto inline-flex justify-center items-center rounded-full bg-[#111111] text-[#F5F5F5] font-semibold py-3 px-5 text-sm hover:opacity-95 transition">
            {L.ctaPost}
          </Link>
          <Link href={withLang(L.routeList)} className="w-full sm:w-auto inline-flex justify-center items-center rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold py-3 px-5 text-sm hover:bg-[#EFEFEF] transition">
            {L.ctaListings}
          </Link>
          <Link href={withLang(L.routeCuenta)} className="w-full sm:w-auto inline-flex justify-center items-center rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold py-3 px-5 text-sm hover:bg-[#EFEFEF] transition">
            {L.ctaAccount}
          </Link>
          <Link href={withLang(L.routeContacto)} className="w-full sm:w-auto inline-flex justify-center items-center rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold py-3 px-5 text-sm hover:bg-[#EFEFEF] transition">
            {L.ctaMediaKit}
          </Link>
        </section>
      </main>
    </div>
  );
}
