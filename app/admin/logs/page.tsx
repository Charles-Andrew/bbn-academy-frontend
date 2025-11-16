import type { Metadata } from "next";
import LoggingDashboard from "@/components/admin/LoggingDashboard";

export const metadata: Metadata = {
  title: "Application Logs | Admin Dashboard",
  description: "View and manage application logs and system activity",
  robots: "noindex, nofollow",
};

export default function LogsPage() {
  return <LoggingDashboard />;
}
