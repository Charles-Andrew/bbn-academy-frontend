import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/auth/protected-route";
import AdminDashboardClient from "@/components/admin/admin-dashboard-client";

export const metadata: Metadata = {
  title: "Admin Dashboard | BBN Academy",
  description:
    "Manage your BBN Academy website - view messages, manage content, and track performance.",
  robots: "noindex, nofollow", // Prevent admin pages from being indexed
};

export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <AdminDashboardClient />
    </ProtectedRoute>
  );
}
