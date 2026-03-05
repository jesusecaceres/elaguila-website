"use client";

import Link from "next/link";

export default function AdminUsuariosPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 py-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold text-yellow-400">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Aquí veremos las cuentas creadas y su información básica.
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="rounded-2xl border border-yellow-600/20 bg-white/5 p-6">
          <p className="text-sm text-white/80 leading-relaxed">
            Próximo paso: conectar esta vista a los perfiles reales para confirmar
            altas, editar datos y administrar cuentas.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            ← Volver al panel
          </Link>
        </div>
      </div>
    </main>
  );
}
