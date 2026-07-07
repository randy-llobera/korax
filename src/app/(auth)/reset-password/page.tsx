import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ResetPasswordFallback = () => {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      Loading password reset...
    </div>
  );
};

const ResetPasswordPage = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.1fr)_430px] lg:items-center">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-flex size-2 rounded-full bg-primary" />
              Korax recovery
            </div>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Reset your Korax password.
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                Request a reset link or set a new password from your email.
              </p>
            </div>
          </section>

          <Card className="border border-border/70 bg-card/80 py-0 backdrop-blur">
            <CardHeader className="border-b border-border/70 py-6">
              <CardTitle className="text-2xl">Password reset</CardTitle>
              <p className="text-sm text-muted-foreground">
                Request a link first, then use the emailed token to finish the reset.
              </p>
            </CardHeader>
            <CardContent className="space-y-5 py-6">
              <Suspense fallback={<ResetPasswordFallback />}>
                <ResetPasswordForm />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordPage;
