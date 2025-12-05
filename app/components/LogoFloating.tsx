"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export default function LogoFloating() {
  const pathname = usePathname();

  // Hide during cinematic intro
  if (pathname === "/") return null;

  return (
    <div
      className="
        fixed top-2 left-4 z-[60]
        flex items-center justify-center
        pointer-events-none
      "
    >
      <Image
        src="/logo.png"
        alt="El Águila Logo"
        width={220}
        height={220}
        className="drop-shadow-xl opacity-95"
        priority
      />
    </div>
  );
}
