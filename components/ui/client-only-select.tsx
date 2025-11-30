"use client";

import { useEffect, useState } from "react";

interface ClientOnlySelectProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnlySelect({
  children,
  fallback = null,
}: ClientOnlySelectProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
