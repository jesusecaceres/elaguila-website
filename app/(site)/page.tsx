"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { RootIntroLanguagePanel } from "@/app/components/RootIntroLanguagePanel";

function RootIntroPanelFallback() {
  return (
    <div
      className="absolute inset-x-0 bottom-[6%] z-20 flex justify-center px-4 sm:bottom-[8%]"
      aria-hidden
    >
      <div className="h-[10.5rem] w-full max-w-md rounded-2xl border border-[#C9A84A]/25 bg-black/40" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <motion.img
        src="/cinema-flags-final-v2.png"
        alt="Cinematic Flags Background"
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "easeInOut" }}
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />

      <motion.img
        src="/logo-layer-new.png"
        alt="Leonix Media logo"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1.5, y: 0 }}
        transition={{ delay: 1, duration: 1.8, ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-[58%]"
        style={{
          width: "clamp(420px, 65vmin, 1300px)",
          height: "auto",
          filter: "drop-shadow(0 0 140px rgba(255,215,0,0.9))",
        }}
      />

      <motion.div
        className="absolute inset-x-0 bottom-0 z-20"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6, duration: 1.2, ease: "easeOut" }}
      >
        <Suspense fallback={<RootIntroPanelFallback />}>
          <RootIntroLanguagePanel />
        </Suspense>
      </motion.div>
    </main>
  );
}
