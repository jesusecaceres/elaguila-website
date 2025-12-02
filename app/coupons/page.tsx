"use client";

import Navbar from "@/app/components/Navbar";
import CouponCard from "@/app/components/CouponCard";

export default function CouponsPage() {
  const coupons = [
    {
      title: "10% Off Complete Detail",
      business: "Bay Area Detailing",
      description: "Full exterior + interior detail. New customers only.",
      image: "/coupons/detailing.jpg",
      expires: "02/15/2026",
      lang: "en",
    },
    {
      title: "Buy 1 Get 1 Free Smoothie",
      business: "Jungle Smoothies",
      description: "Any flavor. Limit 1 per customer.",
      image: "/coupons/smoothie.jpg",
      expires: "03/01/2026",
      lang: "en",
    },
    {
      title: "$5 Off Any Service",
      business: "War Fitness",
      description: "Valid for new members. Show coupon at front desk.",
      image: "/coupons/war-fitness.jpg",
      expires: "02/20/2026",
      lang: "en",
    },
  ];

  return (
    <main className="min-h-screen w-full bg-black text-white">
      <Navbar />

      <div className="pt-28 px-6 pb-20 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8">
          Coupons
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((c, i) => (
            <CouponCard key={i} {...c} lang="en" />
          ))}
        </div>
      </div>
    </main>
  );
}
