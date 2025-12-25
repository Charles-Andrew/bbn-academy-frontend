// Global error handler for Supabase authentication errors
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;

  console.error = (...args) => {
    const firstArg = args[0];

    // Check if this is a Supabase refresh token error
    if (
      firstArg &&
      typeof firstArg === "object" &&
      firstArg.__isAuthError === true &&
      firstArg.code === "refresh_token_not_found"
    ) {
      // Silently handle refresh token errors - they're expected when tokens expire
      return;
    }

    // Check for string-based refresh token errors
    if (
      typeof firstArg === "string" &&
      (firstArg.includes("Invalid Refresh Token") ||
        firstArg.includes("refresh_token_not_found") ||
        firstArg.includes("AuthApiError"))
    ) {
      return;
    }

    // For all other errors, use the original console.error
    originalConsoleError.apply(console, args);
  };

  // Clean up corrupted auth tokens on page load
  window.addEventListener("load", () => {
    try {
      // Clear all Supabase-related storage that might be corrupted
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("supabase") && key.includes("auth")) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              // Remove if it looks invalid or expired
              if (
                !parsed ||
                (parsed.expires_at && parsed.expires_at < Date.now() / 1000)
              ) {
                localStorage.removeItem(key);
              }
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (_error) {
      // Silently ignore cleanup errors
    }
  });
}
