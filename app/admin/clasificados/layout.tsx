import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminClasificadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const c = await cookies();
  const admin = c.get("leonix_admin")?.value;
  if (admin !== "1") {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-[#F5F5F5]">
      <aside className="w-56 shrink-0 border-r border-black/10 bg-white p-4">
        <div className="text-xs font-semibold text-[#111111] mb-4">Clasificados Admin</div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/admin/clasificados/servicios"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#111111] bg-[#F2EFE8] border border-[#A98C2A]/30"
          >
            Servicios
          </Link>
          <span className="rounded-lg px-3 py-2 text-sm text-[#999]">More categories (coming soon)</span>
        </nav>
        <div className="mt-6 pt-4 border-t border-black/10">
          <Link href="/clasificados/lista" className="text-xs text-[#A98C2A] hover:underline">
            View lista →
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
