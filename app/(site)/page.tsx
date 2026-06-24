"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { RootIntroLanguagePanel } from "@/app/components/RootIntroLanguagePanel";

function RootIntroPanelFallback() {
  return (
    <div
      className="h-[10.5rem] w-full rounded-2xl border border-[#C9A84A]/25 bg-black/40"
      aria-hidden
    />
  );
}

export default function Home() {
  return (
    <main className="fixed inset-0 z-30 h-dvh w-full max-w-full overflow-hidden bg-black text-white">
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
        className="absolute left-1/2 top-1/2 z-10 max-w-[92vw] -translate-x-1/2 -translate-y-[58%] md:-translate-y-[54%] lg:-translate-y-[52%]"
        style={{
          width: "clamp(420px, 65vmin, 1300px)",
          height: "auto",
          filter: "drop-shadow(0 0 140px rgba(255,215,0,0.9))",
        }}
      />

      <motion.div
        className="pointer-events-none absolute inset-x-0 z-20 bottom-[6%] flex justify-center px-4 md:bottom-[18%] lg:bottom-[20%]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6, duration: 1.2, ease: "easeOut" }}
      >
        <div className="pointer-events-auto w-full max-w-md min-w-0">
          <Suspense fallback={<RootIntroPanelFallback />}>
            <RootIntroLanguagePanel />
          </Suspense>
        </div>
      </motion.div>
    </main>
  );
}
