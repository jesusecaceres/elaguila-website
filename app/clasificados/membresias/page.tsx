"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";

type Lang = "es" | "en";

type CategoryKey = "venta-personal" | "auto" | "rentas" | "empleos" | "servicios" | "clases" | null;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function MembresiasPage() {
  const params = useSearchParams();
  const lang: Lang = params?.get("lang") === "en" ? "en" : "es";

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>(null);
  const [autoSub, setAutoSub] = useState<"particular" | "negocio" | null>(null);
  const [rentasSub, setRentasSub] = useState<"persona" | "negocio" | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<"gratis" | "pro" | "standard" | "plus" | null>(null);
  const [showPersonalCompare, setShowPersonalCompare] = useState(false);
  const [showBusinessCompare, setShowBusinessCompare] = useState(false);

  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<"standard" | "plus" | null>(null);

  const withLang = (path: string) => {
    const joiner = path.includes("?") ? "&" : "?";
    return `${path}${joiner}lang=${lang}`;
  };

  const isBusinessPath =
    selectedCategory === "servicios" ||
    selectedCategory === "empleos" ||
    (selectedCategory === "auto" && autoSub === "negocio") ||
    (selectedCategory === "rentas" && rentasSub === "negocio");

  const copy = useMemo(() => {
    const c = {
      es: {
        title: "Membresías",
        subtitle: "Encuentra la opción correcta según lo que quieres publicar y cómo quieres crecer.",
        supportLine:
          "No todos publican igual. Algunas opciones son para vendedores personales y otras para negocios que quieren crecer con más fuerza.",

        selectorTitle: "¿Qué quieres publicar?",
        ventaPersonal: "Venta personal",
        ventaPersonalHelp: "Artículos, cosas del hogar, ventas personales.",
        auto: "Auto",
        autoHelp: "Vehículos de vendedor particular o presencia comercial.",
        rentas: "Rentas",
        rentasHelp: "Publicaciones personales, propietarios o presencia profesional.",
        empleos: "Empleos",
        empleosHelp: "Ofertas de trabajo y contratación.",
        servicios: "Servicios / Negocio",
        serviciosHelp: "Negocios, marcas, servicios y presencia comercial.",
        clases: "Clases / Comunidad",
        clasesHelp: "Clases, actividades y publicaciones comunitarias.",

        personalIntro: "Si publicas como persona, estas son las opciones más relevantes para ti.",
        personalNote:
          "Estas opciones son para vendedores personales, no para negocios ni inventario comercial.",

        compareTitle: "Comparación rápida",
        compareHide: "Ocultar comparación",
        verQueIncluye: "Ver qué incluye",
        queCambiaSubir: "Qué cambia al subir",
        loQueGanas: "Lo que ganas con este plan",
        asistenciaExplain: "Ayuda a darle un impulso extra a tu anuncio por un tiempo cuando más lo necesitas.",

        compDuración: "Duración del anuncio",
        compFotosContenido: "Fotos y contenido visual",
        compVideo: "Video",
        compPresentación: "Presentación del anuncio",
        compPresentacionMejor: "Mejor presentación",
        compAsistencia: "Asistencia de visibilidad",
        compVistas: "Vistas",
        compGuardados: "Guardados",
        compCompartidos: "Compartidos",
        compBotonesContacto: "Botones de contacto",
        compAnaliticas: "Analíticas",
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
        compHerramientasContacto: "Herramientas de contacto",
        compPrioridadVisibilidad: "Prioridad de visibilidad",
        compAsistenciasVisibilidad: "Asistencias de visibilidad",
        compMasLlamadas: "Mejor oportunidad de generar llamadas o mensajes",
        compConvertir: "Mejor oportunidad de generar resultados",
        compGenerarContactos: "Mejor oportunidad de generar contactos",
        compGenerarCandidatos: "Mayor oportunidad de generar candidatos",
        standardLine: "Standard te ayuda a verte profesionalmente.",
        plusLine: "Plus te ayuda a convertir mejor esa visibilidad en oportunidades.",
        queSignificaAsistencia: "Asistencia de visibilidad: le da un impulso extra a tu anuncio por un tiempo cuando más lo necesitas.",
        queSignificaVistas: "Vistas, guardados y compartidos: te ayudan a ver si tu anuncio está llamando la atención.",
        queSignificaBotones: "Botones de contacto: facilitan que te llamen o te manden texto más rápido.",

        autoSplit: "¿Publicas como vendedor particular o como negocio?",
        autoParticular: "Particular",
        autoNegocio: "Negocio",
        autoParticularNote:
          "Si operas como lote, dealer o inventario comercial, te corresponde la ruta de negocio.",
        autoNegocioNote: "Para presencia comercial, inventario o operación como negocio.",

        rentasTop: "En rentas, la publicación personal se maneja por publicación de 30 días.",
        rentasSplit: "¿Publicas como persona o como negocio/profesional?",
        rentasPersona: "Persona / propietario ocasional",
        rentasNegocio: "Negocio / realtor / administrador",
        rentasPersonalCard: "Rentas personales",
        rentasPersonalPrice: "$35 / 30 días",
        rentasPersonalExplain: "Para propietarios o publicaciones personales ocasionales.",
        rentasPersonaCta: "Ver opciones de publicación",
        rentasNegocioNote:
          "Si publicas como realtor, administrador o presencia profesional recurrente, te conviene la ruta de negocio.",

        empleosCard: "Publicación de empleo",
        empleosPrice: "$35 / 30 días",
        empleosExplain: "Para vacantes y contratación.",
        empleosNote:
          "Si buscas presencia más sólida o publicación recurrente como negocio, estas opciones te ayudan más:",

        serviciosIntro:
          "Si tu meta es que más personas te descubran, te contacten y confíen en tu negocio, esta es tu ruta.",
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
        gratisSummary: "Publicación básica, visible en búsqueda. Ideal para publicar de vez en cuando.",
        gratisIdeal: ["Personas que publican de vez en cuando", "Comunidad, artículos sueltos o necesidades básicas"],
        gratisIncluye: ["Publicación básica", "Visibilidad en búsqueda", "Presencia en el marketplace"],
        gratisSignifica: "Puedes estar presente y probar la plataforma sin pagar al inicio.",
        gratisSubir: "Si publicas seguido o quieres más fotos, mejor presentación o más datos.",

        proTitle: "LEONIX Pro",
        proPrice: "Desde tu cuenta",
        proSummary: "Más duración, mejor presentación, más fotos y 1 asistencia de visibilidad.",
        proIdeal: ["Personas que venden con más frecuencia", "Quienes quieren verse más serios y destacar mejor"],
        proIncluye: ["Más duración y mejor presentación", "Más fotos, video y mejor descripción", "1 asistencia de visibilidad", "Vistas, guardados y compartidos", "Botones para llamar o enviar texto"],
        proSignifica: "Te deja ver cómo va tu anuncio y te ayuda a entender si la gente está respondiendo.",
        proSubir: "Si ya operas como negocio o dependes de captar clientes o contratos constantemente.",

        standardTitle: "Standard",
        standardPrice: "$49/semana",
        standardSummary: "Bueno para establecer una presencia profesional clara.",
        standardIdeal: ["Negocios que quieren presencia profesional clara y constante", "Dueños que quieren verse mejor por categoría"],
        standardIncluye: ["Perfil profesional del negocio", "Presencia por categoría", "Fotos y video", "Herramientas de contacto", "1 asistencia de visibilidad por anuncio activo / 30 días", "Analíticas para ver cómo va tu negocio"],
        standardSignifica: "Te ayuda a verte profesionalmente y a que más gente te descubra y te contacte.",
        standardSubir: "Si necesitas más llamadas, mensajes o urgencia de conversión.",

        plusTitle: "Plus",
        plusPrice: "$125/semana",
        plusSummary: "Bueno para negocios que quieren más impulso, más contacto y mejor oportunidad de convertir visitas en clientes.",
        plusIdeal: ["Negocios que quieren cerrar más oportunidades", "Quienes necesitan mejor visibilidad y herramientas de contacto"],
        plusIncluye: ["Perfil premium para vender mejor", "Más herramientas de contacto", "Mayor visibilidad y prioridad", "2 asistencias de visibilidad por anuncio activo / 30 días", "Analíticas más completas"],
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
        clasesComercialNote: "Si tu clase es de pago o claramente comercial, conviene la ruta de negocio.",
        autoDealerNote: "Si operas como dealer, lote o inventario comercial, te corresponde esta ruta.",
        quizReset: "Volver a responder",
        ctaAccount: "Ir a mi cuenta",

        resourceTitle: "Aprende a vender mejor con LEONIX",
        resource1: "Qué significa SEO en palabras simples",
        resource2: "Cómo tomar mejores fotos para vender",
        resource3: "Qué poner en un perfil de negocio",
        resource4: "Cómo saber si tu publicidad está funcionando",
        resourceSoon: "Muy pronto: recursos y guías creadas para negocios latinos.",

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
        ventaPersonal: "Personal sale",
        ventaPersonalHelp: "Items, household stuff, personal sales.",
        auto: "Auto",
        autoHelp: "Private seller vehicles or commercial presence.",
        rentas: "Rentals",
        rentasHelp: "Personal listings, owners, or professional presence.",
        empleos: "Jobs",
        empleosHelp: "Job offers and hiring.",
        servicios: "Services / Business",
        serviciosHelp: "Businesses, brands, services, and commercial presence.",
        clases: "Classes / Community",
        clasesHelp: "Classes, activities, and community posts.",

        personalIntro: "If you post as an individual, these are the most relevant options for you.",
        personalNote: "These options are for personal sellers, not for businesses or commercial inventory.",

        compareTitle: "Quick comparison",
        compareHide: "Hide comparison",
        verQueIncluye: "See what's included",
        queCambiaSubir: "What changes when you upgrade",
        loQueGanas: "What you get with this plan",
        asistenciaExplain: "Helps give your listing extra momentum for a period when you need it most.",

        compDuración: "Listing duration",
        compFotosContenido: "Photos and visual content",
        compVideo: "Video",
        compPresentación: "Listing presentation",
        compPresentacionMejor: "Better presentation",
        compAsistencia: "Visibility assist",
        compVistas: "Views",
        compGuardados: "Saves",
        compCompartidos: "Shares",
        compBotonesContacto: "Contact buttons",
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
        compHerramientasContacto: "Contact tools",
        compPrioridadVisibilidad: "Visibility priority",
        compAsistenciasVisibilidad: "Visibility assists",
        compMasLlamadas: "Better chance to get calls or messages",
        compConvertir: "Better chance to generate results",
        compGenerarContactos: "Better chance to generate contacts",
        compGenerarCandidatos: "Better chance to generate candidates",
        standardLine: "Standard helps you look professional.",
        plusLine: "Plus helps you turn that visibility into opportunities.",
        queSignificaAsistencia: "Visibility assist: gives your listing an extra boost for a period when you need it most.",
        queSignificaVistas: "Views, saves, and shares: help you see if your listing is getting attention.",
        queSignificaBotones: "Contact buttons: make it easier for people to call or text you.",

        autoSplit: "Do you post as a private seller or as a business?",
        autoParticular: "Private",
        autoNegocio: "Business",
        autoParticularNote:
          "If you operate as a lot, dealer, or commercial inventory, use the business path.",
        autoNegocioNote: "For commercial presence, inventory, or business operation.",

        rentasTop: "For rentals, personal posting is handled per 30-day listing.",
        rentasSplit: "Do you post as an individual or as a business/professional?",
        rentasPersona: "Individual / occasional owner",
        rentasNegocio: "Business / realtor / manager",
        rentasPersonalCard: "Personal rentals",
        rentasPersonalPrice: "$35 / 30 days",
        rentasPersonalExplain: "For owners or occasional personal listings.",
        rentasPersonaCta: "See posting options",
        rentasNegocioNote:
          "If you post as a realtor, manager, or recurring professional presence, the business path fits you better.",

        empleosCard: "Job posting",
        empleosPrice: "$35 / 30 days",
        empleosExplain: "For vacancies and hiring.",
        empleosNote:
          "If you want a stronger presence or recurring business posting, these options help more:",

        serviciosIntro:
          "If your goal is for more people to discover you, contact you, and trust your business, this is your path.",
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
        gratisSummary: "Basic posting, visible in search. Best for posting from time to time.",
        gratisIdeal: ["People who post from time to time", "Community, one-off items, or basic needs"],
        gratisIncluye: ["Basic posting", "Visibility in search", "Presence in the marketplace"],
        gratisSignifica: "You can be present and try the platform without paying upfront.",
        gratisSubir: "If you post often or want more photos, better presentation, or more data.",

        proTitle: "LEONIX Pro",
        proPrice: "Available in your account",
        proSummary: "Longer duration, better presentation, more photos, and 1 visibility assist.",
        proIdeal: ["People who sell more often", "Those who want to look more serious and stand out"],
        proIncluye: ["Longer duration and better presentation", "More photos, video, and description", "1 visibility assist", "Views, saves, and shares", "Call or text buttons"],
        proSignifica: "Lets you see how your listing is doing and whether people are responding.",
        proSubir: "If you already operate as a business or depend on capturing clients or contracts regularly.",

        standardTitle: "Standard",
        standardPrice: "$49/week",
        standardSummary: "Good for establishing a clear professional presence.",
        standardIdeal: ["Businesses that want clear, steady professional presence", "Owners who want to look better by category"],
        standardIncluye: ["Professional business profile", "Category presence", "Photos and video", "Contact tools", "1 visibility assist per active listing / 30 days", "Analytics to see how your business is doing"],
        standardSignifica: "Helps you look professional and get discovered and contacted by more people.",
        standardSubir: "If you need more calls, messages, or conversion urgency.",

        plusTitle: "Plus",
        plusPrice: "$125/week",
        plusSummary: "Good for businesses that want more momentum, more contact, and better chance to turn visits into clients.",
        plusIdeal: ["Businesses that want to close more opportunities", "Those who need better visibility and contact tools"],
        plusIncluye: ["Premium profile to sell better", "More contact tools", "Higher visibility and priority", "2 visibility assists per active listing / 30 days", "Richer analytics"],
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
        clasesComercialNote: "If your class is paid or clearly commercial, the business path fits better.",
        autoDealerNote: "If you operate as a dealer, lot, or commercial inventory, this path is for you.",
        quizReset: "Answer again",
        ctaAccount: "Go to my account",

        resourceTitle: "Learn how to sell better with LEONIX",
        resource1: "What SEO means in simple words",
        resource2: "How to take better photos to sell",
        resource3: "What to put in a business profile",
        resource4: "How to tell if your advertising is working",
        resourceSoon: "Coming soon: resources and guides built for Latino businesses.",

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
    setExpandedPlan(null);
    setShowPersonalCompare(false);
    setShowBusinessCompare(false);
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  type PlanId = "gratis" | "pro" | "standard" | "plus";

  const PlanCard = ({
    id,
    title,
    price,
    summary,
    ideal,
    incluye,
    significa,
    cuandoSubir,
    accent,
    onShowCompare,
  }: {
    id: PlanId;
    title: string;
    price: string;
    summary: string;
    ideal: string[];
    incluye: string[];
    significa: string;
    cuandoSubir: string;
    accent?: "gold" | "strong";
    onShowCompare?: () => void;
  }) => {
    const isExpanded = expandedPlan === id;
    return (
      <div
        className={cx(
          "rounded-2xl border bg-[#F5F5F5] overflow-hidden",
          accent === "gold" && "border-yellow-500/25",
          accent === "strong" && "border-yellow-500/40 bg-[#F8F6F0]"
        )}
      >
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-[#111111]">{title}</h3>
              <p className="text-sm font-semibold text-[#111111] mt-0.5">{price}</p>
            </div>
            <button
              type="button"
              onClick={() => setExpandedPlan(isExpanded ? null : id)}
              className="rounded-xl border border-[#C9B46A]/50 bg-white/80 px-3 py-2 text-sm font-medium text-[#111111] hover:bg-white transition"
            >
              {isExpanded ? L.ocultarDetalles : L.verDetalles}
            </button>
          </div>
          <p className="mt-2 text-sm text-[#111111]/90">{summary}</p>
          {onShowCompare && (
            <button
              type="button"
              onClick={onShowCompare}
              className="mt-2 text-xs font-medium text-[#111111]/80 hover:text-[#111111] underline underline-offset-1"
            >
              {L.verQueIncluye}
            </button>
          )}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-[#111111]/10 space-y-3 text-sm">
              <div>
                <h4 className="font-semibold text-[#111111]">{L.idealPara}</h4>
                <ul className="mt-1 space-y-0.5 text-[#111111]/90">
                  {ideal.map((s, i) => (
                    <li key={i}>· {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#111111]">{L.incluye}</h4>
                <ul className="mt-1 space-y-0.5 text-[#111111]/90">
                  {incluye.map((s, i) => (
                    <li key={i}>· {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#111111]">{L.queSignifica}</h4>
                <p className="mt-1 text-[#111111]/90">{significa}</p>
              </div>
              {cuandoSubir && (
                <div>
                  <h4 className="font-semibold text-[#111111]">{L.cuandoSubir}</h4>
                  <p className="mt-1 text-[#111111]/90">{cuandoSubir}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const PersonalCompare = () => {
    const rows: { feature: string; gratis: string; pro: string }[] = [
      { feature: L.compDuración, gratis: L.compBasica, pro: L.compAmpliado },
      { feature: L.compFotosContenido, gratis: L.compBasica, pro: L.compAmpliado },
      { feature: L.compVideo, gratis: L.compNoIncluido, pro: L.compIncluido },
      { feature: L.compAsistencia, gratis: L.compNo, pro: L.comp1 },
      { feature: L.compVistas, gratis: L.compSinAnaliticas, pro: L.compSi },
      { feature: L.compGuardados, gratis: L.compSinAnaliticas, pro: L.compSi },
      { feature: L.compCompartidos, gratis: L.compSinAnaliticas, pro: L.compSi },
      { feature: L.compBotonesContacto, gratis: L.compNo, pro: L.compLlamarTexto },
      { feature: L.compPresentacionMejor, gratis: L.compBasica, pro: L.compMejorada },
    ];
    return (
      <div className="mt-4 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-[#111111]/10 flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#111111]">{L.compareTitle}</h4>
          <button
            type="button"
            onClick={() => setShowPersonalCompare(false)}
            className="text-xs font-medium text-[#111111]/70 hover:text-[#111111]"
          >
            {L.compareHide}
          </button>
        </div>
        <div className="p-3 sm:p-4">
          <div className="hidden sm:grid sm:grid-cols-3 gap-2 text-sm mb-2">
            <div className="font-semibold text-[#111111]">{L.incluye}</div>
            <div className="font-semibold text-[#111111]">{L.gratisTitle}</div>
            <div className="font-semibold text-[#111111]">{L.proTitle}</div>
          </div>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-[#111111]/5 last:border-0 text-sm">
                <span className="font-medium text-[#111111]">{r.feature}</span>
                <div className="flex gap-2 text-[#111111]/90">
                  <span className="sm:hidden text-[#111111]/60">{L.gratisTitle}:</span>
                  <span>{r.gratis}</span>
                </div>
                <div className="flex gap-2 text-[#111111]/90">
                  <span className="sm:hidden text-[#111111]/60">{L.proTitle}:</span>
                  <span>{r.pro}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#111111]/10 space-y-1.5 text-xs text-[#111111]/70">
            <p>{L.queSignificaAsistencia}</p>
            <p>{L.queSignificaVistas}</p>
            <p>{L.queSignificaBotones}</p>
          </div>
        </div>
      </div>
    );
  };

  const BusinessCompare = ({ empleos = false }: { empleos?: boolean }) => {
    const defaultRows: { feature: string; standard: string; plus: string }[] = [
      { feature: L.compPerfil, standard: L.compSi, plus: L.compSi },
      { feature: L.compPresenciaCategoria, standard: L.compSi, plus: L.compSi },
      { feature: L.compFotosVideo, standard: L.compSi, plus: L.compMejorada },
      { feature: L.compHerramientasContacto, standard: L.compBasica, plus: L.compMejorada },
      { feature: L.compPrioridadVisibilidad, standard: L.compBasica, plus: L.compMejorada },
      { feature: L.compAnaliticas, standard: L.compSi, plus: L.compSi },
      { feature: L.compAsistenciasVisibilidad, standard: L.comp1, plus: L.comp2 },
      { feature: L.compMasLlamadas, standard: L.compBasica, plus: L.compMejorada },
      { feature: empleos ? L.compGenerarCandidatos : L.compConvertir, standard: L.compBasica, plus: L.compMejorada },
    ];
    const rows = empleos
      ? [
          { feature: L.compPerfil, standard: L.compSi, plus: L.compSi },
          { feature: L.compPresenciaCategoria, standard: L.compSi, plus: L.compSi },
          { feature: L.compHerramientasContacto, standard: L.compBasica, plus: L.compMejorada },
          { feature: L.compAnaliticas, standard: L.compSi, plus: L.compSi },
          { feature: L.compAsistenciasVisibilidad, standard: L.comp1, plus: L.comp2 },
          { feature: L.compGenerarCandidatos, standard: L.compBasica, plus: L.compMejorada },
        ]
      : defaultRows;
    return (
      <div className="mt-4 rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-[#111111]/10 flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#111111]">{L.compareTitle}</h4>
          <button
            type="button"
            onClick={() => setShowBusinessCompare(false)}
            className="text-xs font-medium text-[#111111]/70 hover:text-[#111111]"
          >
            {L.compareHide}
          </button>
        </div>
        <div className="p-3 sm:p-4">
          <div className="hidden sm:grid sm:grid-cols-3 gap-2 text-sm mb-2">
            <div className="font-semibold text-[#111111]">{L.incluye}</div>
            <div className="font-semibold text-[#111111]">{L.standardTitle}</div>
            <div className="font-semibold text-[#111111]">{L.plusTitle}</div>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 py-2 border-b border-[#111111]/5 last:border-0 text-sm">
              <div className="font-medium text-[#111111]">{r.feature}</div>
              <div className="sm:col-span-1 text-[#111111]/90 flex gap-2">
                <span className="sm:hidden text-[#111111]/60">{L.standardTitle}:</span>
                <span>{r.standard}</span>
              </div>
              <div className="sm:col-span-1 text-[#111111]/90 flex gap-2">
                <span className="sm:hidden text-[#111111]/60">{L.plusTitle}:</span>
                <span>{r.plus}</span>
              </div>
            </div>
          ))}
          <p className="text-xs text-[#111111]/80 mt-3">{L.standardLine}</p>
          <p className="text-xs text-[#111111]/80 mt-1">{L.plusLine}</p>
        </div>
      </div>
    );
  };

  const selectorCards: { key: CategoryKey; label: string; help: string }[] = [
    { key: "venta-personal", label: L.ventaPersonal, help: L.ventaPersonalHelp },
    { key: "auto", label: L.auto, help: L.autoHelp },
    { key: "rentas", label: L.rentas, help: L.rentasHelp },
    { key: "empleos", label: L.empleos, help: L.empleosHelp },
    { key: "servicios", label: L.servicios, help: L.serviciosHelp },
    { key: "clases", label: L.clases, help: L.clasesHelp },
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {selectedCategory === "venta-personal" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
            <p className="text-sm text-[#111111] mb-4">{L.personalIntro}</p>
            <div className="space-y-4">
              <PlanCard
                id="gratis"
                title={L.gratisTitle}
                price={L.gratisPrice}
                summary={L.gratisSummary}
                ideal={L.gratisIdeal}
                incluye={L.gratisIncluye}
                significa={L.gratisSignifica}
                cuandoSubir={L.gratisSubir}
              />
              <PlanCard
                id="pro"
                title={L.proTitle}
                price={L.proPrice}
                summary={L.proSummary}
                ideal={L.proIdeal}
                incluye={L.proIncluye}
                significa={L.proSignifica}
                cuandoSubir={L.proSubir}
                accent="gold"
                onShowCompare={() => setShowPersonalCompare(true)}
              />
            </div>
            {showPersonalCompare && <PersonalCompare />}
            <p className="mt-4 text-xs text-[#111111]/70">{L.personalNote}</p>
          </section>
        )}

        {selectedCategory === "auto" && (
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
                <div className="space-y-4">
                  <PlanCard
                    id="gratis"
                    title={L.gratisTitle}
                    price={L.gratisPrice}
                    summary={L.gratisSummary}
                    ideal={L.gratisIdeal}
                    incluye={L.gratisIncluye}
                    significa={L.gratisSignifica}
                    cuandoSubir={L.gratisSubir}
                  />
                  <PlanCard
                    id="pro"
                    title={L.proTitle}
                    price={L.proPrice}
                    summary={L.proSummary}
                    ideal={L.proIdeal}
                    incluye={L.proIncluye}
                    significa={L.proSignifica}
                    cuandoSubir={L.proSubir}
                    accent="gold"
                    onShowCompare={() => setShowPersonalCompare(true)}
                  />
                </div>
                {showPersonalCompare && <PersonalCompare />}
                <p className="mt-4 text-xs text-[#111111]/70">{L.autoDealerNote}</p>
              </>
            )}
            {autoSub === "negocio" && (
              <>
                <div className="space-y-4">
                  <PlanCard
                    id="standard"
                    title={L.standardTitle}
                    price={L.standardPrice}
                    summary={L.standardSummary}
                    ideal={L.standardIdeal}
                    incluye={L.standardIncluye}
                    significa={L.standardSignifica}
                    cuandoSubir={L.standardSubir}
                    accent="strong"
                    onShowCompare={() => setShowBusinessCompare(true)}
                  />
                  <PlanCard
                    id="plus"
                    title={L.plusTitle}
                    price={L.plusPrice}
                    summary={L.plusSummaryStrong}
                    ideal={L.plusIdeal}
                    incluye={L.plusIncluye}
                    significa={L.plusSignifica}
                    cuandoSubir={L.plusSubir}
                    accent="strong"
                    onShowCompare={() => setShowBusinessCompare(true)}
                  />
                </div>
                {showBusinessCompare && <BusinessCompare />}
                <p className="mt-4 text-xs text-[#111111]/70">{L.autoNegocioNote}</p>
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
                <div className="space-y-4">
                  <PlanCard
                    id="standard"
                    title={L.standardTitle}
                    price={L.standardPrice}
                    summary={L.standardSummary}
                    ideal={L.standardIdeal}
                    incluye={L.standardIncluye}
                    significa={L.standardSignifica}
                    cuandoSubir={L.standardSubir}
                    accent="strong"
                    onShowCompare={() => setShowBusinessCompare(true)}
                  />
                  <PlanCard
                    id="plus"
                    title={L.plusTitle}
                    price={L.plusPrice}
                    summary={L.plusSummaryStrong}
                    ideal={L.plusIdeal}
                    incluye={L.plusIncluye}
                    significa={L.plusSignifica}
                    cuandoSubir={L.plusSubir}
                    accent="strong"
                    onShowCompare={() => setShowBusinessCompare(true)}
                  />
                </div>
                {showBusinessCompare && <BusinessCompare />}
                <p className="mt-4 text-xs text-[#111111]/70">{L.rentasNegocioNote}</p>
              </>
            )}
          </section>
        )}

        {selectedCategory === "empleos" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
            <div className="rounded-2xl border-2 border-[#C9B46A]/40 bg-[#F8F6F0] p-4 mb-4">
              <h3 className="text-lg font-bold text-[#111111]">{L.empleosCard}</h3>
              <p className="text-base font-semibold text-[#111111] mt-1">{L.empleosPrice}</p>
              <p className="mt-2 text-sm text-[#111111]/90">{L.empleosExplain}</p>
            </div>
            <p className="text-sm text-[#111111] mb-4">{L.empleosNote}</p>
            <div className="space-y-4">
              <PlanCard
                id="standard"
                title={L.standardTitle}
                price={L.standardPrice}
                summary={L.standardSummary}
                ideal={L.standardIdeal}
                incluye={L.standardIncluye}
                significa={L.standardSignifica}
                cuandoSubir={L.standardSubir}
                accent="strong"
                onShowCompare={() => setShowBusinessCompare(true)}
              />
              <PlanCard
                id="plus"
                title={L.plusTitle}
                price={L.plusPrice}
                summary={L.plusSummaryStrong}
                ideal={L.plusIdeal}
                incluye={L.plusIncluye}
                significa={L.plusSignifica}
                cuandoSubir={L.plusSubir}
                accent="strong"
                onShowCompare={() => setShowBusinessCompare(true)}
              />
            </div>
            {showBusinessCompare && <BusinessCompare empleos />}
          </section>
        )}

        {selectedCategory === "servicios" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-4 sm:p-6">
            <p className="text-sm font-medium text-[#111111] mb-4">{L.serviciosIntro}</p>
            <div className="space-y-4">
              <PlanCard
                id="standard"
                title={L.standardTitle}
                price={L.standardPrice}
                summary={L.standardSummary}
                ideal={L.standardIdeal}
                incluye={L.standardIncluye}
                significa={L.standardSignifica}
                cuandoSubir={L.standardSubir}
                accent="strong"
                onShowCompare={() => setShowBusinessCompare(true)}
              />
              <PlanCard
                id="plus"
                title={L.plusTitle}
                price={L.plusPrice}
                summary={L.plusSummaryStrong}
                ideal={L.plusIdeal}
                incluye={L.plusIncluye}
                significa={L.plusSignifica}
                cuandoSubir={L.plusSubir}
                accent="strong"
                onShowCompare={() => setShowBusinessCompare(true)}
              />
            </div>
            {showBusinessCompare && <BusinessCompare />}
          </section>
        )}

        {selectedCategory === "clases" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
            <p className="text-sm text-[#111111] mb-2">{L.clasesComunidadFree}</p>
            <p className="text-sm text-[#111111] mb-4">{L.clasesIntro}</p>
            <p className="text-xs font-medium text-[#111111]/80 mb-2">{L.clasesPersonal}</p>
            <div className="space-y-3 mb-6">
              <PlanCard
                id="gratis"
                title={L.gratisTitle}
                price={L.gratisPrice}
                summary={L.gratisSummary}
                ideal={L.gratisIdeal}
                incluye={L.gratisIncluye}
                significa={L.gratisSignifica}
                cuandoSubir={L.gratisSubir}
              />
              <PlanCard
                id="pro"
                title={L.proTitle}
                price={L.proPrice}
                summary={L.proSummary}
                ideal={L.proIdeal}
                incluye={L.proIncluye}
                significa={L.proSignifica}
                cuandoSubir={L.proSubir}
                accent="gold"
              />
            </div>
            <p className="text-xs font-medium text-[#111111]/80 mb-2">{L.clasesNegocio}</p>
            <p className="text-xs text-[#111111]/70 mb-3">{L.clasesComercialNote}</p>
            <div className="space-y-3">
              <PlanCard
                id="standard"
                title={L.standardTitle}
                price={L.standardPrice}
                summary={L.standardSummary}
                ideal={L.standardIdeal}
                incluye={L.standardIncluye}
                significa={L.standardSignifica}
                cuandoSubir={L.standardSubir}
                accent="strong"
                onShowCompare={() => setShowBusinessCompare(true)}
              />
              <PlanCard
                id="plus"
                title={L.plusTitle}
                price={L.plusPrice}
                summary={L.plusSummaryStrong}
                ideal={L.plusIdeal}
                incluye={L.plusIncluye}
                significa={L.plusSignifica}
                cuandoSubir={L.plusSubir}
                accent="strong"
                onShowCompare={() => setShowBusinessCompare(true)}
              />
            </div>
            {showBusinessCompare && <BusinessCompare />}
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
