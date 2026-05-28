"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Resets scroll position to the top whenever the route (pathname) changes.
// Next.js sometimes fails to do this automatically with static export +
// basePath, leaving a new page scrolled to wherever the previous one was.
// If the URL has a hash (e.g. /#rooms), we leave scrolling to the browser so
// in-page anchor links still jump to the right section.
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
