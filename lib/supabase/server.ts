import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cookie store interface for different environments
interface CookieStore {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
}

export async function createClient() {
  // During build time (static generation), we can't access cookies
  // so we'll create a client with empty cookies
  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

  let cookieStore: CookieStore;
  try {
    cookieStore = await cookies();
  } catch (error) {
    // This happens during static generation when there's no request context
    if (isBuildTime) {
      console.log("Creating Supabase client without cookies during build time");
      cookieStore = {
        getAll: () => [],
        set: () => {},
      };
    } else {
      throw error;
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase server client is missing public configuration.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        try {
          return cookieStore.getAll();
        } catch {
          return [];
        }
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
