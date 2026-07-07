import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isEmailVerificationEnabled } from "@/lib/auth/email-verification-settings";

const RegisterPage = () => {
  const emailVerificationEnabled = isEmailVerificationEnabled();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-flex size-2 rounded-full bg-primary" />
              Korax account
            </div>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Create your Korax account.
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                {emailVerificationEnabled
                  ? "Use GitHub right away or create an account with email and verify your address before signing in."
                  : "Use GitHub right away or create an account with email and password."}
              </p>
            </div>
          </section>

          <Card className="border border-border/70 bg-card/80 py-0 backdrop-blur">
            <CardHeader className="border-b border-border/70 py-6">
              <CardTitle className="text-2xl">Register</CardTitle>
              <p className="text-sm text-muted-foreground">
                {emailVerificationEnabled
                  ? "Use GitHub or set up your account and check your email for the verification link."
                  : "Use GitHub or set up your account with email and password."}
              </p>
            </CardHeader>
            <CardContent className="space-y-5 py-6">
              <RegisterForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
