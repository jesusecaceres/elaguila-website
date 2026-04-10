type Lang = "es" | "en";

const ITEMS: Record<Lang, { title: string; body: string; icon: "map" | "globe" | "shield" | "link" }[]> = {
  es: [
    {
      title: "Negocios Locales",
      body: "Priorizamos talento cercano y citas prácticas en tu zona.",
      icon: "map",
    },
    {
      title: "Exposición Bilingüe",
      body: "Tu mensaje llega en español e inglés cuando lo publicas así.",
      icon: "globe",
    },
    {
      title: "Contacto Directo y Seguro",
      body: "Llamadas y mensajes claros — sin intermediarios innecesarios.",
      icon: "shield",
    },
    {
      title: "Web, Redes y Videos",
      body: "Leonix es el puente promocional hacia tus canales propios.",
      icon: "link",
    },
  ],
  en: [
    {
      title: "Local businesses",
      body: "We prioritize nearby talent and practical scheduling in your area.",
      icon: "map",
    },
    {
      title: "Bilingual exposure",
      body: "Your message reaches Spanish and English audiences when you publish both.",
      icon: "globe",
    },
    {
      title: "Direct, clear contact",
      body: "Calls and messages stay straightforward — no unnecessary middlemen.",
      icon: "shield",
    },
    {
      title: "Web, social & video",
      body: "Leonix is the promotional bridge to your own channels.",
      icon: "link",
    },
  ],
};

function Icon({ kind }: { kind: "map" | "globe" | "shield" | "link" }) {
  const cls = "h-6 w-6 text-[#1e3a5f]";
  switch (kind) {
    case "map":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z" strokeLinejoin="round" />
          <circle cx="12" cy="11" r="2.5" />
        </svg>
      );
    case "globe":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a16 16 0 000 18M12 3a16 16 0 010 18" />
        </svg>
      );
    case "shield":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 3l7 3v6c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" />
        </svg>
      );
  }
}

export function TrustValueStrip({ lang }: { lang: Lang }) {
  const items = ITEMS[lang];
  return (
    <section
      className="rounded-2xl border border-[#E8E2D8] bg-[#FFFCF7] px-4 py-8 shadow-[0_12px_36px_-24px_rgba(30,52,78,0.35)] sm:px-8"
      aria-labelledby="servicios-trust-heading"
    >
      <h2 id="servicios-trust-heading" className="sr-only">
        {lang === "en" ? "Why Leonix Servicios" : "Por qué Leonix Servicios"}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {items.map((it) => (
          <div key={it.title} className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8EDF4]/90">
              <Icon kind={it.icon} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#1a2f4a]">{it.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-[#5b6b7b]">{it.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
