import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

async function loginAction(formData: FormData) {
  "use server";
  const password = (formData.get("password") as string) ?? "";
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || password !== expected) {
    redirect("/admin/login?error=1");
  }
  const c = await cookies();
  c.set("leonix_admin", "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  redirect("/admin/clasificados/servicios");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#111111] text-white p-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/20 bg-[#1a1a1a] p-6 shadow-xl">
        <h1 className="text-xl font-bold mb-2 text-[#F5F5F5]">Admin</h1>
        <p className="text-sm text-[#999] mb-4">Enter the shared password to continue.</p>
        {error === "1" ? (
          <p className="text-sm text-red-400 mb-3" role="alert">
            Invalid password. Try again.
          </p>
        ) : null}
        <form action={loginAction} className="flex flex-col gap-3">
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            className="w-full rounded-xl border border-black/20 bg-[#2a2a2a] px-4 py-3 text-[#F5F5F5] placeholder:text-[#666] outline-none focus:ring-2 focus:ring-[#A98C2A]/50"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-[#A98C2A] px-4 py-3 font-semibold text-[#111111] hover:bg-[#C9B46A] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/50"
          >
            Log in
          </button>
        </form>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-[#A98C2A] hover:underline">
            ← Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}
