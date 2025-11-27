"use client";

import { useSearchParams } from "next/navigation";
import Footer from "./Footer";

export default function FooterClient() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";
  return <Footer lang={lang} />;
}
