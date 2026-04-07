"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleClick = (lang: string) => {
    setTimeout(() => {
      window.location.href = `/home?lang=${lang}`;
    }, 250);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white">
      {/* CINEMATIC BACKGROUND */}
      <motion.img
        src="/cinema-flags-final-v2.png"
        alt="Cinematic Flags Background"
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "easeInOut" }}
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* LOGO */}
      <motion.img
        src="/logo-layer-new.png"
        alt="LEONIX Media Logo"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1.5, y: 0 }}
        transition={{ delay: 1, duration: 1.8, ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%] z-10"
        style={{
          width: "clamp(420px, 65vmin, 1300px)",
          height: "auto",
          filter: "drop-shadow(0 0 140px rgba(255,215,0,0.9))",
        }}
      />

      {/* BUTTONS */}
      <motion.div
        className="absolute left-1/2 bottom-[10%] flex gap-12 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6, duration: 1.2, ease: "easeOut" }}
      >
        {/* Spanish Button */}
        <motion.button
          whileHover={{
            scale: 1.06,
            boxShadow: "0 0 70px rgba(255,215,0,1)",
          }}
          transition={{ type: "spring", stiffness: 150, damping: 12 }}
          onClick={() => handleClick("es")}
          className="relative text-black font-serif font-bold
                     px-16 py-6
                     text-[2.2vmin]
                     rounded-xl overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #FFD700 0%, #FFC107 40%, #B8860B 100%)",
            border: "2px solid #C99700",
            filter:
              "drop-shadow(0 0 32px rgba(255,215,0,0.6)) drop-shadow(0 0 16px rgba(255,215,0,0.4))",
            clipPath:
              "polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%)",
            boxShadow:
              "inset 0 4px 8px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.5)",
          }}
        >
          <span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 hover:opacity-70 animate-pulse"
            style={{
              mixBlendMode: "overlay",
              transition: "opacity 0.5s ease-in-out",
            }}
          ></span>
          <span className="relative z-10">Bienvenidos — Entre</span>
        </motion.button>

        {/* English Button */}
        <motion.button
          whileHover={{
            scale: 1.06,
            boxShadow: "0 0 70px rgba(255,215,0,1)",
          }}
          transition={{ type: "spring", stiffness: 150, damping: 12 }}
          onClick={() => handleClick("en")}
          className="relative text-black font-serif font-bold
                     px-16 py-6
                     text-[2.2vmin]
                     rounded-xl overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #FFD700 0%, #FFC107 40%, #B8860B 100%)",
            border: "2px solid #C99700",
            filter:
              "drop-shadow(0 0 32px rgba(255,215,0,0.6)) drop-shadow(0 0 16px rgba(255,215,0,0.4))",
            clipPath:
              "polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%)",
            boxShadow:
              "inset 0 4px 8px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.5)",
          }}
        >
          <span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 hover:opacity-70 animate-pulse"
            style={{
              mixBlendMode: "overlay",
              transition: "opacity 0.5s ease-in-out",
            }}
          ></span>
          <span className="relative z-10">Welcome — Enter</span>
        </motion.button>
      </motion.div>
    </main>
  );
}
