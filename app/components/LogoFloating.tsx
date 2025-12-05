"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export default function LogoFloating() {
  const pathname = usePathname();

  // Hide logo on cinematic intro
  if (pathname === "/") return null;

  return (
    <div
      className="
        fixed top-4 left-4 z-[60]
        pointer-events-none
        flex items-center justify-center
      "
    >
      <Image
        src="/logo.png"
        alt="El Águila Logo"
        width={300}   // Bigger logo
        height={300}
        className="drop-shadow-2xl opacity-100"
        priority
      />
    </div>
  );
}
