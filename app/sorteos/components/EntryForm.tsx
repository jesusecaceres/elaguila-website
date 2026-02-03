"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function EntryForm({ sweepstakeId }: { sweepstakeId: string }) {
  const params = useSearchParams()!;
  const lang = params.get("lang") || "es";
  const isES = lang === "es";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const labels = {
    title: isES ? "Participar" : "Enter Now",
    name: isES ? "Nombre completo" : "Full name",
    email: "Email",
    phone: isES ? "Teléfono (opcional)" : "Phone (optional)",
    submit: isES ? "Enviar entrada" : "Submit entry",
    success: isES
      ? "¡Gracias! Tu entrada fue enviada."
      : "Thank you! Your entry has been submitted.",
  };

  async function submitEntry(e: any) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);

    const res = await fetch("/api/sweepstakes/add-entry", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        language: lang,
        sweepstake_id: sweepstakeId,
        entry_source: "sweepstakes-page",
      }),
    });

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      e.target.reset();
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl mt-12">
      <h3 className="text-3xl font-bold mb-6">{labels.title}</h3>

      {success && (
        <p className="text-green-700 text-xl font-semibold mb-4">
          {labels.success}
        </p>
      )}

      <form onSubmit={submitEntry} className="grid gap-6">
        <input
          type="text"
          name="name"
          required
          placeholder={labels.name}
          className="w-full p-4 rounded-xl border border-gray-400"
        />

        <input
          type="email"
          name="email"
          required
          placeholder={labels.email}
          className="w-full p-4 rounded-xl border border-gray-400"
        />

        <input
          type="tel"
          name="phone"
          placeholder={labels.phone}
          className="w-full p-4 rounded-xl border border-gray-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition disabled:bg-gray-400"
        >
          {loading ? "..." : labels.submit}
        </button>
      </form>
    </div>
  );
}
