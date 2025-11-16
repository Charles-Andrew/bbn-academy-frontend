import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // During build time (static generation), we can't access cookies
  // so we'll create a client with empty cookies
  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
  
  let cookieStore;
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

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
