// utils/console-filter.ts
const originalError = console.error;
const originalWarn = console.warn;

// List of error patterns to hide
const HIDDEN_ERROR_PATTERNS = [
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
];

export function suppressConsoleErrors() {
  // Override console.error
  console.error = (...args: any[]) => {
    const errorMessage = args.join(" ");

    // Check if this error should be hidden
    const shouldHide = HIDDEN_ERROR_PATTERNS.some((pattern) =>
      errorMessage.includes(pattern)
    );

    if (!shouldHide) {
      originalError.apply(console, args);
    }
  };

  // Override console.warn
  console.warn = (...args: any[]) => {
    const warnMessage = args.join(" ");

    // Check if this warning should be hidden
    const shouldHide = HIDDEN_ERROR_PATTERNS.some((pattern) =>
      warnMessage.includes(pattern)
    );

    if (!shouldHide) {
      originalWarn.apply(console, args);
    }
  };
}

export function restoreConsoleErrors() {
  console.error = originalError;
  console.warn = originalWarn;
}
