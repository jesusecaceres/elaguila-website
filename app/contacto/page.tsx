  "use client";

  import Navbar from "../components/Navbar";
  import Footer from "../components/Footer";
  import { useSearchParams } from "next/navigation";

  export default function Page() {
    const searchParams = useSearchParams();
    const lang = searchParams.get("lang") === "en" ? "en" : "es";

    const text = {
      es: {
        title: "Contacto",
        desc: "Muy pronto podrás escribirnos directamente desde esta página para anuncios, eventos y más.",
      },
      en: {
        title: "Contact",
        desc: "Soon you’ll be able to contact us directly from this page for ads, events and more.",
      },
    } as const;

    const L = text[lang];

    return (
      <main className="min-h-screen w-full text-white relative">
        <Navbar />
        <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
          <h1 className="text-4xl font-extrabold text-yellow-300 drop-shadow mb-4">
            {L.title}
          </h1>
          <p className="text-lg text-gray-200">{L.desc}</p>
        </div>
        <Footer />
      </main>
    );
  }
