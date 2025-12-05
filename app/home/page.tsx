"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get("lang") || "es") as "es" | "en";

  const t = {
    es: {
      bienvenidos: "Bienvenidos a",
      comunidad: "Comunidad, Cultura y Orgullo Latino",
      revistaActual: "Revista Digital — Edición Actual",
      pronto: "Muy pronto podrás hojear la primera edición digital."
    },
    en: {
      bienvenidos: "Welcome to",
      comunidad: "Community, Culture & Latino Pride",
      revistaActual: "Digital Magazine — Current Edition",
      pronto: "Soon you will be able to browse the first digital edition."
    }
  };

  const L = t[lang];
  const magazineLink = `/magazine?lang=${lang}`;

  return (
    <main className="relative min-h-screen w-full text-white">
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to
