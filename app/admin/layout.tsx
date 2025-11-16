import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./components/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin (you might want to implement proper role-based access)
  if (user.email !== "admin@bbnacademy.com") {
    redirect("/unauthorized");
  }

  return (
    <MainLayout showHeader={false} showFooter={false}>
      <div className="h-screen bg-gradient-to-br from-background to-muted/20 text-foreground overflow-hidden">
        <div className="container mx-auto flex gap-6 p-6 h-full lg:flex-row">
          <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <Sidebar />
          </div>
          <main className="flex-1 rounded-3xl border border-border/50 bg-card p-6 shadow-2xl overflow-hidden flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
