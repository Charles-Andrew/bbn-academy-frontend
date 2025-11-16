"use client";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { clientLogger } from "@/lib/logging/client";

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <ErrorBoundary
      onError={async (error, errorInfo) => {
        // Enhanced error logging with client-side logger
        try {
          await clientLogger.logError("react_error_boundary", error, {
            component_stack: errorInfo.componentStack,
            error_boundary_name: "AppWrapper",
            user_agent:
              typeof window !== "undefined"
                ? window.navigator.userAgent
                : undefined,
            url:
              typeof window !== "undefined" ? window.location.href : undefined,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
          });
        } catch (logError) {
          // Fallback to console if logging fails
          console.error("Failed to log error:", logError);
          console.error("Original error:", error, errorInfo);
        }

        // Also log to console in development
        if (process.env.NODE_ENV === "development") {
          console.error("Application Error:", error, errorInfo);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
