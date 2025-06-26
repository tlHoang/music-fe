"use client";

import { useEffect } from "react";

export function NextJSOverlayHider() {
  useEffect(() => {
    // Hide Next.js development overlay immediately
    const hideOverlays = () => {
      const selectors = [
        "#__next-build-watcher",
        "[data-nextjs-dialog-overlay]",
        "[data-nextjs-dialog]",
        "[data-nextjs-toast]",
        ".__next-dev-overlay-wrapper__",
        "[data-nextjs-scroll-lock]",
        "[data-overlay]",
      ];

      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          if (element instanceof HTMLElement) {
            element.style.display = "none";
            element.style.visibility = "hidden";
            element.style.opacity = "0";
            element.style.pointerEvents = "none";
            // Remove from DOM entirely
            element.remove();
          }
        });
      });
    };

    // Run immediately
    hideOverlays();

    // Run on DOM changes
    const observer = new MutationObserver(() => {
      hideOverlays();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Run on interval to catch any late-loading overlays
    const interval = setInterval(hideOverlays, 100);

    // Cleanup
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}
