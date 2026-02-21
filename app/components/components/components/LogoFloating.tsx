"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export default function LogoFloating() {
  const pathname = usePathname();

  // Hide on cinematic intro + hide on mobile
  if (pathname === "/") return null;

  return (
    <div
      className="
        fixed top-2 left-2 z-[60]
        pointer-events-none
        hidden md:block
      "
    >
      <Image
        src="/logo.png"
        alt="El Águila Logo"
        width={180}
        height={180}
        className="drop-shadow-2xl opacity-100"
        priority
      />
    </div>
  );
}
