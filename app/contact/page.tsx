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
        desc: "Versión en inglés de la página de contacto. Aquí añadiremos el formulario completo más adelante.",
      },
      en: {
        title: "Contact",
        desc: "English version of the contact page. We’ll add the full contact form here soon.",
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
