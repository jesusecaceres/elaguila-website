"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { adminQueueRowAnchorId } from "../_lib/adminQueueActionFlow";

export function AdminQueueScrollRestore() {
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !searchParams) return;
    const status = searchParams.get("action_status");
    if (status !== "success" && status !== "error") return;
    ran.current = true;

    const target = (searchParams.get("target") ?? "").trim();
    const scrollRaw = searchParams.get("scroll_y");
    const scrollY = scrollRaw ? Math.max(0, parseInt(scrollRaw, 10) || 0) : 0;

    const restore = () => {
      if (target) {
        const el = document.getElementById(adminQueueRowAnchorId(target));
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
          return;
        }
      }
      if (scrollY > 0) {
        window.scrollTo({ top: scrollY, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(restore);
    });
  }, [searchParams]);

  return null;
}
