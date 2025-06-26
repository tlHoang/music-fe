/**
 * Global modal focus fix utility
 * This provides a comprehensive solution for modal focus trap issues across the app
 */

// Install global click handler to detect and fix stuck modals
let globalFixInstalled = false;

export const installGlobalModalFix = () => {
  if (globalFixInstalled || typeof window === "undefined") return;

  globalFixInstalled = true;

  // Global click handler to detect and fix stuck modals
  const handleGlobalClick = () => {
    // Check if there are any visible modal backgrounds or focus guards
    const focusGuards = document.querySelectorAll("[data-radix-focus-guard]");
    const portals = document.querySelectorAll("[data-radix-portal]");
    const overlays = document.querySelectorAll("[data-radix-dialog-overlay]");

    // Check if any dialogs are actually open
    const openDialogs = document.querySelectorAll(
      "[data-radix-dialog-content]"
    );
    const visibleDialogs = Array.from(openDialogs).filter((dialog: any) => {
      const style = window.getComputedStyle(dialog);
      return style.display !== "none" && style.visibility !== "hidden";
    });

    // If no dialogs are visible but focus guards exist, clean them up
    if (
      visibleDialogs.length === 0 &&
      (focusGuards.length > 0 || portals.length > 0)
    ) {
      emergencyCleanup();
    }
  };

  // Add click listener with high priority
  document.addEventListener("click", handleGlobalClick, true);

  // Also add escape key handler
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setTimeout(() => {
        const openDialogs = document.querySelectorAll(
          "[data-radix-dialog-content]"
        );
        const visibleDialogs = Array.from(openDialogs).filter((dialog: any) => {
          const style = window.getComputedStyle(dialog);
          return style.display !== "none" && style.visibility !== "hidden";
        });

        if (visibleDialogs.length === 0) {
          emergencyCleanup();
        }
      }, 100);
    }
  };

  document.addEventListener("keydown", handleEscape);
};

// Enhanced emergency cleanup function
export const emergencyCleanup = () => {
  if (typeof window === "undefined") return;

  console.log("🔧 Emergency modal cleanup triggered");

  // Remove all focus guards and portals
  document
    .querySelectorAll("[data-radix-focus-guard], [data-radix-portal]")
    .forEach((el) => {
      el.remove();
    });

  // Reset body styles
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.style.position = "";

  // Clear inert attributes from all elements
  document.querySelectorAll("[inert]").forEach((el) => {
    el.removeAttribute("inert");
  });

  // Remove any modal-related classes from body
  document.body.classList.remove("overflow-hidden", "pr-4");

  // Force focus back to body
  if (document.activeElement && document.activeElement !== document.body) {
    try {
      document.body.focus();
      document.body.blur();
    } catch (e) {
      // Ignore focus errors
    }
  }

  // Ensure page is interactive
  const main = document.querySelector("main") || document.body;
  if (main instanceof HTMLElement) {
    main.style.pointerEvents = "auto";
  }
};

// Store focus before opening modal
export const storeFocus = () => {
  if (typeof window !== "undefined") {
    (window as any).__lastFocusedElement = document.activeElement;
  }
};

// Restore focus after closing modal
export const restoreFocus = () => {
  if (typeof window === "undefined") return;

  setTimeout(() => {
    emergencyCleanup();

    // Try to restore previous focus
    const lastFocused = (window as any).__lastFocusedElement;
    if (lastFocused && document.contains(lastFocused)) {
      try {
        lastFocused.focus();
      } catch (e) {
        document.body.focus();
      }
    } else {
      document.body.focus();
    }
  }, 50);
};

// Create enhanced close handler for dialogs
export const createEnhancedCloseHandler = (
  originalCloseFunction: () => void
) => {
  return () => {
    originalCloseFunction();
    restoreFocus();
  };
};

// Hook to patch Dialog components on a page
export const patchDialogsOnPage = () => {
  if (typeof window === "undefined") return;

  // Patch all dialog close buttons
  setTimeout(() => {
    const closeButtons = document.querySelectorAll("[data-radix-dialog-close]");
    closeButtons.forEach((button) => {
      if (!(button as any).__patched) {
        (button as any).__patched = true;
        button.addEventListener("click", () => {
          setTimeout(emergencyCleanup, 100);
        });
      }
    });
  }, 1000);
};

// Auto-install on import in browser
if (typeof window !== "undefined") {
  // Auto-install after a short delay
  setTimeout(() => {
    installGlobalModalFix();
    patchDialogsOnPage();
  }, 1000);

  // Install on page navigation
  if ("navigation" in window) {
    (window as any).navigation?.addEventListener("navigate", () => {
      setTimeout(() => {
        installGlobalModalFix();
        patchDialogsOnPage();
      }, 500);
    });
  }
}
