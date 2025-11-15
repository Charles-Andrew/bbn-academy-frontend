import { ShieldCheck, Sparkles } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <MainLayout>
      <section className="bg-gradient-to-br from-background via-background to-muted/40">
        <div className="container mx-auto grid gap-12 px-4 py-24 lg:grid-cols-[1fr,420px] lg:items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" />
              Secure Admin Access
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Welcome Back to the
                <span className="text-primary"> BBN Academy </span>
                Control Room
              </h1>
              <p className="text-lg text-muted-foreground">
                Sign in to publish stories, manage engagements, and keep the
                community updated with fresh learning resources.
              </p>
            </div>
            <div className="grid gap-4 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <p className="text-sm font-semibold text-primary">Real-time updates</p>
                <p className="text-sm text-muted-foreground">
                  Publish new books, posts, and engagements instantly.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <p className="text-sm font-semibold text-primary">Secure workspace</p>
                <p className="text-sm text-muted-foreground">
                  Protected admin-only area powered by Supabase Auth.
                </p>
              </div>
            </div>
          </div>

          <Card className="rounded-3xl border border-border/60 bg-card/80 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
              <CardDescription>
                Enter your credentials to access the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Need help? Contact the BBN Academy tech team.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
