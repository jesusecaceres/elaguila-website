"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

type Lang = "es" | "en";

const translations: Record<Lang, {
  title: string;
  first: string;
  last: string;
  email: string;
  submit: string;
  success: string;
}> = {
  es: {
    title: "Participa en el Sorteo",
    first: "Nombre",
    last: "Apellido",
    email: "Correo electrónico",
    submit: "Enviar participación",
    success: "¡Gracias! Tu participación fue enviada."
  },
  en: {
    title: "Enter the Sweepstakes",
    first: "First Name",
    last: "Last Name",
    email: "Email",
    submit: "Submit Entry",
    success: "Thank you! Your entry has been submitted."
  }
};

export default function EnterPage() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang") as Lang | null;

  const lang: Lang = langParam === "en" ? "en" : "es";
  const t = translations;

  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-32 bg-black text-white px-6">

      {/* TITLE */}
      <h1 className="text-3xl font-bold text-yellow-400 mb-6 drop-shadow-lg">
        {t[lang].title}
      </h1>

      {!submitted && (
        <form
          className="w-full max-w-md flex flex-col gap-4 bg-[#111]/60 backdrop-blur-lg p-6 rounded-xl border border-yellow-500/40 shadow-xl"
        >
          <input
            placeholder={t[lang].first}
            className="p-3 rounded bg-black/50 border border-yellow-500/30"
          />
          <input
            placeholder={t[lang].last}
            className="p-3 rounded bg-black/50 border border-yellow-500/30"
          />
          <input
            placeholder={t[lang].email}
            className="p-3 rounded bg-black/50 border border-yellow-500/30"
          />

          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="mt-4 bg-yellow-500 text-black font-bold py-3 rounded shadow-lg hover:bg-yellow-400 transition-all"
          >
            {t[lang].submit}
          </button>
        </form>
      )}

      {submitted && (
        <p className="text-green-400 text-lg mt-6 font-semibold">
          {t[lang].success}
        </p>
      )}
    </main>
  );
}
