"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, error } = useSupabaseAuth();
  const router = useRouter();

  // Handle redirect based on auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push("/login");
    return null;
  }

  // Show error state if there's an auth error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Authentication Error
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
}
