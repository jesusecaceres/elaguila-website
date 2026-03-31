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
      className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_18px_48px_rgba(42,36,22,0.10)] p-5 flex flex-col gap-4 text-[color:var(--lx-text)]"
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
      <h2 className="text-xl font-bold text-[color:var(--lx-text)] tracking-tight">
        {title}
      </h2>

      {/* BUSINESS NAME */}
      <p className="text-md text-[color:var(--lx-text-2)]/90 font-semibold">
        {business}
      </p>

      {/* DESCRIPTION */}
      {description && (
        <p className="text-sm text-[color:var(--lx-muted)]">{description}</p>
      )}

      {/* EXPIRATION */}
      {expiration && (
        <p className="text-xs text-[color:var(--lx-text-2)] font-semibold">
          {lang === "es" ? "Expira:" : "Expires:"} {expiration}
        </p>
      )}

      {/* CONTACT INFO */}
      <div className="text-xs text-[color:var(--lx-muted)] mt-2 space-y-1">
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
