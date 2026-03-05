import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";

export default async function AdminHome() {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 py-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold text-yellow-400">
            Panel de administración
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Acceso interno para gestionar cuentas, clasificados y servicios.
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/usuarios"
            className="block rounded-2xl border border-yellow-600/20 bg-white/5 p-6 hover:bg-white/10 hover:border-yellow-500/30 transition text-left"
          >
            <h2 className="text-lg font-semibold text-yellow-400">Clientes</h2>
            <p className="mt-1 text-sm text-white/60">
              Ver cuentas creadas y administrar clientes.
            </p>
          </Link>

          <Link
            href="/admin/clasificados"
            className="block rounded-2xl border border-yellow-600/20 bg-white/5 p-6 hover:bg-white/10 hover:border-yellow-500/30 transition text-left"
          >
            <h2 className="text-lg font-semibold text-yellow-400">Clasificados</h2>
            <p className="mt-1 text-sm text-white/60">
              Administrar flujos y herramientas de clasificados.
            </p>
          </Link>

          <Link
            href="/admin/clasificados/servicios"
            className="block rounded-2xl border border-yellow-600/20 bg-white/5 p-6 hover:bg-white/10 hover:border-yellow-500/30 transition text-left"
          >
            <h2 className="text-lg font-semibold text-yellow-400">Servicios</h2>
            <p className="mt-1 text-sm text-white/60">
              Continuar con la administración de servicios.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
