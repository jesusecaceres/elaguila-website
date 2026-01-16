"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });

    setLoading(false);
    if (error) setMsg(error.message);
    else setMsg("Listo ✅ Te mandé un link a tu email (magic link).");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-yellow-600/20 bg-black/40 p-6">
        <h1 className="text-2xl font-semibold text-yellow-400">Login</h1>
        <p className="text-sm text-gray-300 mt-2">
          Entra con tu email (magic link).
        </p>

        <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
          <input
            className="w-full rounded-xl bg-black/50 border border-yellow-600/20 px-4 py-3 text-gray-100 outline-none"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold py-3 disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar link"}
          </button>

          {msg && <p className="text-sm text-gray-200 mt-2">{msg}</p>}
        </form>
      </div>
    </main>
  );
}
