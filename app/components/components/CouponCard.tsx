"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface CouponCardProps {
  title: string;
  business: string;
  description?: string;
  expiration?: string;
  phone?: string;
  email?: string;
  image: string; // path in public folder
  lang?: "es" | "en";
}

export default function CouponCard({
  title,
  business,
  description,
  expiration,
  phone,
  email,
  image,
  lang = "es",
}: CouponCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#111]/60 backdrop-blur-md border border-[#FFD700]/40 rounded-xl shadow-xl p-5 flex flex-col gap-4 text-white"
    >
      {/* IMAGE */}
      <div className="w-full h-48 relative rounded-lg overflow-hidden shadow-lg">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      {/* TITLE */}
      <h2 className="text-xl font-bold text-[#FFD700] tracking-wide">
        {title}
      </h2>

      {/* BUSINESS NAME */}
      <p className="text-md text-gray-200 font-semibold">
        {business}
      </p>

      {/* DESCRIPTION */}
      {description && (
        <p className="text-sm text-gray-300">{description}</p>
      )}

      {/* EXPIRATION */}
      {expiration && (
        <p className="text-xs text-red-300 font-semibold">
          {lang === "es" ? "Expira:" : "Expires:"} {expiration}
        </p>
      )}

      {/* CONTACT INFO */}
      <div className="text-xs text-gray-300 mt-2 space-y-1">
        {phone && (
          <p>
            <span className="font-semibold">{lang === "es" ? "Teléfono:" : "Phone:"}</span>{" "}
            {phone}
          </p>
        )}

        {email && (
          <p>
            <span className="font-semibold">Email:</span> {email}
          </p>
        )}
      </div>
    </motion.div>
  );
}
