"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import {
  AuthFormDivider,
  AuthFormError,
  AuthGitHubButton,
  AuthInputField,
} from "@/components/auth/auth-form-fields";
import { Button } from "@/components/ui/button";
import { getRateLimitMessageFromCode } from "@/lib/rate-limit";

const getErrorMessage = (error: string | null, code?: string | null) => {
  const rateLimitMessage = getRateLimitMessageFromCode(code);

  if (rateLimitMessage) {
    return rateLimitMessage;
  }

  if (!error) {
    return "";
  }

  switch (error) {
    case "AccessDenied":
      return "Access denied. Try a different account.";
    case "CallbackRouteError":
    case "CredentialsSignin":
      return "Invalid email or password.";
    default:
      return "Unable to sign in right now.";
  }
};

interface SignInFormProps {
  emailVerificationEnabled: boolean;
}

export const SignInForm = ({ emailVerificationEnabled }: SignInFormProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const oauthError = searchParams.get("error");
  const oauthCode = searchParams.get("code");
  const registered = searchParams.get("registered") === "1";
  const reset = searchParams.get("reset") === "1";
  const verified = searchParams.get("verified") === "1";
  const verificationState = searchParams.get("verification");
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [error, setError] = useState("");

  const pageError = useMemo(
    () => getErrorMessage(oauthError, oauthCode),
    [oauthCode, oauthError],
  );

  useEffect(() => {
    if (!registered && !reset && !verified && verificationState !== "invalid") {
      return;
    }

    if (registered) {
      toast.success(
        emailVerificationEnabled
          ? "Check your email to verify your account."
          : "Account created. You can now sign in.",
      );
    }

    if (verified) {
      toast.success("Email verified. You can now sign in.");
    }

    if (reset) {
      toast.success("Password updated. You can now sign in.");
    }

    if (verificationState === "invalid") {
      toast.error("That verification link is invalid or has expired.");
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("registered");
    nextParams.delete("reset");
    nextParams.delete("verified");
    nextParams.delete("verification");
    nextParams.delete("email");
    nextParams.delete("code");
    const nextSearch = nextParams.toString();

    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname);
  }, [
    emailVerificationEnabled,
    pathname,
    registered,
    reset,
    router,
    searchParams,
    verificationState,
    verified,
  ]);

  const handleCredentialsSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      email: trimmedEmail,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (result?.error) {
      const message = getErrorMessage(result.error, result.code);
      setError(message);

      if (getRateLimitMessageFromCode(result.code)) {
        toast.error(message);
      }

      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  };

  const handleGithubSignIn = async () => {
    setIsSubmitting(true);
    await signIn("github", { callbackUrl });
  };

  const handleResendVerification = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Enter your email to resend the verification link.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setIsResendingVerification(true);
    setError("");

    const response = await fetch("/api/auth/verification/resend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: trimmedEmail }),
    });

    setIsResendingVerification(false);

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      const message = result.error ?? "Unable to resend verification email.";
      setError(message);

      if (response.status === 429) {
        toast.error(message);
      }

      return;
    }

    toast.success("If your account exists and still needs verification, we sent a new link.");
  };

  return (
    <>
      <AuthFormError message={pageError} />

      <AuthFormError message={error} />

      <AuthGitHubButton onClick={handleGithubSignIn} disabled={isSubmitting} />

      <AuthFormDivider />

      <form className="space-y-4" onSubmit={handleCredentialsSignIn}>
        <AuthInputField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@example.com"
          icon={Mail}
        />

        <AuthInputField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="Enter your password"
          icon={LockKeyhole}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>

        <div className="text-right">
          <Link
            href={`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`}
            className="text-sm font-medium text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </form>

      {emailVerificationEnabled ? (
        <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Need a new verification email?
          <Button
            type="button"
            variant="link"
            className="h-auto px-1 align-baseline"
            onClick={handleResendVerification}
            disabled={isResendingVerification || isSubmitting}
          >
            {isResendingVerification ? "Sending..." : "Resend verification email"}
          </Button>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
};
