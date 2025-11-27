"use client";

import { useSearchParams } from "next/navigation";
import Footer from "./Footer";

export default function FooterClient() {
  // We still read the language, but we do NOT pass it to Footer
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  return <Footer />;
}
