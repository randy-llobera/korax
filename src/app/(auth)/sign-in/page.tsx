import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isEmailVerificationEnabled } from "@/lib/auth/email-verification-settings";

const SignInPageShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.1fr)_430px] lg:items-center">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-flex size-2 rounded-full bg-primary" />
              Korax auth
            </div>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Sign in to your developer knowledge hub.
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                Save prompts, snippets, notes, commands, links, files, and images in one place.
              </p>
            </div>
          </section>

          <Card className="border border-border/70 bg-card/80 py-0 backdrop-blur">
            <CardHeader className="border-b border-border/70 py-6">
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use GitHub or your email and password.
              </p>
            </CardHeader>
            <CardContent className="space-y-5 py-6">{children}</CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

const SignInFallback = () => {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      Loading sign-in options...
    </div>
  );
};

const SignInPage = () => {
  const emailVerificationEnabled = isEmailVerificationEnabled();

  return (
    <SignInPageShell>
      <Suspense fallback={<SignInFallback />}>
        <SignInForm emailVerificationEnabled={emailVerificationEnabled} />
      </Suspense>
    </SignInPageShell>
  );
};

export default SignInPage;
