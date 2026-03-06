"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";

type Lang = "es" | "en";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function MembresiasPage() {
  const params = useSearchParams();
  const lang: Lang = params?.get("lang") === "en" ? "en" : "es";

  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<"standard" | "plus" | null>(null);

  const withLang = (path: string) => {
    const joiner = path.includes("?") ? "&" : "?";
    return `${path}${joiner}lang=${lang}`;
  };

  const t = useMemo(() => {
    const copy = {
      es: {
        title: "Membresías",
        subtitle:
          "Opciones claras para personas y negocios que quieren publicar mejor, ganar más visibilidad y crecer con LEONIX.",
        introLine:
          "No solo es publicar. Es elegir el nivel de visibilidad, presentación y herramientas que mejor se adapta a tu meta.",

        ctaPost: "Publicar anuncio",
        ctaListings: "Ver anuncios",
        ctaMediaKit: "Solicita el Media Kit",
        ctaAccount: "Entrar a mi cuenta",
        ctaSeeDetails: "Ver detalles",

        compareTitle: "Comparación rápida",
        freePrice: "Gratis",
        proPrice: "Desde tu cuenta",
        standardPrice: "$49/semana",
        plusPrice: "$125/semana",

        freeWho: "Para publicaciones ocasionales y comunitarias.",
        proWho: "Para personas que publican más seguido y quieren mejor presentación.",
        standardWho: "Para negocios que quieren presencia profesional clara y constante.",
        plusWho: "Para negocios que quieren más contacto, más prioridad y mejor conversión.",

        deepTitle: "Desglose por plan",
        idealPara: "Ideal para",
        incluye: "Incluye",
        teAyuda: "Te ayuda a lograr",
        noIncluye: "No incluye",
        cuandoSubir: "Cuándo subir de plan",

        gratisIdeal: ["Personas que publican de vez en cuando", "Comunidad, artículos sueltos o necesidades básicas"],
        gratisIncluye: ["Publicación básica", "Visibilidad en búsqueda", "Presencia dentro del marketplace"],
        gratisAyuda: ["Estar presente sin pagar al inicio", "Probar la plataforma"],
        gratisNo: ["Presentación mejorada", "Asistencias de visibilidad", "Analíticas"],
        gratisSubir: "Si publicas seguido, si quieres más fotos, mejor presentación o más datos.",

        proIdeal: ["Personas que venden con más frecuencia", "Usuarios que quieren verse más serios y destacar mejor"],
        proIncluye: ["Más duración y mejor presentación", "Más fotos y mejor descripción", "1 asistencia de visibilidad", "Analíticas básicas"],
        proAyuda: ["Más confianza", "Mejor exposición", "Mejor seguimiento del rendimiento"],
        proNo: ["Herramientas avanzadas de negocio", "Prioridad fuerte de negocio"],
        proSubir: "Si ya operas como negocio o dependes de captar clientes o contratos constantemente.",

        standardIdeal: ["Negocios que quieren presencia profesional clara y constante", "Dueños que quieren empezar a verse mejor por categoría"],
        standardIncluye: ["Perfil profesional del negocio", "Presencia por categoría", "Analíticas básicas", "1 asistencia de visibilidad"],
        standardAyuda: ["Mejor presencia", "Mejor descubrimiento", "Una imagen más seria y organizada"],
        standardNo: ["El nivel más fuerte de prioridad/contacto del plan superior"],
        standardSubir: "Si necesitas más llamadas, mensajes o urgencia de conversión, o una presencia más agresiva.",

        plusIdeal: ["Negocios que quieren cerrar más oportunidades", "Negocios que necesitan mejor visibilidad y herramientas de contacto"],
        plusIncluye: ["Perfil premium para vender mejor", "Más herramientas de contacto", "Mayor visibilidad y prioridad", "2 asistencias de visibilidad"],
        plusAyuda: ["Más exposición", "Menos fricción para que te contacten", "Mejor oportunidad de convertir vistas en llamadas o mensajes"],
        plusNo: [],
        plusSubir: "",

        benefitsTitle: "¿Qué significa cada beneficio?",
        asistenciaTitle: "Asistencia de visibilidad",
        asistenciaBody: "Ayuda a que un anuncio gane impulso extra por un tiempo cuando más lo necesitas.",
        analiticasTitle: "Analíticas básicas",
        analiticasBody: "Te muestran si la gente está encontrando y viendo tu anuncio.",
        presenciaTitle: "Presencia por categoría",
        presenciaBody: "Ayuda a que tu negocio aparezca donde la gente ya está buscando ese tipo de servicio o producto.",
        contactoTitle: "Herramientas de contacto",
        contactoBody: "Hacen más fácil que un cliente te llame o te escriba sin tanta fricción.",
        prioridadTitle: "Prioridad de visibilidad",
        prioridadBody: "Ayuda a que tu presencia se vea más fuerte frente a opciones más básicas.",

        quizTitle: "¿Qué plan te conviene?",
        quizSubtitle: "Responde en pocos segundos y te recomendamos un plan.",
        q1: "¿Publicas seguido?",
        q1a: "A veces",
        q1b: "Casi siempre",
        q2: "¿Qué buscas más?",
        q2a: "Presencia profesional",
        q2b: "Más llamadas / mensajes / contactos",
        q3: "¿Qué tanto depende tu negocio de fotos, ubicación y contacto directo?",
        q3a: "Algo",
        q3b: "Mucho",
        q4: "¿Tu meta principal ahorita es…?",
        q4a: "Verte mejor y estar presente",
        q4b: "Conseguir más oportunidades rápido",
        resultStandard: "Te recomendamos Standard",
        resultPlus: "Te recomendamos Plus",
        resultStandardWhy:
          "Nos dijiste que buscas presencia profesional constante y mejor organización. Standard te queda bien para empezar fuerte sin complicarte.",
        resultPlusWhy:
          "Nos dijiste que quieres más contacto, más visibilidad y mejor oportunidad de conversión. Plus te conviene más.",
        quizNote: "Esta recomendación es una guía rápida, no una obligación.",
        quizReset: "Volver a responder",

        resourceTitle: "Aprende a vender mejor con LEONIX",
        resourceSubtitle: "También queremos ayudarte a entender mejor cómo mejorar tu presencia, tu anuncio y tu negocio.",
        resource1: "Qué significa SEO en palabras simples",
        resource2: "Cómo tomar mejores fotos para vender",
        resource3: "Qué poner en un perfil de negocio",
        resource4: "Cómo saber si tu publicidad está funcionando",
        resourceSoon: "Muy pronto: recursos y guías creadas para negocios latinos.",

        trustTitle: "Invertir en visibilidad también es parte de crecer",
        trustBody:
          "Muchos negocios tratan este tipo de inversión como parte de su presupuesto de publicidad y promoción. Lo importante es usar una plataforma que te ayude a verte mejor, a generar más confianza y a facilitar el contacto con clientes.",
        trustTax: "Para temas fiscales o deducciones específicas, consulta con tu contador.",

        routePost: "/clasificados/publicar",
        routeList: "/clasificados/lista",
        routeCuenta: "/clasificados/cuenta",
        routeContacto: "/contacto",
      },
      en: {
        title: "Memberships",
        subtitle:
          "Clear options for personal sellers and businesses that want better posting, stronger visibility, and room to grow with LEONIX.",
        introLine:
          "It's not just about posting. It's about choosing the visibility, presentation, and tools that match your goal.",

        ctaPost: "Post a listing",
        ctaListings: "Browse listings",
        ctaMediaKit: "Request the Media Kit",
        ctaAccount: "Go to my account",
        ctaSeeDetails: "See details",

        compareTitle: "Quick compare",
        freePrice: "Gratis",
        proPrice: "Available in your account",
        standardPrice: "$49/week",
        plusPrice: "$125/week",

        freeWho: "For occasional and community posts.",
        proWho: "For people who post more often and want better presentation.",
        standardWho: "For businesses that want a clear, steady professional presence.",
        plusWho: "For businesses that want more contact, more priority, and better conversion.",

        deepTitle: "Plan breakdown",
        idealPara: "Ideal for",
        incluye: "Includes",
        teAyuda: "Helps you achieve",
        noIncluye: "Does not include",
        cuandoSubir: "When to upgrade",

        gratisIdeal: ["People who post from time to time", "Community, one-off items, or basic needs"],
        gratisIncluye: ["Basic posting", "Visibility in search", "Presence in the marketplace"],
        gratisAyuda: ["Be present without paying upfront", "Try the platform"],
        gratisNo: ["Enhanced presentation", "Visibility assists", "Analytics"],
        gratisSubir: "If you post often, or want more photos, better presentation, or more data.",

        proIdeal: ["People who sell more frequently", "Users who want to look more serious and stand out"],
        proIncluye: ["Longer duration and better presentation", "More photos and better description", "1 visibility assist", "Basic analytics"],
        proAyuda: ["More trust", "Better exposure", "Better performance tracking"],
        proNo: ["Advanced business tools", "Strong business priority"],
        proSubir: "If you already operate as a business or depend on capturing clients or contracts regularly.",

        standardIdeal: ["Businesses that want clear, steady professional presence", "Owners who want to look better by category"],
        standardIncluye: ["Professional business profile", "Category presence", "Basic analytics", "1 visibility assist"],
        standardAyuda: ["Better presence", "Better discovery", "A more serious, organized image"],
        standardNo: ["The strongest priority/contact level of the higher plan"],
        standardSubir: "If you need more calls, messages, or conversion urgency, or a more aggressive presence.",

        plusIdeal: ["Businesses that want to close more opportunities", "Businesses that need better visibility and contact tools"],
        plusIncluye: ["Premium profile to sell better", "More contact tools", "Higher visibility and priority", "2 visibility assists"],
        plusAyuda: ["More exposure", "Less friction for people to contact you", "Better chance to turn views into calls or messages"],
        plusNo: [],
        plusSubir: "",

        benefitsTitle: "What does each benefit mean?",
        asistenciaTitle: "Visibility assist",
        asistenciaBody: "Helps a listing gain extra momentum for a period when you need it most.",
        analiticasTitle: "Basic analytics",
        analiticasBody: "Shows you whether people are finding and viewing your listing.",
        presenciaTitle: "Category presence",
        presenciaBody: "Helps your business appear where people are already searching for that type of service or product.",
        contactoTitle: "Contact tools",
        contactoBody: "Make it easier for a customer to call or message you with less friction.",
        prioridadTitle: "Visibility priority",
        prioridadBody: "Helps your presence look stronger next to more basic options.",

        quizTitle: "Which plan fits you?",
        quizSubtitle: "Answer in a few seconds and we'll recommend a plan.",
        q1: "Do you post often?",
        q1a: "Sometimes",
        q1b: "Almost always",
        q2: "What are you looking for most?",
        q2a: "Professional presence",
        q2b: "More calls / messages / contacts",
        q3: "How much does your business depend on photos, location, and direct contact?",
        q3a: "Some",
        q3b: "A lot",
        q4: "Your main goal right now is…?",
        q4a: "Look better and be present",
        q4b: "Get more opportunities fast",
        resultStandard: "We recommend Standard",
        resultPlus: "We recommend Plus",
        resultStandardWhy:
          "You said you want steady professional presence and better organization. Standard fits you well to start strong without overcomplicating.",
        resultPlusWhy:
          "You said you want more contact, more visibility, and better conversion. Plus suits you better.",
        quizNote: "This recommendation is a quick guide, not a requirement.",
        quizReset: "Answer again",

        resourceTitle: "Learn how to grow with LEONIX",
        resourceSubtitle: "We also want to help you better understand how to improve your visibility, your listing, and your business.",
        resource1: "What SEO means in simple words",
        resource2: "How to take better photos to sell",
        resource3: "What to put in a business profile",
        resource4: "How to tell if your advertising is working",
        resourceSoon: "Coming soon: resources and guides built for Latino businesses.",

        trustTitle: "Investing in visibility is also part of growing",
        trustBody:
          "Many businesses treat this kind of investment as part of their advertising and promotion budget. What matters is using a platform that helps you look better, build more trust, and make it easier for customers to reach you.",
        trustTax: "For tax-specific treatment or deductions, check with your accountant.",

        routePost: "/clasificados/publicar",
        routeList: "/clasificados/lista",
        routeCuenta: "/clasificados/cuenta",
        routeContacto: "/contacto",
      },
    };

    return copy[lang];
  }, [lang]);

  const L = t;

  const handleQuizAnswer = (value: number) => {
    const next = [...quizAnswers, value];
    setQuizAnswers(next);
    if (next.length >= 4) {
      const sum = next.reduce((a, b) => a + b, 0);
      setQuizResult(sum <= 2 ? "standard" : "plus");
      setQuizStep(4);
    } else {
      setQuizStep(next.length);
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  const QuickCard = ({
    id,
    title,
    price,
    who,
    bullets,
    accent,
  }: {
    id: string;
    title: string;
    price: string;
    who: string;
    bullets: string[];
    accent?: "gold" | "strong";
  }) => (
    <div
      className={cx(
        "rounded-2xl border bg-[#F5F5F5] p-4 sm:p-5",
        accent === "gold" && "border-yellow-500/25",
        accent === "strong" && "border-yellow-500/40 bg-[#F8F6F0]"
      )}
    >
      <div className="text-lg font-bold text-[#111111]">{title}</div>
      <div className="mt-1 text-sm font-semibold text-[#111111]">{price}</div>
      <p className="mt-2 text-sm text-[#111111]/80">{who}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-[#111111]">
        {bullets.slice(0, 3).map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#111111]/70 shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <a
        href={`#${id}`}
        className="mt-4 block w-full sm:w-auto text-center rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-2.5 px-4 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF] transition"
      >
        {L.ctaSeeDetails}
      </a>
    </div>
  );

  const DeepSection = ({
    id,
    title,
    ideal,
    incluye,
    ayuda,
    noIncluye,
    cuandoSubir,
  }: {
    id: string;
    title: string;
    ideal: string[];
    incluye: string[];
    ayuda: string[];
    noIncluye: string[];
    cuandoSubir: string;
  }) => (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6 mb-6">
      <h3 className="text-xl font-bold text-[#111111] mb-4">{title}</h3>
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-semibold text-[#111111] mb-1">{L.idealPara}</h4>
          <ul className="space-y-1 text-[#111111]/90">
            {ideal.map((s, i) => (
              <li key={i}>· {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-[#111111] mb-1">{L.incluye}</h4>
          <ul className="space-y-1 text-[#111111]/90">
            {incluye.map((s, i) => (
              <li key={i}>· {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-[#111111] mb-1">{L.teAyuda}</h4>
          <ul className="space-y-1 text-[#111111]/90">
            {ayuda.map((s, i) => (
              <li key={i}>· {s}</li>
            ))}
          </ul>
        </div>
        {noIncluye.length > 0 && (
          <div>
            <h4 className="font-semibold text-[#111111] mb-1">{L.noIncluye}</h4>
            <ul className="space-y-1 text-[#111111]/90">
              {noIncluye.map((s, i) => (
                <li key={i}>· {s}</li>
              ))}
            </ul>
          </div>
        )}
        {cuandoSubir && (
          <div>
            <h4 className="font-semibold text-[#111111] mb-1">{L.cuandoSubir}</h4>
            <p className="text-[#111111]/90">{cuandoSubir}</p>
          </div>
        )}
      </div>
    </section>
  );

  const BenefitCard = ({
    title,
    body,
    className,
  }: {
    title: string;
    body: string;
    className?: string;
  }) => (
    <div className={cx("rounded-xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4", className)}>
      <h4 className="font-semibold text-[#111111]">{title}</h4>
      <p className="mt-1.5 text-sm text-[#111111]/90">{body}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111] pb-20 bg-[radial-gradient(ellipse_at_top,rgba(169,140,42,0.10),transparent_60%)]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
        {/* 1) HERO */}
        <header className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111111]">{L.title}</h1>
          <p className="mt-3 text-[#111111] text-base sm:text-lg max-w-2xl mx-auto">{L.subtitle}</p>
          <p className="mt-2 text-sm text-[#111111]/80 max-w-xl mx-auto">{L.introLine}</p>
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <Link
              href={withLang(L.routePost)}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-full bg-[#111111] text-[#F5F5F5] font-semibold py-3 px-5 text-sm hover:opacity-95 transition"
            >
              {L.ctaPost}
            </Link>
            <Link
              href={withLang(L.routeList)}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold py-3 px-5 text-sm hover:bg-[#EFEFEF] transition"
            >
              {L.ctaListings}
            </Link>
            <Link
              href={withLang(L.routeContacto)}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold py-3 px-5 text-sm hover:bg-[#EFEFEF] transition"
            >
              {L.ctaMediaKit}
            </Link>
          </div>
        </header>

        {/* 2) QUICK COMPARE */}
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111111] mb-4">{L.compareTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickCard
              id="plan-gratis"
              title="Gratis"
              price={L.freePrice}
              who={L.freeWho}
              bullets={L.gratisIncluye}
            />
            <QuickCard
              id="plan-pro"
              title="LEONIX Pro"
              price={L.proPrice}
              who={L.proWho}
              bullets={L.proIncluye}
              accent="gold"
            />
            <QuickCard
              id="plan-standard"
              title="Standard"
              price={L.standardPrice}
              who={L.standardWho}
              bullets={L.standardIncluye}
              accent="strong"
            />
            <QuickCard
              id="plan-plus"
              title="Plus"
              price={L.plusPrice}
              who={L.plusWho}
              bullets={L.plusIncluye}
              accent="strong"
            />
          </div>
        </section>

        {/* 3) DEEP PLAN BREAKDOWNS */}
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111111] mb-4">{L.deepTitle}</h2>
          <DeepSection
            id="plan-gratis"
            title="Gratis"
            ideal={L.gratisIdeal}
            incluye={L.gratisIncluye}
            ayuda={L.gratisAyuda}
            noIncluye={L.gratisNo}
            cuandoSubir={L.gratisSubir}
          />
          <DeepSection
            id="plan-pro"
            title="LEONIX Pro"
            ideal={L.proIdeal}
            incluye={L.proIncluye}
            ayuda={L.proAyuda}
            noIncluye={L.proNo}
            cuandoSubir={L.proSubir}
          />
          <DeepSection
            id="plan-standard"
            title="Standard"
            ideal={L.standardIdeal}
            incluye={L.standardIncluye}
            ayuda={L.standardAyuda}
            noIncluye={L.standardNo}
            cuandoSubir={L.standardSubir}
          />
          <DeepSection
            id="plan-plus"
            title="Plus"
            ideal={L.plusIdeal}
            incluye={L.plusIncluye}
            ayuda={L.plusAyuda}
            noIncluye={L.plusNo}
            cuandoSubir={L.plusSubir}
          />
        </section>

        {/* 4) BENEFIT EXPLAINERS */}
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111111] mb-4">{L.benefitsTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BenefitCard title={L.asistenciaTitle} body={L.asistenciaBody} />
            <BenefitCard title={L.analiticasTitle} body={L.analiticasBody} />
            <BenefitCard title={L.presenciaTitle} body={L.presenciaBody} />
            <BenefitCard title={L.contactoTitle} body={L.contactoBody} />
            <BenefitCard title={L.prioridadTitle} body={L.prioridadBody} className="sm:col-span-2" />
          </div>
        </section>

        {/* 5) QUIZ */}
        <section className="mb-10 sm:mb-12 rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-4 sm:p-6">
          <h2 className="text-xl font-bold text-[#111111]">{L.quizTitle}</h2>
          <p className="mt-1 text-sm text-[#111111]/80">{L.quizSubtitle}</p>

          {!quizResult && quizStep < 4 && (
            <div className="mt-4 space-y-4">
              {quizStep === 0 && (
                <div>
                  <p className="font-medium text-[#111111] mb-2">{L.q1}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuizAnswer(0)}
                      className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
                    >
                      {L.q1a}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuizAnswer(1)}
                      className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
                    >
                      {L.q1b}
                    </button>
                  </div>
                </div>
              )}
              {quizStep === 1 && (
                <div>
                  <p className="font-medium text-[#111111] mb-2">{L.q2}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuizAnswer(0)}
                      className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
                    >
                      {L.q2a}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuizAnswer(1)}
                      className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
                    >
                      {L.q2b}
                    </button>
                  </div>
                </div>
              )}
              {quizStep === 2 && (
                <div>
                  <p className="font-medium text-[#111111] mb-2">{L.q3}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuizAnswer(0)}
                      className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
                    >
                      {L.q3a}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuizAnswer(1)}
                      className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
                    >
                      {L.q3b}
                    </button>
                  </div>
                </div>
              )}
              {quizStep === 3 && (
                <div>
                  <p className="font-medium text-[#111111] mb-2">{L.q4}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuizAnswer(0)}
                      className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
                    >
                      {L.q4a}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuizAnswer(1)}
                      className="w-full sm:flex-1 rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] py-3 px-4 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
                    >
                      {L.q4b}
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
              <button
                type="button"
                onClick={resetQuiz}
                className="mt-2 block w-full text-center text-sm text-[#111111]/70 hover:text-[#111111]"
              >
                {L.quizReset}
              </button>
            </div>
          )}
        </section>

        {/* 6) RESOURCE PREVIEW */}
        <section className="mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111111] mb-2">{L.resourceTitle}</h2>
          <p className="text-sm text-[#111111]/80 mb-4">{L.resourceSubtitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#111111]/10 bg-[#F5F5F5] p-4">
              <p className="text-sm font-medium text-[#111111]">{L.resource1}</p>
            </div>
            <div className="rounded-xl border border-[#111111]/10 bg-[#F5F5F5] p-4">
              <p className="text-sm font-medium text-[#111111]">{L.resource2}</p>
            </div>
            <div className="rounded-xl border border-[#111111]/10 bg-[#F5F5F5] p-4">
              <p className="text-sm font-medium text-[#111111]">{L.resource3}</p>
            </div>
            <div className="rounded-xl border border-[#111111]/10 bg-[#F5F5F5] p-4">
              <p className="text-sm font-medium text-[#111111]">{L.resource4}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#111111]/60">{L.resourceSoon}</p>
        </section>

        {/* 7) TRUST NOTE */}
        <section className="mb-10 sm:mb-12 rounded-2xl border border-[#C9B46A]/20 bg-[#F5F5F5] p-4 sm:p-6">
          <h2 className="text-lg font-bold text-[#111111]">{L.trustTitle}</h2>
          <p className="mt-2 text-sm text-[#111111]/90">{L.trustBody}</p>
          <p className="mt-3 text-xs text-[#111111]/70">{L.trustTax}</p>
        </section>

        {/* 8) FINAL CTA ROW */}
        <section className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
          <Link
            href={withLang(L.routePost)}
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-full bg-[#111111] text-[#F5F5F5] font-semibold py-3 px-5 text-sm hover:opacity-95 transition"
          >
            {L.ctaPost}
          </Link>
          <Link
            href={withLang(L.routeList)}
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold py-3 px-5 text-sm hover:bg-[#EFEFEF] transition"
          >
            {L.ctaListings}
          </Link>
          <Link
            href={withLang(L.routeCuenta)}
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold py-3 px-5 text-sm hover:bg-[#EFEFEF] transition"
          >
            {L.ctaAccount}
          </Link>
          <Link
            href={withLang(L.routeContacto)}
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold py-3 px-5 text-sm hover:bg-[#EFEFEF] transition"
          >
            {L.ctaMediaKit}
          </Link>
        </section>
      </main>
    </div>
  );
}
