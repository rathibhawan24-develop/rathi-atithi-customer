"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Resets scroll to the top on every route change AND disables the browser's
// automatic scroll restoration (the main reason mobile pages re-open part-way
// down). If the URL has a hash (e.g. /#rooms), scrolling is left to the browser
// so in-page anchor links still jump to the right section.
export function ScrollToTop() {
  const pathname = usePathname();

  // Disable browser scroll restoration once.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return;
    // Scroll now, then again after the next paint to beat any layout shift
    // from images/fonts loading in.
    window.scrollTo(0, 0);
    const id = requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
