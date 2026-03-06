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

        autoSplit: "¿Publicas como vendedor particular o como negocio?",
        autoParticular: "Particular",
        autoNegocio: "Negocio",
        autoParticularNote:
          "Para vendedores particulares. Si operas como lote, dealer o inventario comercial, aplica la ruta de negocio.",
        autoNegocioNote: "Para presencia comercial, inventario o operación como negocio.",

        rentasSplit: "¿Publicas como persona o como negocio/profesional?",
        rentasPersona: "Persona / propietario ocasional",
        rentasNegocio: "Negocio / realtor / administrador",
        rentasPersonaBlock:
          "En rentas, algunas publicaciones personales pueden manejarse por publicación individual. Si publicas seguido o como operación profesional, te conviene la ruta de negocio.",
        rentasPersonaCta: "Ver opciones de publicación",
        rentasPersonaHint: "Las opciones finales aparecen al publicar.",
        rentasNegocioNote:
          "Si manejas varias propiedades, servicios de real estate o presencia profesional, estas son las opciones recomendadas.",

        empleosIntro:
          "Empleos funciona mejor como publicación profesional o comercial. Si tu meta es contratar con más visibilidad y mejor presentación, estas son las opciones relevantes.",

        serviciosIntro:
          "Si tu meta es que más personas te descubran, te contacten y confíen en tu negocio, esta es tu ruta.",

        clasesIntro:
          "Algunas publicaciones comunitarias pueden ser gratuitas o más ligeras. Las ofertas con fin claramente comercial o de crecimiento pueden necesitar una opción más fuerte.",
        clasesPersonal: "Comunitario / personal",
        clasesNegocio: "Comercial / negocio recurrente",

        verDetalles: "Ver detalles",
        ocultarDetalles: "Ocultar detalles",
        idealPara: "Ideal para",
        incluye: "Incluye",
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
        proIncluye: ["Más duración y mejor presentación", "Más fotos y mejor descripción", "1 asistencia de visibilidad", "Analíticas básicas"],
        proSignifica: "Más confianza, mejor exposición y seguimiento del rendimiento.",
        proSubir: "Si ya operas como negocio o dependes de captar clientes o contratos constantemente.",

        standardTitle: "Standard",
        standardPrice: "$49/semana",
        standardSummary: "Bueno para establecer una presencia profesional clara.",
        standardIdeal: ["Negocios que quieren presencia profesional clara y constante", "Dueños que quieren verse mejor por categoría"],
        standardIncluye: ["Perfil profesional del negocio", "Presencia por categoría", "Analíticas básicas", "1 asistencia de visibilidad"],
        standardSignifica: "Mejor presencia, mejor descubrimiento y una imagen más seria y organizada.",
        standardSubir: "Si necesitas más llamadas, mensajes o urgencia de conversión.",

        plusTitle: "Plus",
        plusPrice: "$125/semana",
        plusSummary: "Bueno para negocios que quieren más impulso, más contacto y mejor oportunidad de convertir visitas en clientes.",
        plusIdeal: ["Negocios que quieren cerrar más oportunidades", "Quienes necesitan mejor visibilidad y herramientas de contacto"],
        plusIncluye: ["Perfil premium para vender mejor", "Más herramientas de contacto", "Mayor visibilidad y prioridad", "2 asistencias de visibilidad"],
        plusSignifica: "Más exposición, menos fricción para que te contacten y mejor oportunidad de convertir vistas en llamadas o mensajes.",
        plusSubir: "",

        quizTitle: "¿Qué plan te conviene?",
        q1: "¿Qué quieres lograr más ahorita?",
        q1a: "Tener presencia profesional",
        q1b: "Conseguir más contacto y oportunidades",
        q2: "¿Te importa que la gente te llame o te escriba directamente desde tu presencia?",
        q2a: "Algo",
        q2b: "Mucho",
        q3: "¿Quieres mostrar más herramientas de negocio como sitio web, redes o formas de contacto más claras?",
        q3a: "No tanto",
        q3b: "Sí, eso me importa",
        q4: "¿Tu negocio depende mucho de fotos, presentación y confianza visual?",
        q4a: "Algo",
        q4b: "Mucho",
        q5: "¿Buscas solo aparecer o destacar por encima de opciones básicas?",
        q5a: "Solo aparecer bien",
        q5b: "Quiero destacar más",
        resultStandard: "Te recomendamos Standard",
        resultPlus: "Te recomendamos Plus",
        resultStandardWhy:
          "Nos dijiste que buscas una presencia profesional clara y ordenada. Standard te ayuda a empezar fuerte sin complicarte.",
        resultPlusWhy:
          "Nos dijiste que quieres más contacto, más visibilidad y una presencia más fuerte para convertir interés en oportunidades. Plus te conviene más.",
        quizNote: "Esta guía es solo una recomendación rápida.",
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
          "Muchos negocios tratan este tipo de inversión como parte de su presupuesto de publicidad y promoción. Lo importante es usar una plataforma que te ayude a verte mejor, a generar más confianza y a facilitar el contacto con clientes.",
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

        autoSplit: "Do you post as a private seller or as a business?",
        autoParticular: "Private",
        autoNegocio: "Business",
        autoParticularNote:
          "For private sellers. If you operate as a lot, dealer, or commercial inventory, use the business path.",
        autoNegocioNote: "For commercial presence, inventory, or business operation.",

        rentasSplit: "Do you post as an individual or as a business/professional?",
        rentasPersona: "Individual / occasional owner",
        rentasNegocio: "Business / realtor / manager",
        rentasPersonaBlock:
          "For rentals, some personal listings can be handled per listing. If you post often or as a professional operation, the business path fits you better.",
        rentasPersonaCta: "See posting options",
        rentasPersonaHint: "Final options appear when you publish.",
        rentasNegocioNote:
          "If you manage multiple properties, real estate services, or professional presence, these are the recommended options.",

        empleosIntro:
          "Jobs works best as professional or commercial posting. If your goal is to hire with more visibility and better presentation, these are the relevant options.",

        serviciosIntro:
          "If your goal is for more people to discover you, contact you, and trust your business, this is your path.",

        clasesIntro:
          "Some community posts can be free or lighter. Clearly commercial or growth-focused offers may need a stronger option.",
        clasesPersonal: "Community / personal",
        clasesNegocio: "Commercial / recurring business",

        verDetalles: "See details",
        ocultarDetalles: "Hide details",
        idealPara: "Ideal for",
        incluye: "Includes",
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
        proIncluye: ["Longer duration and better presentation", "More photos and description", "1 visibility assist", "Basic analytics"],
        proSignifica: "More trust, better exposure, and performance tracking.",
        proSubir: "If you already operate as a business or depend on capturing clients or contracts regularly.",

        standardTitle: "Standard",
        standardPrice: "$49/week",
        standardSummary: "Good for establishing a clear professional presence.",
        standardIdeal: ["Businesses that want clear, steady professional presence", "Owners who want to look better by category"],
        standardIncluye: ["Professional business profile", "Category presence", "Basic analytics", "1 visibility assist"],
        standardSignifica: "Better presence, better discovery, and a more serious, organized image.",
        standardSubir: "If you need more calls, messages, or conversion urgency.",

        plusTitle: "Plus",
        plusPrice: "$125/week",
        plusSummary: "Good for businesses that want more momentum, more contact, and better chance to turn visits into clients.",
        plusIdeal: ["Businesses that want to close more opportunities", "Those who need better visibility and contact tools"],
        plusIncluye: ["Premium profile to sell better", "More contact tools", "Higher visibility and priority", "2 visibility assists"],
        plusSignifica: "More exposure, less friction for people to contact you, and better chance to turn views into calls or messages.",
        plusSubir: "",

        quizTitle: "Which plan fits you best?",
        q1: "What do you want to achieve most right now?",
        q1a: "Have a professional presence",
        q1b: "Get more contact and opportunities",
        q2: "Do you care if people call or message you directly from your presence?",
        q2a: "Some",
        q2b: "A lot",
        q3: "Do you want to show more business tools like website, social, or clearer contact options?",
        q3a: "Not really",
        q3b: "Yes, that matters to me",
        q4: "Does your business depend a lot on photos, presentation, and visual trust?",
        q4a: "Some",
        q4b: "A lot",
        q5: "Do you want to just show up or stand out above basic options?",
        q5a: "Just show up well",
        q5b: "I want to stand out more",
        resultStandard: "We recommend Standard",
        resultPlus: "We recommend Plus",
        resultStandardWhy:
          "You said you want a clear, organized professional presence. Standard helps you start strong without overcomplicating.",
        resultPlusWhy:
          "You said you want more contact, more visibility, and a stronger presence to turn interest into opportunities. Plus fits you better.",
        quizNote: "This is just a quick recommendation.",
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
          "Many businesses treat this kind of investment as part of their advertising and promotion budget. What matters is using a platform that helps you look better, build more trust, and make it easier for customers to reach you.",
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
        {/* 1) HERO */}
        <header className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111111]">{L.title}</h1>
          <p className="mt-3 text-base sm:text-lg text-[#111111] max-w-xl mx-auto">{L.subtitle}</p>
          <p className="mt-2 text-sm text-[#111111]/80 max-w-lg mx-auto">{L.supportLine}</p>
        </header>

        {/* 2) SELECTOR */}
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

        {/* 3) DYNAMIC PANELS */}
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
              />
            </div>
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
                  />
                </div>
                <p className="mt-4 text-xs text-[#111111]/70">{L.autoParticularNote}</p>
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
                  />
                  <PlanCard
                    id="plus"
                    title={L.plusTitle}
                    price={L.plusPrice}
                    summary={L.plusSummary}
                    ideal={L.plusIdeal}
                    incluye={L.plusIncluye}
                    significa={L.plusSignifica}
                    cuandoSubir={L.plusSubir}
                    accent="strong"
                  />
                </div>
                <p className="mt-4 text-xs text-[#111111]/70">{L.autoNegocioNote}</p>
              </>
            )}
          </section>
        )}

        {selectedCategory === "rentas" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
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
                <p className="text-sm text-[#111111]/90 mb-4">{L.rentasPersonaBlock}</p>
                <Link
                  href={withLang(L.routePost)}
                  className="inline-flex justify-center w-full sm:w-auto rounded-xl bg-[#111111] text-[#F5F5F5] font-semibold py-3 px-5 text-sm hover:opacity-95 transition"
                >
                  {L.rentasPersonaCta}
                </Link>
                <p className="mt-2 text-xs text-[#111111]/60">{L.rentasPersonaHint}</p>
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
                  />
                  <PlanCard
                    id="plus"
                    title={L.plusTitle}
                    price={L.plusPrice}
                    summary={L.plusSummary}
                    ideal={L.plusIdeal}
                    incluye={L.plusIncluye}
                    significa={L.plusSignifica}
                    cuandoSubir={L.plusSubir}
                    accent="strong"
                  />
                </div>
                <p className="mt-4 text-xs text-[#111111]/70">{L.rentasNegocioNote}</p>
              </>
            )}
          </section>
        )}

        {selectedCategory === "empleos" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
            <p className="text-sm text-[#111111] mb-4">{L.empleosIntro}</p>
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
              />
              <PlanCard
                id="plus"
                title={L.plusTitle}
                price={L.plusPrice}
                summary={L.plusSummary}
                ideal={L.plusIdeal}
                incluye={L.plusIncluye}
                significa={L.plusSignifica}
                cuandoSubir={L.plusSubir}
                accent="strong"
              />
            </div>
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
              />
              <PlanCard
                id="plus"
                title={L.plusTitle}
                price={L.plusPrice}
                summary={L.plusSummary}
                ideal={L.plusIdeal}
                incluye={L.plusIncluye}
                significa={L.plusSignifica}
                cuandoSubir={L.plusSubir}
                accent="strong"
              />
            </div>
          </section>
        )}

        {selectedCategory === "clases" && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
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
              />
              <PlanCard
                id="plus"
                title={L.plusTitle}
                price={L.plusPrice}
                summary={L.plusSummary}
                ideal={L.plusIdeal}
                incluye={L.plusIncluye}
                significa={L.plusSignifica}
                cuandoSubir={L.plusSubir}
                accent="strong"
              />
            </div>
          </section>
        )}

        {/* 5) QUIZ - only in business path */}
        {isBusinessPath && (
          <section className="mb-8 rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-4 sm:p-6">
            <h2 className="text-lg font-bold text-[#111111]">{L.quizTitle}</h2>

            {!quizResult && quizStep < 5 && (
              <div className="mt-4 space-y-4">
                {quizStep === 0 && (
                  <div>
                    <p className="font-medium text-[#111111] mb-2">{L.q1}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => handleQuizAnswer(0)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
                        {L.q1a}
                      </button>
                      <button type="button" onClick={() => handleQuizAnswer(1)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
                        {L.q1b}
                      </button>
                    </div>
                  </div>
                )}
                {quizStep === 1 && (
                  <div>
                    <p className="font-medium text-[#111111] mb-2">{L.q2}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => handleQuizAnswer(0)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
                        {L.q2a}
                      </button>
                      <button type="button" onClick={() => handleQuizAnswer(1)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
                        {L.q2b}
                      </button>
                    </div>
                  </div>
                )}
                {quizStep === 2 && (
                  <div>
                    <p className="font-medium text-[#111111] mb-2">{L.q3}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => handleQuizAnswer(0)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
                        {L.q3a}
                      </button>
                      <button type="button" onClick={() => handleQuizAnswer(1)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
                        {L.q3b}
                      </button>
                    </div>
                  </div>
                )}
                {quizStep === 3 && (
                  <div>
                    <p className="font-medium text-[#111111] mb-2">{L.q4}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => handleQuizAnswer(0)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
                        {L.q4a}
                      </button>
                      <button type="button" onClick={() => handleQuizAnswer(1)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
                        {L.q4b}
                      </button>
                    </div>
                  </div>
                )}
                {quizStep === 4 && (
                  <div>
                    <p className="font-medium text-[#111111] mb-2">{L.q5}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => handleQuizAnswer(0)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
                        {L.q5a}
                      </button>
                      <button type="button" onClick={() => handleQuizAnswer(1)} className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
                        {L.q5b}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {quizResult && (
              <div className="mt-4 rounded-xl border border-[#C9B46A]/40 bg-[#F5F5F5] p-4">
                <p className="text-lg font-bold text-[#111111]">
                  {quizResult === "standard" ? L.resultStandard : L.resultPlus}
                </p>
                <p className="mt-2 text-sm text-[#111111]/90">
                  {quizResult === "standard" ? L.resultStandardWhy : L.resultPlusWhy}
                </p>
                <p className="mt-3 text-xs text-[#111111]/60">{L.quizNote}</p>
                <Link
                  href={withLang(L.routeCuenta)}
                  className="mt-4 block w-full text-center rounded-xl bg-[#111111] text-[#F5F5F5] font-semibold py-3 px-4 text-sm hover:opacity-95 transition"
                >
                  {L.ctaAccount}
                </Link>
                <button type="button" onClick={resetQuiz} className="mt-2 block w-full text-center text-sm text-[#111111]/70 hover:text-[#111111]">
                  {L.quizReset}
                </button>
              </div>
            )}
          </section>
        )}

        {/* 6) RESOURCE PREVIEW */}
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

        {/* 7) TRUST NOTE */}
        <section className="mb-8 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-5">
          <h2 className="text-base font-bold text-[#111111]">{L.trustTitle}</h2>
          <p className="mt-2 text-sm text-[#111111]/90">{L.trustBody}</p>
          <p className="mt-2 text-xs text-[#111111]/70">{L.trustTax}</p>
        </section>

        {/* 8) FINAL CTA ROW */}
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
