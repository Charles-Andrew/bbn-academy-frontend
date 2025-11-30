import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase client is missing public configuration.");
  }

  // Clean up corrupted auth data on client-side initialization
  if (typeof window !== "undefined") {
    try {
      // Clear potential corrupted auth tokens
      const keys = Object.keys(localStorage).filter(
        (key) => key.includes("supabase") && key.includes("auth"),
      );

      keys.forEach((key) => {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            // Remove if expired or invalid
            if (
              !parsed ||
              (parsed.expires_at && parsed.expires_at < Date.now() / 1000)
            ) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Remove corrupted data
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Auth cleanup warning:", error);
    }
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
