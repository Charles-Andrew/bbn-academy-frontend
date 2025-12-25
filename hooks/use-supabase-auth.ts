"use client";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let supabase: SupabaseClient | undefined;

    try {
      supabase = createClient();
    } catch (error) {
      console.error("Failed to create Supabase client:", error);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to initialize authentication",
      }));
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          // Handle refresh token errors gracefully
          if (error.message.includes("refresh_token_not_found")) {
            console.warn("Invalid refresh token found, clearing session");
            await supabase.auth.signOut({ scope: "global" });
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: null,
            });
            return;
          }
          throw error;
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error getting session:", error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error:
            error instanceof Error ? error.message : "Authentication error",
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (event === "TOKEN_REFRESHED" && !session) {
        // Handle failed token refresh
        console.warn("Token refresh failed, signing out");
        await supabase.auth.signOut({ scope: "global" });
      }

      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "global" });
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    ...authState,
    signOut,
  };
}
