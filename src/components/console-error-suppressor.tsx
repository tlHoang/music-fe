"use client";

import { useEffect } from "react";

export function ConsoleErrorSuppressor() {
  useEffect(() => {
    // Always suppress in development unless explicitly disabled
    const shouldSuppress = process.env.NEXT_PUBLIC_SUPPRESS_CONSOLE !== "false";

    if (shouldSuppress) {
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalLog = console.log;

      // Patterns of errors/warnings to suppress
      const suppressPatterns = [
        "Warning: validateDOMNesting",
        'Warning: Each child in a list should have a unique "key" prop',
        "Warning: Function components cannot be given refs",
        "Warning: forwardRef render functions accept exactly two parameters",
        "Warning: React has detected a change in the order of Hooks",
        "Extra attributes from the server",
        "Hydration failed because the initial UI does not match",
        "Text content does not match server-rendered HTML",
        "Did not expect server HTML to contain",
        "Expected server HTML to contain",
        "Prop `className` did not match",
        "Warning: A component is changing an uncontrolled input",
        "Warning: Failed prop type",
        "Warning: Cannot update a component",
        "Warning: setState(...): Can only update a mounted",
        "Warning: unstable_flushDiscreteUpdates",
        "Warning: useLayoutEffect does nothing on the server",
        "Next.js middleware error",
        "HMR-WARN",
        "[Fast Refresh]",
        "Warning: Encountered two children with the same key",
        "Warning: Each child in a list should have a unique",
        // Next.js specific warnings
        "chunk styles",
        "Failed to parse",
        "ChunkLoadError",
        "Loading chunk",
        "eval source map",
        // React DevTools
        "Download the React DevTools",
        "Components tree",
      ];

      const suppressMessage = (message: string): boolean => {
        return suppressPatterns.some((pattern) =>
          message.toLowerCase().includes(pattern.toLowerCase())
        );
      };

      console.error = (...args: any[]) => {
        const message = args.join(" ");
        if (!suppressMessage(message)) {
          originalError.apply(console, args);
        }
      };

      console.warn = (...args: any[]) => {
        const message = args.join(" ");
        if (!suppressMessage(message)) {
          originalWarn.apply(console, args);
        }
      };

      console.log = (...args: any[]) => {
        const message = args.join(" ");
        if (!suppressMessage(message)) {
          originalLog.apply(console, args);
        }
      };

      // Suppress Next.js build warnings by intercepting window errors
      const originalOnError = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        const errorMessage = String(message);
        if (suppressMessage(errorMessage)) {
          return true; // Prevent default behavior
        }
        if (originalOnError) {
          return originalOnError(message, source, lineno, colno, error);
        }
        return false;
      };

      // Suppress unhandled promise rejections that are warnings
      const originalOnUnhandledRejection = window.onunhandledrejection;
      window.onunhandledrejection = (event) => {
        const errorMessage = String(event.reason);
        if (suppressMessage(errorMessage)) {
          event.preventDefault();
          return;
        }
        if (originalOnUnhandledRejection) {
          originalOnUnhandledRejection.call(window, event);
        }
      };

      // Cleanup function
      return () => {
        console.error = originalError;
        console.warn = originalWarn;
        console.log = originalLog;
        window.onerror = originalOnError;
        window.onunhandledrejection = originalOnUnhandledRejection;
      };
    }
  }, []);

  return null;
}
