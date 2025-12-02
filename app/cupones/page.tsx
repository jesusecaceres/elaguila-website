"use client";

import Navbar from "@/app/components/Navbar";
import CouponCard from "@/app/components/CouponCard";

export default function CuponesPage() {
  const coupons = [
    {
      title: "10% de Descuento en Detallado Completo",
      business: "Bay Area Detailing",
      description: "Detalle exterior + interior. Solo nuevos clientes.",
      image: "/coupons/detailing.jpg",
      expires: "15/02/2026",
      lang: "es",
    },
    {
      title: "Compra 1 y Llévate 1 Gratis (Smoothie)",
      business: "Jungle Smoothies",
      description: "Cualquier sabor. Límite 1 por cliente.",
      image: "/coupons/smoothie.jpg",
      expires: "01/03/2026",
      lang: "es",
    },
    {
      title: "$5 de Descuento en Cualquier Servicio",
      business: "War Fitness",
      description: "Válido para nuevos miembros. Presenta el cupón.",
      image: "/coupons/war-fitness.jpg",
      expires: "20/02/2026",
      lang: "es",
    },
  ];

  return (
    <main className="min-h-screen w-full bg-black text-white">
      <Navbar />

      <div className="pt-28 px-6 pb-20 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8">
          Cupones
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((c, i) => (
            <CouponCard key={i} {...c} lang="es" />
          ))}
        </div>
      </div>
    </main>
  );
}
